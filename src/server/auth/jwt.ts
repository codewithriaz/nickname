import { SignJWT, jwtVerify, errors } from "jose";
import type { Role } from "@/generated/prisma/enums";
import { ACCESS_TTL_SECONDS, JWT_ISSUER } from "./constants";

export type AccessClaims = { sub: string; role: Role; sid: string; imp?: string };

const secret = () => new TextEncoder().encode(process.env.JWT_ACCESS_SECRET ?? "");

export async function signAccessToken(claims: AccessClaims) {
  return new SignJWT({ role: claims.role, sid: claims.sid, ...(claims.imp ? { imp: claims.imp } : {}) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.sub)
    .setIssuer(JWT_ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret());
}

export type VerifyResult = { ok: true; claims: AccessClaims } | { ok: false; reason: "expired" | "invalid" };

export async function verifyAccessToken(token: string | undefined | null): Promise<VerifyResult> {
  if (!token) return { ok: false, reason: "invalid" };
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: JWT_ISSUER, algorithms: ["HS256"] });
    return {
      ok: true,
      claims: {
        sub: String(payload.sub),
        role: payload.role as Role,
        sid: String(payload.sid),
        imp: payload.imp ? String(payload.imp) : undefined,
      },
    };
  } catch (e) {
    return { ok: false, reason: e instanceof errors.JWTExpired ? "expired" : "invalid" };
  }
}
