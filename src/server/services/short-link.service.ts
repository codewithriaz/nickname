import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { conflict, forbidden, notFound, badRequest } from "../http/errors";
import { shortId } from "../crypto";
import { hashPassword, verifyPassword } from "../auth/password";
import { assertFeature, assertLimit } from "./plan.service";
import { toShortLinkDTO } from "./mappers";
import type { AuthContext } from "../auth/context";
import { shortLinkInputSchema, updateShortLinkSchema, type ShortLinkInput, type UpdateShortLinkInput } from "@/schemas/short-link";
import type { PaginationQuery } from "@/schemas/common";

const RESERVED_CODES = new Set(["api", "admin", "login", "unlock"]);

function withUtm(destination: string, utm?: { source?: string; medium?: string; campaign?: string }) {
  if (!utm || (!utm.source && !utm.medium && !utm.campaign)) return destination;
  try {
    const url = new URL(destination);
    if (utm.source) url.searchParams.set("utm_source", utm.source);
    if (utm.medium) url.searchParams.set("utm_medium", utm.medium);
    if (utm.campaign) url.searchParams.set("utm_campaign", utm.campaign);
    return url.toString();
  } catch {
    return destination;
  }
}

async function uniqueCode() {
  for (let i = 0; i < 6; i++) {
    const code = shortId();
    if (!(await db.shortLink.findUnique({ where: { code }, select: { id: true } }))) return code;
  }
  throw new Error("Could not generate short code");
}

export async function listShortLinks(auth: AuthContext, q: PaginationQuery) {
  const where: Prisma.ShortLinkWhereInput = {
    userId: auth.userId,
    ...(q.search
      ? {
          OR: [
            { code: { contains: q.search, mode: "insensitive" } },
            { title: { contains: q.search, mode: "insensitive" } },
            { destination: { contains: q.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };
  const [items, total] = await Promise.all([
    db.shortLink.findMany({ where, orderBy: { createdAt: q.order }, skip: (q.page - 1) * q.pageSize, take: q.pageSize }),
    db.shortLink.count({ where }),
  ]);
  return { items: items.map(toShortLinkDTO), total };
}

export async function createShortLink(auth: AuthContext, raw: ShortLinkInput) {
  const input = shortLinkInputSchema.parse(raw);
  const count = await db.shortLink.count({ where: { userId: auth.userId } });
  await assertLimit(auth.userId, "shortLinks", count, "short links");
  if (input.qrStyle && (input.qrStyle.logoUrl || input.qrStyle.fg !== "#000000" || input.qrStyle.bg !== "#ffffff")) {
    await assertFeature(auth.userId, "customQr");
  }
  let code = input.code || "";
  if (code) {
    if (RESERVED_CODES.has(code.toLowerCase())) throw badRequest("This code is reserved");
    if (await db.shortLink.findUnique({ where: { code }, select: { id: true } })) throw conflict("This short code is taken");
  } else code = await uniqueCode();
  if (input.profileId) {
    const p = await db.profile.findFirst({ where: { id: input.profileId, userId: auth.userId } });
    if (!p) throw badRequest("Profile not found");
  }
  const link = await db.shortLink.create({
    data: {
      userId: auth.userId,
      profileId: input.profileId ?? null,
      code,
      destination: withUtm(input.destination, input.utm),
      title: input.title,
      passwordHash: input.password ? await hashPassword(input.password) : null,
      expiresAt: input.expiresAt ?? null,
      isActive: input.isActive,
      qrStyle: input.qrStyle ?? undefined,
    },
  });
  return toShortLinkDTO(link);
}

async function getOwnedShortLink(auth: AuthContext, id: string) {
  const link = await db.shortLink.findUnique({ where: { id } });
  if (!link) throw notFound("Short link");
  if (link.userId !== auth.userId && auth.role !== "SUPER_ADMIN") throw forbidden();
  return link;
}

export async function updateShortLink(auth: AuthContext, id: string, raw: UpdateShortLinkInput) {
  const input = updateShortLinkSchema.parse(raw);
  const link = await getOwnedShortLink(auth, id);
  if (input.code && input.code !== link.code) {
    if (RESERVED_CODES.has(input.code.toLowerCase())) throw badRequest("This code is reserved");
    if (await db.shortLink.findUnique({ where: { code: input.code }, select: { id: true } })) throw conflict("This short code is taken");
  }
  if (input.qrStyle && (input.qrStyle.logoUrl || input.qrStyle.fg !== "#000000" || input.qrStyle.bg !== "#ffffff")) {
    await assertFeature(link.userId, "customQr");
  }
  const updated = await db.shortLink.update({
    where: { id },
    data: {
      code: input.code || undefined,
      destination: input.destination ? withUtm(input.destination, input.utm) : undefined,
      title: input.title,
      passwordHash: input.removePassword ? null : input.password ? await hashPassword(input.password) : undefined,
      expiresAt: input.expiresAt,
      isActive: input.isActive,
      qrStyle: input.qrStyle === null ? Prisma.DbNull : (input.qrStyle ?? undefined),
    },
  });
  return toShortLinkDTO(updated);
}

export async function deleteShortLink(auth: AuthContext, id: string) {
  await getOwnedShortLink(auth, id);
  await db.shortLink.delete({ where: { id } });
  return { id };
}

export type ResolvedShortLink =
  | { status: "ok"; id: string; destination: string }
  | { status: "password"; id: string }
  | { status: "missing" | "expired" | "disabled" };

export async function resolveShortLink(code: string): Promise<ResolvedShortLink> {
  const link = await db.shortLink.findUnique({
    where: { code },
    include: { user: { select: { status: true } } },
  });
  if (!link) return { status: "missing" };
  if (!link.isActive || link.user.status !== "ACTIVE") return { status: "disabled" };
  if (link.expiresAt && link.expiresAt < new Date()) return { status: "expired" };
  if (link.passwordHash) return { status: "password", id: link.id };
  return { status: "ok", id: link.id, destination: link.destination };
}

export async function unlockShortLink(code: string, password: string) {
  const link = await db.shortLink.findUnique({ where: { code } });
  if (!link || !link.isActive || !link.passwordHash) throw notFound("Short link");
  if (link.expiresAt && link.expiresAt < new Date()) throw badRequest("This link has expired");
  if (!(await verifyPassword(password, link.passwordHash))) throw badRequest("Wrong password");
  return { id: link.id, destination: link.destination };
}
