import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getPublicStore } from "@/server/queries/public";
import { ShopShell } from "@/features/shop/components/public/shop-shell";
import { ProductDetail } from "@/features/shop/components/public/product-detail";
import { ProductCard } from "@/features/shop/components/public/product-card";
import { CartBar } from "@/features/shop/components/public/cart-button";
import { ShopSkeleton } from "@/features/shop/components/public/shop-skeleton";
import { absoluteUrl, routes } from "@/config/site";
import { toMajor } from "@/lib/money";

type Props = PageProps<"/[username]/shop/p/[slug]">;

async function load(params: Props["params"]) {
  const { username, slug } = await params;
  const data = await getPublicStore(username);
  const product = data?.products.find((p) => p.slug === slug);
  return data && product ? { data, product } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Product not found", robots: { index: false } };
  const { data, product } = found;
  const title = `${product.name} — ${data.store.name}`;
  const description = product.description.slice(0, 160) || `Buy ${product.name} from ${data.store.name}`;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: absoluteUrl(routes.product(data.profile.username, product.slug)) },
    openGraph: { title, description, images: product.images.slice(0, 1), url: absoluteUrl(routes.product(data.profile.username, product.slug)) },
  };
}

async function ProductContent({ params }: { params: Props["params"] }) {
  const found = await load(params);
  if (!found) notFound();
  const { data, product } = found;
  const related = data.products.filter((p) => p.id !== product.id && (!product.categoryId || p.categoryId === product.categoryId)).slice(0, 4);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    brand: data.store.name,
    offers: {
      "@type": "Offer",
      priceCurrency: data.store.currency,
      price: toMajor(product.price),
      availability: product.stock === 0 ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      url: absoluteUrl(routes.product(data.profile.username, product.slug)),
    },
  };
  return (
    <ShopShell data={data} back={{ href: routes.shop(data.profile.username), label: data.store.name }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductDetail product={product} data={data} />
      {related.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 font-semibold">You may also like</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} username={data.profile.username} currency={data.store.currency} />
            ))}
          </div>
        </section>
      )}
      <CartBar storeId={data.store.id} username={data.profile.username} label="Checkout" />
    </ShopShell>
  );
}

export default function ProductPage(props: Props) {
  return (
    <Suspense fallback={<ShopSkeleton />}>
      <ProductContent params={props.params} />
    </Suspense>
  );
}
