import "server-only";
import type { BillingInterval } from "@/generated/prisma/enums";
import { db } from "../db";
import { badRequest, notFound } from "../http/errors";
import { transactionId } from "../crypto";
import { dayjs } from "@/lib/dayjs";
import { sslcommerzInit } from "../payments/sslcommerz";
import { bkashCreate } from "../payments/bkash";
import { platformBkash, platformSslCommerz } from "../payments/credentials";
import type { VerifiedPayment } from "../payments/types";
import { creditReferral } from "./referral.service";
import { invalidateUserProfiles } from "./profile.service";
import { getPlatformSettings } from "./settings.service";
import { audit } from "./audit.service";
import { toPaymentDTO, toPlanDTO } from "./mappers";
import { absoluteUrl } from "@/config/site";
import type { AuthContext } from "../auth/context";
import type { BillingCheckoutInput } from "@/schemas/billing";

export async function listActivePlans() {
  const plans = await db.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
  return plans.map(toPlanDTO);
}

export function gatewayAvailability() {
  return { sslcommerz: !!platformSslCommerz(), bkash: !!platformBkash() };
}

export async function getBillingOverview(userId: string) {
  const [payments, settings] = await Promise.all([
    db.payment.findMany({ where: { userId }, include: { plan: { select: { name: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
    getPlatformSettings(),
  ]);
  const hadSubscription = !!(await db.subscription.findUnique({ where: { userId }, select: { id: true } }));
  return {
    payments: payments.map(toPaymentDTO),
    gateways: gatewayAvailability(),
    manual: settings.manualBilling,
    trialEligible: !hadSubscription,
  };
}

const priceFor = (plan: { priceMonthly: number; priceYearly: number }, interval: BillingInterval) =>
  interval === "YEARLY" ? plan.priceYearly : plan.priceMonthly;

async function applyCoupon(code: string | undefined, amount: number) {
  if (!code) return { amount, couponId: null as string | null };
  const coupon = await db.coupon.findUnique({ where: { code: code.toUpperCase() } });
  if (
    !coupon ||
    !coupon.isActive ||
    (coupon.expiresAt && coupon.expiresAt < new Date()) ||
    (coupon.maxRedemptions != null && coupon.redemptions >= coupon.maxRedemptions)
  ) {
    throw badRequest("Coupon is invalid or expired");
  }
  return { amount: Math.max(0, Math.round(amount * (1 - coupon.percentOff / 100))), couponId: coupon.id };
}

export async function startCheckout(auth: AuthContext, input: BillingCheckoutInput) {
  const plan = await db.plan.findUnique({ where: { id: input.planId } });
  if (!plan || !plan.isActive) throw notFound("Plan");
  const base = priceFor(plan, input.interval);
  if (base <= 0) throw badRequest("This plan is free");
  const { amount, couponId } = await applyCoupon(input.couponCode, base);
  const user = await db.user.findUniqueOrThrow({ where: { id: auth.userId } });
  const tran = transactionId("SUB");

  if (input.gateway === "MANUAL") {
    const settings = await getPlatformSettings();
    if (!settings.manualBilling.enabled) throw badRequest("Manual payment is disabled");
    if (!input.manualProvider || !input.manualSender || !input.manualTrxId) throw badRequest("Provide sender number and TrxID");
    const payment = await db.payment.create({
      data: {
        userId: user.id,
        planId: plan.id,
        interval: input.interval,
        amount,
        gateway: "MANUAL",
        transactionId: tran,
        couponId,
        meta: { provider: input.manualProvider, senderNumber: input.manualSender, trxId: input.manualTrxId },
      },
    });
    return { paymentId: payment.id, redirectUrl: null, status: "PENDING" as const };
  }

  // 100% coupon → activate immediately
  if (amount === 0) {
    const payment = await db.payment.create({
      data: { userId: user.id, planId: plan.id, interval: input.interval, amount: 0, gateway: "ADMIN", transactionId: tran, couponId },
    });
    await activatePayment(payment.id);
    return { paymentId: payment.id, redirectUrl: null, status: "PAID" as const };
  }

  const params = {
    kind: "billing" as const,
    transactionId: tran,
    amount,
    currency: "BDT",
    customer: { name: user.name, email: user.email, phone: "01700000000" },
    productName: `${plan.name} plan (${input.interval.toLowerCase()})`,
  };
  let result;
  if (input.gateway === "SSLCOMMERZ") {
    const creds = platformSslCommerz();
    if (!creds) throw badRequest("SSLCommerz is not configured");
    result = await sslcommerzInit(creds, params);
  } else {
    const creds = platformBkash();
    if (!creds) throw badRequest("bKash is not configured");
    result = await bkashCreate(creds, params);
  }
  const payment = await db.payment.create({
    data: {
      userId: user.id,
      planId: plan.id,
      interval: input.interval,
      amount,
      gateway: input.gateway,
      transactionId: tran,
      gatewayRef: result.gatewayRef ?? null,
      couponId,
    },
  });
  return { paymentId: payment.id, redirectUrl: result.redirectUrl, status: "PENDING" as const };
}

/** Marks a payment PAID and extends/starts the subscription. Idempotent. */
export async function activatePayment(paymentId: string, actorId?: string) {
  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment) throw notFound("Payment");
  if (payment.status === "PAID" && actorId === undefined) return payment;

  const existing = await db.subscription.findUnique({ where: { userId: payment.userId } });
  const now = dayjs();
  const unit = payment.interval === "YEARLY" ? "year" : "month";
  const canExtend =
    existing && existing.planId === payment.planId && existing.currentPeriodEnd && dayjs(existing.currentPeriodEnd).isAfter(now);
  const start = canExtend ? dayjs(existing!.currentPeriodEnd) : now;
  const end = start.add(1, unit).toDate();

  await db.$transaction([
    db.payment.update({ where: { id: paymentId }, data: { status: "PAID", paidAt: payment.paidAt ?? new Date() } }),
    db.subscription.upsert({
      where: { userId: payment.userId },
      create: {
        userId: payment.userId,
        planId: payment.planId,
        interval: payment.interval,
        status: "ACTIVE",
        currentPeriodStart: now.toDate(),
        currentPeriodEnd: end,
      },
      update: {
        planId: payment.planId,
        interval: payment.interval,
        status: "ACTIVE",
        cancelAtPeriodEnd: false,
        ...(canExtend ? {} : { currentPeriodStart: now.toDate() }),
        currentPeriodEnd: end,
      },
    }),
    ...(payment.couponId ? [db.coupon.update({ where: { id: payment.couponId }, data: { redemptions: { increment: 1 } } })] : []),
  ]);
  await creditReferral(paymentId);
  await invalidateUserProfiles(payment.userId);
  if (actorId) await audit(actorId, "payment.approve", "Payment", paymentId);
  return payment;
}

export async function completeBillingPayment(verified: VerifiedPayment) {
  const payment = await db.payment.findUnique({ where: { transactionId: verified.transactionId } });
  const url = absoluteUrl("/dashboard/billing");
  if (!payment) return `${url}?payment=missing`;
  if (payment.status === "PAID") return `${url}?payment=success`;
  if (!verified.ok || verified.amount < payment.amount) {
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED", meta: verified.raw as object } });
    return `${url}?payment=failed`;
  }
  await db.payment.update({ where: { id: payment.id }, data: { gatewayRef: verified.gatewayRef, meta: verified.raw as object } });
  await activatePayment(payment.id);
  return `${url}?payment=success`;
}

export async function failBillingPayment(tran: string, status: "FAILED" | "CANCELED") {
  await db.payment.updateMany({ where: { transactionId: tran, status: "PENDING" }, data: { status } });
  return absoluteUrl(`/dashboard/billing?payment=${status === "CANCELED" ? "cancelled" : "failed"}`);
}

export async function startTrial(auth: AuthContext, planId: string) {
  const plan = await db.plan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive || plan.trialDays <= 0) throw badRequest("No trial for this plan");
  if (await db.subscription.findUnique({ where: { userId: auth.userId } })) throw badRequest("Trial already used");
  await db.subscription.create({
    data: {
      userId: auth.userId,
      planId,
      status: "TRIALING",
      interval: "MONTHLY",
      currentPeriodEnd: dayjs().add(plan.trialDays, "day").toDate(),
    },
  });
  await invalidateUserProfiles(auth.userId);
  return { ok: true };
}

export async function cancelSubscription(auth: AuthContext, cancel: boolean) {
  const sub = await db.subscription.findUnique({ where: { userId: auth.userId } });
  if (!sub) throw badRequest("No active subscription");
  await db.subscription.update({ where: { id: sub.id }, data: { cancelAtPeriodEnd: cancel } });
  return { ok: true };
}

/** Cron: mark ended subscriptions as EXPIRED and refresh affected public pages. */
export async function expireSubscriptions() {
  const ended = await db.subscription.findMany({
    where: { status: { in: ["ACTIVE", "TRIALING"] }, currentPeriodEnd: { lt: new Date() } },
    select: { id: true, userId: true },
  });
  if (!ended.length) return { expired: 0 };
  await db.subscription.updateMany({ where: { id: { in: ended.map((s) => s.id) } }, data: { status: "EXPIRED" } });
  await Promise.all(ended.map((s) => invalidateUserProfiles(s.userId)));
  return { expired: ended.length };
}
