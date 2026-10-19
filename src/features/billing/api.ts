import { BaseApiService } from "@/lib/api/base-service";
import type { ApiKeyDTO, PaymentDTO, PlanDTO, ReferralSummaryDTO } from "@/types/dto";
import type { BillingCheckoutInput, PayoutRequestInput } from "@/schemas/billing";
import type { PlatformSettings } from "@/schemas/admin";

export type BillingOverview = {
  payments: PaymentDTO[];
  gateways: { sslcommerz: boolean; bkash: boolean };
  manual: PlatformSettings["manualBilling"];
  trialEligible: boolean;
};

class BillingApi extends BaseApiService {
  plans = () => this.get<PlanDTO[]>("/plans");
  overview = () => this.get<BillingOverview>("/billing");
  checkout = (body: BillingCheckoutInput) =>
    this.post<{ paymentId: string; redirectUrl: string | null; status: "PENDING" | "PAID" }>("/billing/checkout", body);
  startTrial = (planId: string) => this.post<{ ok: boolean }>("/billing/trial", { planId });
  setCancel = (cancel: boolean) => this.post<{ ok: boolean }>("/billing/cancel", { cancel });

  referrals = () => this.get<ReferralSummaryDTO>("/referrals");
  requestPayout = (body: PayoutRequestInput) => this.post<{ id: string; amount: number }>("/referrals/payout", body);

  apiKeys = () => this.get<ApiKeyDTO[]>("/api-keys");
  createApiKey = (name: string) => this.post<{ key: ApiKeyDTO; secret: string }>("/api-keys", { name });
  revokeApiKey = (id: string) => this.delete(`/api-keys/${id}`);
}

export const billingApi = new BillingApi();
