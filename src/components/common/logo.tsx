import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export function Logo({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn("flex items-center gap-2 font-display text-lg font-bold tracking-tight", className)}>
      <span className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-pink-500 text-sm text-white shadow-md shadow-violet-500/30">
        {siteConfig.name.charAt(0)}
      </span>
      {siteConfig.name}
    </Link>
  );
}
