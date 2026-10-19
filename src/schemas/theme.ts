import { z } from "zod";
import { THEME_FONT_KEYS } from "@/config/fonts";
import { hexColor } from "./common";

export const BUTTON_STYLES = ["fill", "outline", "soft", "shadow", "hard-shadow", "glass", "torn"] as const;
export const BUTTON_RADII = ["none", "sm", "md", "lg", "full"] as const;
export const AVATAR_SHAPES = ["circle", "rounded", "square"] as const;
export const BACKGROUND_TYPES = ["solid", "gradient", "image"] as const;
/** cover = full-page photo · bottom = solid color with the image anchored at the bottom */
export const IMAGE_MODES = ["cover", "bottom"] as const;

export const themeSchema = z.object({
  background: z.object({
    type: z.enum(BACKGROUND_TYPES),
    color: hexColor,
    gradientFrom: hexColor,
    gradientTo: hexColor,
    gradientAngle: z.number().int().min(0).max(360),
    imageUrl: z
      .string()
      .max(2048)
      .regex(/^(\/|https:\/\/)[^"'()\s\\]*$/, "Invalid image URL")
      .optional()
      .nullable(),
    overlay: z.number().min(0).max(0.9),
    imageMode: z.enum(IMAGE_MODES).optional(),
  }),
  textColor: hexColor,
  /** Soft shadow behind page text — keeps it readable on photos. */
  textShadow: z.boolean().optional(),
  font: z.enum(THEME_FONT_KEYS),
  button: z.object({
    style: z.enum(BUTTON_STYLES),
    radius: z.enum(BUTTON_RADII),
    color: hexColor,
    textColor: hexColor,
  }),
  avatarShape: z.enum(AVATAR_SHAPES),
});
export type ProfileTheme = z.infer<typeof themeSchema>;

/** Overrides stored on Profile.theme (any subset of the theme). */
export const themeOverrideSchema = z.object({
  background: themeSchema.shape.background.partial().optional(),
  textColor: hexColor.optional(),
  textShadow: z.boolean().optional(),
  font: z.enum(THEME_FONT_KEYS).optional(),
  button: themeSchema.shape.button.partial().optional(),
  avatarShape: z.enum(AVATAR_SHAPES).optional(),
});
export type ProfileThemeOverride = z.infer<typeof themeOverrideSchema>;

export const DEFAULT_THEME: ProfileTheme = {
  background: {
    type: "gradient",
    color: "#f5f3ff",
    gradientFrom: "#ede9fe",
    gradientTo: "#fdf2f8",
    gradientAngle: 160,
    imageUrl: null,
    overlay: 0,
  },
  textColor: "#1e1b4b",
  font: "inter",
  button: { style: "fill", radius: "full", color: "#ffffff", textColor: "#1e1b4b" },
  avatarShape: "circle",
};

/** Merge template theme + profile overrides into a complete, valid theme. */
export function resolveTheme(base: unknown, override?: unknown): ProfileTheme {
  const parsedBase = themeSchema.safeParse(base);
  const b = parsedBase.success ? parsedBase.data : DEFAULT_THEME;
  const parsedOverride = themeOverrideSchema.safeParse(override ?? {});
  const o = parsedOverride.success ? parsedOverride.data : {};
  return {
    background: { ...b.background, ...o.background },
    textColor: o.textColor ?? b.textColor,
    textShadow: o.textShadow ?? b.textShadow ?? false,
    font: o.font ?? b.font,
    button: { ...b.button, ...o.button },
    avatarShape: o.avatarShape ?? b.avatarShape,
  };
}

export const templateInputSchema = z.object({
  slug: z.string().trim().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().trim().min(2).max(80),
  description: z.string().trim().max(300).default(""),
  category: z.string().trim().max(40).default("general"),
  theme: themeSchema,
  previewImage: z.string().max(2048).optional().nullable(),
  isPremium: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});
export type TemplateInput = z.infer<typeof templateInputSchema>;
