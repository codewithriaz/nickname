import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import type { PublicStoreData } from "@/types/public";
import type { ProductDTO } from "@/types/dto";
import { routes } from "@/config/site";
import { initials } from "@/lib/utils";
import { HeroSlider, MegaProductCard, ScrollRow } from "./mega-client";

function ProductRow({ data, products }: { data: PublicStoreData; products: ProductDTO[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {products.map((p) => (
        <MegaProductCard key={p.id} product={p} storeId={data.store.id} profileId={data.profile.id} username={data.profile.username} currency={data.store.currency} />
      ))}
    </div>
  );
}

function Section({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200/70 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="border-b-2 border-[var(--brand)] pb-1 text-lg font-bold text-[var(--brand)]">{title}</h2>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-sm text-[var(--brand)] hover:underline">
            See all <ArrowRight className="size-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Mega store home: hero slider → category carousel → promo banners → per-category sections → all products. */
export function MegaHome({ data }: { data: PublicStoreData }) {
  const { store, categories, products } = data;
  const shop = routes.shop(data.profile.username);
  const byCategory = categories
    .map((c) => ({ category: c, items: products.filter((p) => p.categoryId === c.id).slice(0, 5) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-8">
      <HeroSlider slides={store.heroSlides} fallbackTitle={store.name} fallbackText={store.description} />

      {categories.length > 0 && (
        <ScrollRow>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`${shop}/all?category=${c.slug}`}
              className="flex w-28 shrink-0 snap-start flex-col items-center gap-2 rounded-2xl bg-white p-3 text-center shadow-sm ring-1 ring-zinc-200/70 transition hover:ring-[var(--brand)] sm:w-32"
            >
              {c.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={c.imageUrl} alt="" className="size-14 rounded-xl object-cover" loading="lazy" />
              ) : (
                <span className="flex size-14 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-lg font-bold text-[var(--brand)]">{initials(c.name)}</span>
              )}
              <span className="line-clamp-2 text-xs font-medium">{c.name}</span>
            </Link>
          ))}
        </ScrollRow>
      )}

      {store.promoBanners.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-3">
          {store.promoBanners.map((b, i) => {
            // eslint-disable-next-line @next/next/no-img-element
            const img = <img src={b.imageUrl} alt={b.title ?? ""} className="aspect-[2/1] w-full rounded-xl object-cover transition hover:opacity-95" loading="lazy" />;
            return <div key={i}>{b.linkUrl ? <a href={b.linkUrl}>{img}</a> : img}</div>;
          })}
        </div>
      )}

      {byCategory.map(({ category, items }) => (
        <Section key={category.id} title={category.name} href={`${shop}/all?category=${category.slug}`}>
          <ProductRow data={data} products={items} />
        </Section>
      ))}

      <Section title="All products" href={`${shop}/all`}>
        {products.length ? (
          <ProductRow data={data} products={products.slice(0, 20)} />
        ) : (
          <p className="flex flex-col items-center gap-2 py-10 text-sm text-zinc-500">
            <ShoppingBag className="size-8" /> No products yet
          </p>
        )}
      </Section>
    </div>
  );
}
