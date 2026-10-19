import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/dashboard", "/admin", "/api", "/s/", "/*/shop/checkout", "/*/shop/order/"] }],
    sitemap: `${siteConfig.url}/sitemap.xml`,
  };
}
