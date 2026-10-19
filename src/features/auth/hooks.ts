"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authApi } from "./api";
import { qk } from "@/lib/query-keys";
import { useAuthStore } from "@/stores/auth-store";
import type { ApiError } from "@/lib/api/types";
import type { MeDTO } from "@/types/dto";
import type { PlanFeatureKey } from "@/schemas/plan";

export function useMe() {
  const setUser = useAuthStore((s) => s.setUser);
  const query = useQuery({ queryKey: qk.me, queryFn: authApi.me, staleTime: 60_000 });
  useEffect(() => {
    if (query.data) setUser(query.data);
  }, [query.data, setUser]);
  return query;
}

/** Plan feature flag for the logged-in user. */
export function useFeature(feature: PlanFeatureKey) {
  const { data } = useMe();
  return !!data?.plan.features[feature];
}

export function useAuthSuccess() {
  const qc = useQueryClient();
  const router = useRouter();
  return (me: MeDTO, next?: string | null) => {
    qc.setQueryData(qk.me, me);
    useAuthStore.getState().setUser(me);
    const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
    router.replace(safeNext ?? (me.role === "SUPER_ADMIN" ? "/admin" : "/dashboard"));
    router.refresh();
  };
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      qc.clear();
      useAuthStore.getState().setUser(null);
// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload: auth cookies changed, client state must reset
      window.location.href = "/login";
    },
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: authApi.updateAccount,
    onSuccess: (me) => {
      qc.setQueryData(qk.me, me);
      toast.success("Account updated");
    },
    onError: (e: ApiError) => toast.error(e.message),
  });
}
