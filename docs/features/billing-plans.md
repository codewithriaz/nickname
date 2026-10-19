# Plans & billing

**Status:** ✅ Done (2026-10-20)

## Plans (seeded — editable in `/admin/plans`)
| | Free | Starter | Pro |
|---|---|---|---|
| Price | ৳0 | **৳299/mo · ৳2,868/yr** (~$2.50) | **৳799/mo · ৳7,668/yr** (~$7) |
| vs liinks.co | – | Liinks Starter $5/mo · $48/yr | Liinks Pro $12/mo · $120/yr |
| Profiles | 1 | 2 | 10 |
| Products | 15 | 200 | ∞ |
| Short links | 25 | 500 | ∞ |
| Analytics history | 7 d | 180 d | 730 d |
| Orders/month | 100 | ∞ | ∞ |
| Features | core | + online payments, premium templates, remove branding, scheduling, pixels, SEO, tabs, custom QR, lead export, advanced analytics | + custom domain, API, priority support |
Trial: 7 days on paid plans (once per account).

## How it works
- `Plan.limits` / `Plan.features` JSON validated by `src/schemas/plan.ts`. `-1` = unlimited.
- `getUserPlan(userId)` → live subscription (ACTIVE/TRIALING and not past `currentPeriodEnd`) or the default plan.
- Gates: `assertFeature(userId, key)` and `assertLimit(userId, key, count)` in services → `402 PLAN_LIMIT`.
- Checkout `/api/billing/checkout` (SSLCommerz / bKash / manual / 100% coupon), trial `/api/billing/trial`,
  cancel-at-period-end `/api/billing/cancel`. Coupons in `/admin/coupons`.
- Renewal model: prepaid periods (no auto-charge in BD gateways). Paying again extends the current period.
- Cron: `GET /api/cron/expire-subscriptions` with `Authorization: Bearer $CRON_SECRET` (daily) marks expired subs
  and refreshes public pages (expiry is also enforced lazily on every request).

## Key files
`src/config/plans.ts`, `src/schemas/plan.ts`, `src/server/services/{plan,billing}.service.ts`, `src/features/billing/*`,
`src/components/common/pricing-cards.tsx`, admin `plans-view.tsx`, `revenue-views.tsx`.

## Known issues / TODO
- Expiry reminder emails before period end not sent yet.
