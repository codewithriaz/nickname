import "server-only";
import { db } from "../db";
import { planLimit, notFound } from "../http/errors";
import {
  PLAN_FEATURE_LABELS,
  planFeaturesSchema,
  planLimitsSchema,
  type PlanFeatureKey,
  type PlanFeatures,
  type PlanLimits,
} from "@/schemas/plan";
import type { Plan, Subscription } from "@/generated/prisma/client";

export type ResolvedPlan = {
  plan: Plan;
  subscription: Subscription | null;
  limits: PlanLimits;
  features: PlanFeatures;
  isPaid: boolean;
};

export function parsePlan(plan: Plan) {
  return {
    limits: planLimitsSchema.parse(plan.limits),
    features: planFeaturesSchema.parse(plan.features),
  };
}

export async function getDefaultPlan() {
  const plan =
    (await db.plan.findFirst({ where: { isDefault: true, isActive: true } })) ??
    (await db.plan.findFirst({ orderBy: { sortOrder: "asc" } }));
  if (!plan) throw notFound("Default plan (run `pnpm db:seed`)");
  return plan;
}

const isLive = (s: Subscription | null) =>
  !!s && (s.status === "ACTIVE" || s.status === "TRIALING") && (!s.currentPeriodEnd || s.currentPeriodEnd > new Date());

/** The plan currently in effect for a user (falls back to the default/free plan). */
export async function getUserPlan(userId: string): Promise<ResolvedPlan> {
  const subscription = await db.subscription.findUnique({ where: { userId }, include: { plan: true } });
  const plan = isLive(subscription) && subscription!.plan.isActive !== false ? subscription!.plan : await getDefaultPlan();
  return {
    plan,
    subscription,
    ...parsePlan(plan),
    isPaid: isLive(subscription) && plan.priceMonthly > 0,
  };
}

export async function assertFeature(userId: string, feature: PlanFeatureKey) {
  const { features, plan } = await getUserPlan(userId);
  if (!features[feature]) {
    throw planLimit(`"${PLAN_FEATURE_LABELS[feature]}" is not included in the ${plan.name} plan. Please upgrade.`);
  }
}

/** Throws when `current` already reached the plan limit for `key`. */
export async function assertLimit(userId: string, key: keyof PlanLimits, current: number, label: string) {
  const { limits, plan } = await getUserPlan(userId);
  const max = limits[key];
  if (max >= 0 && current >= max) {
    throw planLimit(`Your ${plan.name} plan allows ${max} ${label}. Upgrade to add more.`);
  }
}

/** Earliest date analytics can be queried for this user's plan. */
export async function analyticsWindowStart(userId: string) {
  const { limits } = await getUserPlan(userId);
  return new Date(Date.now() - limits.analyticsDays * 86_400_000);
}
