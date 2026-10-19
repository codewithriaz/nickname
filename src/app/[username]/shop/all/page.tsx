import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/server/queries/public";
import { ShopShell } from "@/features/shop/components/public/shop-shell";
import { AllProducts } from "@/features/shop/components/public/megastore/mega-all-products";
import { CartBar } from "@/features/shop/components/public/cart-button";
import { ShopSkeleton } from "@/features/shop/components/public/shop-skeleton";
import { absoluteUrl, routes } from "@/config/site";

type Props = PageProps<"/[username]/shop/all">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const data = await getPublicStore(username);
  if (!data) return { title: "Shop not found", robots: { index: false } };
  return {
    title: { absolute: `All products — ${data.store.name}` },
    alternates: { canonical: absoluteUrl(`${routes.shop(data.profile.username)}/all`) },
  };
}

async function Content({ params }: { params: Props["params"] }) {
  const { username } = await params;
  const data = await getPublicStore(username);
  if (!data) notFound();
  return (
    <ShopShell data={data} back={{ href: routes.shop(data.profile.username), label: data.store.name }}>
      {/* search params are read on the client so this page stays cached */}
      <Suspense>
        <AllProducts data={data} />
      </Suspense>
      <CartBar storeId={data.store.id} username={data.profile.username} label="Checkout" />
    </ShopShell>
  );
}

export default function AllProductsPage(props: Props) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <Content params={props.params} />
    </Suspense>
  );
}
