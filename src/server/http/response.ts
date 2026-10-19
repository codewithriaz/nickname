import { NextResponse } from "next/server";
import type { ApiFailure, ApiSuccess, PageMeta } from "@/lib/api/types";
import type { AppError } from "./errors";

export function ok<T>(data: T, init?: ResponseInit & { meta?: PageMeta }) {
  const body: ApiSuccess<T> = { success: true, data, ...(init?.meta ? { meta: init.meta } : {}) };
  return NextResponse.json(body, { status: init?.status ?? 200, headers: init?.headers });
}

export const created = <T>(data: T) => ok(data, { status: 201 });

export function fail(err: AppError) {
  const body: ApiFailure = { success: false, error: { code: err.code, message: err.message, details: err.details } };
  return NextResponse.json(body, { status: err.status });
}

export function pageMeta(page: number, pageSize: number, total: number): PageMeta {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
