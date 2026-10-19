import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  key: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
  options: Record<string, string>;
  maxStock: number | null;
};

type CartState = {
  /** carts keyed by storeId so shoppers can use multiple shops */
  carts: Record<string, CartLine[]>;
  add: (storeId: string, line: Omit<CartLine, "key">) => void;
  setQuantity: (storeId: string, key: string, quantity: number) => void;
  remove: (storeId: string, key: string) => void;
  clear: (storeId: string) => void;
};

export const lineKey = (productId: string, options: Record<string, string>) =>
  `${productId}:${Object.entries(options)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("|")}`;

const clampQty = (q: number, max: number | null) => Math.max(1, Math.min(q, max ?? 99));

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      carts: {},
      add: (storeId, line) =>
        set((s) => {
          const key = lineKey(line.productId, line.options);
          const cart = s.carts[storeId] ?? [];
          const existing = cart.find((l) => l.key === key);
          const next = existing
            ? cart.map((l) => (l.key === key ? { ...l, quantity: clampQty(l.quantity + line.quantity, l.maxStock) } : l))
            : [...cart, { ...line, key, quantity: clampQty(line.quantity, line.maxStock) }];
          return { carts: { ...s.carts, [storeId]: next } };
        }),
      setQuantity: (storeId, key, quantity) =>
        set((s) => ({
          carts: {
            ...s.carts,
            [storeId]: (s.carts[storeId] ?? []).map((l) => (l.key === key ? { ...l, quantity: clampQty(quantity, l.maxStock) } : l)),
          },
        })),
      remove: (storeId, key) => set((s) => ({ carts: { ...s.carts, [storeId]: (s.carts[storeId] ?? []).filter((l) => l.key !== key) } })),
      clear: (storeId) => set((s) => ({ carts: { ...s.carts, [storeId]: [] } })),
    }),
    { name: "nk-cart" },
  ),
);

const EMPTY: CartLine[] = [];
/** Selector hooks (stable references → no unnecessary re-renders). */
export const useCart = (storeId: string) => useCartStore((s) => s.carts[storeId] ?? EMPTY);
export const useCartCount = (storeId: string) => useCartStore((s) => (s.carts[storeId] ?? EMPTY).reduce((a, l) => a + l.quantity, 0));
