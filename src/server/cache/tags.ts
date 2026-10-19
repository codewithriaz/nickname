import "server-only";
import { revalidateTag } from "next/cache";

/** Cache tags used by `'use cache'` public queries. Keep in one place to avoid typos. */
export const tags = {
  profile: (username: string) => `profile:${username.toLowerCase()}`,
  profileDomain: (domain: string) => `domain:${domain.toLowerCase()}`,
  store: (profileId: string) => `store:${profileId}`,
  plans: "plans",
  templates: "templates",
  settings: "platform-settings",
} as const;

/** Stale-while-revalidate invalidation (works from Route Handlers). */
export function invalidate(...tagList: (string | null | undefined)[]) {
  for (const tag of tagList) {
    if (!tag) continue;
    try {
      revalidateTag(tag, "max");
    } catch (e) {
      // revalidateTag throws outside a request scope (e.g. seed scripts) — safe to ignore.
      if (process.env.NODE_ENV === "development") console.warn("[cache] revalidateTag skipped", tag, e);
    }
  }
}
