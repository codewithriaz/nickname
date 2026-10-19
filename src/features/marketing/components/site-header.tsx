import Link from "next/link";
import { Logo } from "@/components/common/logo";
import { buttonVariants } from "@/components/ui/button";

const NAV = [
  { href: "/features", label: "Features" },
  { href: "/templates", label: "Templates" },
  { href: "/pricing", label: "Pricing" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-foreground">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
            Log in
          </Link>
          <Link href="/register" className={buttonVariants({ size: "sm" })}>
            Get started free
          </Link>
        </div>
      </div>
    </header>
  );
}
