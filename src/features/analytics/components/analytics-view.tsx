"use client";

import { useState } from "react";
import { DollarSign, Eye, MousePointerClick, Percent, ShoppingCart, UserPlus, Users } from "lucide-react";
import { useActiveProfileId } from "@/features/profiles/hooks";
import { useProfileAnalytics } from "../hooks";
import { PageHeader } from "@/components/ui/page-header";
import { Segmented } from "@/components/ui/segmented";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeSeriesChart } from "@/components/charts/time-series-chart";
import { BarList } from "@/components/charts/bar-list";
import { UpgradeHint } from "@/components/common/upgrade-hint";
import { compactNumber } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { formatDate } from "@/lib/dayjs";

const RANGES = [7, 30, 90, 365] as const;

export function AnalyticsView() {
  const { profileId } = useActiveProfileId();
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useProfileAnalytics(profileId, days);
  const maxDays = data?.range.maxDays ?? 7;

  return (
    <>
      <PageHeader
        title="Analytics"
        description={data ? `${formatDate(data.range.from)} – ${formatDate(data.range.to)} · your plan keeps ${maxDays} days of history` : "Views, clicks and where your visitors come from"}
        actions={
          <Segmented
            value={String(days)}
            onChange={(v) => setDays(Number(v))}
            options={RANGES.map((r) => ({ value: String(r), label: r === 365 ? "1y" : `${r}d` }))}
          />
        }
      />
      {isLoading || !data ? (
        <div className="grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Page views" value={compactNumber(data.totals.views)} icon={Eye} />
            <StatCard label="Unique visitors" value={compactNumber(data.totals.uniqueVisitors)} icon={Users} />
            <StatCard label="Link clicks" value={compactNumber(data.totals.clicks)} icon={MousePointerClick} />
            <StatCard label="Click-through rate" value={`${data.totals.ctr}%`} icon={Percent} />
            <StatCard label="New subscribers" value={compactNumber(data.totals.subscribers)} icon={UserPlus} />
            <StatCard label="Orders" value={compactNumber(data.totals.orders)} icon={ShoppingCart} />
            <StatCard label="Revenue" value={formatMoney(data.totals.revenue)} icon={DollarSign} className="col-span-2" />
          </div>
          <Card>
            <CardHeader title="Views & clicks" description="Daily totals" />
            <CardBody>
              <TimeSeriesChart data={data.timeseries} series={[{ key: "views", label: "Views" }, { key: "clicks", label: "Clicks" }]} />
            </CardBody>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Top links" description="Most clicked blocks" />
              <CardBody>
                <BarList items={data.topBlocks.map((b) => ({ name: b.title, count: b.clicks }))} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Devices" />
              <CardBody>
                <BarList items={data.devices} />
              </CardBody>
            </Card>
            {data.advanced ? (
              <>
                <Card>
                  <CardHeader title="Referrers" description="Where visitors came from" />
                  <CardBody>
                    <BarList items={data.referrers} />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Countries" />
                  <CardBody>
                    <BarList items={data.countries} />
                  </CardBody>
                </Card>
                <Card>
                  <CardHeader title="Browsers" />
                  <CardBody>
                    <BarList items={data.browsers} />
                  </CardBody>
                </Card>
              </>
            ) : (
              <UpgradeHint className="lg:col-span-1" text="Referrers, countries and browsers are part of advanced analytics (Starter & Pro)." />
            )}
          </div>
        </div>
      )}
    </>
  );
}
