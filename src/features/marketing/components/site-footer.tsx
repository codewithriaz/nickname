import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-4">
        <div className="sm:col-span-2">
          <Logo />
          <p className="mt-3 max-w-sm text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Product</p>
          <Link href="/features" className="block text-muted-foreground hover:text-foreground">Features</Link>
          <Link href="/templates" className="block text-muted-foreground hover:text-foreground">Templates</Link>
          <Link href="/pricing" className="block text-muted-foreground hover:text-foreground">Pricing</Link>
          <Link href="/demo" className="block text-muted-foreground hover:text-foreground">Live demo</Link>
        </div>
        <div className="space-y-2 text-sm">
          <p className="font-semibold">Company</p>
          <Link href="/terms" className="block text-muted-foreground hover:text-foreground">Terms</Link>
          <Link href="/privacy" className="block text-muted-foreground hover:text-foreground">Privacy</Link>
          <a href={`mailto:${siteConfig.supportEmail}`} className="block text-muted-foreground hover:text-foreground">Support</a>
        </div>
      </div>
      <p className="pb-8 text-center text-xs text-muted-foreground">© 2026 {siteConfig.name}. Made for creators & sellers in Bangladesh and beyond.</p>
    </footer>
  );
}
