"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingApi } from "./api";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/types";
import type { BillingCheckoutInput, PayoutRequestInput } from "@/schemas/billing";

const onError = (e: ApiError) => toast.error(e.message);

export const usePlans = () => useQuery({ queryKey: qk.plans, queryFn: billingApi.plans, staleTime: 5 * 60_000 });
export const useBillingOverview = () => useQuery({ queryKey: qk.billing, queryFn: billingApi.overview });
export const useReferrals = () => useQuery({ queryKey: qk.referrals, queryFn: billingApi.referrals });
export const useApiKeys = () => useQuery({ queryKey: qk.apiKeys, queryFn: billingApi.apiKeys });

export function useBillingMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: qk.billing });
    qc.invalidateQueries({ queryKey: qk.me });
  };
  return {
    checkout: useMutation({
      mutationFn: (body: BillingCheckoutInput) => billingApi.checkout(body),
      onSuccess: (r) => {
        if (r.redirectUrl) window.location.href = r.redirectUrl;
        else {
          refresh();
          toast.success(r.status === "PAID" ? "Plan activated 🎉" : "Payment submitted — we'll activate your plan after verification.");
        }
      },
      onError,
    }),
    trial: useMutation({
      mutationFn: (planId: string) => billingApi.startTrial(planId),
      onSuccess: () => {
        refresh();
        toast.success("Free trial started 🎉");
      },
      onError,
    }),
    cancel: useMutation({ mutationFn: (cancel: boolean) => billingApi.setCancel(cancel), onSuccess: refresh, onError }),
  };
}

export function useRequestPayout() {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, PayoutRequestInput>({
    mutationFn: billingApi.requestPayout,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.referrals });
      toast.success("Payout requested");
    },
    onError,
  });
}

export function useApiKeyMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.apiKeys });
  return {
    create: useMutation({ mutationFn: (name: string) => billingApi.createApiKey(name), onSuccess: invalidate, onError }),
    revoke: useMutation({ mutationFn: (id: string) => billingApi.revokeApiKey(id), onSuccess: invalidate, onError }),
  };
}
