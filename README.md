# Nickname — Link in bio + mini shop SaaS

All the features of linktr.ee and liinks.co (link-in-bio pages, 13 block types, themes, analytics, URL shortener,
QR codes, affiliate links, lead capture, custom domains, API) **plus a mobile mini shop for Facebook Marketplace
sellers** with Cash on Delivery, manual bKash/Nagad and online payments (SSLCommerz, bKash), a referral program,
free + paid plans and a full super admin panel.

> Project status, decisions and per-feature docs: **[CLAUDE.md](CLAUDE.md)** and **[docs/features/](docs/features/)**.

## Stack
Next.js 16 (App Router, Cache Components, TypeScript) · Tailwind CSS v4 · Prisma 7 + PostgreSQL · Axios ·
TanStack Query & Table · Zustand · Day.js · Zod · React Hook Form · Recharts.

## Local setup
```bash
pnpm install                 # also runs `prisma generate`
cp .env.example .env         # fill JWT_ACCESS_SECRET, ENCRYPTION_KEY (openssl rand -hex 32)

# Database — either a hosted Postgres (Neon/Supabase) URL in DATABASE_URL, or a local one:
pnpm db:dev                  # starts Prisma Postgres locally, prints the postgres:// URL → put it in .env

pnpm db:migrate              # apply migrations
pnpm db:seed                 # plans, templates, super admin, demo seller
pnpm dev                     # http://localhost:3000
```
Logins after seeding: super admin = `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` from `.env` (default `admin@example.com / ChangeMe123!`),
demo seller = `demo@nickname.app / Demo12345` (public page: `/demo`, shop: `/demo/shop`).

## Scripts
| | |
|---|---|
| `pnpm dev` / `pnpm build` / `pnpm start` | Next.js |
| `pnpm typecheck` / `pnpm lint` | quality checks |
| `pnpm db:migrate` / `pnpm db:deploy` | migrations (dev / production) |
| `pnpm db:seed` / `pnpm db:studio` | seed / browse data |

## Deployment
1. PostgreSQL database → `DATABASE_URL`.
2. Env vars from `.env.example` (secrets, `NEXT_PUBLIC_APP_URL`, `APP_HOSTS`, gateways, SMTP).
3. `pnpm install && pnpm db:deploy && pnpm db:seed && pnpm build && pnpm start`.
4. Daily cron: `curl -H "Authorization: Bearer $CRON_SECRET" https://YOUR_APP/api/cron/expire-subscriptions`.
5. Persistent volume for `UPLOAD_DIR` (or switch the storage adapter to S3/R2).
6. Custom domains: the server must accept any `Host` and issue TLS on demand (e.g. Caddy `on_demand_tls`).
7. Payment callbacks: `https://YOUR_APP/api/payments/sslcommerz/{callback,ipn}` and `/api/payments/bkash/callback`.

## Project structure
```
src/app          routes (marketing, auth, dashboard, admin, [username] public pages, api)
src/components   shared UI kit, layout, charts, profile renderer
src/features     feature modules (components + TanStack Query hooks + Axios services)
src/server       backend: auth, services, payments, storage, cached public queries
src/schemas      zod schemas shared by client & server
src/lib          axios base service, dayjs, money, utils
src/stores       zustand (workspace, cart, auth)
prisma           schema, migrations, seed
docs             owner rules + per-feature documentation
```
