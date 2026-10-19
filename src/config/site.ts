/** Public (isomorphic) site configuration. Never put secrets here. */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_APP_NAME || "Nickname",
  url: (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  description:
    "One link for everything — link-in-bio pages, a mobile mini shop with Cash on Delivery & bKash, URL shortener, QR codes and analytics.",
  tagline: "Your link-in-bio + mini shop, built for sellers & creators",
  defaultCurrency: "BDT",
  supportEmail: "support@nickname.app",
} as const;

export const routes = {
  home: "/",
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  dashboard: "/dashboard",
  admin: "/admin",
  pricing: "/pricing",
  features: "/features",
  templates: "/templates",
  profile: (username: string) => `/${username}`,
  shop: (username: string) => `/${username}/shop`,
  product: (username: string, slug: string) => `/${username}/shop/p/${slug}`,
  checkout: (username: string) => `/${username}/shop/checkout`,
  order: (username: string, token: string) => `/${username}/shop/order/${token}`,
  shortLink: (code: string) => `/s/${code}`,
} as const;

export const absoluteUrl = (path = "/") => `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;
