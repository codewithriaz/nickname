import { z } from "zod";

/** -1 means unlimited. */
export const planLimitsSchema = z.object({
  profiles: z.number().int().min(-1),
  blocksPerProfile: z.number().int().min(-1),
  products: z.number().int().min(-1),
  shortLinks: z.number().int().min(-1),
  analyticsDays: z.number().int().min(1),
  monthlyOrders: z.number().int().min(-1),
});
export type PlanLimits = z.infer<typeof planLimitsSchema>;

export const planFeaturesSchema = z.object({
  removeBranding: z.boolean(),
  customDomain: z.boolean(),
  onlinePayments: z.boolean(),
  premiumTemplates: z.boolean(),
  scheduling: z.boolean(),
  pixels: z.boolean(),
  customSeo: z.boolean(),
  apiAccess: z.boolean(),
  leadExport: z.boolean(),
  tabs: z.boolean(),
  customQr: z.boolean(),
  advancedAnalytics: z.boolean(),
  prioritySupport: z.boolean(),
});
export type PlanFeatures = z.infer<typeof planFeaturesSchema>;
export type PlanFeatureKey = keyof PlanFeatures;

export const PLAN_FEATURE_LABELS: Record<PlanFeatureKey, string> = {
  removeBranding: "Remove branding",
  customDomain: "Custom domain",
  onlinePayments: "Online payment gateway (SSLCommerz / bKash)",
  premiumTemplates: "Premium templates",
  scheduling: "Link scheduling & timed redirects",
  pixels: "Facebook Pixel & Google Analytics",
  customSeo: "Custom SEO & social preview",
  apiAccess: "Public REST API",
  leadExport: "Export leads (CSV)",
  tabs: "Multi-tab pages",
  customQr: "Custom QR colors & logo",
  advancedAnalytics: "Advanced analytics (geo, devices, referrers)",
  prioritySupport: "Priority support",
};

export const planInputSchema = z.object({
  slug: z.string().trim().min(2).max(40).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(300).default(""),
  priceMonthly: z.number().int().min(0),
  priceYearly: z.number().int().min(0),
  priceMonthlyUsd: z.number().int().min(0),
  priceYearlyUsd: z.number().int().min(0),
  trialDays: z.number().int().min(0).max(90).default(0),
  limits: planLimitsSchema,
  features: planFeaturesSchema,
  highlights: z.array(z.string().trim().max(120)).max(20).default([]),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  isPopular: z.boolean().default(false),
  sortOrder: z.number().int().default(0),
});
export type PlanInput = z.infer<typeof planInputSchema>;

export const isUnlimited = (n: number) => n < 0;
