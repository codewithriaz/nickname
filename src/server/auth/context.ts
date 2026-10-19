import "server-only";
import type { NextRequest } from "next/server";
import type { Role } from "@/generated/prisma/enums";
import { forbidden, tokenExpired, unauthorized } from "../http/errors";
import { ACCESS_COOKIE } from "./constants";
import { verifyAccessToken } from "./jwt";

export type AuthContext = { userId: string; role: Role; sessionId: string; impersonatorId?: string };

function readToken(req: NextRequest) {
  const header = req.headers.get("authorization");
  if (header?.startsWith("Bearer ") && !header.startsWith("Bearer nk_")) return header.slice(7);
  return req.cookies.get(ACCESS_COOKIE)?.value;
}

export async function getAuth(req: NextRequest): Promise<AuthContext | null> {
  const result = await verifyAccessToken(readToken(req));
  if (!result.ok) return null;
  const { sub, role, sid, imp } = result.claims;
  return { userId: sub, role, sessionId: sid, impersonatorId: imp };
}

export async function requireAuth(req: NextRequest): Promise<AuthContext> {
  const token = readToken(req);
  if (!token) throw unauthorized();
  const result = await verifyAccessToken(token);
  if (!result.ok) throw result.reason === "expired" ? tokenExpired() : unauthorized();
  const { sub, role, sid, imp } = result.claims;
  return { userId: sub, role, sessionId: sid, impersonatorId: imp };
}

export async function requireAdmin(req: NextRequest): Promise<AuthContext> {
  const auth = await requireAuth(req);
  if (auth.role !== "SUPER_ADMIN") throw forbidden("Super admin only");
  return auth;
}
