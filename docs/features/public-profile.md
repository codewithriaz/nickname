# Public profile page

**Status:** ✅ Done (2026-10-20)

## What it does
Renders `/{username}` (and verified custom domains) — SEO-friendly, instant, themed.

## Rendering (Next 16 Cache Components)
- Data: `getPublicProfile(username)` in `src/server/queries/public.ts` — `'use cache'` + `cacheTag('profile:<username>')` (+ `store:<id>`).
  Lifetime is `days`, shortened automatically to the next scheduled block/redirect boundary.
- Every mutation calls `invalidateProfile()` → `revalidateTag(tag, 'max')` (see `src/server/cache/tags.ts`). Plan changes invalidate all of a user's pages (branding/features).
- Page awaits params inside `<Suspense>` → App Shell served instantly, URL-specific result cached (ISR). Build output shows `◐ /[username]`.
- `?tab=` is read client-side so the page stays cacheable.
- SEO: `generateMetadata` (title/description/OG/Twitter/canonical, `p:domain_verify`, noindex for sensitive), JSON-LD `ProfilePage`.
- Interactivity = small client islands: `ProfileClient` (page-view beacon, delegated click tracking, tabs, search), forms, share sheet (QR + vCard), sensitive gate, pixels.

## Key files
- `src/app/[username]/page.tsx`, `not-found.tsx`
- `src/components/profile-renderer/*` (shared by public page, dashboard preview and marketing demo)
- `src/proxy.ts` + `src/app/api/public/domain/[host]/route.ts` (custom-domain rewrite)

## Custom domains (page + shop on the seller's own domain)
User adds domain (Pro) → token `nickname-verify=…` → user adds `CNAME domain → app host` and `TXT _nickname.domain → token` → "Verify DNS".
`src/proxy.ts` resolves unknown hosts via `/api/public/domain/{host}` (cached `getUsernameByDomain`, plus a 5-min in-memory map) and rewrites:
`/` → `/{username}` · `/shop/**` → `/{username}/shop/**` · `/{username}/**` and `/s/**` pass through · anything else redirects to the main app ·
unknown/unverified domains → `/link-unavailable?reason=domain`. Optional env `INTERNAL_APP_URL` for the lookup behind a reverse proxy.
Deployment must accept any Host header and issue TLS certs for custom domains (e.g. Caddy on-demand TLS / Vercel domains API).
**Future:** single-page portfolio website templates will plug in here — `/` can render the user's site instead of the link page (see CLAUDE.md pending).

## Known issues / TODO
- On custom domains, canonical/OG URLs still point at the main domain (fine for SEO de-duplication; could switch to the custom domain).
- Unknown usernames return status 200 with the not-found UI (streamed PPR); `noindex` is applied.
- Image optimisation uses plain `<img>` (uploads are local); switch to `next/image` once on a CDN.
