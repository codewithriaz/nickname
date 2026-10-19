"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { BadgeCheck, CreditCard, FileClock, Gauge, LayoutTemplate, LogOut, Package, Percent, Scissors, Settings, ShoppingCart, Users, Wallet, Globe } from "lucide-react";
import { AppShell, type NavSection } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { useLogout, useMe } from "@/features/auth/hooks";

const sections: NavSection[] = [
  { items: [{ href: "/admin", label: "Dashboard", icon: Gauge, exact: true }] },
  {
    title: "People",
    items: [
      { href: "/admin/users", label: "Users", icon: Users },
      { href: "/admin/profiles", label: "Profiles & verification", icon: BadgeCheck },
    ],
  },
  {
    title: "Revenue",
    items: [
      { href: "/admin/payments", label: "Payments", icon: CreditCard },
      { href: "/admin/plans", label: "Plans", icon: Package },
      { href: "/admin/coupons", label: "Coupons", icon: Percent },
      { href: "/admin/payouts", label: "Referral payouts", icon: Wallet },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/templates", label: "Templates", icon: LayoutTemplate },
      { href: "/admin/orders", label: "Shop orders", icon: ShoppingCart },
      { href: "/admin/short-links", label: "Short links", icon: Scissors },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/settings", label: "Platform settings", icon: Settings },
      { href: "/admin/audit", label: "Audit log", icon: FileClock },
    ],
  },
];

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: me } = useMe();
  const logout = useLogout();
  return (
    <AppShell
      sections={sections}
      logoHref="/admin"
      sidebarTop={<span className="mx-2 w-fit rounded-full bg-foreground px-2.5 py-0.5 text-[11px] font-semibold text-white">SUPER ADMIN</span>}
      topbar={
        <div className="ml-auto flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm">
              <Globe className="size-4" /> My dashboard
            </Button>
          </Link>
          {me && <Avatar src={me.avatarUrl} name={me.name} className="size-8" />}
          <Button variant="ghost" size="icon" onClick={() => logout.mutate()} aria-label="Log out">
            <LogOut className="size-4" />
          </Button>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
