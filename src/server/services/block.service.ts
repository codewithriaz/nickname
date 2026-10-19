import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { badRequest, notFound } from "../http/errors";
import { assertFeature, assertLimit } from "./plan.service";
import { getOwnedProfile, invalidateProfile } from "./profile.service";
import { toBlockDTO } from "./mappers";
import type { AuthContext } from "../auth/context";
import {
  blockDataSchemas,
  createBlockSchema,
  updateBlockSchema,
  URL_BLOCK_TYPES,
  type CreateBlockInput,
  type UpdateBlockInput,
} from "@/schemas/block";
import type { BlockType } from "@/generated/prisma/enums";

export async function listBlocks(auth: AuthContext, profileId: string) {
  await getOwnedProfile(auth, profileId);
  const blocks = await db.block.findMany({ where: { profileId }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  return blocks.map(toBlockDTO);
}

async function getOwnedBlock(auth: AuthContext, blockId: string) {
  const block = await db.block.findUnique({ where: { id: blockId } });
  if (!block) throw notFound("Block");
  const profile = await getOwnedProfile(auth, block.profileId);
  return { block, profile };
}

function parseData(type: BlockType, data: unknown) {
  return blockDataSchemas[type].parse(data ?? {}) as Prisma.InputJsonValue;
}

async function validateRelations(profileId: string, ownerId: string, tabId?: string | null, parentId?: string | null) {
  if (tabId) {
    await assertFeature(ownerId, "tabs");
    const tab = await db.tab.findFirst({ where: { id: tabId, profileId } });
    if (!tab) throw badRequest("Tab not found");
  }
  if (parentId) {
    const parent = await db.block.findFirst({ where: { id: parentId, profileId, type: "FOLDER" } });
    if (!parent) throw badRequest("Folder not found");
  }
}

export async function createBlock(auth: AuthContext, profileId: string, raw: CreateBlockInput) {
  const input = createBlockSchema.parse(raw);
  const profile = await getOwnedProfile(auth, profileId);
  const count = await db.block.count({ where: { profileId } });
  await assertLimit(profile.userId, "blocksPerProfile", count, "blocks per profile");

  if (URL_BLOCK_TYPES.includes(input.type) && !input.url && input.type !== "FILE") {
    // URL can be filled later in the editor; allow empty for drafts but keep block inactive.
    input.isActive = false;
  }
  if (input.type === "FOLDER" && input.parentId) throw badRequest("Folders can't be nested");
  if (input.startsAt || input.endsAt) await assertFeature(profile.userId, "scheduling");
  await validateRelations(profileId, profile.userId, input.tabId, input.parentId);

  const max = await db.block.aggregate({ where: { profileId, parentId: input.parentId ?? null }, _max: { order: true } });
  const block = await db.block.create({
    data: {
      profileId,
      type: input.type,
      title: input.title,
      url: input.url || null,
      data: parseData(input.type, input.data),
      thumbnail: input.thumbnail ?? undefined,
      layout: input.layout,
      animation: input.animation,
      isActive: input.isActive,
      startsAt: input.startsAt ?? null,
      endsAt: input.endsAt ?? null,
      tabId: input.tabId ?? null,
      parentId: input.parentId ?? null,
      order: (max._max.order ?? -1) + 1,
    },
  });
  await invalidateProfile(profileId);
  return toBlockDTO(block);
}

export async function updateBlock(auth: AuthContext, blockId: string, raw: UpdateBlockInput) {
  const input = updateBlockSchema.parse(raw);
  const { block, profile } = await getOwnedBlock(auth, blockId);
  if ((input.startsAt || input.endsAt) && !(block.startsAt || block.endsAt)) await assertFeature(profile.userId, "scheduling");
  if (input.tabId !== undefined || input.parentId !== undefined) {
    await validateRelations(block.profileId, profile.userId, input.tabId, input.parentId);
    if (block.type === "FOLDER" && input.parentId) throw badRequest("Folders can't be nested");
  }
  const updated = await db.block.update({
    where: { id: blockId },
    data: {
      title: input.title,
      url: input.url === undefined ? undefined : input.url || null,
      data: input.data === undefined ? undefined : parseData(block.type, { ...(block.data as object), ...input.data }),
      thumbnail: input.thumbnail === undefined ? undefined : input.thumbnail === null ? Prisma.DbNull : input.thumbnail,
      layout: input.layout,
      animation: input.animation,
      isActive: input.isActive,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      tabId: input.tabId,
      parentId: input.parentId,
    },
  });
  await invalidateProfile(block.profileId);
  return toBlockDTO(updated);
}

export async function deleteBlock(auth: AuthContext, blockId: string) {
  const { block } = await getOwnedBlock(auth, blockId);
  await db.block.delete({ where: { id: blockId } });
  await invalidateProfile(block.profileId);
  return { id: blockId };
}

export async function duplicateBlock(auth: AuthContext, blockId: string) {
  const { block, profile } = await getOwnedBlock(auth, blockId);
  const count = await db.block.count({ where: { profileId: block.profileId } });
  await assertLimit(profile.userId, "blocksPerProfile", count, "blocks per profile");
  const copy = await db.block.create({
    data: {
      profileId: block.profileId,
      tabId: block.tabId,
      parentId: block.parentId,
      type: block.type,
      title: block.title ? `${block.title} (copy)` : "",
      url: block.url,
      data: block.data as Prisma.InputJsonValue,
      thumbnail: (block.thumbnail as Prisma.InputJsonValue) ?? undefined,
      layout: block.layout,
      animation: block.animation,
      isActive: false,
      order: block.order + 1,
    },
  });
  await invalidateProfile(block.profileId);
  return toBlockDTO(copy);
}

export async function reorderBlocks(
  auth: AuthContext,
  profileId: string,
  items: { id: string; order: number; parentId?: string | null }[],
) {
  await getOwnedProfile(auth, profileId);
  const owned = await db.block.findMany({ where: { profileId, id: { in: items.map((i) => i.id) } }, select: { id: true, type: true } });
  const ownedIds = new Map(owned.map((b) => [b.id, b.type]));
  await db.$transaction(
    items
      .filter((i) => ownedIds.has(i.id))
      .map((i) =>
        db.block.update({
          where: { id: i.id },
          data: { order: i.order, ...(i.parentId !== undefined && ownedIds.get(i.id) !== "FOLDER" ? { parentId: i.parentId } : {}) },
        }),
      ),
  );
  await invalidateProfile(profileId);
  return { ok: true };
}
