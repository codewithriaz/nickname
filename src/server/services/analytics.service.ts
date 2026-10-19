import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { dayjs } from "@/lib/dayjs";
import { getUserPlan } from "./plan.service";
import { getOwnedProfile } from "./profile.service";
import { notFound, forbidden } from "../http/errors";
import type { AuthContext } from "../auth/context";
import type { AnalyticsSummaryDTO, ShortLinkAnalyticsDTO } from "@/types/dto";
import type { DateRangeQuery } from "@/schemas/common";

function safeTz(tz: string | null | undefined) {
  if (!tz) return "UTC";
  try {
    Intl.DateTimeFormat("en", { timeZone: tz });
    return tz;
  } catch {
    return "UTC";
  }
}

async function resolveRange(userId: string, q: DateRangeQuery) {
  const { limits, features } = await getUserPlan(userId);
  const maxDays = limits.analyticsDays;
  const to = q.to ?? new Date();
  const earliest = dayjs(to).subtract(maxDays, "day").toDate();
  let from = q.from ?? dayjs(to).subtract(q.days ?? Math.min(30, maxDays), "day").toDate();
  if (from < earliest) from = earliest;
  return { from, to, maxDays, advanced: features.advancedAnalytics };
}

type Scope = { profileId: string } | { shortLinkId: string };

const scopeSql = (s: Scope) =>
  "profileId" in s ? Prisma.sql`"profileId" = ${s.profileId}` : Prisma.sql`"shortLinkId" = ${s.shortLinkId}`;

async function timeseries(scope: Scope, from: Date, to: Date, tz: string, viewTypes: string[], clickTypes: string[]) {
  const rows = await db.$queryRaw<{ d: Date; views: bigint; clicks: bigint }[]>`
    SELECT date_trunc('day', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}) AS d,
           count(*) FILTER (WHERE type::text = ANY(${viewTypes})) AS views,
           count(*) FILTER (WHERE type::text = ANY(${clickTypes})) AS clicks
    FROM "AnalyticsEvent"
    WHERE ${scopeSql(scope)} AND "createdAt" BETWEEN ${from} AND ${to}
    GROUP BY 1 ORDER BY 1`;
  const map = new Map(rows.map((r) => [dayjs(r.d).format("YYYY-MM-DD"), r]));
  const out: { date: string; views: number; clicks: number }[] = [];
  for (let d = dayjs(from).startOf("day"); !d.isAfter(to, "day"); d = d.add(1, "day")) {
    const key = d.format("YYYY-MM-DD");
    const r = map.get(key);
    out.push({ date: key, views: Number(r?.views ?? 0), clicks: Number(r?.clicks ?? 0) });
  }
  return out;
}

async function breakdown(
  where: Prisma.AnalyticsEventWhereInput,
  field: "referrer" | "country" | "device" | "browser",
  take = 10,
) {
  const rows = await db.analyticsEvent.groupBy({
    by: [field],
    where,
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take,
  });
  return rows.map((r) => ({ name: (r[field] as string | null) ?? "Unknown", count: r._count._all }));
}

export async function getProfileAnalytics(
  auth: AuthContext,
  profileId: string,
  q: DateRangeQuery,
  tzHeader?: string | null,
): Promise<AnalyticsSummaryDTO> {
  const profile = await getOwnedProfile(auth, profileId);
  const { from, to, maxDays, advanced } = await resolveRange(profile.userId, q);
  const tz = safeTz(tzHeader);
  const base = { profileId, createdAt: { gte: from, lte: to } };

  const [views, clicks, uniques, subscribers, series, topRaw, orderAgg] = await Promise.all([
    db.analyticsEvent.count({ where: { ...base, type: "PAGE_VIEW" } }),
    db.analyticsEvent.count({ where: { ...base, type: "LINK_CLICK" } }),
    db.analyticsEvent.groupBy({ by: ["visitorId"], where: { ...base, type: "PAGE_VIEW" } }).then((r) => r.length),
    db.subscriber.count({ where: { profileId, createdAt: { gte: from, lte: to } } }),
    timeseries({ profileId }, from, to, tz, ["PAGE_VIEW"], ["LINK_CLICK"]),
    db.analyticsEvent.groupBy({
      by: ["blockId"],
      where: { ...base, type: "LINK_CLICK", blockId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { id: "desc" } },
      take: 10,
    }),
    db.order.aggregate({
      where: { store: { profileId }, createdAt: { gte: from, lte: to }, status: { notIn: ["CANCELLED", "RETURNED"] } },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  const blocks = await db.block.findMany({
    where: { id: { in: topRaw.map((t) => t.blockId!).filter(Boolean) } },
    select: { id: true, title: true, type: true },
  });
  const blockMap = new Map(blocks.map((b) => [b.id, b]));

  const viewWhere = { ...base, type: "PAGE_VIEW" as const };
  const [referrers, countries, devices, browsers] = advanced
    ? await Promise.all([
        breakdown(viewWhere, "referrer"),
        breakdown(viewWhere, "country"),
        breakdown(viewWhere, "device"),
        breakdown(viewWhere, "browser"),
      ])
    : [[], [], await breakdown(viewWhere, "device", 3), []];

  return {
    range: { from: from.toISOString(), to: to.toISOString(), maxDays },
    totals: {
      views,
      clicks,
      uniqueVisitors: uniques,
      ctr: views ? Math.round((clicks / views) * 1000) / 10 : 0,
      subscribers,
      orders: orderAgg._count._all,
      revenue: orderAgg._sum.total ?? 0,
    },
    timeseries: series,
    topBlocks: topRaw.map((t) => {
      const b = blockMap.get(t.blockId!);
      return { id: t.blockId!, title: b?.title || b?.type || "Deleted", type: b?.type ?? "LINK", clicks: t._count._all };
    }),
    referrers,
    countries,
    devices,
    browsers,
    advanced,
  };
}

export async function getShortLinkAnalytics(
  auth: AuthContext,
  shortLinkId: string,
  q: DateRangeQuery,
  tzHeader?: string | null,
): Promise<ShortLinkAnalyticsDTO> {
  const link = await db.shortLink.findUnique({ where: { id: shortLinkId } });
  if (!link) throw notFound("Short link");
  if (link.userId !== auth.userId && auth.role !== "SUPER_ADMIN") throw forbidden();
  const { from, to, maxDays, advanced } = await resolveRange(link.userId, q);
  const tz = safeTz(tzHeader);
  const where = { shortLinkId, createdAt: { gte: from, lte: to } };
  const [total, qr, series, referrers, countries, devices, browsers] = await Promise.all([
    db.analyticsEvent.count({ where }),
    db.analyticsEvent.count({ where: { ...where, type: "QR_SCAN" } }),
    timeseries({ shortLinkId }, from, to, tz, ["SHORTLINK_CLICK", "QR_SCAN"], ["QR_SCAN"]),
    advanced ? breakdown(where, "referrer") : [],
    advanced ? breakdown(where, "country") : [],
    breakdown(where, "device", advanced ? 10 : 3),
    advanced ? breakdown(where, "browser") : [],
  ]);
  return {
    range: { from: from.toISOString(), to: to.toISOString(), maxDays },
    totals: { clicks: total, qrScans: qr, allTime: link.clicks },
    timeseries: series.map((s) => ({ date: s.date, clicks: s.views, qrScans: s.clicks })),
    referrers,
    countries,
    devices,
    browsers,
    advanced,
  };
}

