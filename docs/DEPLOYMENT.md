# Deploying to Vercel

Everything below is one-time setup. After that, every `git push` to `main` deploys automatically:
`vercel-build` = `prisma generate` → **migrations + seed** (`scripts/deploy-db.mjs`) → `next build`.

## 1. Database (PostgreSQL)
Create a free Postgres on **Neon** (recommended) or Supabase.
- `DATABASE_URL` = the **pooled** connection string (Neon: host contains `-pooler`; Supabase: port `6543`).
- `DIRECT_DATABASE_URL` = the **direct** connection string (used only for migrations).
Vercel → Project → Settings → Environment Variables → add both (Production + Preview).

## 2. File uploads → Vercel Blob (easiest) or Cloudflare R2
- **Vercel Blob:** Vercel → Storage → Create → Blob → Connect to project. It adds `BLOB_READ_WRITE_TOKEN` automatically. Done.
- **Cloudflare R2 (or any S3-compatible):** create a bucket, enable public access (r2.dev URL or custom domain), create an API token, then set
  `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`, `S3_REGION=auto`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL`.
The driver is auto-detected (Blob token → Blob, `S3_BUCKET` → S3, otherwise local disk — which does **not** work on Vercel).
Keep `MAX_UPLOAD_MB=4` (Vercel function request bodies max out around 4.5 MB).

## 3. Required environment variables
| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` (or your main domain) |
| `APP_HOSTS` | your app host(s), comma separated, e.g. `your-app.vercel.app,nickname.app` |
| `JWT_ACCESS_SECRET` | `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | `openssl rand -hex 32` (**never change after launch** — it decrypts sellers' gateway keys) |
| `CRON_SECRET` | `openssl rand -hex 16` (Vercel Cron sends it automatically) |
| `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | your real email + strong password (10+ chars) — otherwise the admin is **not** created |
| `SEED_DEMO` | `false` (don't create the public demo account in production) |
Optional: `SMTP_*` (password-reset emails), `SSLCOMMERZ_*` / `BKASH_*` (subscription payments), `INTERNAL_APP_URL`.

## 4. Deploy
Push to GitHub → Vercel builds. In the build log you should see `▶ pnpm prisma migrate deploy` and `✔ super admin: …`.
Log in at `/login` with the super admin, then check `/admin/settings`.

## 5. Cron
`vercel.json` runs `/api/cron/expire-subscriptions` daily at 03:00 UTC (marks ended subscriptions and refreshes pages).

## 6. Custom domains for sellers (later)
On Vercel every seller domain must also be added to the Vercel project (Domains API) before it gets TLS. Until that's automated,
add seller domains manually in Vercel → Domains, then the seller verifies DNS in the dashboard.
On a VPS, use Caddy `on_demand_tls` instead.

## Running migrations/seed manually
```bash
DATABASE_URL="<url>" pnpm db:deploy:all   # migrate deploy + seed
```
