# Super admin panel

**Status:** ✅ Done (2026-10-20) — `/admin` (role `SUPER_ADMIN`; first admin seeded from `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD`).

| Page | What you can do |
|---|---|
| Dashboard | users, profiles, shops, orders, revenue (all/30d), events, pending queues, sign-ups chart, subscriptions per plan |
| Users | search/filter, details, assign any plan for N days (or forever), change role/status (suspend revokes sessions), **login as user**, delete |
| Profiles & verification | approve/reject verified badges, unpublish/publish pages |
| Payments | approve/reject manual payments (shows TrxID), mark refunds |
| Plans | edit prices (BDT + USD), limits, features, highlights, default/popular/active |
| Coupons | % off codes with max uses / expiry |
| Referral payouts | mark paid / reject |
| Templates | create/edit/delete themes with live editor |
| Shop orders | all orders across sellers |
| Short links | disable abusive links |
| Platform settings | sign-ups on/off, announcement, referral %, min payout, manual billing numbers, gateway status |
| Audit log | every admin action (`audit()` helper) |

Tables use **TanStack Table** (`src/components/ui/data-table.tsx`, server pagination) and data via **TanStack Query** (`src/features/admin/{api,hooks}.ts`).
Server: `src/server/services/admin.service.ts`, routes `src/app/api/admin/*` (all wrapped in `adminOnly`).

## Known issues / TODO
- Platform announcement is stored but not yet displayed in the dashboard banner.
