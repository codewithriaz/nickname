import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  items: Record<string, string[]>;
  toggle: (storeId: string, productId: string) => void;
};

/** Per-store wishlist kept in the visitor's browser. */
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      items: {},
      toggle: (storeId, productId) =>
        set((s) => {
          const list = s.items[storeId] ?? [];
          return { items: { ...s.items, [storeId]: list.includes(productId) ? list.filter((x) => x !== productId) : [...list, productId] } };
        }),
    }),
    { name: "nk-wishlist" },
  ),
);

const EMPTY: string[] = [];
export const useWishlist = (storeId: string) => useWishlistStore((s) => s.items[storeId] ?? EMPTY);
