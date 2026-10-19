import "server-only";
import type { NextResponse } from "next/server";
import { ACCESS_COOKIE, ACCESS_TTL_SECONDS, REFRESH_COOKIE, REFRESH_TTL_SECONDS } from "./constants";

const secure = process.env.NODE_ENV === "production";

export function setAuthCookies(res: NextResponse, tokens: { accessToken: string; refreshToken: string }) {
  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: ACCESS_TTL_SECONDS,
  });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: REFRESH_TTL_SECONDS,
  });
  return res;
}

export function clearAuthCookies(res: NextResponse) {
  res.cookies.set(ACCESS_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(REFRESH_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
