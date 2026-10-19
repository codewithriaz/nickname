import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/server/auth/constants";
import { verifyAccessToken } from "@/server/auth/jwt";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
/** Where the proxy can reach this app for internal lookups (defaults to the public URL). */
const INTERNAL_URL = process.env.INTERNAL_APP_URL || APP_URL;

const appHosts = () =>
  new Set(
    (process.env.APP_HOSTS ?? "localhost:3000,localhost")
      .split(",")
      .map((h) => h.trim().toLowerCase())
      .filter(Boolean)
      .concat(new URL(APP_URL).host),
  );

const isPrivate = (p: string) => p.startsWith("/dashboard") || p.startsWith("/admin");
const isAuthPage = (p: string) => p === "/login" || p === "/register";

// ── Custom domains ─────────────────────────────────────────────────────
/** host → username (null = not connected). Small in-memory cache per server instance. */
const domainCache = new Map<string, { username: string | null; expires: number }>();

async function usernameForDomain(host: string) {
  const hit = domainCache.get(host);
  if (hit && hit.expires > Date.now()) return hit.username;
  let username: string | null = null;
  try {
    const res = await fetch(`${INTERNAL_URL}/api/public/domain/${encodeURIComponent(host)}`, { headers: { "x-domain-lookup": "1" } });
    if (res.ok) username = ((await res.json()) as { data?: { username?: string } }).data?.username ?? null;
  } catch {
    username = hit?.username ?? null; // keep serving the last known mapping if the lookup fails
  }
  domainCache.set(host, { username, expires: Date.now() + (username ? 5 * 60_000 : 60_000) });
  if (domainCache.size > 5000) domainCache.clear();
  return username;
}

/**
 * A connected domain serves that user's public site:
 *   /                → /{username}            (link-in-bio page — later: portfolio website)
 *   /shop/...        → /{username}/shop/...   (storefront, product, checkout, order tracking)
 *   /{username}/...  → as is                  (internal links keep working)
 *   /s/{code}        → as is                  (short links)
 *   anything else    → redirect to the main app
 */
async function handleCustomDomain(req: NextRequest, host: string) {
  const { pathname, search } = req.nextUrl;
  const username = await usernameForDomain(host);
  if (!username) {
    const url = req.nextUrl.clone();
    url.pathname = "/link-unavailable";
    url.search = "?reason=domain";
    return NextResponse.rewrite(url);
  }
  if (pathname === `/${username}` || pathname.startsWith(`/${username}/`) || pathname.startsWith("/s/") || pathname === "/link-unavailable") {
    return NextResponse.next();
  }
  if (pathname === "/" || pathname === "/shop" || pathname.startsWith("/shop/")) {
    const url = req.nextUrl.clone();
    url.pathname = `/${username}${pathname === "/" ? "" : pathname}`;
    return NextResponse.rewrite(url);
  }
  return NextResponse.redirect(new URL(`${pathname}${search}`, APP_URL));
}

/**
 * Next 16 Proxy (formerly middleware):
 * 1. Custom domains → user's page / shop on their own domain
 * 2. Optimistic auth gate for /dashboard and /admin (APIs enforce real auth)
 * 3. Referral capture (?ref=CODE → cookie)
 */
export async function proxy(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;
  const host = (req.headers.get("host") ?? "").toLowerCase();

  // 1. Custom domain
  if (host && !appHosts().has(host) && !host.endsWith(".vercel.app")) {
    return handleCustomDomain(req, host);
  }

  let res: NextResponse | undefined;

  // 2. Auth gate
  if (isPrivate(pathname) || isAuthPage(pathname)) {
    const access = await verifyAccessToken(req.cookies.get(ACCESS_COOKIE)?.value);
    const hasRefresh = !!req.cookies.get(REFRESH_COOKIE)?.value;
    const signedIn = access.ok || hasRefresh;

    if (isPrivate(pathname) && !signedIn) {
      const url = new URL("/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    if (pathname.startsWith("/admin") && access.ok && access.claims.role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isAuthPage(pathname) && access.ok) {
      return NextResponse.redirect(new URL(access.claims.role === "SUPER_ADMIN" ? "/admin" : "/dashboard", req.url));
    }
  }

  // 3. Referral cookie
  const ref = searchParams.get("ref");
  if (ref && /^[A-Z0-9]{4,32}$/i.test(ref)) {
    res ??= NextResponse.next();
    res.cookies.set("nk_ref", ref.toUpperCase(), { path: "/", maxAge: 30 * 86400, sameSite: "lax", httpOnly: true });
  }
  return res ?? NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|txt)$).*)"],
};
