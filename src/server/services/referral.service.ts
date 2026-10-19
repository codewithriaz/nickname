import "server-only";
import { db } from "../db";
import { badRequest } from "../http/errors";
import { getPlatformSettings } from "./settings.service";
import { absoluteUrl } from "@/config/site";
import type { ReferralSummaryDTO } from "@/types/dto";
import type { PayoutRequestInput } from "@/schemas/billing";

/** Credit the referrer when a referred user's payment succeeds (idempotent per payment). */
export async function creditReferral(paymentId: string) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { user: { select: { referredById: true } }, referralEarning: true },
  });
  if (!payment || payment.status !== "PAID" || !payment.user.referredById || payment.referralEarning) return;
  if (payment.gateway === "ADMIN") return;
  const { referralPercent } = await getPlatformSettings();
  if (referralPercent <= 0) return;
  await db.referralEarning.create({
    data: {
      referrerId: payment.user.referredById,
      referredUserId: payment.userId,
      paymentId: payment.id,
      percent: referralPercent,
      amount: Math.floor((payment.amount * referralPercent) / 100),
      status: "APPROVED",
    },
  });
}

export async function getReferralSummary(userId: string): Promise<ReferralSummaryDTO> {
  const [user, settings, totalReferred, paidReferred, earnings, payouts, sums] = await Promise.all([
    db.user.findUniqueOrThrow({ where: { id: userId }, select: { referralCode: true } }),
    getPlatformSettings(),
    db.user.count({ where: { referredById: userId } }),
    db.user.count({ where: { referredById: userId, payments: { some: { status: "PAID" } } } }),
    db.referralEarning.findMany({
      where: { referrerId: userId },
      include: { referredUser: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.payout.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.referralEarning.groupBy({ by: ["status"], where: { referrerId: userId }, _sum: { amount: true } }),
  ]);
  const sum = (s: string) => sums.find((x) => x.status === s)?._sum.amount ?? 0;
  const requested = payouts.filter((p) => p.status === "REQUESTED").reduce((a, p) => a + p.amount, 0);
  return {
    referralCode: user.referralCode,
    referralUrl: absoluteUrl(`/register?ref=${user.referralCode}`),
    percent: settings.referralPercent,
    minPayout: settings.referralMinPayout,
    totalReferred,
    paidReferred,
    balance: { pending: sum("PENDING"), approved: sum("APPROVED"), paid: sum("PAID"), requested },
    earnings: earnings.map((e) => ({
      id: e.id,
      amount: e.amount,
      percent: e.percent,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      referredName: e.referredUser.name,
    })),
    payouts: payouts.map((p) => ({
      id: p.id,
      amount: p.amount,
      method: p.method,
      account: p.account,
      status: p.status,
      note: p.note,
      createdAt: p.createdAt.toISOString(),
    })),
  };
}

/** Moves all APPROVED (unpaid) earnings into a payout request. */
export async function requestPayout(userId: string, input: PayoutRequestInput) {
  const settings = await getPlatformSettings();
  return db.$transaction(async (tx) => {
    const earnings = await tx.referralEarning.findMany({ where: { referrerId: userId, status: "APPROVED", payoutId: null } });
    const amount = earnings.reduce((a, e) => a + e.amount, 0);
    if (amount <= 0) throw badRequest("No balance available");
    if (amount < settings.referralMinPayout) throw badRequest("Balance is below the minimum payout");
    const payout = await tx.payout.create({ data: { userId, amount, method: input.method, account: input.account } });
    await tx.referralEarning.updateMany({ where: { id: { in: earnings.map((e) => e.id) } }, data: { payoutId: payout.id } });
    return { id: payout.id, amount };
  });
}
