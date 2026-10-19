"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { shopApi } from "./api";
import { qk } from "@/lib/query-keys";
import type { ApiError } from "@/lib/api/types";
import type { OrderDTO, ProductDTO, StoreDTO } from "@/types/dto";
import type { ProductInput, StoreInput, UpdateOrderInput } from "@/schemas/shop";
import type { OrderStatus } from "@/generated/prisma/enums";

const onError = (e: ApiError) => toast.error(e.message);

export function useStore(profileId: string | null) {
  return useQuery({ queryKey: qk.store(profileId ?? ""), queryFn: () => shopApi.store(profileId!), enabled: !!profileId });
}

export function useSaveStore(profileId: string) {
  const qc = useQueryClient();
  return useMutation<StoreDTO, ApiError, StoreInput>({
    mutationFn: (body) => shopApi.saveStore(profileId, body),
    onSuccess: (s) => {
      qc.setQueryData(qk.store(profileId), s);
      qc.invalidateQueries({ queryKey: qk.profiles });
      toast.success("Shop saved");
    },
    onError,
  });
}

export function useProducts(storeId: string | null | undefined) {
  return useQuery({ queryKey: qk.products(storeId ?? ""), queryFn: () => shopApi.products(storeId!), enabled: !!storeId });
}

export function useCategories(storeId: string | null | undefined) {
  return useQuery({ queryKey: qk.categories(storeId ?? ""), queryFn: () => shopApi.categories(storeId!), enabled: !!storeId });
}

export function useCategoryMutations(storeId: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: qk.categories(storeId) });
  return {
    create: useMutation<unknown, ApiError, string>({ mutationFn: (name) => shopApi.createCategory(storeId, name), onSuccess: invalidate, onError }),
    update: useMutation<unknown, ApiError, { id: string; imageUrl: string | null }>({
      mutationFn: ({ id, imageUrl }) => shopApi.updateCategory(id, { imageUrl }),
      onSuccess: invalidate,
      onError,
    }),
    remove: useMutation<unknown, ApiError, string>({ mutationFn: shopApi.deleteCategory, onSuccess: invalidate, onError }),
  };
}

export function useProductMutations(storeId: string) {
  const qc = useQueryClient();
  const key = qk.products(storeId);
  return {
    create: useMutation<ProductDTO, ApiError, ProductInput>({
      mutationFn: (body) => shopApi.createProduct(storeId, body),
      onSuccess: (p) => {
        qc.setQueryData<ProductDTO[]>(key, (old = []) => [...old, p]);
        toast.success("Product added");
      },
      onError,
    }),
    update: useMutation<ProductDTO, ApiError, { id: string; body: ProductInput }>({
      mutationFn: ({ id, body }) => shopApi.updateProduct(id, body),
      onSuccess: (p) => {
        qc.setQueryData<ProductDTO[]>(key, (old = []) => old.map((x) => (x.id === p.id ? p : x)));
        toast.success("Product updated");
      },
      onError,
    }),
    remove: useMutation<unknown, ApiError, string>({
      mutationFn: shopApi.deleteProduct,
      onSuccess: (_r, id) => qc.setQueryData<ProductDTO[]>(key, (old = []) => old.filter((x) => x.id !== id)),
      onError,
    }),
  };
}

export function useOrders(storeId: string | null | undefined, params: { page: number; status?: OrderStatus; search?: string }) {
  return useQuery({
    queryKey: qk.orders(storeId ?? "", params),
    queryFn: () => shopApi.orders(storeId!, { ...params, pageSize: 20 }),
    enabled: !!storeId,
    placeholderData: (prev) => prev,
  });
}

export function useStoreStats(storeId: string | null | undefined) {
  return useQuery({ queryKey: qk.storeStats(storeId ?? ""), queryFn: () => shopApi.stats(storeId!), enabled: !!storeId });
}

export function useUpdateOrder(storeId: string) {
  const qc = useQueryClient();
  return useMutation<OrderDTO, ApiError, { id: string; body: UpdateOrderInput }>({
    mutationFn: ({ id, body }) => shopApi.updateOrder(id, body),
    onSuccess: (o) => {
      qc.setQueryData(qk.order(o.id), o);
      qc.invalidateQueries({ queryKey: ["stores", storeId] });
      toast.success("Order updated");
    },
    onError,
  });
}
