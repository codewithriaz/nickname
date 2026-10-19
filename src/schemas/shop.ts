import { z } from "zod";
import { OrderPaymentMethod, OrderStatus, ProductType } from "@/generated/prisma/enums";
import { assetUrl, bdPhone, hexColor, optionalAssetUrl, optionalUrl } from "./common";
import { COUNTRIES, CURRENCIES, GATEWAY_KEYS, type CountryCode } from "@/config/payment-gateways";

export const productOptionSchema = z.object({
  name: z.string().trim().min(1).max(30),
  values: z.array(z.string().trim().min(1).max(40)).min(1).max(30),
});
export type ProductOption = z.infer<typeof productOptionSchema>;

/** Manual mobile-banking accounts shown at checkout. */
export const manualAccountsSchema = z.object({
  bkash: z.string().trim().max(20).optional(),
  nagad: z.string().trim().max(20).optional(),
  rocket: z.string().trim().max(20).optional(),
  upi: z.string().trim().max(60).optional(),
  bank: z.string().trim().max(300).optional(),
  instructions: z.string().trim().max(500).optional(),
});
export type ManualAccounts = z.infer<typeof manualAccountsSchema>;

/**
 * Seller gateway credentials — `{ [gatewayKey]: { field: value } }`.
 * Encrypted before storage, never returned to the client. Empty values keep the stored secret.
 */
export const gatewaySecretsSchema = z.partialRecord(z.enum(GATEWAY_KEYS), z.record(z.string(), z.string().trim().max(5000)));
export type GatewaySecrets = z.infer<typeof gatewaySecretsSchema>;

export const STORE_LAYOUTS = ["minimal", "megastore"] as const;
export type StoreLayout = (typeof STORE_LAYOUTS)[number];

export const slideSchema = z.object({
  imageUrl: assetUrl,
  linkUrl: z.string().trim().max(2048).optional().or(z.literal("")),
  title: z.string().trim().max(120).optional(),
});
export type StoreSlide = z.infer<typeof slideSchema>;

export const storeInputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional(),
  logoUrl: optionalAssetUrl,
  bannerUrl: optionalAssetUrl,
  currency: z.enum(CURRENCIES).optional(),
  country: z.enum(COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]]).optional(),
  phone: z.string().trim().max(20).optional().nullable(),
  whatsapp: z.string().trim().max(20).optional().nullable(),
  messengerUrl: optionalUrl.nullable(),
  address: z.string().trim().max(300).optional().nullable(),
  deliveryInside: z.number().int().min(0).optional(),
  deliveryOutside: z.number().int().min(0).optional(),
  insideLabel: z.string().trim().max(40).optional(),
  outsideLabel: z.string().trim().max(40).optional(),
  freeShippingMin: z.number().int().min(0).nullable().optional(),
  codEnabled: z.boolean().optional(),
  manualEnabled: z.boolean().optional(),
  manualAccounts: manualAccountsSchema.optional(),
  enabledGateways: z.array(z.enum(GATEWAY_KEYS)).max(GATEWAY_KEYS.length).optional(),
  gatewaySandbox: z.boolean().optional(),
  gatewaySecrets: gatewaySecretsSchema.optional(),
  orderPrefix: z.string().trim().regex(/^[A-Z0-9]{1,6}$/, "1-6 uppercase letters/numbers").optional(),
  isActive: z.boolean().optional(),
  layout: z.enum(STORE_LAYOUTS).optional(),
  brandColor: hexColor.optional(),
  announcement: z.string().trim().max(200).optional().nullable(),
  heroSlides: z.array(slideSchema).max(6).optional(),
  promoBanners: z.array(slideSchema).max(3).optional(),
});
export type StoreInput = z.input<typeof storeInputSchema>;

export const categoryInputSchema = z.object({ name: z.string().trim().min(1).max(60), imageUrl: optionalAssetUrl });
export const categoryUpdateSchema = categoryInputSchema.partial();

export const productInputSchema = z.object({
  name: z.string().trim().min(1).max(150),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9-]+$/).max(160).optional(),
  description: z.string().trim().max(5000).default(""),
  type: z.enum(ProductType).default("PHYSICAL"),
  price: z.number().int().min(0),
  comparePrice: z.number().int().min(0).nullable().optional(),
  images: z.array(z.string().max(2048)).max(10).default([]),
  stock: z.number().int().min(0).nullable().optional(),
  sku: z.string().trim().max(60).nullable().optional(),
  options: z.array(productOptionSchema).max(5).default([]),
  categoryId: z.string().nullable().optional(),
  affiliateUrl: optionalUrl.nullable(),
  digitalUrl: z.string().max(2048).nullable().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});
export type ProductInput = z.input<typeof productInputSchema>;

export const cartItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().int().min(1).max(100),
  options: z.record(z.string(), z.string()).default({}),
});
export type CartItemInput = z.infer<typeof cartItemSchema>;

export const checkoutSchema = z
  .object({
    storeId: z.string(),
    items: z.array(cartItemSchema).min(1, "Cart is empty").max(50),
    customerName: z.string().trim().min(2, "Enter your name").max(80),
    customerPhone: bdPhone,
    customerEmail: z.email().optional().or(z.literal("")),
    address: z.string().trim().min(5, "Enter full address").max(500),
    city: z.string().trim().max(80).default(""),
    deliveryZone: z.enum(["inside", "outside"]),
    note: z.string().trim().max(500).optional(),
    paymentMethod: z.enum(OrderPaymentMethod),
    gateway: z.enum(GATEWAY_KEYS).optional(),
    manualProvider: z.enum(["bkash", "nagad", "rocket", "upi", "bank"]).optional(),
    manualSender: z.string().trim().max(20).optional(),
    manualTrxId: z.string().trim().max(40).optional(),
  })
  .refine((v) => v.paymentMethod !== "MANUAL" || (v.manualProvider && v.manualSender && v.manualTrxId), {
    message: "Provide payment number and transaction ID",
    path: ["manualTrxId"],
  })
  .refine((v) => v.paymentMethod !== "ONLINE" || !!v.gateway, { message: "Choose a payment gateway", path: ["gateway"] });
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const updateOrderSchema = z.object({
  status: z.enum(OrderStatus).optional(),
  paymentStatus: z.enum(["UNPAID", "PENDING_VERIFICATION", "PAID", "FAILED", "REFUNDED"]).optional(),
  note: z.string().trim().max(300).optional(),
});
export type UpdateOrderInput = z.infer<typeof updateOrderSchema>;

export const ORDER_STATUS_FLOW: OrderStatus[] = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];
