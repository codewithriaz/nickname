"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Menu, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Logo } from "@/components/common/logo";

export type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; badge?: ReactNode };
export type NavSection = { title?: string; items: NavItem[] };

function NavLinks({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-5">
      {sections.map((section, i) => (
        <div key={i}>
          {section.title && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{section.title}</p>}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary-soft text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <item.icon className="size-4.5 shrink-0" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Responsive sidebar layout shared by the user dashboard and the super admin panel. */
export function AppShell({
  sections,
  topbar,
  sidebarTop,
  sidebarBottom,
  banner,
  children,
  logoHref = "/dashboard",
}: {
  sections: NavSection[];
  topbar?: ReactNode;
  sidebarTop?: ReactNode;
  sidebarBottom?: ReactNode;
  banner?: ReactNode;
  children: ReactNode;
  logoHref?: string;
}) {
  const open = useWorkspaceStore((s) => s.sidebarOpen);
  const setOpen = useWorkspaceStore((s) => s.setSidebarOpen);

  const sidebar = (onNavigate?: () => void) => (
    <div className="flex h-full flex-col gap-5 p-4">
      <Logo href={logoHref} className="px-2" />
      {sidebarTop}
      <div className="flex-1 overflow-y-auto">
        <NavLinks sections={sections} onNavigate={onNavigate} />
      </div>
      {sidebarBottom}
    </div>
  );

  return (
    <div className="min-h-dvh bg-muted/40">
      {banner}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border bg-white lg:block" style={banner ? { top: 36 } : undefined}>
        {sidebar()}
      </aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl">
            <button type="button" className="absolute right-3 top-4 rounded-lg p-1.5 hover:bg-muted" onClick={() => setOpen(false)} aria-label="Close menu">
              <X className="size-5" />
            </button>
            {sidebar(() => setOpen(false))}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-white/85 px-4 backdrop-blur sm:px-6">
          <button type="button" className="rounded-lg p-1.5 hover:bg-muted lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          {topbar}
        </header>
        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
