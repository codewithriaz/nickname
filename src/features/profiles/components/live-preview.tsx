"use client";

import { memo, useMemo } from "react";
import { ProfileView } from "@/components/profile-renderer/profile-view";
import { useBlocks, useProfile, useTabs } from "../hooks";
import { useProducts, useStore } from "@/features/shop/hooks";
import { useMe } from "@/features/auth/hooks";
import { buildPreviewData } from "../lib/preview-data";
import type { ProfileDTO } from "@/types/dto";
import { Skeleton } from "@/components/ui/skeleton";

/** Phone-framed live preview. `themeOverride` lets the appearance editor preview unsaved changes. */
export const LivePreview = memo(function LivePreview({ profileId, profileOverride }: { profileId: string; profileOverride?: Partial<ProfileDTO> }) {
  const { data: profile } = useProfile(profileId);
  const { data: blocks } = useBlocks(profileId);
  const { data: tabs } = useTabs(profileId);
  const { data: store } = useStore(profileId);
  const { data: products } = useProducts(store?.id);
  const { data: me } = useMe();

  const data = useMemo(() => {
    if (!profile || !blocks) return null;
    const merged = profileOverride ? { ...profile, ...profileOverride } : profile;
    const showBranding = !(me?.plan.features.removeBranding && merged.settings.hideBranding);
    return buildPreviewData(merged, blocks, me?.plan.features.tabs ? (tabs ?? []) : [], { store, products, showBranding });
  }, [profile, blocks, tabs, store, products, me, profileOverride]);

  return (
    <div className="mx-auto w-[300px] rounded-[44px] border-[10px] border-zinc-900 bg-zinc-900 shadow-2xl">
      <div className="relative h-[600px] overflow-hidden rounded-[34px] bg-white">
        <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-zinc-900" />
        <div className="h-full overflow-y-auto no-scrollbar [&_main]:min-h-[600px] [&_main]:pt-10">
          {data ? <ProfileView data={data} preview /> : <Skeleton className="h-full rounded-none" />}
        </div>
      </div>
    </div>
  );
});
