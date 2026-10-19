import "server-only";
import { db } from "../db";
import { randomToken, sha256 } from "../crypto";
import { unauthorized } from "../http/errors";
import { signAccessToken } from "./jwt";
import { REFRESH_REUSE_GRACE_MS, REFRESH_TTL_SECONDS } from "./constants";

type SessionMeta = { userAgent?: string | null; ip?: string | null; impersonatorId?: string | null };
export type IssuedTokens = { accessToken: string; refreshToken: string };

export async function createSession(userId: string, meta: SessionMeta = {}): Promise<IssuedTokens> {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId }, select: { id: true, role: true } });
  const refreshToken = randomToken(48);
  const session = await db.session.create({
    data: {
      userId,
      tokenHash: sha256(refreshToken),
      userAgent: meta.userAgent?.slice(0, 300),
      ip: meta.ip,
      impersonatorId: meta.impersonatorId ?? null,
      expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
    },
  });
  const accessToken = await signAccessToken({
    sub: user.id,
    role: user.role,
    sid: session.id,
    imp: meta.impersonatorId ?? undefined,
  });
  return { accessToken, refreshToken };
}

/**
 * Rotate a refresh token. Returns new tokens, or `null` when the token was rotated moments ago
 * by a parallel request (the browser already received the new cookies).
 * Reuse of an old token outside the grace window revokes every session of that user.
 */
export async function rotateSession(refreshToken: string | undefined, meta: SessionMeta = {}): Promise<IssuedTokens | null> {
  if (!refreshToken) throw unauthorized("Session expired");
  const session = await db.session.findUnique({
    where: { tokenHash: sha256(refreshToken) },
    include: { user: { select: { id: true, status: true } } },
  });
  if (!session) throw unauthorized("Session expired");

  if (session.revokedAt) {
    if (Date.now() - session.revokedAt.getTime() < REFRESH_REUSE_GRACE_MS) return null;
    await db.session.updateMany({ where: { userId: session.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    throw unauthorized("Session revoked");
  }
  if (session.expiresAt < new Date()) throw unauthorized("Session expired");
  if (session.user.status !== "ACTIVE") throw unauthorized("Account suspended");

  await db.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
  return createSession(session.userId, { ...meta, impersonatorId: session.impersonatorId });
}

export async function revokeSessionByToken(refreshToken: string | undefined) {
  if (!refreshToken) return;
  await db.session.updateMany({ where: { tokenHash: sha256(refreshToken), revokedAt: null }, data: { revokedAt: new Date() } });
}

export async function revokeAllSessions(userId: string, exceptSessionId?: string) {
  await db.session.updateMany({
    where: { userId, revokedAt: null, ...(exceptSessionId ? { NOT: { id: exceptSessionId } } : {}) },
    data: { revokedAt: new Date() },
  });
}
