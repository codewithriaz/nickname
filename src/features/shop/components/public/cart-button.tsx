"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useCartCount } from "@/stores/cart-store";
import { routes } from "@/config/site";

const subscribe = () => () => {};
/** Avoids hydration mismatch: persisted cart only exists on the client. */
export const useHydrated = () => useSyncExternalStore(subscribe, () => true, () => false);

export function CartButton({ storeId, username }: { storeId: string; username: string }) {
  const count = useCartCount(storeId);
  const hydrated = useHydrated();
  return (
    <Link href={routes.checkout(username)} className="relative rounded-full p-2 hover:bg-zinc-100" aria-label="Cart">
      <ShoppingCart className="size-5" />
      {hydrated && count > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white">{count}</span>
      )}
    </Link>
  );
}

/** Sticky bottom "checkout" bar on mobile. */
export function CartBar({ storeId, username, label }: { storeId: string; username: string; label: string }) {
  const count = useCartCount(storeId);
  const hydrated = useHydrated();
  if (!hydrated || count === 0) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 sm:hidden">
      <Link href={routes.checkout(username)} className="flex items-center justify-between rounded-2xl bg-zinc-900 px-5 py-3.5 text-white shadow-2xl">
        <span className="text-sm">
          {count} item{count > 1 ? "s" : ""} in cart
        </span>
        <span className="font-semibold">{label} →</span>
      </Link>
    </div>
  );
}
