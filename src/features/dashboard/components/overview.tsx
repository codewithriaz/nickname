"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BarChart3, ExternalLink, Eye, MousePointerClick, Package, Palette, PartyPopper, Plus, ShoppingCart, Store, Users } from "lucide-react";
import { useMe } from "@/features/auth/hooks";
import { useActiveProfileId, useProfile } from "@/features/profiles/hooks";
import { useProfileAnalytics } from "@/features/analytics/hooks";
import { useStore, useStoreStats } from "@/features/shop/hooks";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { CopyButton } from "@/components/ui/copy-button";
import { buttonVariants } from "@/components/ui/button";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { QrCodeView } from "@/components/common/qr-code";
import { absoluteUrl, routes } from "@/config/site";
import { compactNumber } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

const QUICK = [
  { href: "/dashboard/links", label: "Add a link", icon: Plus },
  { href: "/dashboard/appearance", label: "Change theme", icon: Palette },
  { href: "/dashboard/shop/products", label: "Add product", icon: Package },
  { href: "/dashboard/analytics", label: "See analytics", icon: BarChart3 },
];

export function Overview() {
  const welcome = useSearchParams().get("welcome");
  const { data: me } = useMe();
  const { profileId } = useActiveProfileId();
  const { data: profile } = useProfile(profileId);
  const { data: analytics } = useProfileAnalytics(profileId, 7);
  const { data: store } = useStore(profileId);
  const { data: shopStats } = useStoreStats(store?.id);
  const url = profile ? absoluteUrl(routes.profile(profile.username)) : "";

  return (
    <div className="space-y-6">
      {welcome && (
        <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 p-4 text-white">
          <PartyPopper className="size-6 shrink-0" />
          <p className="text-sm">
            <b>Welcome{me ? `, ${me.name.split(" ")[0]}` : ""}!</b> Your page is live. Add links, set up your shop and share your link everywhere.
          </p>
        </div>
      )}
      <div>
        <h1 className="font-display text-2xl font-semibold">Hi {me?.name.split(" ")[0] ?? "there"} 👋</h1>
        <p className="text-sm text-muted-foreground">Here&apos;s how your page is doing this week.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Views (7d)" value={compactNumber(analytics?.totals.views ?? 0)} icon={Eye} />
            <StatCard label="Clicks (7d)" value={compactNumber(analytics?.totals.clicks ?? 0)} icon={MousePointerClick} />
            <StatCard label="Subscribers (7d)" value={compactNumber(analytics?.totals.subscribers ?? 0)} icon={Users} />
            <StatCard label="Orders (7d)" value={compactNumber(analytics?.totals.orders ?? 0)} icon={ShoppingCart} />
          </div>
          <Card>
            <CardHeader title="Last 7 days" />
            <CardBody>
              {analytics ? <TimeSeriesChart data={analytics.timeseries} series={[{ key: "views", label: "Views" }, { key: "clicks", label: "Clicks" }]} height={220} /> : <div className="h-56" />}
            </CardBody>
          </Card>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK.map((q) => (
              <Link key={q.href} href={q.href} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white p-4 text-center text-sm font-medium transition hover:border-primary hover:bg-primary-soft/40">
                <q.icon className="size-5 text-primary" />
                {q.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {profile && (
            <Card>
              <CardHeader title="Your link" />
              <CardBody className="space-y-3">
                <div className="flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm">
                  <span className="truncate font-medium">{url.replace(/^https?:\/\//, "")}</span>
                  <CopyButton value={url} className="ml-auto shrink-0" />
                </div>
                <a href={url} target="_blank" rel="noopener" className={buttonVariants({ variant: "secondary", className: "w-full" })}>
                  Open page <ExternalLink className="size-4" />
                </a>
                <QrCodeView value={`${url}?utm_source=qr`} size={160} fileName={profile.username} />
              </CardBody>
            </Card>
          )}
          <Card>
            <CardHeader title="Shop" action={<Store className="size-4 text-muted-foreground" />} />
            <CardBody>
              {store ? (
                <div className="space-y-2 text-sm">
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Pending orders</span>
                    <b>{shopStats?.pending ?? 0}</b>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Orders (30d)</span>
                    <b>{shopStats?.last30 ?? 0}</b>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-muted-foreground">Revenue (30d)</span>
                    <b>{formatMoney(shopStats?.revenue30 ?? 0, store.currency)}</b>
                  </p>
                  <Link href="/dashboard/shop/orders" className={buttonVariants({ variant: "outline", size: "sm", className: "mt-2 w-full" })}>
                    Manage orders
                  </Link>
                </div>
              ) : (
                <div className="text-sm">
                  <p className="text-muted-foreground">Sell on Facebook with a mobile shop — COD, bKash & card checkout.</p>
                  <Link href="/dashboard/shop" className={buttonVariants({ size: "sm", className: "mt-3 w-full" })}>
                    Create my shop
                  </Link>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
