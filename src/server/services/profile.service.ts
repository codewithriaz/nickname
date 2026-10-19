import "server-only";
import { resolveTxt } from "node:dns/promises";
import { Prisma } from "@/generated/prisma/client";
import { db } from "../db";
import { badRequest, conflict, forbidden, notFound } from "../http/errors";
import { invalidate, tags } from "../cache/tags";
import { randomToken } from "../crypto";
import { assertFeature, assertLimit, getUserPlan } from "./plan.service";
import { toProfileDTO, toProfileSummaryDTO } from "./mappers";
import type { AuthContext } from "../auth/context";
import type { CreateProfileInput, UpdateProfileInput } from "@/schemas/profile";
import { profileSettingsSchema, updateProfileSchema } from "@/schemas/profile";

const withRelations = { template: true, store: { select: { id: true } } } as const;

/** Loads a profile and checks the caller owns it (super admin may access any). */
export async function getOwnedProfile(auth: AuthContext, profileId: string) {
  const profile = await db.profile.findUnique({ where: { id: profileId }, include: withRelations });
  if (!profile) throw notFound("Profile");
  if (profile.userId !== auth.userId && auth.role !== "SUPER_ADMIN") throw forbidden();
  return profile;
}

/** Invalidate every cached public page for a profile. */
export async function invalidateProfile(profileId: string) {
  const p = await db.profile.findUnique({ where: { id: profileId }, select: { username: true, customDomain: true } });
  if (!p) return;
  invalidate(tags.profile(p.username), p.customDomain ? tags.profileDomain(p.customDomain) : null, tags.store(profileId));
}

export async function invalidateUserProfiles(userId: string) {
  const profiles = await db.profile.findMany({ where: { userId }, select: { id: true } });
  await Promise.all(profiles.map((p) => invalidateProfile(p.id)));
}

export async function listProfiles(userId: string) {
  const profiles = await db.profile.findMany({
    where: { userId },
    include: { store: { select: { id: true } } },
    orderBy: { createdAt: "asc" },
  });
  return profiles.map(toProfileSummaryDTO);
}

export async function isUsernameAvailable(username: string, exceptProfileId?: string) {
  const existing = await db.profile.findUnique({ where: { username }, select: { id: true } });
  return !existing || existing.id === exceptProfileId;
}

async function assertTemplateAllowed(userId: string, templateId: string | null | undefined) {
  if (!templateId) return;
  const template = await db.template.findUnique({ where: { id: templateId } });
  if (!template || !template.isActive) throw badRequest("Template not found");
  if (template.isPremium) await assertFeature(userId, "premiumTemplates");
}

export async function createProfile(userId: string, input: CreateProfileInput) {
  const count = await db.profile.count({ where: { userId } });
  await assertLimit(userId, "profiles", count, "profiles");
  if (!(await isUsernameAvailable(input.username))) throw conflict("Username is already taken");
  await assertTemplateAllowed(userId, input.templateId);

  const defaultTemplate = input.templateId
    ? null
    : await db.template.findFirst({ where: { isActive: true, isPremium: false }, orderBy: { sortOrder: "asc" } });

  const profile = await db.profile.create({
    data: {
      userId,
      username: input.username,
      displayName: input.displayName,
      templateId: input.templateId ?? defaultTemplate?.id ?? null,
      settings: profileSettingsSchema.parse({}),
      blocks: {
        create: [
          { type: "SOCIALS", order: 0, data: { size: "md" } },
          { type: "LINK", title: "My website", url: "https://example.com", order: 1 },
        ],
      },
    },
    include: withRelations,
  });
  return toProfileDTO(profile);
}

