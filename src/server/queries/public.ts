import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { db } from "../db";
import { tags } from "../cache/tags";
import { getUserPlan } from "../services/plan.service";
import { toBlockDTO, toPlanDTO, toPublicProductDTO, toTabDTO, toTemplateDTO } from "../services/mappers";
import { storeGatewayAvailable } from "../services/order.service";
import { gatewayDef, type GatewayKey } from "@/config/payment-gateways";
import { resolveTheme } from "@/schemas/theme";
import { profileSeoSchema, profileSettingsSchema, socialLinkSchema } from "@/schemas/profile";
import { manualAccountsSchema, slideSchema, STORE_LAYOUTS, type StoreLayout } from "@/schemas/shop";
import type { PublicProfileData, PublicStoreData } from "@/types/public";
import { z } from "zod";

const HOUR = 3600;

/** Shorten the cache lifetime so scheduled blocks / redirects flip on time. */
function lifeUntil(nextChange: number | null) {
  if (!nextChange) {
    cacheLife("days");
    return;
  }
  const secs = Math.max(60, Math.ceil((nextChange - Date.now()) / 1000));
  cacheLife({ stale: 60, revalidate: Math.min(secs, HOUR), expire: Math.max(secs + 60, 300) });
}

async function ownerFlags(userId: string, settings: z.infer<typeof profileSettingsSchema>) {
  const { features } = await getUserPlan(userId);
  return {
    showBranding: !(features.removeBranding && settings.hideBranding),
    pixels: features.pixels && (settings.fbPixelId || settings.gaId) ? { fbPixelId: settings.fbPixelId || undefined, gaId: settings.gaId || undefined } : null,
    features,
  };
}

/** ISR data for /[username]. Tagged so edits revalidate instantly. */
export async function getPublicProfile(username: string): Promise<PublicProfileData | null> {
  "use cache";
  const uname = username.toLowerCase();
  cacheTag(tags.profile(uname));

  const profile = await db.profile.findUnique({
    where: { username: uname },
    include: {
      template: true,
      tabs: { orderBy: { order: "asc" } },
      blocks: { where: { isActive: true }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] },
      store: { select: { id: true, name: true, currency: true, isActive: true, _count: { select: { products: { where: { isActive: true } } } } } },
      user: { select: { status: true } },
    },
  });
  if (!profile || !profile.isPublished || profile.user.status !== "ACTIVE") {
    cacheLife("minutes");
    return null;
  }
  if (profile.store) cacheTag(tags.store(profile.id));

  const now = Date.now();
  const boundaries: number[] = [];
  const visible = profile.blocks.filter((b) => {
    const s = b.startsAt?.getTime();
    const e = b.endsAt?.getTime();
    if (s && s > now) boundaries.push(s);
    if (e && e > now) boundaries.push(e);
    return (!s || s <= now) && (!e || e > now);
  });

  const settings = profileSettingsSchema.catch(profileSettingsSchema.parse({})).parse(profile.settings ?? {});
  const flags = await ownerFlags(profile.userId, settings);

  // Temporary redirect (Pro scheduling feature)
  let redirectUrl: string | null = null;
  if (profile.redirectBlockId && flags.features.scheduling) {
    const rs = profile.redirectStartsAt?.getTime();
    const re = profile.redirectEndsAt?.getTime();
    if (rs && rs > now) boundaries.push(rs);
    if (re && re > now) boundaries.push(re);
    if ((!rs || rs <= now) && (!re || re > now)) {
      redirectUrl = profile.blocks.find((b) => b.id === profile.redirectBlockId)?.url ?? null;
    }
  }
  lifeUntil(boundaries.length ? Math.min(...boundaries) : null);

  const productIds = visible
    .filter((b) => b.type === "PRODUCT")
    .map((b) => (b.data as { productId?: string })?.productId)
    .filter((id): id is string => !!id);
  const products = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds }, isActive: true, store: { profileId: profile.id } } })
    : [];

  return {
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      bio: profile.bio,
      avatarUrl: profile.avatarUrl,
      verified: profile.verification === "APPROVED",
      socials: z.array(socialLinkSchema).catch([]).parse(profile.socials),
      settings,
      seo: flags.features.customSeo ? profileSeoSchema.catch({}).parse(profile.seo) : {},
    },
    theme: resolveTheme(profile.template?.theme, profile.theme),
    tabs: flags.features.tabs ? profile.tabs.map(toTabDTO) : [],
    blocks: visible.map(toBlockDTO).map((b) => (flags.features.tabs ? b : { ...b, tabId: null })),
    products: Object.fromEntries(
      products.map((p) => [
        p.id,
        { id: p.id, name: p.name, slug: p.slug, price: p.price, comparePrice: p.comparePrice, images: p.images, type: p.type, affiliateUrl: p.affiliateUrl },
      ]),
    ),
    store:
      profile.store && profile.store.isActive
        ? { id: profile.store.id, name: profile.store.name, currency: profile.store.currency, productCount: profile.store._count.products }
        : null,
    showBranding: flags.showBranding,
    pixels: flags.pixels,
    redirectUrl,
  };
}

