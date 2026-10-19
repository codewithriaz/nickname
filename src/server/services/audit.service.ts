import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "../db";

export async function audit(
  actorId: string | null,
  action: string,
  entity: string,
  entityId?: string | null,
  meta?: Prisma.InputJsonValue,
) {
  try {
    await db.auditLog.create({ data: { actorId, action, entity, entityId: entityId ?? null, meta } });
  } catch (e) {
    console.error("[audit] failed", e);
  }
}
