/**
 * DTOs returned by the API (JSON-serialised: dates are ISO strings).
 * Client code should import these types — never Prisma models directly.
 */
import type {
  BillingInterval,
  BlockAnimation,
  BlockLayout,
  BlockType,
  OrderPaymentMethod,
  OrderPaymentStatus,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  ProductType,
  Role,
  SubscriptionStatus,
  UserStatus,
  VerificationStatus,
  EarningStatus,
  PayoutStatus,
} from "@/generated/prisma/enums";
import type { PlanFeatures, PlanLimits } from "@/schemas/plan";
import type { ProfileTheme, ProfileThemeOverride } from "@/schemas/theme";
import type { ProfileSeo, ProfileSettings, SocialLink } from "@/schemas/profile";
import type { BlockThumbnail } from "@/schemas/block";
import type { ManualAccounts, ProductOption, StoreLayout, StoreSlide } from "@/schemas/shop";
import type { GatewayKey } from "@/config/payment-gateways";
import type { QrStyle } from "@/schemas/short-link";

export type PlanDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  priceMonthlyUsd: number;
  priceYearlyUsd: number;
  trialDays: number;
  limits: PlanLimits;
  features: PlanFeatures;
  highlights: string[];
  isActive: boolean;
  isDefault: boolean;
  isPopular: boolean;
  sortOrder: number;
};

export type SubscriptionDTO = {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  interval: BillingInterval;
  currentPeriodStart: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
};

export type MeDTO = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: Role;
  emailVerified: boolean;
  referralCode: string;
  createdAt: string;
  impersonating: boolean;
  plan: PlanDTO;
  isPaid: boolean;
  subscription: SubscriptionDTO | null;
};

export type TemplateDTO = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  theme: ProfileTheme;
  previewImage: string | null;
  isPremium: boolean;
  isActive: boolean;
  sortOrder: number;
};

export type ProfileSummaryDTO = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isPublished: boolean;
  verification: VerificationStatus;
  hasStore: boolean;
  createdAt: string;
};

export type ProfileDTO = ProfileSummaryDTO & {
  bio: string;
  templateId: string | null;
  theme: ProfileThemeOverride | null;
  resolvedTheme: ProfileTheme;
  socials: SocialLink[];
  seo: ProfileSeo;
  settings: ProfileSettings;
  customDomain: string | null;
  domainVerifyToken: string | null;
  domainVerified: boolean;
  redirectBlockId: string | null;
  redirectStartsAt: string | null;
  redirectEndsAt: string | null;
};

export type TabDTO = { id: string; title: string; slug: string; order: number };

export type BlockDTO = {
  id: string;
  profileId: string;
  tabId: string | null;
  parentId: string | null;
  type: BlockType;
  title: string;
  url: string | null;
  data: Record<string, unknown>;
  thumbnail: BlockThumbnail;
  layout: BlockLayout;
  animation: BlockAnimation;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  order: number;
  clicks: number;
};

export type SubscriberDTO = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  data: Record<string, string> | null;
  blockId: string | null;
  createdAt: string;
};

export type ShortLinkDTO = {
  id: string;
  code: string;
  destination: string;
  title: string;
  hasPassword: boolean;
  expiresAt: string | null;
  isActive: boolean;
  qrStyle: QrStyle | null;
  clicks: number;
  profileId: string | null;
  createdAt: string;
  shortUrl: string;
};

export type StoreDTO = {
  id: string;
  profileId: string;
  name: string;
  description: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  currency: string;
  country: string;
  phone: string | null;
  whatsapp: string | null;
  messengerUrl: string | null;
  address: string | null;
  deliveryInside: number;
  deliveryOutside: number;
  insideLabel: string;
  outsideLabel: string;
  freeShippingMin: number | null;
  codEnabled: boolean;
  manualEnabled: boolean;
  manualAccounts: ManualAccounts;
  enabledGateways: GatewayKey[];
  gatewaySandbox: boolean;
  /** which gateways have all required credentials (values are never returned) */
  gatewayConfigured: Partial<Record<GatewayKey, boolean>>;
  orderPrefix: string;
  isActive: boolean;
  layout: StoreLayout;
  brandColor: string;
  announcement: string | null;
  heroSlides: StoreSlide[];
  promoBanners: StoreSlide[];
};

export type CategoryDTO = { id: string; name: string; slug: string; order: number; imageUrl: string | null; productCount?: number };

export type ProductDTO = {
  id: string;
  storeId: string;
  categoryId: string | null;
  type: ProductType;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  images: string[];
  stock: number | null;
  sku: string | null;
  options: ProductOption[];
  affiliateUrl: string | null;
  digitalUrl: string | null;
  isActive: boolean;
  isFeatured: boolean;
  order: number;
  createdAt: string;
};

export type OrderItemDTO = {
  id: string;
  productId: string | null;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  options: Record<string, string>;
};

export type OrderHistoryEntry = { status: string; at: string; note?: string };

export type OrderDTO = {
  id: string;
  storeId: string;
  orderNumber: string;
  trackingToken: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  deliveryZone: string;
  note: string | null;
  subtotal: number;
  shippingFee: number;
  discount: number;
  total: number;
  currency: string;
  paymentMethod: OrderPaymentMethod;
  gateway: string | null;
  paymentStatus: OrderPaymentStatus;
  manualPayment: { provider: string; senderNumber: string; trxId: string } | null;
  transactionId: string | null;
  status: OrderStatus;
  history: OrderHistoryEntry[];
  createdAt: string;
  items: OrderItemDTO[];
};

export type PaymentDTO = {
  id: string;
  userId: string;
  planId: string;
  planName?: string;
  userEmail?: string;
  interval: BillingInterval;
  amount: number;
  currency: string;
  gateway: PaymentGateway;
  status: PaymentStatus;
  transactionId: string;
  gatewayRef: string | null;
  meta: Record<string, unknown> | null;
  paidAt: string | null;
  createdAt: string;
};

export type ReferralSummaryDTO = {
  referralCode: string;
  referralUrl: string;
  percent: number;
  minPayout: number;
  totalReferred: number;
  paidReferred: number;
  balance: { pending: number; approved: number; paid: number; requested: number };
  earnings: { id: string; amount: number; percent: number; status: EarningStatus; createdAt: string; referredName: string }[];
  payouts: { id: string; amount: number; method: string; account: string; status: PayoutStatus; note: string | null; createdAt: string }[];
};

export type ApiKeyDTO = { id: string; name: string; prefix: string; lastUsedAt: string | null; createdAt: string; revokedAt: string | null };

export type AdminUserDTO = {
  id: string;
  email: string;
  name: string;
  role: Role;
  status: UserStatus;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  planName: string;
  planSlug: string;
  profileCount: number;
  referredByEmail: string | null;
};

export type AnalyticsSummaryDTO = {
  range: { from: string; to: string; maxDays: number };
  totals: { views: number; clicks: number; uniqueVisitors: number; ctr: number; subscribers: number; orders: number; revenue: number };
  timeseries: { date: string; views: number; clicks: number }[];
  topBlocks: { id: string; title: string; type: string; clicks: number }[];
  referrers: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  advanced: boolean;
};

export type ShortLinkAnalyticsDTO = {
  range: { from: string; to: string; maxDays: number };
  totals: { clicks: number; qrScans: number; allTime: number };
  timeseries: { date: string; clicks: number; qrScans: number }[];
  referrers: { name: string; count: number }[];
  countries: { name: string; count: number }[];
  devices: { name: string; count: number }[];
  browsers: { name: string; count: number }[];
  advanced: boolean;
};
