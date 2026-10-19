"use client";

import { useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { profilesApi } from "./api";
import { qk } from "@/lib/query-keys";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { ApiError } from "@/lib/api/types";
import type { BlockDTO, ProfileDTO } from "@/types/dto";
import type { CreateBlockInput, UpdateBlockInput } from "@/schemas/block";
import type { CreateProfileInput, UpdateProfileInput } from "@/schemas/profile";

const onError = (e: ApiError) => toast.error(e.message);

export function useProfiles() {
  return useQuery({ queryKey: qk.profiles, queryFn: profilesApi.list });
}

/** Resolves the profile being edited (persisted choice, falls back to the first profile). */
export function useActiveProfileId() {
  const { data: profiles, isLoading } = useProfiles();
  const activeId = useWorkspaceStore((s) => s.activeProfileId);
  const setActive = useWorkspaceStore((s) => s.setActiveProfileId);
  const resolved = useMemo(() => {
    if (!profiles?.length) return null;
    return profiles.find((p) => p.id === activeId)?.id ?? profiles[0].id;
  }, [profiles, activeId]);
  useEffect(() => {
    if (resolved && resolved !== activeId) setActive(resolved);
  }, [resolved, activeId, setActive]);
  return { profileId: resolved, profiles: profiles ?? [], isLoading };
}

export function useProfile(id: string | null) {
  return useQuery({ queryKey: qk.profile(id ?? ""), queryFn: () => profilesApi.getOne(id!), enabled: !!id });
}

export function useCreateProfile() {
  const qc = useQueryClient();
  const setActive = useWorkspaceStore((s) => s.setActiveProfileId);
  return useMutation<ProfileDTO, ApiError, CreateProfileInput>({
    mutationFn: profilesApi.create,
    onSuccess: (p) => {
      qc.invalidateQueries({ queryKey: qk.profiles });
      qc.setQueryData(qk.profile(p.id), p);
      setActive(p.id);
      toast.success(`@${p.username} is live!`);
    },
    onError,
  });
}

export function useUpdateProfile(id: string) {
  const qc = useQueryClient();
  return useMutation<ProfileDTO, ApiError, UpdateProfileInput>({
    mutationFn: (body) => profilesApi.update(id, body),
    onSuccess: (p) => {
      qc.setQueryData(qk.profile(id), p);
      qc.invalidateQueries({ queryKey: qk.profiles, exact: true });
    },
    onError,
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  const setActive = useWorkspaceStore((s) => s.setActiveProfileId);
  return useMutation<{ id: string }, ApiError, string>({
    mutationFn: profilesApi.remove,
    onSuccess: () => {
      setActive(null);
      qc.invalidateQueries({ queryKey: qk.profiles });
      toast.success("Profile deleted");
    },
    onError,
  });
}

// ── Blocks ─────────────────────────────────────────────────────────────

export function useBlocks(profileId: string | null) {
  return useQuery({ queryKey: qk.blocks(profileId ?? ""), queryFn: () => profilesApi.blocks(profileId!), enabled: !!profileId });
}

export function useCreateBlock(profileId: string) {
  const qc = useQueryClient();
  return useMutation<BlockDTO, ApiError, CreateBlockInput>({
    mutationFn: (body) => profilesApi.createBlock(profileId, body),
    onSuccess: (block) => qc.setQueryData<BlockDTO[]>(qk.blocks(profileId), (old = []) => [...old, block]),
    onError,
  });
}

/** Optimistic update — the editor & live preview react instantly. */
export function useUpdateBlock(profileId: string) {
  const qc = useQueryClient();
  const key = qk.blocks(profileId);
  return useMutation<BlockDTO, ApiError, { id: string; body: UpdateBlockInput }, { prev?: BlockDTO[] }>({
    mutationFn: ({ id, body }) => profilesApi.updateBlock(id, body),
    onMutate: async ({ id, body }) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BlockDTO[]>(key);
      qc.setQueryData<BlockDTO[]>(key, (old = []) =>
        old.map((b) =>
          b.id === id
            ? ({
                ...b,
                ...body,
                data: body.data ? { ...b.data, ...body.data } : b.data,
                startsAt: body.startsAt === undefined ? b.startsAt : body.startsAt ? new Date(body.startsAt as string | Date).toISOString() : null,
                endsAt: body.endsAt === undefined ? b.endsAt : body.endsAt ? new Date(body.endsAt as string | Date).toISOString() : null,
              } as BlockDTO)
            : b,
        ),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      onError(e);
    },
    onSuccess: (block) => qc.setQueryData<BlockDTO[]>(key, (old = []) => old.map((b) => (b.id === block.id ? block : b))),
  });
}

export function useDeleteBlock(profileId: string) {
  const qc = useQueryClient();
  const key = qk.blocks(profileId);
  return useMutation<{ id: string }, ApiError, string, { prev?: BlockDTO[] }>({
    mutationFn: profilesApi.deleteBlock,
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BlockDTO[]>(key);
      qc.setQueryData<BlockDTO[]>(key, (old = []) => old.filter((b) => b.id !== id && b.parentId !== id));
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      onError(e);
    },
  });
}

export function useDuplicateBlock(profileId: string) {
  const qc = useQueryClient();
  return useMutation<BlockDTO, ApiError, string>({
    mutationFn: profilesApi.duplicateBlock,
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.blocks(profileId) }),
    onError,
  });
}

export function useReorderBlocks(profileId: string) {
  const qc = useQueryClient();
  const key = qk.blocks(profileId);
  return useMutation<{ ok: boolean }, ApiError, BlockDTO[], { prev?: BlockDTO[] }>({
    mutationFn: (ordered) => profilesApi.reorderBlocks(profileId, ordered.map((b, i) => ({ id: b.id, order: i, parentId: b.parentId }))),
    onMutate: async (ordered) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<BlockDTO[]>(key);
      const orderMap = new Map(ordered.map((b, i) => [b.id, { order: i, parentId: b.parentId }]));
      qc.setQueryData<BlockDTO[]>(key, (old = []) =>
        old.map((b) => (orderMap.has(b.id) ? { ...b, ...orderMap.get(b.id)! } : b)).sort((a, b) => a.order - b.order),
      );
      return { prev };
    },
    onError: (e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      onError(e);
    },
  });
}

// ── Tabs ───────────────────────────────────────────────────────────────

export function useTabs(profileId: string | null) {
  return useQuery({ queryKey: qk.tabs(profileId ?? ""), queryFn: () => profilesApi.tabs(profileId!), enabled: !!profileId });
}

export function useTabMutations(profileId: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: qk.tabs(profileId) });
    qc.invalidateQueries({ queryKey: qk.blocks(profileId) });
  };
  return {
    create: useMutation<unknown, ApiError, string>({ mutationFn: (title) => profilesApi.createTab(profileId, title), onSuccess: invalidate, onError }),
    rename: useMutation<unknown, ApiError, { id: string; title: string }>({ mutationFn: ({ id, title }) => profilesApi.updateTab(id, title), onSuccess: invalidate, onError }),
    remove: useMutation<unknown, ApiError, string>({ mutationFn: profilesApi.deleteTab, onSuccess: invalidate, onError }),
  };
}

export function useTemplates() {
  return useQuery({ queryKey: qk.templates, queryFn: profilesApi.templates, staleTime: 5 * 60_000 });
}
