import "server-only";
import { db } from "../db";
import { notFound } from "../http/errors";
import { slugify } from "@/lib/utils";
import { assertFeature } from "./plan.service";
import { getOwnedProfile, invalidateProfile } from "./profile.service";
import { toTabDTO } from "./mappers";
import type { AuthContext } from "../auth/context";

export async function listTabs(auth: AuthContext, profileId: string) {
  await getOwnedProfile(auth, profileId);
  const tabs = await db.tab.findMany({ where: { profileId }, orderBy: { order: "asc" } });
  return tabs.map(toTabDTO);
}

async function uniqueSlug(profileId: string, title: string, exceptId?: string) {
  const base = slugify(title, 30) || "tab";
  let slug = base;
  for (let i = 2; ; i++) {
    const hit = await db.tab.findFirst({ where: { profileId, slug, ...(exceptId ? { NOT: { id: exceptId } } : {}) } });
    if (!hit) return slug;
    slug = `${base}-${i}`;
  }
}

export async function createTab(auth: AuthContext, profileId: string, title: string) {
  const profile = await getOwnedProfile(auth, profileId);
  await assertFeature(profile.userId, "tabs");
  const count = await db.tab.count({ where: { profileId } });
  const tab = await db.tab.create({ data: { profileId, title, slug: await uniqueSlug(profileId, title), order: count } });
  await invalidateProfile(profileId);
  return toTabDTO(tab);
}

async function getOwnedTab(auth: AuthContext, tabId: string) {
  const tab = await db.tab.findUnique({ where: { id: tabId } });
  if (!tab) throw notFound("Tab");
  await getOwnedProfile(auth, tab.profileId);
  return tab;
}

export async function updateTab(auth: AuthContext, tabId: string, title: string) {
  const tab = await getOwnedTab(auth, tabId);
  const updated = await db.tab.update({ where: { id: tabId }, data: { title, slug: await uniqueSlug(tab.profileId, title, tabId) } });
  await invalidateProfile(tab.profileId);
  return toTabDTO(updated);
}

export async function deleteTab(auth: AuthContext, tabId: string) {
  const tab = await getOwnedTab(auth, tabId);
  await db.tab.delete({ where: { id: tabId } });
  await invalidateProfile(tab.profileId);
  return { id: tabId };
}
