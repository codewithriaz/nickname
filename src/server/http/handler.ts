import "server-only";
import type { NextRequest } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { AppError } from "./errors";
import { fail } from "./response";
import { requireAdmin, requireAuth, type AuthContext } from "../auth/context";

type Params = Record<string, string | string[]>;
type RouteCtx<P extends Params> = { params: Promise<P> };
type Handler<P extends Params, Extra = object> = (
  req: NextRequest,
  ctx: { params: P } & Extra,
) => Promise<Response> | Response;

export function toErrorResponse(error: unknown) {
  if (error instanceof AppError) return fail(error);
  if (error instanceof ZodError) {
    const details: Record<string, string[]> = {};
    for (const issue of error.issues) {
      const key = issue.path.join(".") || "_";
      (details[key] ??= []).push(issue.message);
    }
    const first = error.issues[0];
    return fail(
      new AppError("VALIDATION_ERROR", first ? `${first.path.join(".") || "input"}: ${first.message}` : "Invalid input", 422, details),
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") return fail(new AppError("CONFLICT", "This value is already taken", 409));
    if (error.code === "P2025") return fail(new AppError("NOT_FOUND", "Record not found", 404));
  }
  console.error("[api] unhandled error", error);
  return fail(new AppError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500));
}

/** Public route: error handling + resolved params. */
export function handler<P extends Params = Params>(fn: Handler<P>) {
  return async (req: NextRequest, ctx: RouteCtx<P>) => {
    try {
      return await fn(req, { params: ((await ctx?.params) ?? {}) as P });
    } catch (e) {
      // Let Next.js internals (prerender bail-out, redirect, notFound) propagate.
      unstable_rethrow(e);
      return toErrorResponse(e);
    }
  };
}

/** Authenticated route (any role). */
export function authed<P extends Params = Params>(fn: Handler<P, { auth: AuthContext }>) {
  return handler<P>(async (req, ctx) => fn(req, { ...ctx, auth: await requireAuth(req) }));
}

/** SUPER_ADMIN only. */
export function adminOnly<P extends Params = Params>(fn: Handler<P, { auth: AuthContext }>) {
  return handler<P>(async (req, ctx) => fn(req, { ...ctx, auth: await requireAdmin(req) }));
}

/** Public REST API (/api/v1): `Authorization: Bearer nk_...` API key. */
export function apiKeyAuthed<P extends Params = Params>(fn: Handler<P, { auth: AuthContext }>) {
  return handler<P>(async (req, ctx) => {
    const { authenticateApiKey } = await import("../services/api-key.service");
    const key = await authenticateApiKey(req);
    const { rateLimit } = await import("./rate-limit");
    rateLimit(`apikey:${key.sessionId}`, 120, 60_000);
    return fn(req, { ...ctx, auth: { userId: key.userId, role: "USER", sessionId: key.sessionId } });
  });
}
