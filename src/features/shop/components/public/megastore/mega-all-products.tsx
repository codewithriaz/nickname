"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import type { PublicStoreData } from "@/types/public";
import { useWishlist } from "@/stores/wishlist-store";
import { MegaProductCard } from "./mega-client";
import { ProductCard } from "../product-card";
import { cn } from "@/lib/utils";

/** All-products listing (both layouts): search, category, wishlist and sort — filters read from the URL on the client. */
export function AllProducts({ data }: { data: PublicStoreData }) {
  const params = useSearchParams();
  const mega = data.store.layout === "megastore";
  const wishlist = useWishlist(data.store.id);
  const [q, setQ] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState(params.get("category") ?? "");
  const [sort, setSort] = useState("featured");
  const onlyWishlist = params.get("wishlist") === "1";

  const products = useMemo(() => {
    const query = q.trim().toLowerCase();
    const cat = data.categories.find((c) => c.slug === category);
    const list = data.products.filter(
      (p) => (!cat || p.categoryId === cat.id) && (!query || p.name.toLowerCase().includes(query)) && (!onlyWishlist || wishlist.includes(p.id)),
    );
    if (sort === "price-asc") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") return [...list].sort((a, b) => b.price - a.price);
    if (sort === "newest") return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return list;
  }, [data, q, category, sort, onlyWishlist, wishlist]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">{onlyWishlist ? "Your wishlist" : category ? (data.categories.find((c) => c.slug === category)?.name ?? "Products") : "All products"}</h1>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2 rounded-xl bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm ring-1 ring-black/5">
          <Search className="size-4 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full bg-transparent outline-none" />
        </label>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl bg-white px-3 py-2.5 text-sm text-zinc-900 shadow-sm ring-1 ring-black/5" aria-label="Sort">
          <option value="featured">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price: low to high</option>
          <option value="price-desc">Price: high to low</option>
        </select>
      </div>
      {data.categories.length > 0 && !onlyWishlist && (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {[{ slug: "", name: "All" }, ...data.categories].map((c) => (
            <button
              key={c.slug || "all"}
              type="button"
              onClick={() => setCategory(c.slug)}
              className={cn(
                "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-black/5",
                category === c.slug ? (mega ? "bg-[var(--brand)] text-white" : "bg-zinc-900 text-white") : "bg-white text-zinc-700",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
      <div className={cn("grid grid-cols-2 gap-3", mega ? "sm:grid-cols-3 lg:grid-cols-5" : "sm:grid-cols-3")}>
        {products.map((p) =>
          mega ? (
            <MegaProductCard key={p.id} product={p} storeId={data.store.id} profileId={data.profile.id} username={data.profile.username} currency={data.store.currency} />
          ) : (
            <ProductCard key={p.id} product={p} username={data.profile.username} currency={data.store.currency} />
          ),
        )}
      </div>
      {products.length === 0 && <p className="py-16 text-center text-sm text-zinc-500">No products found</p>}
    </div>
  );
}
