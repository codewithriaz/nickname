import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, BadgeCheck, MessageCircle, Phone } from "lucide-react";
import type { PublicStoreData } from "@/types/public";
import { pageStyle } from "@/components/profile-renderer/theme-style";
import { routes, siteConfig } from "@/config/site";
import { initials } from "@/lib/utils";
import { CartButton } from "./cart-button";
import { Pixels } from "@/components/profile-renderer/pixels";
import { Toaster } from "sonner";
import { MegaShell } from "./megastore/mega-shell";

/** Mobile-first shop chrome: themed background, sticky header, floating cart. */
export function ShopShell({ data, children, back }: { data: PublicStoreData; children: ReactNode; back?: { href: string; label: string } }) {
  if (data.store.layout === "megastore") return <MegaShell data={data}>{children}</MegaShell>;
  const { store, profile } = data;
  return (
    <div className="min-h-dvh w-full" style={pageStyle(data.theme)}>
      {data.pixels && <Pixels {...data.pixels} />}
      <Toaster position="top-center" richColors />
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white/85 text-zinc-900 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          {back ? (
            <Link href={back.href} className="flex items-center gap-1 text-sm font-medium">
              <ArrowLeft className="size-4" /> {back.label}
            </Link>
          ) : (
            <Link href={routes.profile(profile.username)} className="flex min-w-0 items-center gap-2">
              {store.logoUrl || profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={store.logoUrl || profile.avatarUrl!} alt={store.name} className="size-8 rounded-full object-cover" />
              ) : (
                <span className="flex size-8 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">{initials(store.name)}</span>
              )}
              <span className="truncate font-semibold">{store.name}</span>
              {profile.verified && <BadgeCheck className="size-4 shrink-0 fill-sky-500 text-white" />}
            </Link>
          )}
          <div className="ml-auto flex items-center gap-1">
            {store.whatsapp && (
              <a href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="rounded-full p-2 hover:bg-zinc-100" aria-label="WhatsApp">
                <MessageCircle className="size-5" />
              </a>
            )}
            {store.phone && (
              <a href={`tel:${store.phone}`} className="rounded-full p-2 hover:bg-zinc-100" aria-label="Call">
                <Phone className="size-5" />
              </a>
            )}
            <CartButton storeId={store.id} username={profile.username} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pb-28 pt-4">{children}</main>
      {data.showBranding && (
        <footer className="pb-8 text-center text-xs opacity-70">
          <a href={`${siteConfig.url}/?ref=shop`}>⚡ Shop powered by {siteConfig.name}</a>
        </footer>
      )}
    </div>
  );
}
