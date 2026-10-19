import { BaseApiService } from "@/lib/api/base-service";
import type { AdminUserDTO, PaymentDTO, PlanDTO, ShortLinkDTO, TemplateDTO } from "@/types/dto";
import type { AdminAssignPlanInput, AdminUpdateUserInput, PlatformSettings } from "@/schemas/admin";
import type { PlanInput } from "@/schemas/plan";
import type { TemplateInput } from "@/schemas/theme";
import type { CouponInput } from "@/schemas/billing";
import type { OrderPaymentMethod, OrderPaymentStatus, OrderStatus, PayoutStatus, VerificationStatus } from "@/generated/prisma/enums";

export type AdminStats = {
  users: number;
  newUsers: number;
  profiles: number;
  stores: number;
  orders: number;
  revenue: number;
  revenue30: number;
  events30: number;
  pendingPayments: number;
  pendingPayouts: number;
  pendingVerifications: number;
  subscriptions: { plan: string; count: number }[];
  signups: { date: string; count: number }[];
};
export type AdminProfileRow = {
  id: string;
  username: string;
  displayName: string;
  ownerEmail: string;
  userId: string;
  isPublished: boolean;
  verification: VerificationStatus;
  hasStore: boolean;
  customDomain: string | null;
  blocks: number;
  events: number;
  subscribers: number;
  createdAt: string;
};
export type AdminPayoutRow = { id: string; userEmail: string; userName: string; amount: number; method: string; account: string; status: PayoutStatus; note: string | null; createdAt: string; processedAt: string | null };
export type AdminOrderRow = {
  id: string;
  orderNumber: string;
  storeName: string;
  username: string;
  customerName: string;
  customerPhone: string;
  total: number;
  currency: string;
  paymentMethod: OrderPaymentMethod;
  gateway: string | null;
  paymentStatus: OrderPaymentStatus;
  status: OrderStatus;
  createdAt: string;
};
export type AdminAuditRow = { id: string; actorEmail: string; action: string; entity: string; entityId: string | null; meta: unknown; createdAt: string };
export type CouponRow = { id: string; code: string; percentOff: number; maxRedemptions: number | null; redemptions: number; expiresAt: string | null; isActive: boolean; createdAt: string };
export type AdminUserDetail = {
  id: string;
  email: string;
  name: string;
  role: AdminUserDTO["role"];
  status: AdminUserDTO["status"];
  referralCode: string;
  createdAt: string;
  lastLoginAt: string | null;
  subscription: { status: string; interval: string; currentPeriodEnd: string | null; plan: PlanDTO } | null;
  profiles: { id: string; username: string; displayName: string; isPublished: boolean; verification: VerificationStatus }[];
  payments: PaymentDTO[];
  _count: { referrals: number; shortLinks: number };
};

type ListParams = { page: number; pageSize?: number; search?: string; [k: string]: string | number | undefined };

class AdminApi extends BaseApiService {
  constructor() {
    super("/admin");
  }
  stats = () => this.get<AdminStats>("/stats");

  users = (p: ListParams) => this.getPaginated<AdminUserDTO>("/users", p);
  user = (id: string) => this.get<AdminUserDetail>(`/users/${id}`);
  updateUser = (id: string, body: AdminUpdateUserInput) => this.patch<{ id: string }>(`/users/${id}`, body);
  deleteUser = (id: string) => this.delete(`/users/${id}`);
  assignPlan = (id: string, body: AdminAssignPlanInput) => this.post<{ ok: boolean }>(`/users/${id}/plan`, body);
  impersonate = (id: string) => this.post<{ ok: boolean }>(`/users/${id}/impersonate`);

  profiles = (p: ListParams) => this.getPaginated<AdminProfileRow>("/profiles", p);
  updateProfile = (id: string, body: { verification?: VerificationStatus; isPublished?: boolean }) => this.patch<{ id: string }>(`/profiles/${id}`, body);

  templates = () => this.get<(TemplateDTO & { usage: number })[]>("/templates");
  createTemplate = (body: TemplateInput) => this.post<TemplateDTO>("/templates", body);
  updateTemplate = (id: string, body: TemplateInput) => this.put<TemplateDTO>(`/templates/${id}`, body);
  deleteTemplate = (id: string) => this.delete(`/templates/${id}`);

  plans = () => this.get<(PlanDTO & { subscribers: number })[]>("/plans");
  createPlan = (body: PlanInput) => this.post<PlanDTO>("/plans", body);
  updatePlan = (id: string, body: PlanInput) => this.put<PlanDTO>(`/plans/${id}`, body);
  deletePlan = (id: string) => this.delete(`/plans/${id}`);

  payments = (p: ListParams) => this.getPaginated<PaymentDTO>("/payments", p);
  reviewPayment = (id: string, action: "approve" | "reject" | "refund") => this.post<{ id: string }>(`/payments/${id}`, { action });

  coupons = () => this.get<CouponRow[]>("/coupons");
  createCoupon = (body: CouponInput) => this.post<CouponRow>("/coupons", body);
  updateCoupon = (id: string, body: CouponInput) => this.put<CouponRow>(`/coupons/${id}`, body);
  deleteCoupon = (id: string) => this.delete(`/coupons/${id}`);

  payouts = (p: ListParams) => this.getPaginated<AdminPayoutRow>("/payouts", p);
  processPayout = (id: string, status: PayoutStatus, note?: string) => this.patch<{ id: string }>(`/payouts/${id}`, { status, note });

  shortLinks = (p: ListParams) => this.getPaginated<ShortLinkDTO & { userEmail: string }>("/short-links", p);
  toggleShortLink = (id: string, isActive: boolean) => this.patch<{ id: string }>(`/short-links/${id}`, { isActive });

  orders = (p: ListParams) => this.getPaginated<AdminOrderRow>("/orders", p);
  audit = (p: ListParams) => this.getPaginated<AdminAuditRow>("/audit", p);

  settings = () => this.get<{ settings: PlatformSettings; gateways: { sslcommerz: boolean; bkash: boolean } }>("/settings");
  saveSettings = (body: PlatformSettings) => this.put<{ settings: PlatformSettings; gateways: { sslcommerz: boolean; bkash: boolean } }>("/settings", body);
}

export const adminApi = new AdminApi();
