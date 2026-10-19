import type { BlockDTO, ProductDTO, ProfileDTO, StoreDTO, TabDTO } from "@/types/dto";
import type { PublicProfileData } from "@/types/public";

/** Builds the same shape the public page uses, from dashboard query data (live preview). */
export function buildPreviewData(
  profile: ProfileDTO,
  blocks: BlockDTO[],
  tabs: TabDTO[],
  opts: { store?: StoreDTO | null; products?: ProductDTO[]; showBranding: boolean },
): PublicProfileData {
  const now = Date.now();
  const visible = blocks.filter(
    (b) => b.isActive && (!b.startsAt || new Date(b.startsAt).getTime() <= now) && (!b.endsAt || new Date(b.endsAt).getTime() > now),
  );
  return {
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      verified: profile.verification === "APPROVED",
      socials: profile.socials,
      settings: profile.settings,
      seo: profile.seo,
    },
    theme: profile.resolvedTheme,
    tabs,
    blocks: visible,
    products: Object.fromEntries((opts.products ?? []).map((p) => [p.id, p])),
    store: opts.store ? { id: opts.store.id, name: opts.store.name, currency: opts.store.currency, productCount: opts.products?.length ?? 0 } : null,
    showBranding: opts.showBranding,
    pixels: null,
    redirectUrl: null,
  };
}
