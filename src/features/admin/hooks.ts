"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/types";
import type { Paginated } from "@/lib/api/types";

/** Paginated admin list query (server-side pagination + search). */
export function useAdminList<T>(key: (p: object) => QueryKey, fetcher: (p: { page: number; search?: string; [k: string]: string | number | undefined }) => Promise<Paginated<T>>, params: { page: number; search?: string; [k: string]: string | number | undefined }) {
  return useQuery({ queryKey: key(params), queryFn: () => fetcher({ ...params, pageSize: 20 }), placeholderData: keepPreviousData });
}

/** Mutation that refreshes every admin query on success. */
export function useAdminMutation<TVars, TData = unknown>(fn: (v: TVars) => Promise<TData>, success?: string) {
  const qc = useQueryClient();
  return useMutation<TData, ApiError, TVars>({
    mutationFn: fn,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.admin.all });
      if (success) toast.success(success);
    },
    onError: (e) => toast.error(e.message),
  });
}
