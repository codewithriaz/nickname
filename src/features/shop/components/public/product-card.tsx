import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { ProductDTO } from "@/types/dto";
import { discountPercent, formatMoney } from "@/lib/money";
import { routes } from "@/config/site";

export function ProductCard({ product, username, currency }: { product: ProductDTO; username: string; currency: string }) {
  const off = discountPercent(product.price, product.comparePrice);
  const soldOut = product.stock === 0;
  return (
    <Link
      href={routes.product(username, product.slug)}
      prefetch={true}
      className="group overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
      data-nk-search={product.name.toLowerCase()}
      data-category={product.categoryId ?? ""}
    >
      <div className="relative aspect-square bg-zinc-100">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.images[0]} alt={product.name} className="size-full object-cover transition group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex size-full items-center justify-center text-zinc-300">
            <ShoppingBag className="size-10" />
          </div>
        )}
        {off > 0 && <span className="absolute left-2 top-2 rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">-{off}%</span>}
        {soldOut && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-semibold text-white">Sold out</span>}
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-medium leading-snug">{product.name}</p>
        <p className="mt-1 text-sm">
          <span className="font-bold">{formatMoney(product.price, currency)}</span>
          {off > 0 && <s className="ml-1.5 text-xs text-zinc-400">{formatMoney(product.comparePrice!, currency)}</s>}
        </p>
      </div>
    </Link>
  );
}
