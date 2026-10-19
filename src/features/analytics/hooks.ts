"use client";

import { useQuery } from "@tanstack/react-query";
import { profilesApi } from "@/features/profiles/api";
import { qk } from "@/lib/query-keys";

export function useProfileAnalytics(profileId: string | null, days: number) {
  return useQuery({
    queryKey: qk.analytics(profileId ?? "", { days }),
    queryFn: () => profilesApi.analytics(profileId!, { days }),
    enabled: !!profileId,
    placeholderData: (prev) => prev,
  });
}
