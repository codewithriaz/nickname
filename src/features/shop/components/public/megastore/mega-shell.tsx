import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import {
  BadgeCheck,
  ChevronDown,
  Headphones,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Phone,
  RotateCcw,
  Truck,
  PackageSearch,
  User,
} from "lucide-react";
import { Toaster } from "sonner";
import type { PublicStoreData } from "@/types/public";
import { routes, siteConfig } from "@/config/site";
import {
  gatewayDef,
  MANUAL_PROVIDERS,
  manualProvidersForCountry,
} from "@/config/payment-gateways";
import { initials } from "@/lib/utils";
import { CartButton } from "../cart-button";
import { Pixels } from "@/components/profile-renderer/pixels";
import { MegaSearch, WishlistLink } from "./mega-client";

/** "Mega store" storefront chrome — announcement bar, search header, category menu, rich footer. */
export function MegaShell({
  data,
  children,
}: {
  data: PublicStoreData;
  children: ReactNode;
}) {
  const { store, profile, categories } = data;
  const shop = routes.shop(profile.username);
  const paymentBadges = [
    ...(store.payment.cod ? ["Cash on Delivery"] : []),
    ...store.payment.gateways.map((g) => gatewayDef(g.key)?.name ?? g.label),
    ...(store.payment.manual
      ? manualProvidersForCountry(store.country)
          .filter((p) => store.payment.manualAccounts[p])
          .map((p) => MANUAL_PROVIDERS[p].label.replace(/ \(.*\)/, ""))
      : []),
  ];

  return (
    <div
      className="min-h-dvh bg-zinc-50 text-zinc-900"
      style={{ "--brand": store.brandColor } as CSSProperties}
    >
      {data.pixels && <Pixels {...data.pixels} />}
      <Toaster position="top-center" richColors />
      {store.announcement && (
        <div className="bg-[var(--brand)] px-4 py-2 text-center text-xs font-medium text-white">
          {store.announcement}
        </div>
      )}

      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
          <Link href={shop} className="flex shrink-0 items-center gap-2">
            {store.logoUrl || profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={store.logoUrl || profile.avatarUrl!}
                alt={store.name}
                className="h-9 w-auto max-w-28 rounded object-contain"
              />
            ) : (
              <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--brand)] text-sm font-bold text-white">
                {initials(store.name)}
              </span>
            )}
            <span className="hidden font-bold sm:block">{store.name}</span>
            {profile.verified && (
              <BadgeCheck className="hidden size-4 fill-sky-500 text-white sm:block" />
            )}
          </Link>
          <MegaSearch
            username={profile.username}
            className="hidden flex-1 md:flex"
          />
          <nav className="ml-auto flex items-center gap-4">
            <Link
              href={`${shop}/track`}
              className="flex flex-col items-center text-[11px] text-zinc-600 hover:text-[var(--brand)]"
            >
              <User className="size-5" />
              <span className="hidden sm:block">Track</span>
            </Link>
            <WishlistLink storeId={store.id} username={profile.username} />
            <span className="flex flex-col items-center text-[11px] text-zinc-600">
              <CartButton storeId={store.id} username={profile.username} />
            </span>
          </nav>
        </div>
        <div className="px-4 pb-3 md:hidden">
          <MegaSearch username={profile.username} />
        </div>
        <div className="border-t border-zinc-100">
          <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2">
            <details className="group relative shrink-0">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white [&::-webkit-details-marker]:hidden">
                <LayoutGrid className="size-4" /> All categories{" "}
                <ChevronDown className="size-4 transition group-open:rotate-180" />
              </summary>
              <div className="absolute left-0 z-40 mt-1 w-56 rounded-xl border border-zinc-200 bg-white p-1 shadow-xl">
                <Link
                  href={`${shop}/all`}
                  className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100"
                >
                  All products
                </Link>
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    href={`${shop}/all?category=${c.slug}`}
                    className="block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </details>
            <div className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto no-scrollbar">
              {categories.slice(0, 6).map((c) => (
                <Link
                  key={c.id}
                  href={`${shop}/all?category=${c.slug}`}
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:border-[var(--brand)] hover:text-[var(--brand)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
            <Link
              href={`${shop}/track`}
              className="ml-auto hidden shrink-0 items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:border-[var(--brand)] sm:flex"
            >
              <PackageSearch className="size-4" /> Track order
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>

      <section className="mx-auto max-w-6xl px-4 pb-10">
        <div className="grid gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/70 sm:grid-cols-3">
          {[
            {
              icon: Truck,
              title: "Fast delivery",
              text: `${store.insideLabel} & ${store.outsideLabel}`,
              color: "bg-blue-600",
            },
            {
              icon: Headphones,
              title: "Customer support",
              text: store.phone ? `Call ${store.phone}` : "Message us any time",
              color: "bg-green-600",
            },
            {
              icon: RotateCcw,
              title: "Easy returns",
              text: "Problem with your order? We'll make it right.",
              color: "bg-rose-500",
            },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-full text-white ${f.color}`}
              >
                <f.icon className="size-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{f.title}</span>
                <span className="text-xs text-zinc-500">{f.text}</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[var(--brand)] text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
          <div className="space-y-2 text-sm">
            <p className="text-lg font-bold">{store.name}</p>
            {store.description && (
              <p className="opacity-85">{store.description}</p>
            )}
            {store.phone && (
              <a
                href={`tel:${store.phone}`}
                className="flex items-center gap-2 opacity-90"
              >
                <Phone className="size-4" /> {store.phone}
              </a>
            )}
            {store.address && (
              <p className="flex items-center gap-2 opacity-90">
                <MapPin className="size-4" /> {store.address}
              </p>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Shop</p>
            <Link
              href={`${shop}/all`}
              className="block opacity-85 hover:opacity-100"
            >
              All products
            </Link>
            <Link
              href={`${shop}/track`}
              className="block opacity-85 hover:opacity-100"
            >
              Track order
            </Link>
            <Link
              href={routes.profile(profile.username)}
              className="block opacity-85 hover:opacity-100"
            >
              About us
            </Link>
          </div>
          <div className="space-y-2 text-sm">
            <p className="font-semibold">Contact</p>
            {store.whatsapp && (
              <a
                href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener"
                className="flex items-center gap-2 opacity-85 hover:opacity-100"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            )}
            {store.messengerUrl && (
              <a
                href={store.messengerUrl}
                target="_blank"
                rel="noopener"
                className="block opacity-85 hover:opacity-100"
              >
                Messenger
              </a>
            )}
          </div>
        </div>
        {paymentBadges.length > 0 && (
          <div className="mx-auto max-w-6xl px-4 pb-6">
            <p className="mb-2 text-center text-xs opacity-75">We accept</p>
            <div className="flex flex-wrap justify-center gap-2">
              {paymentBadges.map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-white px-2.5 py-1 text-[11px] font-semibold text-zinc-800"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}
        <div className="border-t border-white/15 py-4 text-center text-xs opacity-80">
          © {store.name}
          {data.showBranding && (
            <>
              {" · "}
              <a href={`${siteConfig.url}/?ref=shop`} className="underline">
                Powered by {siteConfig.name}
              </a>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
