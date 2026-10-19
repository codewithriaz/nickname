"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Activity, BadgeCheck, CreditCard, DollarSign, Store, UserPlus, Users, Wallet, ShoppingCart, Globe } from "lucide-react";
import { adminApi } from "../api";
import { qk } from "@/lib/query-keys";
import { PageHeader } from "@/components/ui/page-header";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { BarList } from "@/components/charts/bar-list";
import { compactNumber } from "@/lib/utils";
import { formatMoney } from "@/lib/money";

export function AdminDashboard() {
  const { data } = useQuery({ queryKey: qk.admin.stats, queryFn: adminApi.stats });
  if (!data)
    return (
      <div className="grid gap-3 sm:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  const pending = [
    { href: "/admin/payments?status=PENDING", label: "Manual payments to verify", count: data.pendingPayments, icon: CreditCard },
    { href: "/admin/payouts", label: "Payout requests", count: data.pendingPayouts, icon: Wallet },
    { href: "/admin/profiles?verification=PENDING", label: "Verification requests", count: data.pendingVerifications, icon: BadgeCheck },
  ];
  return (
    <div className="space-y-4">
      <PageHeader title="Platform overview" description="Everything happening across the platform." />
      <div className="grid gap-3 sm:grid-cols-3">
        {pending.map((p) => (
          <Link key={p.href} href={p.href} className={`flex items-center gap-3 rounded-2xl border p-4 ${p.count ? "border-amber-300 bg-warning-soft" : "border-border bg-white"}`}>
            <p.icon className="size-5" />
            <span className="flex-1 text-sm font-medium">{p.label}</span>
            <b className="text-lg">{p.count}</b>
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Users" value={compactNumber(data.users)} icon={Users} hint={`+${data.newUsers} in 30 days`} />
        <StatCard label="Profiles" value={compactNumber(data.profiles)} icon={Globe} />
        <StatCard label="Shops" value={compactNumber(data.stores)} icon={Store} />
        <StatCard label="Shop orders" value={compactNumber(data.orders)} icon={ShoppingCart} />
        <StatCard label="Revenue (all time)" value={formatMoney(data.revenue)} icon={DollarSign} />
        <StatCard label="Revenue (30d)" value={formatMoney(data.revenue30)} icon={DollarSign} />
        <StatCard label="New users (30d)" value={data.newUsers} icon={UserPlus} />
        <StatCard label="Events (30d)" value={compactNumber(data.events30)} icon={Activity} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader title="Daily sign-ups" description="Last 30 days" />
          <CardBody>
            <TimeSeriesChart data={data.signups} series={[{ key: "count", label: "Sign-ups" }]} height={240} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Active subscriptions" description="By plan" />
          <CardBody>
            <BarList items={data.subscriptions.map((s) => ({ name: s.plan, count: s.count }))} empty="No paid subscriptions yet" />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
