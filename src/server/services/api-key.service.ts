import "server-only";
import { db } from "../db";
import { randomToken, sha256 } from "../crypto";
import { notFound, unauthorized } from "../http/errors";
import { assertFeature } from "./plan.service";
import type { ApiKeyDTO } from "@/types/dto";
import type { ApiKey } from "@/generated/prisma/client";

const toDTO = (k: ApiKey): ApiKeyDTO => ({
  id: k.id,
  name: k.name,
  prefix: k.prefix,
  lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
  createdAt: k.createdAt.toISOString(),
  revokedAt: k.revokedAt?.toISOString() ?? null,
});

export async function listApiKeys(userId: string) {
  const keys = await db.apiKey.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
  return keys.map(toDTO);
}

/** Returns the plaintext key ONCE. Format: nk_<random> */
export async function createApiKey(userId: string, name: string) {
  await assertFeature(userId, "apiAccess");
  const secret = `nk_${randomToken(30)}`;
  const key = await db.apiKey.create({ data: { userId, name, prefix: secret.slice(0, 10), keyHash: sha256(secret) } });
  return { key: toDTO(key), secret };
}

export async function revokeApiKey(userId: string, id: string) {
  const key = await db.apiKey.findFirst({ where: { id, userId } });
  if (!key) throw notFound("API key");
  await db.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
  return { id };
}

/** Authenticates `Authorization: Bearer nk_...` for /api/v1. */
export async function authenticateApiKey(req: Request) {
  const header = req.headers.get("authorization") ?? "";
  const secret = header.startsWith("Bearer nk_") ? header.slice(7) : req.headers.get("x-api-key");
  if (!secret) throw unauthorized("Missing API key");
  const key = await db.apiKey.findUnique({ where: { keyHash: sha256(secret) }, include: { user: true } });
  if (!key || key.revokedAt || key.user.status !== "ACTIVE") throw unauthorized("Invalid API key");
  await assertFeature(key.userId, "apiAccess");
  void db.apiKey.update({ where: { id: key.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  return { userId: key.userId, role: key.user.role, sessionId: `apikey:${key.id}` } as const;
}
