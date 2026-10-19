import { BaseApiService } from "@/lib/api/base-service";
import type { SubscribeInput } from "@/schemas/profile";

class PublicApi extends BaseApiService {
  constructor() {
    super("/public");
  }
  subscribe = (body: SubscribeInput) => this.post<{ ok: boolean }>("/subscribe", body);
}

export const publicApi = new PublicApi();

type TrackPayload = {
  type: "PAGE_VIEW" | "LINK_CLICK" | "SHOP_VIEW" | "PRODUCT_VIEW" | "ADD_TO_CART" | "CHECKOUT_START";
  profileId: string;
  blockId?: string;
  productId?: string;
};

/** Fire-and-forget analytics beacon (survives navigation). */
export function track(payload: TrackPayload) {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const body = JSON.stringify({
    ...payload,
    referrer: document.referrer || undefined,
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  });
  if (navigator.sendBeacon) navigator.sendBeacon("/api/track", new Blob([body], { type: "text/plain" }));
  else void fetch("/api/track", { method: "POST", body, keepalive: true });
}