/** Resolve a verified custom domain → username. */
export async function getUsernameByDomain(domain: string) {
  "use cache";
  cacheTag(tags.profileDomain(domain));
  cacheLife("hours");
  const p = await db.profile.findFirst({ where: { customDomain: domain.toLowerCase(), domainVerified: true }, select: { username: true } });
  return p?.username ?? null;
}

/** ISR data for /[username]/shop and product pages. */
export async function getPublicStore(username: string): Promise<PublicStoreData | null> {
  "use cache";
  const uname = username.toLowerCase();
  cacheTag(tags.profile(uname));
  cacheLife("days");

  const profile = await db.profile.findUnique({
    where: { username: uname },
    include: {
      template: true,
      user: { select: { status: true } },
      store: {
        include: {
          categories: { orderBy: { order: "asc" } },
          products: { where: { isActive: true }, orderBy: [{ isFeatured: "desc" }, { order: "asc" }, { createdAt: "desc" }] },
        },
      },
    },
  });
  if (!profile || !profile.isPublished || profile.user.status !== "ACTIVE" || !profile.store || !profile.store.isActive) return null;
  const store = profile.store;
  cacheTag(tags.store(profile.id));

  const settings = profileSettingsSchema.catch(profileSettingsSchema.parse({})).parse(profile.settings ?? {});
  const flags = await ownerFlags(profile.userId, settings);
  const online = flags.features.onlinePayments;

  return {
    profile: {
      id: profile.id,
      username: profile.username,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      verified: profile.verification === "APPROVED",
    },
    theme: resolveTheme(profile.template?.theme, profile.theme),
    store: {
      id: store.id,
      name: store.name,
      description: store.description,
      logoUrl: store.logoUrl,
      bannerUrl: store.bannerUrl,
      currency: store.currency,
      country: store.country,
      layout: (STORE_LAYOUTS as readonly string[]).includes(store.layout) ? (store.layout as StoreLayout) : "minimal",
      brandColor: store.brandColor,
      announcement: store.announcement,
      heroSlides: z.array(slideSchema).catch([]).parse(store.heroSlides),
      promoBanners: z.array(slideSchema).catch([]).parse(store.promoBanners),
      phone: store.phone,
      whatsapp: store.whatsapp,
      messengerUrl: store.messengerUrl,
      address: store.address,
      deliveryInside: store.deliveryInside,
      deliveryOutside: store.deliveryOutside,
      insideLabel: store.insideLabel,
      outsideLabel: store.outsideLabel,
      freeShippingMin: store.freeShippingMin,
      payment: {
        cod: store.codEnabled,
        manual: store.manualEnabled,
        manualAccounts: manualAccountsSchema.catch({}).parse(store.manualAccounts),
        gateways: (store.enabledGateways as GatewayKey[])
          .filter((k) => storeGatewayAvailable(store, k, online))
          .map((k) => {
            const def = gatewayDef(k)!;
            return { key: k, label: def.checkoutLabel, hint: def.checkoutHint, color: def.color };
          }),
      },
    },
    categories: store.categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug, imageUrl: c.imageUrl })),
    products: store.products.map(toPublicProductDTO),
    showBranding: flags.showBranding,
    pixels: flags.pixels,
  };
}

export async function getPublicPlans() {
  "use cache";
  cacheTag(tags.plans);
  cacheLife("hours");
  try {
    const plans = await db.plan.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    return plans.map(toPlanDTO);
  } catch (e) {
    console.error("[public] plans unavailable", e);
    cacheLife("seconds");
    return [];
  }
}

export async function getPublicTemplates() {
  "use cache";
  cacheTag(tags.templates);
  cacheLife("hours");
  try {
    const rows = await db.template.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } });
    return rows.map(toTemplateDTO);
  } catch (e) {
    console.error("[public] templates unavailable", e);
    cacheLife("seconds");
    return [];
  }
}
