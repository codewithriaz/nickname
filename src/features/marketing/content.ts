import {
  BarChart3,
  BadgePercent,
  CreditCard,
  Gift,
  Globe,
  Layers,
  LayoutTemplate,
  Mail,
  Palette,
  QrCode,
  Scissors,
  ShoppingBag,
  Truck,
  Users,
  Code2,
  CalendarClock,
  type LucideIcon,
} from "lucide-react";

export type Feature = { icon: LucideIcon; title: string; description: string };

/** Single source for the features shown on home + /features. */
export const FEATURE_GROUPS: { title: string; tagline: string; items: Feature[] }[] = [
  {
    title: "Link in bio",
    tagline: "Everything you are, in one simple link.",
    items: [
      { icon: Layers, title: "13 block types", description: "Links, headers, text, images, videos & music, email signup, custom forms, file downloads, folders, products, socials and dividers." },
      { icon: Palette, title: "Themes & custom design", description: "Templates plus full control of backgrounds, gradients, fonts (incl. Bangla), button styles, corners and animations." },
      { icon: LayoutTemplate, title: "Grid, carousel & highlight", description: "Show links as classic buttons, big highlight cards, image grids or swipeable carousels." },
      { icon: CalendarClock, title: "Scheduling & timed redirects", description: "Publish and unpublish links automatically, or redirect your page to one link during a live sale." },
      { icon: Users, title: "Multi-tab pages", description: "Organise links into tabs and share direct links to any tab." },
      { icon: Globe, title: "Custom domain & SEO", description: "Use your own domain, custom social previews, Pinterest verification and lightning-fast SEO pages." },
    ],
  },
  {
    title: "Mini shop for Facebook sellers",
    tagline: "Turn Marketplace & Instagram followers into orders.",
    items: [
      { icon: ShoppingBag, title: "Mobile-first shop", description: "Beautiful product pages with photos, variants (size/color), stock and discounts — built for phones." },
      { icon: Truck, title: "Simple checkout", description: "Name, phone and address — that's it. Delivery charge by zone (inside / outside Dhaka) and free-shipping thresholds." },
      { icon: CreditCard, title: "COD, bKash, Nagad & cards", description: "Cash on Delivery, manual Send Money with TrxID, or online payment via SSLCommerz and bKash — money goes to you." },
      { icon: Mail, title: "Order management", description: "Confirm, ship and deliver orders, print invoices, WhatsApp the customer, and share live tracking links." },
    ],
  },
  {
    title: "Grow & earn",
    tagline: "Know what works. Earn more from every visitor.",
    items: [
      { icon: BarChart3, title: "Analytics", description: "Views, unique visitors, clicks, CTR, top links, referrers, countries, devices and browsers — plus revenue." },
      { icon: Scissors, title: "URL shortener", description: "Branded short links with custom back-halves, UTM builder, passwords, expiry and click analytics." },
      { icon: QrCode, title: "Dynamic QR codes", description: "Trackable QR codes with your colors and logo. Change the destination without reprinting." },
      { icon: BadgePercent, title: "Affiliate links", description: "Add affiliate links and products with automatic disclosure and coupon codes." },
      { icon: Gift, title: "Refer & earn", description: "Earn a recurring commission on every payment from creators you refer, with bKash/bank payouts." },
      { icon: Code2, title: "Pixels & REST API", description: "Facebook Pixel, Google Analytics, lead export (CSV) and a public API with API keys." },
    ],
  },
];

export const FAQ = [
  { q: "Is it really free?", a: "Yes. The Free plan includes unlimited links, a mini shop with Cash on Delivery, short links, QR codes and analytics — forever." },
  { q: "How do I get paid for orders?", a: "Choose Cash on Delivery, manual bKash/Nagad Send Money (customer enters the TrxID), or connect your own SSLCommerz / bKash merchant account. We never hold your money." },
  { q: "Can I use it for my Facebook page?", a: "Absolutely — put your link in your Facebook bio, posts and Marketplace listings. Buyers order in seconds from their phone." },
  { q: "How is this cheaper than Linktree or Liinks?", a: "Our paid plans start at ৳299/month (~$2.50) versus $5+ elsewhere — and include a shop, short links and QR codes." },
  { q: "Can I use my own domain?", a: "Yes, on the Pro plan. Point a CNAME to us, add one TXT record and you're live." },
];

/** Public competitor prices (USD/month) used on the pricing comparison. */
export const COMPETITORS = [
  { name: "Liinks Starter", price: "$5 / mo" },
  { name: "Liinks Pro", price: "$12 / mo" },
  { name: "Linktree Pro", price: "$9+ / mo" },
];
