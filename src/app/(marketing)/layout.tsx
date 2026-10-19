import { SiteHeader } from "@/features/marketing/components/site-header";
import { SiteFooter } from "@/features/marketing/components/site-footer";

/** Marketing pages are fully static / ISR for SEO and speed. */
export default function MarketingLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </>
  );
}
