# Mini shop & checkout (for Facebook Marketplace sellers)

**Status:** ✅ Done (2026-10-20)

## What it does
- One `Store` per profile: name, logo, banner, phone/WhatsApp/Messenger, address, 2 delivery zones
  (labels + charges, e.g. Inside/Outside Dhaka), free-shipping threshold, order-number prefix, open/closed.
- Products: physical / digital (download unlocked after payment) / affiliate (external buy link); photos (up to 8),
  price + compare-at price, stock (null = unlimited), SKU, variants (size/color…), categories, featured, hidden.
- Public shop `/{username}/shop` (search + category chips), product page `/{username}/shop/p/{slug}` (gallery, variants,
  qty, add to cart / order now, WhatsApp order, JSON-LD `Product`), cart persisted in localStorage (Zustand, per store).
- Checkout `/{username}/shop/checkout`: **name, phone, address** (+ optional city/email/note), delivery zone,
  payment: **Cash on Delivery**, **manual Send Money** (bKash/Nagad/Rocket number shown, customer enters sender + TrxID),
  **SSLCommerz** or **bKash** online (seller's own merchant credentials, paid plans).
- Order tracking page `/{username}/shop/order/{token}` (SSR, unguessable token) with status timeline and digital downloads.
- Seller dashboard: shop settings, products, orders table (filters + counts), order drawer (call/WhatsApp customer,
  verify manual payment, status workflow PENDING→CONFIRMED→PROCESSING→SHIPPED→DELIVERED / CANCELLED / RETURNED,
  history, print invoice, copy tracking link). Cancel/return restocks items; delivered COD → marked paid.

## Storefront templates (`Store.layout`, 2026-10-20)
- **Minimal** — original mobile shop using the profile theme.
- **Mega store** — full e-commerce look (based on owner's reference PDF): announcement bar, logo + search + track/wishlist/cart header,
  "All categories" dropdown + category links, hero banner slider (`heroSlides`, up to 6), category carousel (category pictures),
  promo banners (`promoBanners`, up to 3), per-category product sections with "See all", all-products section, feature strip,
  brand-colored footer with "We accept" payment badges. Brand color = `Store.brandColor`.
- Seller configures it in **Shop → Shop design** (layout picker with previews). Category pictures: Products page → click a category's icon.
- New pages (both layouts): `/{username}/shop/all` (search, category, sort, wishlist via `?wishlist=1` — filters read client-side so the page stays cached)
  and `/{username}/shop/track` (order number + phone → tracking page; `/api/public/track-order`).
- Wishlist: Zustand, per store, in the visitor's browser (`src/stores/wishlist-store.ts`).
- Files: `src/features/shop/components/public/megastore/*`, `ShopShell` switches layout.

## Rules (server-side, `order.service.ts`)
**Digital products can't use Cash on Delivery** (2026-10-20): if the cart contains any `DIGITAL` product, COD is
hidden at checkout (with a notice), the product page says "Cash on Delivery is not available", and `placeOrder`
rejects `paymentMethod: COD` with 400. Digital-only carts also skip the delivery-zone picker and pay ৳0 shipping.

Prices, shipping and totals are always recomputed on the server. Stock is decremented atomically
(`updateMany where stock >= qty`) inside the order transaction. Order numbers use `Store.orderSeq` increment.
Free plan: `limits.monthlyOrders` per store per month.

## Key files
`src/server/services/{store,order}.service.ts`, `src/schemas/shop.ts`,
API: `/api/profiles/[id]/store`, `/api/stores/[id]/{categories,products,orders,stats}`, `/api/products/[id]`, `/api/categories/[id]`, `/api/orders/[id]`, `/api/public/checkout`.
UI: `src/features/shop/components/public/*` (storefront), `src/features/shop/components/dashboard/*` (seller), `src/stores/cart-store.ts`.

## Known issues / TODO
- No SMS/email notification to seller on new order yet (hook point: end of `placeOrder`).
- No courier integration (Pathao/Steadfast/RedX) yet — good next step.
- Coupons for shop orders not implemented (only plan coupons).
