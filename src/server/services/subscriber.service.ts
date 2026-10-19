import "server-only";
import { db } from "../db";
import { badRequest, notFound } from "../http/errors";
import { assertFeature } from "./plan.service";
import { getOwnedProfile } from "./profile.service";
import type { AuthContext } from "../auth/context";
import type { SubscribeInput } from "@/schemas/profile";
import type { PaginationQuery } from "@/schemas/common";
import type { SubscriberDTO } from "@/types/dto";
import type { Subscriber } from "@/generated/prisma/client";

const toDTO = (s: Subscriber): SubscriberDTO => ({
  id: s.id,
  email: s.email,
  name: s.name,
  phone: s.phone,
  data: (s.data as Record<string, string>) ?? null,
  blockId: s.blockId,
  createdAt: s.createdAt.toISOString(),
});

/** Public: email-signup / custom-form submission. */
export async function subscribe(input: SubscribeInput) {
  const profile = await db.profile.findUnique({ where: { id: input.profileId }, select: { id: true, isPublished: true } });
  if (!profile || !profile.isPublished) throw notFound("Profile");
  let block = null;
  if (input.blockId) {
    block = await db.block.findFirst({ where: { id: input.blockId, profileId: profile.id } });
    if (!block || !["EMAIL_SIGNUP", "FORM"].includes(block.type)) throw badRequest("Form not found");
  }
  if (!input.email && !input.phone && !input.data) throw badRequest("Nothing to submit");
  if (block?.type === "EMAIL_SIGNUP" && !input.email) throw badRequest("Email is required");

  if (input.email && block?.type === "EMAIL_SIGNUP") {
    const dup = await db.subscriber.findFirst({ where: { profileId: profile.id, email: input.email, blockId: block.id } });
    if (dup) return { ok: true };
  }
  await db.subscriber.create({
    data: {
      profileId: profile.id,
      blockId: block?.id ?? null,
      email: input.email || null,
      name: input.name || null,
      phone: input.phone || null,
      data: input.data ?? undefined,
    },
  });
  return { ok: true };
}

export async function listSubscribers(auth: AuthContext, profileId: string, q: PaginationQuery) {
  await getOwnedProfile(auth, profileId);
  const where = {
    profileId,
    ...(q.search
      ? {
          OR: [
            { email: { contains: q.search, mode: "insensitive" as const } },
            { name: { contains: q.search, mode: "insensitive" as const } },
            { phone: { contains: q.search } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.subscriber.findMany({ where, orderBy: { createdAt: q.order }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    db.subscriber.count({ where }),
  ]);
  return { items: items.map(toDTO), total };
}

export async function exportSubscribersCsv(auth: AuthContext, profileId: string) {
  const profile = await getOwnedProfile(auth, profileId);
  await assertFeature(profile.userId, "leadExport");
  const rows = await db.subscriber.findMany({ where: { profileId }, orderBy: { createdAt: "desc" }, take: 50_000 });
  const extraKeys = [...new Set(rows.flatMap((r) => Object.keys((r.data as object) ?? {})))];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const header = ["email", "name", "phone", ...extraKeys, "created_at"].map(esc).join(",");
  const lines = rows.map((r) => {
    const data = (r.data as Record<string, string>) ?? {};
    return [r.email, r.name, r.phone, ...extraKeys.map((k) => data[k]), r.createdAt.toISOString()].map(esc).join(",");
  });
  return [header, ...lines].join("\n");
}

export async function deleteSubscriber(auth: AuthContext, id: string) {
  const sub = await db.subscriber.findUnique({ where: { id } });
  if (!sub) throw notFound("Subscriber");
  await getOwnedProfile(auth, sub.profileId);
  await db.subscriber.delete({ where: { id } });
  return { id };
}
