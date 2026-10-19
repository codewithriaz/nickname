import { z } from "zod";
import { BillingInterval } from "@/generated/prisma/enums";

export const billingCheckoutSchema = z.object({
  planId: z.string(),
  interval: z.enum(BillingInterval),
  gateway: z.enum(["SSLCOMMERZ", "BKASH", "MANUAL"]),
  couponCode: z.string().trim().max(40).optional(),
  manualProvider: z.enum(["bkash", "nagad", "rocket"]).optional(),
  manualSender: z.string().trim().max(20).optional(),
  manualTrxId: z.string().trim().max(40).optional(),
});
export type BillingCheckoutInput = z.infer<typeof billingCheckoutSchema>;

export const payoutRequestSchema = z.object({
  method: z.enum(["bkash", "nagad", "rocket", "bank"]),
  account: z.string().trim().min(5).max(200),
});
export type PayoutRequestInput = z.infer<typeof payoutRequestSchema>;

export const couponInputSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{3,30}$/),
  percentOff: z.number().int().min(1).max(100),
  maxRedemptions: z.number().int().min(1).nullable().optional(),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
});
export type CouponInput = z.infer<typeof couponInputSchema>;
