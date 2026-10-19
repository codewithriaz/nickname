"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, MessageCircle, Minus, Plus, ShoppingBag, Truck } from "lucide-react";
import type { ProductDTO } from "@/types/dto";
import type { PublicStoreData } from "@/types/public";
import { useCartStore } from "@/stores/cart-store";
import { discountPercent, formatMoney } from "@/lib/money";
import { routes } from "@/config/site";
import { track } from "@/features/public/api";
import { cn } from "@/lib/utils";

export function ProductDetail({ product, data }: { product: ProductDTO; data: PublicStoreData }) {
  const router = useRouter();
  const add = useCartStore((s) => s.add);
  const { store, profile } = data;
  const [image, setImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [options, setOptions] = useState<Record<string, string>>(() =>
    Object.fromEntries(product.options.map((o) => [o.name, o.values[0] ?? ""])),
  );
  const off = discountPercent(product.price, product.comparePrice);
  const soldOut = product.stock === 0;
  const isAffiliate = product.type === "AFFILIATE";

  useEffect(() => {
    track({ type: "PRODUCT_VIEW", profileId: profile.id, productId: product.id });
  }, [profile.id, product.id]);

  const addToCart = (goCheckout: boolean) => {
    add(store.id, {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0] ?? null,
      quantity: qty,
      options,
      maxStock: product.stock,
    });
    track({ type: "ADD_TO_CART", profileId: profile.id, productId: product.id });
    if (goCheckout) router.push(routes.checkout(profile.username));
    else toast.success("Added to cart");
  };

  const waText = encodeURIComponent(
    `Hi! I want to order: ${product.name}${Object.entries(options).map(([k, v]) => ` (${k}: ${v})`).join("")} x${qty}`,
  );

  return (
    <div className="overflow-hidden rounded-3xl bg-white text-zinc-900 shadow-sm ring-1 ring-black/5">
      <div className="grid gap-0 sm:grid-cols-2">
        <div>
          <div className="aspect-square bg-zinc-100">
            {product.images[image] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[image]} alt={product.name} className="size-full object-cover" />
            ) : (
              <div className="flex size-full items-center justify-center text-zinc-300">
                <ShoppingBag className="size-16" />
              </div>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3 no-scrollbar">
              {product.images.map((src, i) => (
                <button key={src} type="button" onClick={() => setImage(i)} className={cn("size-16 shrink-0 overflow-hidden rounded-xl ring-2", i === image ? "ring-zinc-900" : "ring-transparent")}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="size-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4 p-5">
          <div>
            <h1 className="text-xl font-bold leading-tight">{product.name}</h1>
            <p className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold">{formatMoney(product.price, store.currency)}</span>
              {off > 0 && (
                <>
                  <s className="text-zinc-400">{formatMoney(product.comparePrice!, store.currency)}</s>
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-xs font-bold text-rose-600">-{off}%</span>
                </>
              )}
            </p>
            {product.stock !== null && product.stock > 0 && product.stock <= 5 && <p className="mt-1 text-xs font-medium text-amber-600">Only {product.stock} left!</p>}
          </div>

          {product.options.map((opt) => (
            <div key={opt.name}>
              <p className="mb-1.5 text-sm font-medium">{opt.name}</p>
              <div className="flex flex-wrap gap-2">
                {opt.values.map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setOptions((o) => ({ ...o, [opt.name]: v }))}
                    className={cn("rounded-xl border px-3.5 py-1.5 text-sm", options[opt.name] === v ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200")}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {!isAffiliate && !soldOut && (
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center rounded-xl border border-zinc-200">
                <button type="button" className="p-2" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm font-semibold tabular-nums">{qty}</span>
                <button type="button" className="p-2" onClick={() => setQty((q) => Math.min(product.stock ?? 99, q + 1))} aria-label="Increase">
                  <Plus className="size-4" />
                </button>
              </div>
            </div>
          )}

          {isAffiliate ? (
            <a href={product.affiliateUrl ?? "#"} target="_blank" rel="sponsored noopener" className="flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-900 px-4 py-3.5 font-semibold text-white">
              Buy on partner site <ExternalLink className="size-4" />
            </a>
          ) : soldOut ? (
            <p className="rounded-2xl bg-zinc-100 py-3.5 text-center font-semibold text-zinc-500">Sold out</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => addToCart(false)} className="rounded-2xl border-2 border-zinc-900 px-4 py-3 font-semibold">
                Add to cart
              </button>
              <button type="button" onClick={() => addToCart(true)} className="rounded-2xl bg-zinc-900 px-4 py-3 font-semibold text-white">
                Order now
              </button>
            </div>
          )}

          {store.whatsapp && !isAffiliate && (
            <a
              href={`https://wa.me/${store.whatsapp.replace(/\D/g, "")}?text=${waText}`}
              target="_blank"
              rel="noopener"
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-3 font-semibold text-white"
            >
              <MessageCircle className="size-4" /> Order on WhatsApp
            </a>
          )}

          {product.type === "DIGITAL" && (
            <p className="rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
              Digital product — download link unlocks on your order page after payment. Cash on Delivery is not available.
            </p>
          )}

          {!isAffiliate && product.type === "PHYSICAL" && (
            <div className="flex items-start gap-2 rounded-2xl bg-zinc-50 p-3 text-xs text-zinc-600">
              <Truck className="mt-0.5 size-4 shrink-0" />
              <span>
                Delivery: {store.insideLabel} {formatMoney(store.deliveryInside, store.currency)} · {store.outsideLabel} {formatMoney(store.deliveryOutside, store.currency)}
                {store.freeShippingMin != null && ` · Free over ${formatMoney(store.freeShippingMin, store.currency)}`}
                {store.payment.cod && " · Cash on Delivery available"}
              </span>
            </div>
          )}

          {product.description && <div className="whitespace-pre-line border-t border-zinc-100 pt-4 text-sm leading-relaxed text-zinc-700">{product.description}</div>}
        </div>
      </div>
    </div>
  );
}
