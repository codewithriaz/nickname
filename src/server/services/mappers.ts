import "server-only";
import type {
  Block,
  Order,
  OrderItem,
  Payment,
  Plan,
  Product,
  Profile,
  ShortLink,
  Store,
  Subscription,
  Template,
  Tab,
} from "@/generated/prisma/client";
import type {
  BlockDTO,
  OrderDTO,
  PaymentDTO,
  PlanDTO,
  ProductDTO,
  ProfileDTO,
  ProfileSummaryDTO,
  ShortLinkDTO,
  StoreDTO,
  SubscriptionDTO,
  TabDTO,
  TemplateDTO,
} from "@/types/dto";
import { planFeaturesSchema, planLimitsSchema } from "@/schemas/plan";
import { DEFAULT_THEME, resolveTheme, themeOverrideSchema, themeSchema } from "@/schemas/theme";
import { profileSeoSchema, profileSettingsSchema, socialLinkSchema } from "@/schemas/profile";
import { thumbnailSchema } from "@/schemas/block";
import { manualAccountsSchema, productOptionSchema, slideSchema, STORE_LAYOUTS } from "@/schemas/shop";
import { GATEWAY_KEYS, type GatewayKey } from "@/config/payment-gateways";
import { isGatewayConfigured, readStoreSecrets } from "../payments/credentials";
import { qrStyleSchema } from "@/schemas/short-link";
import { absoluteUrl, routes } from "@/config/site";
import { z } from "zod";

const iso = (d: Date | null | undefined) => (d ? d.toISOString() : null);
const asObject = (v: unknown) => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

export const toPlanDTO = (p: Plan): PlanDTO => ({
  id: p.id,
  slug: p.slug,
  name: p.name,
  description: p.description,
  priceMonthly: p.priceMonthly,
  priceYearly: p.priceYearly,
  priceMonthlyUsd: p.priceMonthlyUsd,
  priceYearlyUsd: p.priceYearlyUsd,
  trialDays: p.trialDays,
  limits: planLimitsSchema.parse(p.limits),
  features: planFeaturesSchema.parse(p.features),
  highlights: p.highlights,
  isActive: p.isActive,
  isDefault: p.isDefault,
  isPopular: p.isPopular,
  sortOrder: p.sortOrder,
});

export const toSubscriptionDTO = (s: Subscription): SubscriptionDTO => ({
  id: s.id,
  planId: s.planId,
  status: s.status,
  interval: s.interval,
  currentPeriodStart: s.currentPeriodStart.toISOString(),
  currentPeriodEnd: iso(s.currentPeriodEnd),
  cancelAtPeriodEnd: s.cancelAtPeriodEnd,
});

export const toTemplateDTO = (t: Template): TemplateDTO => {
  const parsed = themeSchema.safeParse(t.theme);
  return {
    id: t.id,
    slug: t.slug,
    name: t.name,
    description: t.description,
    category: t.category,
    theme: parsed.success ? parsed.data : DEFAULT_THEME,
    previewImage: t.previewImage,
    isPremium: t.isPremium,
    isActive: t.isActive,
    sortOrder: t.sortOrder,
  };
};

export const toProfileSummaryDTO = (p: Profile & { store?: { id: string } | null }): ProfileSummaryDTO => ({
  id: p.id,
  username: p.username,
  displayName: p.displayName,
  avatarUrl: p.avatarUrl,
  isPublished: p.isPublished,
  verification: p.verification,
  hasStore: !!p.store,
  createdAt: p.createdAt.toISOString(),
});

export function toProfileDTO(p: Profile & { template?: Template | null; store?: { id: string } | null }): ProfileDTO {
  const override = themeOverrideSchema.safeParse(p.theme ?? {});
  return {
    ...toProfileSummaryDTO(p),
    bio: p.bio,
    templateId: p.templateId,
    theme: override.success ? override.data : null,
    resolvedTheme: resolveTheme(p.template?.theme, p.theme),
    socials: z.array(socialLinkSchema).catch([]).parse(p.socials),
    seo: profileSeoSchema.catch({}).parse(p.seo),
    settings: profileSettingsSchema.catch(profileSettingsSchema.parse({})).parse(asObject(p.settings)),
    customDomain: p.customDomain,
    domainVerifyToken: p.domainVerifyToken,
    domainVerified: p.domainVerified,
    redirectBlockId: p.redirectBlockId,
    redirectStartsAt: iso(p.redirectStartsAt),
    redirectEndsAt: iso(p.redirectEndsAt),
  };
}

export const toTabDTO = (t: Tab): TabDTO => ({ id: t.id, title: t.title, slug: t.slug, order: t.order });

export const toBlockDTO = (b: Block): BlockDTO => ({
  id: b.id,
  profileId: b.profileId,
  tabId: b.tabId,
  parentId: b.parentId,
  type: b.type,
  title: b.title,
  url: b.url,
  data: asObject(b.data),
  thumbnail: thumbnailSchema.catch(null).parse(b.thumbnail ?? null),
  layout: b.layout,
  animation: b.animation,
  isActive: b.isActive,
  startsAt: iso(b.startsAt),
  endsAt: iso(b.endsAt),
  order: b.order,
  clicks: b.clicks,
});

