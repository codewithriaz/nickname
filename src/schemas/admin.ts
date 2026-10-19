import { z } from "zod";
import { BillingInterval, PayoutStatus, Role, UserStatus, VerificationStatus } from "@/generated/prisma/enums";

export const adminUpdateUserSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  role: z.enum(Role).optional(),
  status: z.enum(UserStatus).optional(),
  emailVerified: z.boolean().optional(),
});
export type AdminUpdateUserInput = z.infer<typeof adminUpdateUserSchema>;

export const adminAssignPlanSchema = z.object({
  planId: z.string(),
  interval: z.enum(BillingInterval).default("MONTHLY"),
  /** null = no expiry (lifetime) */
  periodDays: z.number().int().min(1).max(3650).nullable().default(30),
});
export type AdminAssignPlanInput = z.infer<typeof adminAssignPlanSchema>;

export const adminVerificationSchema = z.object({ verification: z.enum(VerificationStatus) });

export const adminPayoutSchema = z.object({
  status: z.enum(PayoutStatus),
  note: z.string().trim().max(300).optional(),
});

export const platformSettingsSchema = z.object({
  referralPercent: z.number().int().min(0).max(90),
  referralMinPayout: z.number().int().min(0),
  manualBilling: z.object({
    enabled: z.boolean(),
    bkash: z.string().max(20).optional(),
    nagad: z.string().max(20).optional(),
    rocket: z.string().max(20).optional(),
    instructions: z.string().max(500).optional(),
  }),
  announcement: z.string().max(300).optional(),
  signupsEnabled: z.boolean(),
});
export type PlatformSettings = z.infer<typeof platformSettingsSchema>;

export const DEFAULT_PLATFORM_SETTINGS: PlatformSettings = {
  referralPercent: 20,
  referralMinPayout: 50000,
  manualBilling: { enabled: true, bkash: "", nagad: "", rocket: "", instructions: "Send money then submit your TrxID." },
  announcement: "",
  signupsEnabled: true,
};
