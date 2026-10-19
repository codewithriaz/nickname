import { z } from "zod";
import { hexColor, httpUrl } from "./common";

export const shortCodeSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{3,40}$/, "3-40 chars: letters, numbers, - and _");

export const qrStyleSchema = z.object({
  fg: hexColor.default("#000000"),
  bg: hexColor.default("#ffffff"),
  logoUrl: z.string().max(2048).optional().nullable(),
});
export type QrStyle = z.infer<typeof qrStyleSchema>;

export const shortLinkInputSchema = z.object({
  destination: httpUrl,
  code: shortCodeSchema.optional().or(z.literal("")),
  title: z.string().trim().max(120).default(""),
  password: z.string().min(4).max(64).optional().or(z.literal("")),
  expiresAt: z.coerce.date().nullable().optional(),
  isActive: z.boolean().default(true),
  profileId: z.string().nullable().optional(),
  qrStyle: qrStyleSchema.nullable().optional(),
  utm: z
    .object({ source: z.string().max(60).optional(), medium: z.string().max(60).optional(), campaign: z.string().max(80).optional() })
    .optional(),
});
export type ShortLinkInput = z.input<typeof shortLinkInputSchema>;
export const updateShortLinkSchema = shortLinkInputSchema.partial().extend({
  removePassword: z.boolean().optional(),
});
export type UpdateShortLinkInput = z.input<typeof updateShortLinkSchema>;