export async function updateProfile(auth: AuthContext, profileId: string, raw: UpdateProfileInput) {
  const input = updateProfileSchema.parse(raw);
  const profile = await getOwnedProfile(auth, profileId);
  const ownerId = profile.userId;

  if (input.username && input.username !== profile.username) {
    if (!(await isUsernameAvailable(input.username, profileId))) throw conflict("Username is already taken");
  }
  if (input.templateId !== undefined && input.templateId !== profile.templateId) {
    await assertTemplateAllowed(ownerId, input.templateId);
  }

  const { features } = await getUserPlan(ownerId);
  const currentSettings = profileSettingsSchema.parse({ ...(profile.settings as object) });
  let settings = currentSettings;
  if (input.settings) {
    settings = profileSettingsSchema.parse({ ...currentSettings, ...input.settings });
    if (settings.hideBranding && !currentSettings.hideBranding) await assertFeature(ownerId, "removeBranding");
    if ((settings.fbPixelId || settings.gaId) && !features.pixels) await assertFeature(ownerId, "pixels");
  }
  if (input.seo && (input.seo.title || input.seo.description || input.seo.ogImage) && !features.customSeo) {
    await assertFeature(ownerId, "customSeo");
  }
  if (input.redirectBlockId) await assertFeature(ownerId, "scheduling");

  const data: Prisma.ProfileUpdateInput = {
    username: input.username,
    displayName: input.displayName,
    bio: input.bio,
    avatarUrl: input.avatarUrl === "" ? null : input.avatarUrl,
    template: input.templateId === undefined ? undefined : input.templateId ? { connect: { id: input.templateId } } : { disconnect: true },
    theme: input.theme === undefined ? undefined : input.theme === null ? Prisma.DbNull : input.theme,
    socials: input.socials,
    seo: input.seo,
    settings: input.settings ? settings : undefined,
    isPublished: input.isPublished,
    redirectBlockId: input.redirectBlockId,
    redirectStartsAt: input.redirectStartsAt,
    redirectEndsAt: input.redirectEndsAt,
  };

  const updated = await db.profile.update({ where: { id: profileId }, data, include: withRelations });
  invalidate(tags.profile(profile.username), profile.customDomain ? tags.profileDomain(profile.customDomain) : null);
  if (updated.username !== profile.username) invalidate(tags.profile(updated.username));
  return toProfileDTO(updated);
}

export async function deleteProfile(auth: AuthContext, profileId: string) {
  const profile = await getOwnedProfile(auth, profileId);
  await db.profile.delete({ where: { id: profileId } });
  invalidate(tags.profile(profile.username), profile.customDomain ? tags.profileDomain(profile.customDomain) : null);
  return { id: profileId };
}

// ── Custom domains ─────────────────────────────────────────────────────

export async function setCustomDomain(auth: AuthContext, profileId: string, domain: string | null) {
  const profile = await getOwnedProfile(auth, profileId);
  if (domain) {
    await assertFeature(profile.userId, "customDomain");
    const taken = await db.profile.findFirst({ where: { customDomain: domain, NOT: { id: profileId } }, select: { id: true } });
    if (taken) throw conflict("Domain is already connected to another profile");
  }
  const updated = await db.profile.update({
    where: { id: profileId },
    data: {
      customDomain: domain,
      domainVerified: false,
      domainVerifyToken: domain ? `nickname-verify=${randomToken(12)}` : null,
    },
    include: withRelations,
  });
  if (profile.customDomain) invalidate(tags.profileDomain(profile.customDomain));
  return toProfileDTO(updated);
}

/** Verifies a TXT record `_nickname.<domain>` containing the verify token. */
export async function verifyCustomDomain(auth: AuthContext, profileId: string) {
  const profile = await getOwnedProfile(auth, profileId);
  if (!profile.customDomain || !profile.domainVerifyToken) throw badRequest("No domain configured");
  let records: string[][] = [];
  try {
    records = await resolveTxt(`_nickname.${profile.customDomain}`);
  } catch {
    records = [];
  }
  const verified = records.some((r) => r.join("").trim() === profile.domainVerifyToken);
  const updated = await db.profile.update({ where: { id: profileId }, data: { domainVerified: verified }, include: withRelations });
  if (verified) invalidate(tags.profileDomain(profile.customDomain));
  return { verified, profile: toProfileDTO(updated) };
}

export async function requestVerification(auth: AuthContext, profileId: string) {
  const profile = await getOwnedProfile(auth, profileId);
  if (profile.verification === "APPROVED") throw badRequest("Already verified");
  const updated = await db.profile.update({ where: { id: profileId }, data: { verification: "PENDING" }, include: withRelations });
  return toProfileDTO(updated);
}
