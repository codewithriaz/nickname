import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus, PaymentStatus, PayoutStatus, VerificationStatus } from "@/generated/prisma/enums";
import { db } from "../db";
import { badRequest, notFound } from "../http/errors";
import { dayjs } from "@/lib/dayjs";
import { invalidate, tags } from "../cache/tags";
import { audit } from "./audit.service";
import { activatePayment } from "./billing.service";
import { invalidateProfile, invalidateUserProfiles } from "./profile.service";
import { revokeAllSessions } from "../auth/session";
import { getDefaultPlan } from "./plan.service";
import { toPaymentDTO, toPlanDTO, toShortLinkDTO, toTemplateDTO } from "./mappers";
import type { AuthContext } from "../auth/context";
import type { AdminAssignPlanInput, AdminUpdateUserInput } from "@/schemas/admin";
import type { PlanInput } from "@/schemas/plan";
import type { TemplateInput } from "@/schemas/theme";
import type { CouponInput } from "@/schemas/billing";
import type { PaginationQuery } from "@/schemas/common";
import type { AdminUserDTO } from "@/types/dto";

const page = (q: PaginationQuery) => ({ skip: (q.page - 1) * q.pageSize, take: q.pageSize });
const ci = (search: string) => ({ contains: search, mode: "insensitive" as const });

// ── Dashboard ──────────────────────────────────────────────────────────

export async function getAdminStats() {
  const since30 = dayjs().subtract(30, "day").toDate();
  const [users, newUsers, profiles, stores, orders, revenue, revenue30, activeSubs, pendingPayments, pendingPayouts, pendingVerifications, events30] =
    await Promise.all([
      db.user.count(),
      db.user.count({ where: { createdAt: { gte: since30 } } }),
      db.profile.count(),
      db.store.count(),
      db.order.count(),
      db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
      db.payment.aggregate({ where: { status: "PAID", paidAt: { gte: since30 } }, _sum: { amount: true } }),
      db.subscription.groupBy({
        by: ["planId"],
        where: { status: { in: ["ACTIVE", "TRIALING"] }, OR: [{ currentPeriodEnd: null }, { currentPeriodEnd: { gt: new Date() } }] },
        _count: { _all: true },
      }),
      db.payment.count({ where: { status: "PENDING", gateway: "MANUAL" } }),
      db.payout.count({ where: { status: "REQUESTED" } }),
      db.profile.count({ where: { verification: "PENDING" } }),
      db.analyticsEvent.count({ where: { createdAt: { gte: since30 } } }),
    ]);
  const plans = await db.plan.findMany({ select: { id: true, name: true } });
  const signups = await db.$queryRaw<{ d: Date; c: bigint }[]>`
    SELECT date_trunc('day', "createdAt") d, count(*) c FROM "User" WHERE "createdAt" >= ${since30} GROUP BY 1 ORDER BY 1`;
  return {
    users,
    newUsers,
    profiles,
    stores,
    orders,
    revenue: revenue._sum.amount ?? 0,
    revenue30: revenue30._sum.amount ?? 0,
    events30,
    pendingPayments,
    pendingPayouts,
    pendingVerifications,
    subscriptions: activeSubs.map((s) => ({ plan: plans.find((p) => p.id === s.planId)?.name ?? "?", count: s._count._all })),
    signups: signups.map((s) => ({ date: dayjs(s.d).format("YYYY-MM-DD"), count: Number(s.c) })),
  };
}

// ── Users ──────────────────────────────────────────────────────────────

export async function listUsers(q: PaginationQuery & { role?: string; status?: string }) {
  const where: Prisma.UserWhereInput = {
    ...(q.search ? { OR: [{ email: ci(q.search) }, { name: ci(q.search) }, { profiles: { some: { username: ci(q.search) } } }] } : {}),
    ...(q.role === "USER" || q.role === "SUPER_ADMIN" ? { role: q.role } : {}),
    ...(q.status === "ACTIVE" || q.status === "SUSPENDED" ? { status: q.status } : {}),
  };
  const sortable = ["createdAt", "email", "name", "lastLoginAt"];
  const orderBy = { [sortable.includes(q.sort ?? "") ? q.sort! : "createdAt"]: q.order };
  const [rows, total, defaultPlan] = await Promise.all([
    db.user.findMany({
      where,
      orderBy,
      ...page(q),
      include: {
        subscription: { include: { plan: true } },
        referredBy: { select: { email: true } },
        _count: { select: { profiles: true } },
      },
    }),
    db.user.count({ where }),
    getDefaultPlan(),
  ]);
  const items: AdminUserDTO[] = rows.map((u) => {
    const live =
      u.subscription &&
      ["ACTIVE", "TRIALING"].includes(u.subscription.status) &&
      (!u.subscription.currentPeriodEnd || u.subscription.currentPeriodEnd > new Date());
    const plan = live ? u.subscription!.plan : defaultPlan;
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      status: u.status,
      emailVerified: u.emailVerified,
      createdAt: u.createdAt.toISOString(),
      lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
      planName: plan.name,
      planSlug: plan.slug,
      profileCount: u._count.profiles,
      referredByEmail: u.referredBy?.email ?? null,
    };
  });
  return { items, total };
}

