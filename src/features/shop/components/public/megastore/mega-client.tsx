"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Heart, Search, ShoppingCart } from "lucide-react";
import type { ProductDTO } from "@/types/dto";
import type { StoreSlide } from "@/schemas/shop";
import { useCartStore } from "@/stores/cart-store";
import { useWishlist, useWishlistStore } from "@/stores/wishlist-store";
import { useHydrated } from "../cart-button";
import { track } from "@/features/public/api";
import { discountPercent, formatMoney } from "@/lib/money";
import { routes } from "@/config/site";
import { cn } from "@/lib/utils";

/** Header search → all-products page (client-side filtering keeps pages cacheable). */
export function MegaSearch({ username, className }: { username: string; className?: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`${routes.shop(username)}/all${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`);
  };
  return (
    <form onSubmit={submit} className={cn("flex h-10 items-center rounded-full border border-zinc-300 bg-white pl-4 pr-1 focus-within:border-[var(--brand)]", className)}>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="w-full bg-transparent text-sm outline-none" aria-label="Search products" />
      <button type="submit" className="rounded-full p-2 text-zinc-600 hover:text-[var(--brand)]" aria-label="Search">
        <Search className="size-4" />
      </button>
    </form>
  );
}

export function WishlistLink({ storeId, username }: { storeId: string; username: string }) {
  const count = useWishlist(storeId).length;
  const hydrated = useHydrated();
  return (
    <Link href={`${routes.shop(username)}/all?wishlist=1`} className="relative flex flex-col items-center text-[11px] text-zinc-600 hover:text-[var(--brand)]">
      <Heart className="size-5" />
      <span className="hidden sm:block">Wishlist</span>
      {hydrated && count > 0 && <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-[var(--brand)] text-[9px] font-bold text-white">{count}</span>}
    </Link>
  );
}

/** Auto-rotating hero slider with arrows & dots. */
export function HeroSlider({ slides, fallbackTitle, fallbackText }: { slides: StoreSlide[]; fallbackTitle: string; fallbackText: string }) {
  const [i, setI] = useState(0);
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 5000);
    return () => clearInterval(t);
  }, [n]);

  if (n === 0) {
    return (
      <div className="flex aspect-[16/7] flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand)] to-zinc-900 p-6 text-center text-white sm:aspect-[16/5]">
        <p className="text-2xl font-bold sm:text-4xl">{fallbackTitle}</p>
        {fallbackText && <p className="mt-2 max-w-xl text-sm opacity-85 sm:text-base">{fallbackText}</p>}
      </div>
    );
  }
  return (
    <div className="relative overflow-hidden rounded-2xl">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(-${i * 100}%)` }}>
        {slides.map((s, idx) => {
          // eslint-disable-next-line @next/next/no-img-element
          const img = <img src={s.imageUrl} alt={s.title ?? ""} className="aspect-[16/7] w-full shrink-0 object-cover sm:aspect-[16/5]" loading={idx === 0 ? "eager" : "lazy"} />;
          return (
            <div key={idx} className="w-full shrink-0">
              {s.linkUrl ? <a href={s.linkUrl}>{img}</a> : img}
            </div>
          );
        })}
      </div>
      {n > 1 && (
        <>
          <button type="button" onClick={() => setI((i - 1 + n) % n)} className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow" aria-label="Previous slide">
            <ChevronLeft className="size-4" />
          </button>
          <button type="button" onClick={() => setI((i + 1) % n)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow" aria-label="Next slide">
            <ChevronRight className="size-4" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_, idx) => (
              <button key={idx} type="button" onClick={() => setI(idx)} className={cn("h-1.5 rounded-full bg-white transition-all", idx === i ? "w-5" : "w-1.5 opacity-60")} aria-label={`Slide ${idx + 1}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/** Horizontally scrolling row with arrow buttons (category carousel). */
export function ScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <div className="relative">
      <button type="button" onClick={() => scroll(-1)} className="absolute -left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[var(--brand)] p-1.5 text-white shadow sm:block" aria-label="Scroll left">
        <ChevronLeft className="size-4" />
      </button>
      <div ref={ref} className="no-scrollbar flex snap-x gap-3 overflow-x-auto scroll-smooth">
        {children}
      </div>
      <button type="button" onClick={() => scroll(1)} className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-[var(--brand)] p-1.5 text-white shadow sm:block" aria-label="Scroll right">
        <ChevronRight className="size-4" />
      </button>
    </div>
  );
}

/** E-commerce product card: wishlist heart + one-tap add to cart (when no variants). */
export function MegaProductCard({ product, storeId, profileId, username, currency }: { product: ProductDTO; storeId: string; profileId: string; username: string; currency: string }) {
  const add = useCartStore((s) => s.add);
  const toggle = useWishlistStore((s) => s.toggle);
  const wished = useWishlist(storeId).includes(product.id);
  const hydrated = useHydrated();
  const off = discountPercent(product.price, product.comparePrice);
  const href = routes.product(username, product.slug);
  const quickAdd = product.type !== "AFFILIATE" && product.options.length === 0 && product.stock !== 0;

  return (
    <div className="group flex flex-col overflow-hidden rounded-xl bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200/70 transition hover:shadow-md">
      <div className="relative aspect-square bg-zinc-100">
        <Link href={href} prefetch={true}>
          {product.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} className="size-full object-cover transition group-hover:scale-105" loading="lazy" />
          ) : (
            <div className="flex size-full items-center justify-center text-zinc-300">
              <ShoppingCart className="size-8" />
            </div>
          )}
        </Link>
        {off > 0 && <span className="absolute left-2 top-2 rounded bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">-{off}%</span>}
        <button
          type="button"
          onClick={() => toggle(storeId, product.id)}
          className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 shadow-sm"
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <Heart className={cn("size-4", hydrated && wished ? "fill-[var(--brand)] text-[var(--brand)]" : "text-zinc-500")} />
        </button>
        {product.stock === 0 && <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-semibold text-white">Sold out</span>}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <Link href={href} className="line-clamp-2 min-h-10 text-sm leading-snug hover:text-[var(--brand)]">
          {product.name}
        </Link>
        <div className="mt-2 flex items-end justify-between gap-2">
          <p className="leading-tight">
            <span className="font-bold">{formatMoney(product.price, currency)}</span>
            {off > 0 && <s className="block text-xs text-zinc-400">{formatMoney(product.comparePrice!, currency)}</s>}
          </p>
          {quickAdd ? (
            <button
              type="button"
              onClick={() => {
                add(storeId, { productId: product.id, name: product.name, slug: product.slug, price: product.price, image: product.images[0] ?? null, quantity: 1, options: {}, maxStock: product.stock });
                track({ type: "ADD_TO_CART", profileId, productId: product.id });
                toast.success("Added to cart");
              }}
              className="rounded-full bg-[var(--brand)] p-2 text-white transition hover:opacity-90"
              aria-label="Add to cart"
            >
              <ShoppingCart className="size-4" />
            </button>
          ) : (
            <Link href={href} className="rounded-full bg-[var(--brand)] p-2 text-white" aria-label="Choose options">
              <ShoppingCart className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
