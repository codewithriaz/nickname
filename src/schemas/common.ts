import { z } from "zod";

export const hexColor = z.string().regex(/^#(?:[0-9a-fA-F]{3}){1,2}(?:[0-9a-fA-F]{2})?$/, "Invalid color");
export const httpUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => /^(https?:\/\/|mailto:|tel:)/i.test(v), "Must start with https://, mailto: or tel:");
export const optionalUrl = z.union([httpUrl, z.literal("")]).optional();
export const assetUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((v) => v.startsWith("/") || /^https?:\/\//i.test(v), "Invalid file URL");
export const optionalAssetUrl = z.union([assetUrl, z.literal("")]).optional().nullable();
export const bdPhone = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .refine((v) => /^(?:\+?88)?01[3-9]\d{8}$/.test(v) || /^\+?\d{7,15}$/.test(v), "Invalid phone number");
export const id = z.string().min(1).max(64);
export const isoDate = z.coerce.date();

export const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).optional(),
  sort: z.string().max(50).optional(),
  order: z.enum(["asc", "desc"]).default("desc"),
});
export type PaginationQuery = z.infer<typeof paginationQuery>;

export const dateRangeQuery = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  days: z.coerce.number().int().min(1).max(3650).optional(),
});
export type DateRangeQuery = z.infer<typeof dateRangeQuery>;
