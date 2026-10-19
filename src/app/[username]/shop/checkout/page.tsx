import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/server/queries/public";
import { ShopShell } from "@/features/shop/components/public/shop-shell";
import { CheckoutForm } from "@/features/shop/components/public/checkout-form";
import { ShopSkeleton } from "@/features/shop/components/public/shop-skeleton";
import { routes } from "@/config/site";

export const metadata = { title: "Checkout", robots: { index: false } };

async function CheckoutContent({ params }: { params: PageProps<"/[username]/shop/checkout">["params"] }) {
  const { username } = await params;
  const data = await getPublicStore(username);
  if (!data) notFound();
  return (
    <ShopShell data={data} back={{ href: routes.shop(data.profile.username), label: "Continue shopping" }}>
      <h1 className="mb-4 text-xl font-bold">Checkout</h1>
      <CheckoutForm data={data} />
    </ShopShell>
  );
}

/** Store data is cached; the cart + form are client-side (CSR). */
export default function CheckoutPage(props: PageProps<"/[username]/shop/checkout">) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <CheckoutContent params={props.params} />
    </Suspense>
  );
}
