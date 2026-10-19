import type { TemplateInput } from "@/schemas/theme";

/**
 * Built-in template presets — seeded into the Template table (upsert by slug).
 * To add a template: append here and run `pnpm db:seed`, or create it from /admin/templates.
 */
export const TEMPLATE_PRESETS: TemplateInput[] = [
  {
    slug: "aurora", name: "Aurora", description: "Soft lavender gradient", category: "general", isPremium: false, isActive: true, sortOrder: 0,
    theme: {
      background: { type: "gradient", color: "#f5f3ff", gradientFrom: "#ede9fe", gradientTo: "#fdf2f8", gradientAngle: 160, imageUrl: null, overlay: 0 },
      textColor: "#1e1b4b", font: "inter", button: { style: "fill", radius: "full", color: "#ffffff", textColor: "#1e1b4b" }, avatarShape: "circle",
    },
  },
  {
    slug: "bazaar", name: "Bazaar", description: "Warm, shop-first look with Bangla font", category: "shop", isPremium: false, isActive: true, sortOrder: 1,
    theme: {
      background: { type: "gradient", color: "#fff7ed", gradientFrom: "#fff7ed", gradientTo: "#fef3c7", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#431407", font: "hindsiliguri", button: { style: "hard-shadow", radius: "md", color: "#f97316", textColor: "#ffffff" }, avatarShape: "rounded",
    },
  },
  {
    slug: "midnight", name: "Midnight", description: "Dark and glassy", category: "general", isPremium: false, isActive: true, sortOrder: 2,
    theme: {
      background: { type: "gradient", color: "#0f172a", gradientFrom: "#020617", gradientTo: "#1e293b", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#f8fafc", font: "dmsans", button: { style: "glass", radius: "lg", color: "#ffffff", textColor: "#f8fafc" }, avatarShape: "circle",
    },
  },
  {
    slug: "sunset", name: "Sunset", description: "Bold orange to pink", category: "creator", isPremium: false, isActive: true, sortOrder: 3,
    theme: {
      background: { type: "gradient", color: "#fb923c", gradientFrom: "#f97316", gradientTo: "#db2777", gradientAngle: 150, imageUrl: null, overlay: 0 },
      textColor: "#ffffff", font: "poppins", button: { style: "fill", radius: "full", color: "#ffffff", textColor: "#9d174d" }, avatarShape: "circle",
    },
  },
  {
    slug: "minimal", name: "Minimal", description: "Clean black & white", category: "business", isPremium: false, isActive: true, sortOrder: 4,
    theme: {
      background: { type: "solid", color: "#ffffff", gradientFrom: "#ffffff", gradientTo: "#f4f4f5", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#09090b", font: "inter", button: { style: "outline", radius: "sm", color: "#09090b", textColor: "#09090b" }, avatarShape: "circle",
    },
  },
  {
    slug: "forest", name: "Forest", description: "Calm greens", category: "general", isPremium: false, isActive: true, sortOrder: 5,
    theme: {
      background: { type: "gradient", color: "#ecfdf5", gradientFrom: "#d1fae5", gradientTo: "#ecfccb", gradientAngle: 170, imageUrl: null, overlay: 0 },
      textColor: "#064e3b", font: "outfit", button: { style: "soft", radius: "lg", color: "#059669", textColor: "#064e3b" }, avatarShape: "rounded",
    },
  },
  {
    slug: "ocean", name: "Ocean", description: "Deep blue gradient", category: "general", isPremium: false, isActive: true, sortOrder: 6,
    theme: {
      background: { type: "gradient", color: "#0ea5e9", gradientFrom: "#0284c7", gradientTo: "#312e81", gradientAngle: 160, imageUrl: null, overlay: 0 },
      textColor: "#ffffff", font: "outfit", button: { style: "glass", radius: "full", color: "#ffffff", textColor: "#ffffff" }, avatarShape: "circle",
    },
  },
  {
    slug: "candy", name: "Candy", description: "Playful pink", category: "creator", isPremium: false, isActive: true, sortOrder: 7,
    theme: {
      background: { type: "solid", color: "#fdf2f8", gradientFrom: "#fce7f3", gradientTo: "#fae8ff", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#831843", font: "poppins", button: { style: "shadow", radius: "full", color: "#ec4899", textColor: "#ffffff" }, avatarShape: "circle",
    },
  },
  {
    slug: "noir", name: "Noir", description: "Brutalist black with hard shadows", category: "business", isPremium: true, isActive: true, sortOrder: 8,
    theme: {
      background: { type: "solid", color: "#fafaf9", gradientFrom: "#fafaf9", gradientTo: "#e7e5e4", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#0c0a09", font: "spacegrotesk", button: { style: "hard-shadow", radius: "none", color: "#facc15", textColor: "#0c0a09" }, avatarShape: "square",
    },
  },
  {
    slug: "paper", name: "Paper", description: "Elegant serif on warm paper", category: "business", isPremium: true, isActive: true, sortOrder: 9,
    theme: {
      background: { type: "solid", color: "#f5f0e6", gradientFrom: "#f5f0e6", gradientTo: "#ede4d3", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#3f2d1d", font: "playfair", button: { style: "outline", radius: "md", color: "#3f2d1d", textColor: "#3f2d1d" }, avatarShape: "circle",
    },
  },
  {
    slug: "neon", name: "Neon", description: "Night-club glow", category: "creator", isPremium: true, isActive: true, sortOrder: 10,
    theme: {
      background: { type: "gradient", color: "#13002b", gradientFrom: "#13002b", gradientTo: "#3b0764", gradientAngle: 200, imageUrl: null, overlay: 0 },
      textColor: "#f5d0fe", font: "spacegrotesk", button: { style: "outline", radius: "lg", color: "#e879f9", textColor: "#f5d0fe" }, avatarShape: "circle",
    },
  },
  {
    slug: "luxe", name: "Luxe", description: "Black & gold boutique", category: "shop", isPremium: true, isActive: true, sortOrder: 11,
    theme: {
      background: { type: "gradient", color: "#0a0a0a", gradientFrom: "#0a0a0a", gradientTo: "#262626", gradientAngle: 180, imageUrl: null, overlay: 0 },
      textColor: "#fef3c7", font: "lora", button: { style: "fill", radius: "sm", color: "#d4a017", textColor: "#0a0a0a" }, avatarShape: "circle",
    },
  },
  // ── Photo templates (backgrounds in /public/templates; photos via Unsplash License — see docs/features/templates.md)
  {
    slug: "orchard", name: "Orchard", description: "Olive green with fresh fruit — great for food & juice brands", category: "shop", isPremium: false, isActive: true, sortOrder: 12,
    theme: {
      background: { type: "image", color: "#5c6a50", gradientFrom: "#5c6a50", gradientTo: "#4b5741", gradientAngle: 180, imageUrl: "/templates/orchard-fruits.svg", overlay: 0, imageMode: "bottom" },
      textColor: "#f4f2e8", textShadow: false, font: "dmsans", button: { style: "fill", radius: "full", color: "#d7d9cf", textColor: "#2d3327" }, avatarShape: "circle",
    },
  },
  {
    slug: "lagoon", name: "Lagoon", description: "Turquoise water photo with clean white buttons", category: "creator", isPremium: false, isActive: true, sortOrder: 13,
    theme: {
      background: { type: "image", color: "#2a9d9a", gradientFrom: "#2a9d9a", gradientTo: "#1d6f74", gradientAngle: 180, imageUrl: "/templates/lagoon.jpg", overlay: 0.15, imageMode: "cover" },
      textColor: "#ffffff", textShadow: true, font: "dmsans", button: { style: "fill", radius: "full", color: "#ffffff", textColor: "#111827" }, avatarShape: "circle",
    },
  },
  {
    slug: "canyon", name: "Canyon", description: "Warm canyon photo with torn-paper buttons", category: "creator", isPremium: false, isActive: true, sortOrder: 14,
    theme: {
      background: { type: "image", color: "#6b3a22", gradientFrom: "#6b3a22", gradientTo: "#3b1f12", gradientAngle: 180, imageUrl: "/templates/canyon.jpg", overlay: 0.3, imageMode: "cover" },
      textColor: "#ffffff", textShadow: true, font: "spacegrotesk", button: { style: "torn", radius: "none", color: "#f2a27e", textColor: "#ffffff" }, avatarShape: "circle",
    },
  },
];
