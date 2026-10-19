import { z } from "zod";
import { RESERVED_USERNAMES, USERNAME_REGEX } from "@/config/reserved-usernames";
import { SOCIAL_PLATFORM_KEYS } from "@/config/social-platforms";
import { themeOverrideSchema } from "./theme";
import { httpUrl, optionalAssetUrl } from "./common";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(USERNAME_REGEX, "3-30 chars: letters, numbers, dot, dash, underscore")
  .refine((v) => !RESERVED_USERNAMES.has(v), "This username is reserved");

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORM_KEYS),
  url: httpUrl,
});
export type SocialLink = z.infer<typeof socialLinkSchema>;

export const profileSeoSchema = z.object({
  title: z.string().trim().max(70).optional(),
  description: z.string().trim().max(200).optional(),
  ogImage: z.string().max(2048).optional().nullable(),
});
export type ProfileSeo = z.infer<typeof profileSeoSchema>;

export const profileSettingsSchema = z.object({
  showSearch: z.boolean().default(false),
  showShare: z.boolean().default(true),
  hideBranding: z.boolean().default(false),
  sensitive: z.boolean().default(false),
  sensitiveMessage: z.string().max(200).optional(),
  socialsPosition: z.enum(["top", "bottom"]).default("top"),
  fbPixelId: z.string().regex(/^\d{5,20}$/).optional().or(z.literal("")),
  gaId: z.string().regex(/^(G|UA|GT)-[A-Z0-9-]+$/i).optional().or(z.literal("")),
  pinterestVerify: z.string().max(100).optional(),
  footerLogoUrl: z.string().max(2048).optional().nullable(),
  footerText: z.string().max(120).optional(),
});
export type ProfileSettings = z.infer<typeof profileSettingsSchema>;

export const createProfileSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(60),
  templateId: z.string().optional().nullable(),
});
export type CreateProfileInput = z.infer<typeof createProfileSchema>;

export const updateProfileSchema = z.object({
  username: usernameSchema.optional(),
  displayName: z.string().trim().min(1).max(60).optional(),
  bio: z.string().trim().max(300).optional(),
  avatarUrl: optionalAssetUrl,
  templateId: z.string().nullable().optional(),
  theme: themeOverrideSchema.nullable().optional(),
  socials: z.array(socialLinkSchema).max(25).optional(),
  seo: profileSeoSchema.optional(),
  settings: profileSettingsSchema.partial().optional(),
  isPublished: z.boolean().optional(),
  redirectBlockId: z.string().nullable().optional(),
  redirectStartsAt: z.coerce.date().nullable().optional(),
  redirectEndsAt: z.coerce.date().nullable().optional(),
});
export type UpdateProfileInput = z.input<typeof updateProfileSchema>;

export const customDomainSchema = z.object({
  domain: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/, "Enter a domain like links.yourbrand.com")
    .nullable(),
});

export const subscribeSchema = z.object({
  profileId: z.string(),
  blockId: z.string().optional(),
  email: z.email().optional().or(z.literal("")),
  name: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(20).optional(),
  data: z.record(z.string(), z.string().max(2000)).optional(),
});
export type SubscribeInput = z.infer<typeof subscribeSchema>;