export async function getUserDetail(userId: string) {
  const user = await db.user.findUnique({
    where: { id: userId },
    omit: { passwordHash: true },
    include: {
      subscription: { include: { plan: true } },
      profiles: { select: { id: true, username: true, displayName: true, isPublished: true, verification: true } },
      payments: { orderBy: { createdAt: "desc" }, take: 20, include: { plan: { select: { name: true } } } },
      _count: { select: { referrals: true, shortLinks: true } },
    },
  });
  if (!user) throw notFound("User");
  return {
    ...user,
    payments: user.payments.map(toPaymentDTO),
    subscription: user.subscription ? { ...user.subscription, plan: toPlanDTO(user.subscription.plan) } : null,
  };
}

export async function updateUser(auth: AuthContext, userId: string, input: AdminUpdateUserInput) {
  if (userId === auth.userId && (input.role === "USER" || input.status === "SUSPENDED")) {
    throw badRequest("You can't demote or suspend yourself");
  }
  const user = await db.user.update({ where: { id: userId }, data: input });
  if (input.status === "SUSPENDED") {
    await revokeAllSessions(userId);
    await invalidateUserProfiles(userId);
  }
  await audit(auth.userId, "user.update", "User", userId, input);
  return { id: user.id };
}

export async function deleteUser(auth: AuthContext, userId: string) {
  if (userId === auth.userId) throw badRequest("You can't delete yourself");
  await invalidateUserProfiles(userId);
  await db.user.delete({ where: { id: userId } });
  await audit(auth.userId, "user.delete", "User", userId);
  return { id: userId };
}

export async function assignPlan(auth: AuthContext, userId: string, input: AdminAssignPlanInput) {
  const plan = await db.plan.findUnique({ where: { id: input.planId } });
  if (!plan) throw notFound("Plan");
  const end = input.periodDays ? dayjs().add(input.periodDays, "day").toDate() : null;
  await db.subscription.upsert({
    where: { userId },
    create: { userId, planId: plan.id, interval: input.interval, status: "ACTIVE", currentPeriodEnd: end },
    update: { planId: plan.id, interval: input.interval, status: "ACTIVE", currentPeriodStart: new Date(), currentPeriodEnd: end, cancelAtPeriodEnd: false },
  });
  await invalidateUserProfiles(userId);
  await audit(auth.userId, "user.assignPlan", "User", userId, { planId: plan.id, periodDays: input.periodDays });
  return { ok: true };
}

// ── Profiles / verification ────────────────────────────────────────────

export async function listProfilesAdmin(q: PaginationQuery & { verification?: VerificationStatus }) {
  const where: Prisma.ProfileWhereInput = {
    ...(q.search ? { OR: [{ username: ci(q.search) }, { displayName: ci(q.search) }, { user: { email: ci(q.search) } }] } : {}),
    ...(q.verification ? { verification: q.verification } : {}),
  };
  const [rows, total] = await Promise.all([
    db.profile.findMany({
      where,
      orderBy: { createdAt: q.order },
      ...page(q),
      include: {
        user: { select: { email: true } },
        store: { select: { id: true } },
        _count: { select: { blocks: true, events: true, subscribers: true } },
      },
    }),
    db.profile.count({ where }),
  ]);
  return {
    items: rows.map((p) => ({
      id: p.id,
      username: p.username,
      displayName: p.displayName,
      ownerEmail: p.user.email,
      userId: p.userId,
      isPublished: p.isPublished,
      verification: p.verification,
      hasStore: !!p.store,
      customDomain: p.customDomain,
      blocks: p._count.blocks,
      events: p._count.events,
      subscribers: p._count.subscribers,
      createdAt: p.createdAt.toISOString(),
    })),
    total,
  };
}

