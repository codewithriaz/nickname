"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shortLinksApi } from "./api";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/types";
import type { ShortLinkDTO } from "@/types/dto";
import type { ShortLinkInput, UpdateShortLinkInput } from "@/schemas/short-link";

const onError = (e: ApiError) => toast.error(e.message);

export function useShortLinks(params: { page: number; search?: string }) {
  return useQuery({ queryKey: qk.shortLinks(params), queryFn: () => shortLinksApi.list({ ...params, pageSize: 20 }), placeholderData: keepPreviousData });
}

export function useShortLinkAnalytics(id: string | null, days: number) {
  return useQuery({ queryKey: qk.shortLinkAnalytics(id ?? "", { days }), queryFn: () => shortLinksApi.analytics(id!, { days }), enabled: !!id });
}

export function useShortLinkMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["short-links"] });
  return {
    create: useMutation<ShortLinkDTO, ApiError, ShortLinkInput>({
      mutationFn: shortLinksApi.create,
      onSuccess: () => {
        invalidate();
        toast.success("Short link created");
      },
      onError,
    }),
    update: useMutation<ShortLinkDTO, ApiError, { id: string; body: UpdateShortLinkInput }>({
      mutationFn: ({ id, body }) => shortLinksApi.update(id, body),
      onSuccess: invalidate,
      onError,
    }),
    remove: useMutation<unknown, ApiError, string>({ mutationFn: shortLinksApi.remove, onSuccess: invalidate, onError }),
  };
}
