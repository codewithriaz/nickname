"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import {
  BarChart3,
  ChevronDown,
  CreditCard,
  ExternalLink,
  Gift,
  Home,
  KeyRound,
  Link2,
  LogOut,
  Package,
  Palette,
  Plus,
  QrCode,
  Scissors,
  Settings,
  Shield,
  ShoppingCart,
  Store,
  Users,
  UserCog,
} from "lucide-react";
import { AppShell, type NavSection } from "@/components/layout/app-shell";
import { Dropdown } from "@/components/ui/dropdown";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLogout, useMe } from "@/features/auth/hooks";
import { authApi } from "@/features/auth/api";
import { useActiveProfileId } from "@/features/profiles/hooks";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { routes } from "@/config/site";
import { CreateProfileCard } from "./create-profile-card";

const sections: NavSection[] = [
  {
    items: [
      { href: "/dashboard", label: "Overview", icon: Home, exact: true },
      { href: "/dashboard/links", label: "Links & blocks", icon: Link2 },
      { href: "/dashboard/appearance", label: "Appearance", icon: Palette },
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/dashboard/audience", label: "Audience", icon: Users },
    ],
  },
  {
    title: "Shop",
    items: [
      { href: "/dashboard/shop", label: "Shop overview", icon: Store, exact: true },
      { href: "/dashboard/shop/products", label: "Products", icon: Package },
      { href: "/dashboard/shop/orders", label: "Orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Grow",
    items: [
      { href: "/dashboard/short-links", label: "Short links", icon: Scissors },
      { href: "/dashboard/qr", label: "QR codes", icon: QrCode },
      { href: "/dashboard/referrals", label: "Refer & earn", icon: Gift },
    ],
  },
  {
    title: "Settings",
    items: [
      { href: "/dashboard/settings", label: "Page settings", icon: Settings },
      { href: "/dashboard/billing", label: "Plan & billing", icon: CreditCard },
      { href: "/dashboard/account", label: "Account & API", icon: KeyRound },
    ],
  },
];

/** Pages that work without any profile. */
const PROFILE_OPTIONAL = ["/dashboard/billing", "/dashboard/referrals", "/dashboard/account", "/dashboard/short-links", "/dashboard/profiles"];

function ProfileSwitcher() {
  const router = useRouter();
  const { profileId, profiles } = useActiveProfileId();
  const setActive = useWorkspaceStore((s) => s.setActiveProfileId);
  const active = profiles.find((p) => p.id === profileId);
  if (!active) return null;
  return (
    <Dropdown
      align="left"
      trigger={
        <button type="button" className="flex items-center gap-2 rounded-xl border border-border bg-white px-2.5 py-1.5 text-sm font-medium hover:bg-muted">
          <Avatar src={active.avatarUrl} name={active.displayName} className="size-6 text-[10px]" />
          <span className="max-w-32 truncate">@{active.username}</span>
          <ChevronDown className="size-4 text-muted-foreground" />
        </button>
      }
      items={[
        ...profiles.map((p) => ({
          label: (
            <span className="flex items-center gap-2">
              @{p.username} {p.id === profileId && <Badge tone="primary">active</Badge>}
            </span>
          ),
          onClick: () => setActive(p.id),
        })),
        { label: "Manage profiles", icon: <Plus className="size-4" />, onClick: () => router.push("/dashboard/profiles") },
      ]}
    />
  );
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: me } = useMe();
  const { profileId, profiles, isLoading } = useActiveProfileId();
  const logout = useLogout();
  const active = profiles.find((p) => p.id === profileId);
  const needsProfile = !PROFILE_OPTIONAL.some((p) => pathname.startsWith(p));

  const banner = me?.impersonating ? (
    <div className="sticky top-0 z-40 flex h-9 items-center justify-center gap-3 bg-amber-400 text-xs font-semibold text-amber-950">
      <Shield className="size-4" /> Viewing as {me.email}
      <button
        type="button"
        className="rounded-md bg-amber-950 px-2 py-0.5 text-amber-50"
        onClick={async () => {
          await authApi.stopImpersonating();
// eslint-disable-next-line @next/next/no-location-assign-relative-destination -- intentional full reload: auth cookies changed, client state must reset
          window.location.href = "/admin/users";
        }}
      >
        Return to admin
      </button>
    </div>
  ) : null;

  return (
    <AppShell
      sections={sections}
      banner={banner}
      sidebarBottom={
        me && (
          <Link href="/dashboard/billing" className="block rounded-2xl bg-gradient-to-br from-violet-600 to-pink-500 p-4 text-white">
            <p className="text-xs opacity-80">Current plan</p>
            <p className="font-semibold">{me.plan.name}</p>
            {!me.isPaid && <p className="mt-1 text-xs opacity-90">Upgrade for online payments, custom domain & more →</p>}
          </Link>
        )
      }
      topbar={
        <>
          <ProfileSwitcher />
          {active && (
            <a href={routes.profile(active.username)} target="_blank" rel="noopener" className="hidden items-center gap-1 text-sm font-medium text-primary sm:flex">
              View page <ExternalLink className="size-3.5" />
            </a>
          )}
          <div className="ml-auto flex items-center gap-2">
            {me?.role === "SUPER_ADMIN" && (
              <Link href="/admin">
                <Button variant="outline" size="sm">
                  <Shield className="size-4" /> Admin
                </Button>
              </Link>
            )}
            {me && (
              <Dropdown
                trigger={
                  <button type="button" className="rounded-full" aria-label="Account menu">
                    <Avatar src={me.avatarUrl} name={me.name} className="size-8" />
                  </button>
                }
                items={[
                  { label: me.email, onClick: () => undefined, disabled: true },
                  { label: "Account", icon: <UserCog className="size-4" />, onClick: () => router.push("/dashboard/account") },
                  { label: "Billing", icon: <CreditCard className="size-4" />, onClick: () => router.push("/dashboard/billing") },
                  { label: "Log out", icon: <LogOut className="size-4" />, destructive: true, onClick: () => logout.mutate() },
                ]}
              />
            )}
          </div>
        </>
      }
    >
      {needsProfile && !isLoading && profiles.length === 0 ? <CreateProfileCard onboarding /> : children}
    </AppShell>
  );
}
