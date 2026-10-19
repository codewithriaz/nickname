import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/server/queries/public";
import { ShopShell } from "@/features/shop/components/public/shop-shell";
import { TrackOrderForm } from "@/features/shop/components/public/track-order-form";
import { ShopSkeleton } from "@/features/shop/components/public/shop-skeleton";
import { routes } from "@/config/site";

export const metadata = { title: "Track order", robots: { index: false } };

async function Content({ params }: { params: PageProps<"/[username]/shop/track">["params"] }) {
  const { username } = await params;
  const data = await getPublicStore(username);
  if (!data) notFound();
  return (
    <ShopShell data={data} back={{ href: routes.shop(data.profile.username), label: data.store.name }}>
      <TrackOrderForm storeId={data.store.id} />
    </ShopShell>
  );
}

export default function TrackPage(props: PageProps<"/[username]/shop/track">) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <Content params={props.params} />
    </Suspense>
  );
}
