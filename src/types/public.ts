import type { BlockDTO, ProductDTO, TabDTO } from "./dto";
import type { ProfileTheme } from "@/schemas/theme";
import type { ProfileSeo, ProfileSettings, SocialLink } from "@/schemas/profile";
import type { ManualAccounts, StoreLayout, StoreSlide } from "@/schemas/shop";
import type { GatewayKey } from "@/config/payment-gateways";

/** Everything the public profile renderer needs (also used by the dashboard live preview). */
export type PublicProfileData = {
  profile: {
    id: string;
    username: string;
    displayName: string;
    bio: string;
    avatarUrl: string | null;
    verified: boolean;
    socials: SocialLink[];
    settings: ProfileSettings;
    seo: ProfileSeo;
  };
  theme: ProfileTheme;
  tabs: TabDTO[];
  blocks: BlockDTO[];
  products: Record<string, Pick<ProductDTO, "id" | "name" | "slug" | "price" | "comparePrice" | "images" | "type" | "affiliateUrl">>;
  store: { id: string; name: string; currency: string; productCount: number } | null;
  showBranding: boolean;
  pixels: { fbPixelId?: string; gaId?: string } | null;
  redirectUrl: string | null;
};

export type PublicStoreData = {
  profile: { id: string; username: string; displayName: string; avatarUrl: string | null; verified: boolean };
  theme: ProfileTheme;
  store: {
    id: string;
    name: string;
    description: string;
    logoUrl: string | null;
    bannerUrl: string | null;
    currency: string;
    phone: string | null;
    whatsapp: string | null;
    messengerUrl: string | null;
    address: string | null;
    deliveryInside: number;
    deliveryOutside: number;
    insideLabel: string;
    outsideLabel: string;
    freeShippingMin: number | null;
    country: string;
    layout: StoreLayout;
    brandColor: string;
    announcement: string | null;
    heroSlides: StoreSlide[];
    promoBanners: StoreSlide[];
    payment: {
      cod: boolean;
      manual: boolean;
      manualAccounts: ManualAccounts;
      /** online gateways usable right now (enabled + configured + plan allows + country/currency match) */
      gateways: { key: GatewayKey; label: string; hint: string; color: string }[];
    };
  };
  categories: { id: string; name: string; slug: string; imageUrl: string | null }[];
  products: ProductDTO[];
  showBranding: boolean;
  pixels: { fbPixelId?: string; gaId?: string } | null;
};
