# Authentication

**Status:** ✅ Done (2026-10-20)

## What it does
Email + password accounts with short-lived JWT access tokens and rotating refresh tokens,
password reset by email, change password, referral capture on sign-up, and super-admin
"login as user" (impersonation) with a "Return to admin" banner.

## How it works
- **Access token**: HS256 JWT (15 min) in httpOnly cookie `nk_at`. Claims: `sub`, `role`, `sid` (session id), `imp` (impersonator id).
- **Refresh token**: 48 random bytes in httpOnly cookie `nk_rt` (30 days). Only the SHA-256 hash is stored in `Session.tokenHash`.
- **Rotation**: `/api/auth/refresh` revokes the old session and creates a new one. Re-use of a revoked token
  **outside a 30 s grace window** revokes *all* the user's sessions (token theft detection). Inside the window
  (parallel tabs) it returns 200 without new cookies.
- **Axios interceptor** (`src/lib/api/client.ts`): on `401 TOKEN_EXPIRED` → single-flight refresh → retries the request.
  If refresh fails → `onSessionExpired` listeners (AppProviders) clear stores and redirect to `/login?next=`.
- **Proxy** (`src/proxy.ts`): optimistic gate for `/dashboard/**` and `/admin/**` (cookie present / role). Real authz is in every API route (`authed`, `adminOnly`).
- **Referral**: `?ref=CODE` on any page sets cookie `nk_ref` (30 d); register uses it if no code typed.
- Suspended users can't log in or refresh; suspending revokes all sessions.

## Key files
- `src/server/auth/{constants,jwt,password,session,cookies,context}.ts`
- `src/server/services/auth.service.ts`, `user.service.ts` (`getMe`)
- `src/app/api/auth/*` — `register, login, logout, refresh, me (GET/PATCH), forgot-password, reset-password, change-password, stop-impersonating`
- `src/app/api/admin/users/[id]/impersonate/route.ts`
- `src/features/auth/{api.ts,hooks.ts,components/*}` · pages in `src/app/(auth)/*`
- `src/proxy.ts`

## Data model
`User` (role USER|SUPER_ADMIN, status, referralCode, referredById), `Session`, `PasswordReset`.

## How to extend
- Social login: add an OAuth callback route that finds/creates the `User` then calls `createSession()` + `setAuthCookies()`.
- Email verification: `User.emailVerified` exists; add a token table like `PasswordReset` and a `/verify-email` page.

## Known issues / TODO
- Rate limiting is in-memory (`src/server/http/rate-limit.ts`) — use Redis/Upstash when running >1 instance.
- No 2FA yet.
