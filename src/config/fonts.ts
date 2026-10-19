/** Font keys available to profile themes. CSS variables are registered in src/app/fonts.ts. */
export const THEME_FONTS = [
  { key: "inter", label: "Inter", cssVar: "--font-inter" },
  { key: "poppins", label: "Poppins", cssVar: "--font-poppins" },
  { key: "dmsans", label: "DM Sans", cssVar: "--font-dmsans" },
  { key: "outfit", label: "Outfit", cssVar: "--font-outfit" },
  { key: "spacegrotesk", label: "Space Grotesk", cssVar: "--font-spacegrotesk" },
  { key: "playfair", label: "Playfair Display", cssVar: "--font-playfair" },
  { key: "lora", label: "Lora", cssVar: "--font-lora" },
  { key: "hindsiliguri", label: "Hind Siliguri (বাংলা)", cssVar: "--font-hindsiliguri" },
] as const;

export type ThemeFontKey = (typeof THEME_FONTS)[number]["key"];
export const THEME_FONT_KEYS = THEME_FONTS.map((f) => f.key) as [ThemeFontKey, ...ThemeFontKey[]];
export const fontVar = (key: ThemeFontKey) =>
  `var(${THEME_FONTS.find((f) => f.key === key)?.cssVar ?? "--font-inter"})`;
