# URL shortener & QR codes

**Status:** ✅ Done (2026-10-20)

## What it does
- Short links `/s/{code}`: custom back-half, title, UTM builder (appended to destination), password protection
  (`/s/{code}/unlock`), expiry, active toggle, click analytics, admin can disable abusive links.
- Dynamic QR codes = short link + `?qr=1` (scans tracked separately, destination editable without reprinting).
  Custom colors + center logo (paid `customQr`), PNG/SVG download.
- QR page (`/dashboard/qr`) for page/shop/any URL. Profile share sheet also offers QR + vCard.

## Key files
`src/server/services/short-link.service.ts`, `src/app/s/[code]/route.ts` (302 + `after()` tracking),
`src/app/s/[code]/unlock/page.tsx`, `/api/short-links[/id][/analytics]`, `/api/public/unlock`,
`src/features/short-links/*`, `src/components/common/qr-code.tsx`, `/link-unavailable`.

## Limits
`limits.shortLinks` per plan (Free 25, Starter 500, Pro ∞).

## Known issues / TODO
- No separate short domain yet (uses main domain `/s/`). A short domain can be added via proxy rewrite.