export async function updateProfileAdmin(auth: AuthContext, profileId: string, data: { verification?: VerificationStatus; isPublished?: boolean }) {
  await db.profile.update({ where: { id: profileId }, data });
  await invalidateProfile(profileId);
  await audit(auth.userId, "profile.update", "Profile", profileId, data);
  return { id: profileId };
}

// ── Templates ──────────────────────────────────────────────────────────

export async function listTemplatesAdmin() {
  const rows = await db.template.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { profiles: true } } } });
  return rows.map((t) => ({ ...toTemplateDTO(t), usage: t._count.profiles }));
}

export async function upsertTemplate(auth: AuthContext, id: string | null, input: TemplateInput) {
  const t = id ? await db.template.update({ where: { id }, data: input }) : await db.template.create({ data: input });
  invalidate(tags.templates);
  if (id) {
    const profiles = await db.profile.findMany({ where: { templateId: id }, select: { id: true } });
    await Promise.all(profiles.map((p) => invalidateProfile(p.id)));
  }
  await audit(auth.userId, id ? "template.update" : "template.create", "Template", t.id);
  return toTemplateDTO(t);
}

export async function deleteTemplate(auth: AuthContext, id: string) {
  const profiles = await db.profile.findMany({ where: { templateId: id }, select: { id: true } });
  await db.template.delete({ where: { id } });
  invalidate(tags.templates);
  await Promise.all(profiles.map((p) => invalidateProfile(p.id)));
  await audit(auth.userId, "template.delete", "Template", id);
  return { id };
}

// ── Plans ──────────────────────────────────────────────────────────────

export async function listPlansAdmin() {
  const rows = await db.plan.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { subscriptions: true } } } });
  return rows.map((p) => ({ ...toPlanDTO(p), subscribers: p._count.subscriptions }));
}

export async function upsertPlan(auth: AuthContext, id: string | null, input: PlanInput) {
  const plan = await db.$transaction(async (tx) => {
    if (input.isDefault) await tx.plan.updateMany({ where: { isDefault: true, ...(id ? { NOT: { id } } : {}) }, data: { isDefault: false } });
    return id ? tx.plan.update({ where: { id }, data: input }) : tx.plan.create({ data: input });
  });
  invalidate(tags.plans);
  await audit(auth.userId, id ? "plan.update" : "plan.create", "Plan", plan.id);
  return toPlanDTO(plan);
}

export async function deletePlan(auth: AuthContext, id: string) {
  const [subs, payments] = await Promise.all([db.subscription.count({ where: { planId: id } }), db.payment.count({ where: { planId: id } })]);
  if (subs || payments) throw badRequest("Plan has subscribers/payments — deactivate it instead");
  await db.plan.delete({ where: { id } });
  invalidate(tags.plans);
  await audit(auth.userId, "plan.delete", "Plan", id);
  return { id };
}

// ── Payments ───────────────────────────────────────────────────────────

export async function listPayments(q: PaginationQuery & { status?: PaymentStatus; gateway?: string }) {
  const where: Prisma.PaymentWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.gateway && ["SSLCOMMERZ", "BKASH", "MANUAL", "ADMIN"].includes(q.gateway) ? { gateway: q.gateway as never } : {}),
    ...(q.search ? { OR: [{ transactionId: ci(q.search) }, { user: { email: ci(q.search) } }, { gatewayRef: ci(q.search) }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.payment.findMany({
      where,
      orderBy: { createdAt: q.order },
      ...page(q),
      include: { plan: { select: { name: true } }, user: { select: { email: true } } },
    }),
    db.payment.count({ where }),
  ]);
  return { items: rows.map(toPaymentDTO), total };
}

export async function reviewPayment(auth: AuthContext, id: string, action: "approve" | "reject" | "refund") {
  const payment = await db.payment.findUnique({ where: { id } });
  if (!payment) throw notFound("Payment");
  if (action === "approve") {
    if (payment.status === "PAID") throw badRequest("Already paid");
    await activatePayment(id, auth.userId);
  } else {
    await db.payment.update({ where: { id }, data: { status: action === "reject" ? "FAILED" : "REFUNDED" } });
    if (action === "refund") await db.referralEarning.updateMany({ where: { paymentId: id, status: { not: "PAID" } }, data: { status: "REJECTED" } });
    await audit(auth.userId, `payment.${action}`, "Payment", id);
  }
  return { id };
}

// ── Coupons ────────────────────────────────────────────────────────────

