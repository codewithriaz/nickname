import type { PublicProfileData } from "@/types/public";
import { TEMPLATE_PRESETS } from "@/config/templates";
import type { BlockDTO } from "@/types/dto";

const block = (id: string, partial: Partial<BlockDTO>): BlockDTO => ({
  id,
  profileId: "demo",
  tabId: null,
  parentId: null,
  type: "LINK",
  title: "",
  url: "#",
  data: {},
  thumbnail: null,
  layout: "CLASSIC",
  animation: "NONE",
  isActive: true,
  startsAt: null,
  endsAt: null,
  order: 0,
  clicks: 0,
  ...partial,
});

/** Static sample page rendered in the marketing hero (no DB needed). */
export function demoProfile(templateSlug = "bazaar"): PublicProfileData {
  const theme = (TEMPLATE_PRESETS.find((t) => t.slug === templateSlug) ?? TEMPLATE_PRESETS[0]).theme;
  return {
    profile: {
      id: "demo",
      username: "rangdhanu",
      displayName: "Rangdhanu Fashion",
      bio: "Handmade sarees & jewellery 🌸\nCash on delivery all over Bangladesh",
      avatarUrl: null,
      verified: true,
      socials: [
        { platform: "facebook", url: "#" },
        { platform: "instagram", url: "#" },
        { platform: "whatsapp", url: "#" },
        { platform: "tiktok", url: "#" },
      ],
      settings: { showSearch: false, showShare: false, hideBranding: true, sensitive: false, socialsPosition: "top" },
      seo: {},
    },
    theme,
    tabs: [],
    blocks: [
      block("1", { title: "🛍️ Shop new collection", layout: "HIGHLIGHT", animation: "PULSE", data: { highlightLabel: "New" } }),
      block("2", { title: "Order on WhatsApp", thumbnail: { kind: "emoji", value: "💬" } }),
      block("3", { type: "AFFILIATE", title: "My ring light", data: { disclosure: "Affiliate link", couponCode: "EID10" } }),
      block("4", { title: "Customer reviews", thumbnail: { kind: "emoji", value: "⭐" } }),
    ],
    products: {},
    store: null,
    showBranding: false,
    pixels: null,
    redirectUrl: null,
  };
}
