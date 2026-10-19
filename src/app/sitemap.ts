import type { MetadataRoute } from "next";
import { cacheLife } from "next/cache";
import { db } from "@/server/db";
import { absoluteUrl, routes } from "@/config/site";

async function publicPages() {
  "use cache";
  cacheLife("hours");
  try {
    return await db.profile.findMany({
      where: { isPublished: true, user: { status: "ACTIVE" } },
      select: { username: true, updatedAt: true, store: { select: { isActive: true } } },
      orderBy: { updatedAt: "desc" },
      take: 45_000,
    });
  } catch {
    cacheLife("seconds");
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const statics = ["/", "/features", "/pricing", "/templates"].map((p) => ({ url: absoluteUrl(p), changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.8 }));
  const profiles = await publicPages();
  return [
    ...statics,
    ...profiles.flatMap((p) => [
      { url: absoluteUrl(routes.profile(p.username)), lastModified: p.updatedAt, changeFrequency: "daily" as const, priority: 0.6 },
      ...(p.store?.isActive ? [{ url: absoluteUrl(routes.shop(p.username)), lastModified: p.updatedAt, changeFrequency: "daily" as const, priority: 0.6 }] : []),
    ]),
  ];
}