export const toShortLinkDTO = (s: ShortLink): ShortLinkDTO => ({
  id: s.id,
  code: s.code,
  destination: s.destination,
  title: s.title,
  hasPassword: !!s.passwordHash,
  expiresAt: iso(s.expiresAt),
  isActive: s.isActive,
  qrStyle: s.qrStyle ? qrStyleSchema.catch({ fg: "#000000", bg: "#ffffff" }).parse(s.qrStyle) : null,
  clicks: s.clicks,
  profileId: s.profileId,
  createdAt: s.createdAt.toISOString(),
  shortUrl: absoluteUrl(routes.shortLink(s.code)),
});

const slides = z.array(slideSchema).catch([]);

export function toStoreDTO(s: Store): StoreDTO {
  const secrets = readStoreSecrets(s);
  return {
    id: s.id,
    profileId: s.profileId,
    name: s.name,
    description: s.description,
    logoUrl: s.logoUrl,
    bannerUrl: s.bannerUrl,
    currency: s.currency,
    country: s.country,
    phone: s.phone,
    whatsapp: s.whatsapp,
    messengerUrl: s.messengerUrl,
    address: s.address,
    deliveryInside: s.deliveryInside,
    deliveryOutside: s.deliveryOutside,
    insideLabel: s.insideLabel,
    outsideLabel: s.outsideLabel,
    freeShippingMin: s.freeShippingMin,
    codEnabled: s.codEnabled,
    manualEnabled: s.manualEnabled,
    manualAccounts: manualAccountsSchema.catch({}).parse(s.manualAccounts),
    enabledGateways: s.enabledGateways.filter((k): k is GatewayKey => (GATEWAY_KEYS as readonly string[]).includes(k)),
    gatewaySandbox: s.gatewaySandbox,
    gatewayConfigured: Object.fromEntries(GATEWAY_KEYS.map((k) => [k, isGatewayConfigured(k, secrets[k])])),
    orderPrefix: s.orderPrefix,
    isActive: s.isActive,
    layout: (STORE_LAYOUTS as readonly string[]).includes(s.layout) ? (s.layout as StoreDTO["layout"]) : "minimal",
    brandColor: s.brandColor,
    announcement: s.announcement,
    heroSlides: slides.parse(s.heroSlides),
    promoBanners: slides.parse(s.promoBanners),
  };
}

export const toProductDTO = (p: Product): ProductDTO => ({
  id: p.id,
  storeId: p.storeId,
  categoryId: p.categoryId,
  type: p.type,
  name: p.name,
  slug: p.slug,
  description: p.description,
  price: p.price,
  comparePrice: p.comparePrice,
  images: p.images,
  stock: p.stock,
  sku: p.sku,
  options: z.array(productOptionSchema).catch([]).parse(p.options),
  affiliateUrl: p.affiliateUrl,
  digitalUrl: p.digitalUrl,
  isActive: p.isActive,
  isFeatured: p.isFeatured,
  order: p.order,
  createdAt: p.createdAt.toISOString(),
});

/** Public product view (no digital download URL until paid). */
export const toPublicProductDTO = (p: Product): ProductDTO => ({ ...toProductDTO(p), digitalUrl: null, sku: null });

export const toOrderDTO = (o: Order & { items: OrderItem[] }): OrderDTO => ({
  id: o.id,
  storeId: o.storeId,
  orderNumber: o.orderNumber,
  trackingToken: o.trackingToken,
  customerName: o.customerName,
  customerPhone: o.customerPhone,
  customerEmail: o.customerEmail,
  address: o.address,
  city: o.city,
  deliveryZone: o.deliveryZone,
  note: o.note,
  subtotal: o.subtotal,
  shippingFee: o.shippingFee,
  discount: o.discount,
  total: o.total,
  currency: o.currency,
  paymentMethod: o.paymentMethod,
  gateway: o.gateway,
  paymentStatus: o.paymentStatus,
  manualPayment: (o.manualPayment as OrderDTO["manualPayment"]) ?? null,
  transactionId: o.transactionId,
  status: o.status,
  history: Array.isArray(o.history) ? (o.history as OrderDTO["history"]) : [],
  createdAt: o.createdAt.toISOString(),
  items: o.items.map((i) => ({
    id: i.id,
    productId: i.productId,
    name: i.name,
    image: i.image,
    price: i.price,
    quantity: i.quantity,
    options: asObject(i.options) as Record<string, string>,
  })),
});

export const toPaymentDTO = (
  p: Payment & { plan?: { name: string } | null; user?: { email: string } | null },
): PaymentDTO => ({
  id: p.id,
  userId: p.userId,
  planId: p.planId,
  planName: p.plan?.name,
  userEmail: p.user?.email,
  interval: p.interval,
  amount: p.amount,
  currency: p.currency,
  gateway: p.gateway,
  status: p.status,
  transactionId: p.transactionId,
  gatewayRef: p.gatewayRef,
  meta: asObject(p.meta),
  paidAt: iso(p.paidAt),
  createdAt: p.createdAt.toISOString(),
});
