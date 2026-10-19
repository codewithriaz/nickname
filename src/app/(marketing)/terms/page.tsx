import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = { title: "Terms of Service", alternates: { canonical: "/terms" } };

export default function Page() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-display text-4xl font-bold">Terms of Service</h1>
      <p className="mt-2 text-sm text-muted-foreground">Last updated: October 2026</p>
      <p className="mt-8 leading-relaxed text-muted-foreground">By using the service you agree to use it lawfully. You are responsible for the content, products and links you publish, and for fulfilling orders placed through your shop. We may suspend accounts that host scams, phishing, illegal goods or abusive content. Paid plans are billed in advance and are non-refundable except where required by law. We may update these terms; continued use means acceptance.</p>
      <p className="mt-6 text-sm text-muted-foreground">
        Questions? Email <a className="text-primary" href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
      </p>
    </article>
  );
}
