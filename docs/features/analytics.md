# Analytics

**Status:** ✅ Done (2026-10-20)

## What it does
Privacy-friendly analytics (no visitor cookies): page views, unique visitors, link clicks, CTR, subscribers,
orders & revenue, daily chart, top links, devices; **advanced** (paid): referrers, countries, browsers.
History window limited by plan (`limits.analyticsDays`). Short links have their own analytics (clicks vs QR scans).

## How it works
- Browser sends `navigator.sendBeacon('/api/track', …)` (`track()` in `src/features/public/api.ts`).
- `/api/track` validates, rate-limits per IP, and records in `after()` (doesn't block the response).
- `recordEvent()` (`src/server/analytics/track.ts`): bot filter, `visitorId = sha256(ip|ua|day|secret)`,
  UA parsing (ua-parser-js), country from `x-vercel-ip-country` / `cf-ipcountry`, referrer host, UTM.
- Aggregation (`analytics.service.ts`): Prisma counts/groupBy + raw SQL `date_trunc` per client timezone (`X-Client-TZ` header).
- Charts: `src/components/charts/*` (Recharts, validated palette — see dataviz notes in `palette.ts`).

## Data model
`AnalyticsEvent` (type, profileId, blockId, shortLinkId, productId, visitorId, referrer, country, city, device, browser, os, utm*).
Denormalised counters: `Block.clicks`, `ShortLink.clicks`.

## Known issues / TODO
- Country needs a CDN header (Vercel/Cloudflare). Self-hosted without one → "Unknown".
- For very high traffic, move events to a queue / ClickHouse and roll up daily.
