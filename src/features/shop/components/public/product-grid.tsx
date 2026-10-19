"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { PublicStoreData } from "@/types/public";
import { ProductCard } from "./product-card";
import { cn } from "@/lib/utils";

export function ProductGrid({ data }: { data: PublicStoreData }) {
  const [category, setCategory] = useState<string>("all");
  const [q, setQ] = useState("");
  const products = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.products.filter(
      (p) => (category === "all" || p.categoryId === category) && (!query || p.name.toLowerCase().includes(query)),
    );
  }, [data.products, category, q]);

  return (
    <>
      <div className="mb-4 space-y-3">
        <label className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm text-zinc-900 shadow-sm ring-1 ring-black/5">
          <Search className="size-4 text-zinc-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full bg-transparent outline-none" />
        </label>
        {data.categories.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
            {[{ id: "all", name: "All" }, ...data.categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={cn(
                  "whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ring-1 ring-black/5",
                  category === c.id ? "bg-zinc-900 text-white" : "bg-white text-zinc-700",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} username={data.profile.username} currency={data.store.currency} />
        ))}
      </div>
      {products.length === 0 && <p className="py-16 text-center text-sm opacity-70">No products found</p>}
    </>
  );
}
