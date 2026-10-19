"use client";

import { useEffect } from "react";
import { track } from "@/features/public/api";

export function ShopPageView({ profileId }: { profileId: string }) {
  useEffect(() => track({ type: "SHOP_VIEW", profileId }), [profileId]);
  return null;
}
