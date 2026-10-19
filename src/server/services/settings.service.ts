import "server-only";
import { db } from "../db";
import { DEFAULT_PLATFORM_SETTINGS, platformSettingsSchema, type PlatformSettings } from "@/schemas/admin";
import { invalidate, tags } from "../cache/tags";

const KEY = "platform";

export async function getPlatformSettings(): Promise<PlatformSettings> {
  const row = await db.platformSetting.findUnique({ where: { key: KEY } });
  const merged = { ...DEFAULT_PLATFORM_SETTINGS, ...((row?.value as object) ?? {}) };
  const parsed = platformSettingsSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_PLATFORM_SETTINGS;
}

export async function updatePlatformSettings(input: PlatformSettings) {
  const value = platformSettingsSchema.parse(input);
  await db.platformSetting.upsert({ where: { key: KEY }, create: { key: KEY, value }, update: { value } });
  invalidate(tags.settings);
  return value;
}
