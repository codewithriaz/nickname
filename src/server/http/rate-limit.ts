import "server-only";
import { rateLimited } from "./errors";

/**
 * Simple fixed-window in-memory limiter. Good for a single instance; swap for Redis/Upstash
 * when running multiple instances (see docs/features/authentication.md → Known issues).
 */
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 50_000) for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k);
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) throw rateLimited();
}
