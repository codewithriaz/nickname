# CLAUDE.md — Nickname (Link-in-bio + Mini Shop SaaS)

> **Read this file first in every session.** It is the single source of truth for project
> progress. Update the "Current plan", "Pending", "Completed", "Decisions" and "Known issues"
> sections after every meaningful change so no one has to re-read the whole codebase.
> Detailed docs live in [`docs/`](docs/) (architecture, features, API, deployment).

@AGENTS.md

### Documentation workflow (owner requirement)
- `CLAUDE.md` = high-level index: plan, pending, completed, decisions, known issues.
- **One file per feature** in [`docs/features/`](docs/features/). When a feature is finished
  or changed, update **only that feature's file** (status, key files, models, endpoints, how to
  extend, TODO) + the Completed/Pending lists here. A new session should read CLAUDE.md, then
  only the feature file it needs — never the whole codebase.

| Feature doc | Status |
|---|---|
| [authentication.md](docs/features/authentication.md) | ✅ |
| [link-in-bio-editor.md](docs/features/link-in-bio-editor.md) | ✅ |
| [public-profile.md](docs/features/public-profile.md) | ✅ |
| [templates.md](docs/features/templates.md) | ✅ |
| [analytics.md](docs/features/analytics.md) | ✅ |
| [url-shortener-qr.md](docs/features/url-shortener-qr.md) | ✅ |
| [shop-checkout.md](docs/features/shop-checkout.md) | ✅ |
| [payment.md](docs/features/payment.md) | ✅ |
| [billing-plans.md](docs/features/billing-plans.md) | ✅ |
| [referral-affiliate.md](docs/features/referral-affiliate.md) | ✅ |
| [api-keys-public-api.md](docs/features/api-keys-public-api.md) | ✅ |
| [super-admin.md](docs/features/super-admin.md) | ✅ |
| [marketing-pages.md](docs/features/marketing-pages.md) | ✅ |

---

## 1. Project overview

**Nickname** is a modern SaaS that combines every feature of **liinks.co** and **linktr.ee**
(link-in-bio pages, blocks, themes, analytics, QR codes, URL shortener, lead capture, affiliate
links, digital products) with a **mobile-first mini shop for Facebook Marketplace sellers**
(products → cart → checkout with name/phone/address → Cash on Delivery, manual bKash/Nagad,
or online gateway via SSLCommerz / bKash).