export const listCoupons = () => db.coupon.findMany({ orderBy: { createdAt: "desc" } });
export async function upsertCoupon(auth: AuthContext, id: string | null, input: CouponInput) {
  const c = id ? await db.coupon.update({ where: { id }, data: input }) : await db.coupon.create({ data: input });
  await audit(auth.userId, id ? "coupon.update" : "coupon.create", "Coupon", c.id);
  return c;
}
export async function deleteCoupon(auth: AuthContext, id: string) {
  await db.coupon.delete({ where: { id } });
  await audit(auth.userId, "coupon.delete", "Coupon", id);
  return { id };
}

// ── Referral payouts ───────────────────────────────────────────────────

export async function listPayouts(q: PaginationQuery & { status?: PayoutStatus }) {
  const where: Prisma.PayoutWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.search ? { user: { email: ci(q.search) } } : {}),
  };
  const [rows, total] = await Promise.all([
    db.payout.findMany({ where, orderBy: { createdAt: q.order }, ...page(q), include: { user: { select: { email: true, name: true } } } }),
    db.payout.count({ where }),
  ]);
  return {
    items: rows.map((p) => ({
      id: p.id,
      userEmail: p.user.email,
      userName: p.user.name,
      amount: p.amount,
      method: p.method,
      account: p.account,
      status: p.status,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
      processedAt: p.processedAt?.toISOString() ?? null,
    })),
    total,
  };
}

export async function processPayout(auth: AuthContext, id: string, status: PayoutStatus, note?: string) {
  const payout = await db.payout.findUnique({ where: { id } });
  if (!payout) throw notFound("Payout");
  if (payout.status !== "REQUESTED") throw badRequest("Payout already processed");
  await db.$transaction([
    db.payout.update({ where: { id }, data: { status, note, processedAt: new Date() } }),
    status === "PAID"
      ? db.referralEarning.updateMany({ where: { payoutId: id }, data: { status: "PAID" } })
      : db.referralEarning.updateMany({ where: { payoutId: id }, data: { payoutId: null } }),
  ]);
  await audit(auth.userId, `payout.${status.toLowerCase()}`, "Payout", id);
  return { id };
}

// ── Short links / orders / audit ───────────────────────────────────────

export async function listShortLinksAdmin(q: PaginationQuery) {
  const where: Prisma.ShortLinkWhereInput = q.search
    ? { OR: [{ code: ci(q.search) }, { destination: ci(q.search) }, { user: { email: ci(q.search) } }] }
    : {};
  const [rows, total] = await Promise.all([
    db.shortLink.findMany({ where, orderBy: { createdAt: q.order }, ...page(q), include: { user: { select: { email: true } } } }),
    db.shortLink.count({ where }),
  ]);
  return { items: rows.map((s) => ({ ...toShortLinkDTO(s), userEmail: s.user.email })), total };
}

export async function toggleShortLinkAdmin(auth: AuthContext, id: string, isActive: boolean) {
  await db.shortLink.update({ where: { id }, data: { isActive } });
  await audit(auth.userId, isActive ? "shortlink.enable" : "shortlink.disable", "ShortLink", id);
  return { id };
}

export async function listOrdersAdmin(q: PaginationQuery & { status?: OrderStatus }) {
  const where: Prisma.OrderWhereInput = {
    ...(q.status ? { status: q.status } : {}),
    ...(q.search ? { OR: [{ orderNumber: ci(q.search) }, { customerPhone: { contains: q.search } }, { store: { name: ci(q.search) } }] } : {}),
  };
  const [rows, total] = await Promise.all([
    db.order.findMany({
      where,
      orderBy: { createdAt: q.order },
      ...page(q),
      include: { store: { select: { name: true, profile: { select: { username: true } } } } },
    }),
    db.order.count({ where }),
  ]);
  return {
    items: rows.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      storeName: o.store.name,
      username: o.store.profile.username,
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      total: o.total,
      currency: o.currency,
      paymentMethod: o.paymentMethod,
      gateway: o.gateway,
      paymentStatus: o.paymentStatus,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    total,
  };
}

export async function listAuditLogs(q: PaginationQuery) {
  const where: Prisma.AuditLogWhereInput = q.search ? { OR: [{ action: ci(q.search) }, { entity: ci(q.search) }, { entityId: q.search }] } : {};
  const [rows, total] = await Promise.all([
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, ...page(q), include: { actor: { select: { email: true } } } }),
    db.auditLog.count({ where }),
  ]);
  return {
    items: rows.map((l) => ({
      id: l.id,
      actorEmail: l.actor?.email ?? "system",
      action: l.action,
      entity: l.entity,
      entityId: l.entityId,
      meta: l.meta,
      createdAt: l.createdAt.toISOString(),
    })),
    total,
  };
}
