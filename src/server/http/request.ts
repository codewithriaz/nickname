import "server-only";
import type { NextRequest } from "next/server";
import type { z } from "zod";
import { badRequest } from "./errors";

export async function parseBody<S extends z.ZodType>(req: NextRequest, schema: S): Promise<z.infer<S>> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw badRequest("Invalid JSON body");
  }
  return schema.parse(json);
}

export function parseQuery<S extends z.ZodType>(req: NextRequest, schema: S): z.infer<S> {
  return schema.parse(Object.fromEntries(req.nextUrl.searchParams.entries()));
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return fwd?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
}

export const userAgent = (req: Request) => req.headers.get("user-agent") ?? "";