- Super admin panel (users, plans, templates, payments, referrals/payouts, verification, settings).
- Free + paid plans (always cheaper than liinks.co: Starter $5 → ours ৳299 / ~$2.5; Pro $12 → ৳799 / ~$7).
- Referral program (commission on referred users' payments + payout requests).
- Public REST API (`/api/v1`) with API keys.

Owner rules (must always follow): see [docs/OWNER_RULES.md](docs/OWNER_RULES.md).

## 2. Tech stack

| Concern | Choice |
|---|---|
| Framework | Next.js **16.4** App Router, TypeScript strict, `src/` dir, **Cache Components** enabled |
| Styling | Tailwind CSS v4 (CSS-first config in `src/app/globals.css`), lucide-react icons, simple-icons (brand icons) |
| DB / ORM | PostgreSQL + **Prisma 7.10** (`prisma-client` generator → `src/generated/prisma`, `@prisma/adapter-pg`) |
| Auth | Custom JWT: access token (15m, httpOnly cookie `nk_at`) + rotating refresh token (30d, cookie `nk_rt`, hashed in `Session` table). `jose` + `bcryptjs` |
| API client | Axios base service (`src/lib/api/client.ts`) with interceptors: auth, error normalising, single-flight token refresh |
| Server state | TanStack Query v5 (dashboard + admin), TanStack Table v8 (admin/data tables) |
| Client state | Zustand (auth user, active profile, shop cart — persisted) |
| Dates | Day.js (`src/lib/dayjs.ts` with plugins) |
| Validation | Zod v4 schemas in `src/schemas/` shared by client + server |
| Charts | Recharts |
| Payments | Gateway abstraction `src/server/payments/` → COD, Manual (bKash/Nagad/Rocket TrxID), SSLCommerz, bKash Tokenized |
| Email | Nodemailer (falls back to console log when SMTP not configured) |
| Uploads | Storage adapter `src/server/storage/` — Vercel Blob / S3-compatible (R2) / local disk (`/api/files/...`), auto-detected from env |

## 3. Rendering strategy (per page)

| Route | Strategy | Why |
|---|---|---|
| `/` `/features` `/pricing` `/templates` | Static / ISR (`'use cache'` + `cacheLife`) | SEO, speed |
| `/[username]` public profile | ISR — `'use cache'` + `cacheTag('profile:<username>')`, revalidated on edit via `revalidateTag` | SEO + instant |
| `/[username]/shop`, `/[username]/shop/p/[slug]` | ISR — tag `store:<profileId>` | SEO for products |
| `/[username]/shop/checkout`, cart | CSR (Zustand cart) | per-visitor |
| `/[username]/shop/order/[token]` | SSR (request-time, inside Suspense) | live order status |
| `/s/[code]` short link | Route handler, request-time redirect + click log | |
| `/dashboard/**` | CSR (TanStack Query) inside static shell; auth by proxy + API | private |
| `/admin/**` | CSR (TanStack Query + Table); SUPER_ADMIN only | private |
| `/domain/[domain]` | ISR, custom-domain rewrite target from `src/proxy.ts` | |

## 4. Folder structure (clean architecture)

```
prisma/                 schema.prisma, seed.ts, migrations
src/
  app/                  routes only (thin) — (marketing), (auth), dashboard, admin, [username], api
  components/           SHARED components only (ui/, layout/, common/, profile-renderer/)
  features/<feature>/   feature-scoped components, hooks (TanStack Query), api services
  server/               backend only: db.ts, auth/, http/ (handler wrapper, errors), services/, payments/, storage/
  lib/                  isomorphic helpers: api/ (axios base), dayjs, utils, money, constants
  schemas/              zod schemas (shared client/server)
  stores/               zustand stores
  config/               site config, plan defaults, template presets, reserved usernames
  types/                shared TS types
  proxy.ts              (Next 16 "middleware") auth gate + custom-domain rewrite
docs/                   detailed documentation
```
Rule: a component used in >1 feature/page → `src/components`; otherwise inside its feature folder.

## 5. Current plan

**Phase 1 (MVP) is complete** — every feature below is built, typechecked, linted, production-built and smoke-tested
against a local Prisma Postgres (`pnpm db:dev`). Next phase = items in "Pending".

Quick start for a new session: read this file → open only the relevant `docs/features/*.md` → edit.
Commands: `pnpm dev` · `pnpm typecheck` · `pnpm lint` · `pnpm build` · `pnpm db:migrate` · `pnpm db:seed` · `pnpm db:studio`.
Logins after seed: super admin `admin@example.com / ChangeMe123!` (from `.env`), demo seller `demo@nickname.app / Demo12345` → `/demo`.

## 6. Pending tasks (next phase, by priority)
1. Deploy to Vercel following docs/DEPLOYMENT.md (DB + Blob/R2 + env vars). Automate seller custom domains via the Vercel Domains API.
2. Test SSLCommerz + bKash with real sandbox credentials (code paths written, not yet hit with live sandbox).
3. Test Vercel Blob / R2 upload drivers with real credentials (written, not yet run against real storage); consider direct-to-storage client uploads for files > 4.5 MB on Vercel; `next/image`.
4. Redis-based rate limiting (`src/server/http/rate-limit.ts`) for multi-instance.
5. Seller notifications on new order (email/SMS) + courier integration (Pathao / Steadfast / RedX).
6. Show platform announcement banner in dashboard; subscription expiry reminder emails.
7. Email verification on sign-up; optional Google login.
8. Automated tests (Vitest for services, Playwright for checkout & editor).
9. Nice-to-have Linktree/Liinks extras: Instagram post sync, AI chat, social planner, bookings/courses.
10. **Portfolio website templates (owner plan):** single-page portfolio/business site templates selectable per profile
    (e.g. `Profile.siteType = "links" | "portfolio"` + `siteTemplate`), rendered at `/{username}` and on the user's custom domain
    (proxy already routes `/` → `/{username}`). Sections: hero, about, services, gallery/work, testimonials, contact form, shop link.
11. Bangla UI option for the public shop (all shop strings are English now).

## 7. Completed tasks
- 2026-10-19: Scaffolded Next 16.4.2 (create-next-app, src dir, TS, Tailwind v4), installed deps, Prisma 7.10.1 init.
- 2026-10-20: Prisma schema + init migration + idempotent seed (3 plans, 12 templates, super admin, demo seller `/demo`).
- 2026-10-20: Backend: zod schemas, server core (auth/JWT refresh rotation, http wrapper, rate limit, AES secrets, storage, mail),
  all services, payments (SSLCommerz, bKash, manual, COD), cached public queries, all API routes (`/api/*`, `/api/admin/*`, `/api/v1/*`).
- 2026-10-20: Frontend: shared UI kit (`src/components/ui`), Axios Base API Service + interceptors, TanStack Query hooks, Zustand stores,
  public profile renderer (ISR), mini shop + cart + checkout + order tracking, full user dashboard (overview, links editor with DnD +
  live preview, appearance, analytics, audience, shop/products/orders, short links, QR, settings, billing, referrals, account/API keys,
  profiles), super admin panel (12 pages), marketing site (home/features/pricing/templates/legal), sitemap/robots.
- 2026-10-20: Verified: `pnpm typecheck` ✅ `pnpm lint` ✅ `pnpm build` ✅; prod smoke test of auth, editor APIs, checkout (COD + manual),
  plan gating, short links, analytics beacon, ISR revalidation, referral commission, admin approval.
- Per-feature documentation in `docs/features/*.md` (see table above).
- 2026-10-20: Digital products can't be paid by Cash on Delivery (checkout UI + server rule). See docs/features/shop-checkout.md.
- 2026-10-20: 3 photo templates (Orchard, Lagoon, Canyon) + theme options: image bottom mode, text shadow, "torn" button style. See docs/features/templates.md.
- 2026-10-20: **Country-based payment gateways** — BD: bKash, Nagad, SSLCommerz · IN: Razorpay (+UPI manual) · worldwide: PayPal, Stripe, 2Checkout;
  generic adapter interface + universal callback `/api/payments/gateway/[key]/[tran]`; migration `20261020120000_shop_gateways_and_layout`
  (OrderPaymentMethod = COD|MANUAL|ONLINE + `Order.gateway`). See docs/features/payment.md.
- 2026-10-20: **Mega store shop template** (owner's PDF reference) + all-products page, track-order page, wishlist, category pictures. See docs/features/shop-checkout.md.
- 2026-10-20: **Custom domains now serve page + shop** (`/`, `/shop/**`) via proxy lookup. See docs/features/public-profile.md.
- 2026-10-20: Build no longer needs a DB (DB reads on static pages inside Suspense).
- 2026-10-20: **Vercel-ready**: upload storage drivers (Vercel Blob / S3-compatible e.g. Cloudflare R2 / local, auto-detected),
  `vercel-build` runs migrations + idempotent seed (`scripts/deploy-db.mjs`), production-safe seed (no demo account, no weak admin),
  `DIRECT_DATABASE_URL` for migrations, daily cron in `vercel.json`. Guide: docs/DEPLOYMENT.md.

## 8. Important decisions
- **Next 16 Cache Components** (default in create-next-app): ISR = `'use cache'` + `cacheLife` + `cacheTag` (`src/server/queries/public.ts`);
  invalidation via `invalidate()` → `revalidateTag(tag,'max')` (`src/server/cache/tags.ts`). No `export const revalidate/dynamic`.
  Request-time pages put awaits inside `<Suspense>`. Dashboard/admin layouts must always render `{children}` (instant-navigation validator).
  **Any DB read on a static page must sit inside `<Suspense>`** (e.g. `PricingTeaser` on `/`): if the DB is unreachable at build
  time (Vercel), the cached query falls back to `cacheLife("seconds")` and becomes dynamic — outside Suspense that fails the build.
  Verified: `DATABASE_URL=<unreachable> pnpm build` passes.
- Route handlers wrap with `handler/authed/adminOnly/apiKeyAuthed` (`src/server/http/handler.ts`); they call `unstable_rethrow` so Next
  prerender bail-outs aren't swallowed. Response envelope `{success,data,meta?}` / `{success:false,error}`.
- `src/proxy.ts` = Next 16 "middleware" (auth gate, referral cookie, custom-domain rewrite).
- **Prisma 7.10.1 (stable)** instead of 8.0 RC; `prisma-client` generator → `src/generated/prisma` (git-ignored, `postinstall` generates).
- **TanStack Table pinned to v8** (v9 has a new API). **lucide-react v1** has no brand icons → brand SVGs from `simple-icons` (+ inline LinkedIn).
- **PostgreSQL** over MongoDB: relational orders/plans/analytics aggregation.
- Money stored as **Int minor units**; UI converts with `toMinor/toMajor/formatMoney` (`src/lib/money.ts`).
- One account → many profiles (plan limit). Shop belongs to a profile (`Store.profileId` unique).
- Seller gateway credentials encrypted (AES-256-GCM, `ENCRYPTION_KEY`); platform billing credentials only in env.
- Forms: react-hook-form + zod resolver (uncontrolled → fewer re-renders); use `useWatch` (React Compiler compatible), not `watch`.
- Charts follow the dataviz skill palette (`src/components/charts/palette.ts`).
- Pricing: Free ৳0 / Starter ৳299 (~$2.50) / Pro ৳799 (~$7) — below liinks.co ($5 / $12).

## 9. Known issues / limitations
- Local dev DB: `pnpm db:dev` (Prisma Dev). Its port may change on restart → update `DATABASE_URL` in `.env` (`pnpm prisma dev ls`).
- In-memory rate limiter + bKash token cache → single instance only until Redis is added.
- Uploads: local disk driver doesn't work on Vercel — set `BLOB_READ_WRITE_TOKEN` or `S3_*`. Vercel caps request bodies at ~4.5 MB (`MAX_UPLOAD_MB=4`).
- Custom domains need a host that accepts arbitrary Host headers + on-demand TLS.
- Unknown usernames respond 200 with not-found UI (PPR streaming) — `noindex` applied.
- Request body size for uploads should also be capped at the reverse proxy (e.g. `client_max_body_size 25m`).
- Gateway integrations need sandbox verification (see docs/features/payment.md).
- Dev only: Turbopack occasionally keeps a stale server module after an edit — if an API change doesn't apply, restart `pnpm dev`.
- Local Prisma Dev DB is `template1`, so `prisma migrate dev` fails on the shadow DB. Workflow: edit schema →
  `pnpm prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` → save as a new folder in
  `prisma/migrations/` (add data-migration SQL if needed) → `pnpm prisma migrate deploy` → `pnpm prisma generate`.
