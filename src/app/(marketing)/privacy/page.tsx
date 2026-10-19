import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Privacy Policy", alternates: { canonical: "/privacy" } };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>
      <p className="mt-8 leading-relaxed text-muted-foreground">We collect the information you give us (account details, page content, products) and basic, privacy-friendly analytics about visits to your pages (hashed visitor IDs, device, browser, country, referrer — no cookies for visitors). Customer details from shop orders are only shared with the seller who received the order. Payment card data is handled by our payment partners (SSLCommerz, bKash) and never touches our servers. You can export or delete your data at any time by contacting support.</p>
      <p className="mt-6 text-sm text-muted-foreground">
        Questions? Email <a className="text-primary" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
      </p>
    </article>
  );
}
