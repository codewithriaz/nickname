import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getPublicStore } from "@/server/queries/public";
import { ShopShell } from "@/features/shop/components/public/shop-shell";
import { ProductGrid } from "@/features/shop/components/public/product-grid";
import { CartBar } from "@/features/shop/components/public/cart-button";
import { ShopPageView } from "@/features/shop/components/public/shop-page-view";
import { ShopSkeleton } from "@/features/shop/components/public/shop-skeleton";
import { MegaHome } from "@/features/shop/components/public/megastore/mega-home";
import { absoluteUrl, routes } from "@/config/site";

export async function generateMetadata({ params }: PageProps<"/[username]/shop">): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicStore(username);
  if (!data) return { title: "Shop not found", robots: { index: false } };
  const title = `${data.store.name} — Shop`;
  const description = data.store.description || `Order from ${data.store.name}. Cash on delivery available.`;
  const image = data.store.bannerUrl || data.store.logoUrl || data.products[0]?.images[0];
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(routes.shop(data.profile.username)) },
    openGraph: { title, description, images: image ? [image] : undefined, url: absoluteUrl(routes.shop(data.profile.username)) },
  };
}

async function ShopContent({ params }: { params: PageProps<"/[username]/shop">["params"] }) {
  const { username } = await params;
  const data = await getPublicStore(username);
  if (!data) notFound();
  const { store } = data;
  if (store.layout === "megastore") {
    return (
      <ShopShell data={data}>
        <ShopPageView profileId={data.profile.id} />
        <MegaHome data={data} />
        <CartBar storeId={store.id} username={data.profile.username} label="Checkout" />
      </ShopShell>
    );
  }
  return (
    <ShopShell data={data}>
      <ShopPageView profileId={data.profile.id} />
      {store.bannerUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={store.bannerUrl} alt="" className="mb-4 aspect-[3/1] w-full rounded-3xl object-cover" />
      )}
      <div className="mb-4">
        <h1 className="text-2xl font-bold">{store.name}</h1>
        {store.description && <p className="mt-1 text-sm opacity-80">{store.description}</p>}
        {store.address && (
          <p className="mt-1 flex items-center gap-1 text-xs opacity-70">
            <MapPin className="size-3.5" /> {store.address}
          </p>
        )}
        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold">
          {store.payment.cod && <span className="rounded-full bg-white/80 px-2.5 py-1 text-zinc-800">💵 Cash on Delivery</span>}
          {store.payment.gateways.map((g) => (
            <span key={g.key} className="rounded-full bg-white/80 px-2.5 py-1 text-zinc-800">
              💳 {g.label}
            </span>
          ))}
          {store.payment.manual && <span className="rounded-full bg-white/80 px-2.5 py-1 text-zinc-800">📱 Send money</span>}
        </div>
      </div>
      <ProductGrid data={data} />
      <CartBar storeId={store.id} username={data.profile.username} label="Checkout" />
    </ShopShell>
  );
}

/** ISR storefront (cached + tag-revalidated on product/store edits). */
export default function ShopPage(props: PageProps<"/[username]/shop">) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ShopContent params={props.params} />
    </Suspense>
  );
}
