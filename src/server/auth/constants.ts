/** Shared by proxy.ts (edge-safe) and server auth code. */
export const ACCESS_COOKIE = "nk_at";
export const REFRESH_COOKIE = "nk_rt";
export const ACCESS_TTL_SECONDS = 15 * 60;
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;
/** Window in which a just-rotated refresh token is tolerated (parallel tabs). */
export const REFRESH_REUSE_GRACE_MS = 30_000;
export const JWT_ISSUER = "nickname";
