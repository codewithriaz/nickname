import { z } from "zod";
import { BlockAnimation, BlockLayout, BlockType } from "@/generated/prisma/enums";
import { httpUrl, optionalUrl } from "./common";

export const thumbnailSchema = z
  .object({
    kind: z.enum(["image", "emoji", "icon"]),
    value: z.string().trim().min(1).max(2048),
  })
  .nullable();
export type BlockThumbnail = z.infer<typeof thumbnailSchema>;

export const FORM_FIELD_TYPES = ["text", "email", "phone", "textarea", "select"] as const;
export const formFieldSchema = z.object({
  id: z.string().min(1).max(40),
  label: z.string().trim().min(1).max(80),
  type: z.enum(FORM_FIELD_TYPES),
  required: z.boolean().default(false),
  options: z.array(z.string().trim().max(80)).max(30).optional(),
});
export type FormField = z.infer<typeof formFieldSchema>;

/** Type-specific `data` payloads. */
export const blockDataSchemas = {
  LINK: z.object({ description: z.string().max(200).optional(), highlightLabel: z.string().max(30).optional() }),
  AFFILIATE: z.object({
    description: z.string().max(200).optional(),
    disclosure: z.string().max(60).default("Affiliate link"),
    couponCode: z.string().max(40).optional(),
    network: z.string().max(40).optional(),
  }),
  HEADER: z.object({ align: z.enum(["left", "center"]).default("center") }),
  TEXT: z.object({ text: z.string().max(5000).default(""), align: z.enum(["left", "center"]).default("center") }),
  IMAGE: z.object({ imageUrl: z.string().max(2048).default(""), alt: z.string().max(200).default(""), linkUrl: optionalUrl }),
  EMBED: z.object({ aspect: z.enum(["video", "square", "audio"]).optional() }),
  EMAIL_SIGNUP: z.object({
    description: z.string().max(300).default(""),
    buttonLabel: z.string().max(30).default("Subscribe"),
    collectName: z.boolean().default(false),
    collectPhone: z.boolean().default(false),
    successMessage: z.string().max(200).default("Thanks for subscribing!"),
  }),
  FORM: z.object({
    description: z.string().max(300).default(""),
    fields: z.array(formFieldSchema).max(15).default([]),
    buttonLabel: z.string().max(30).default("Submit"),
    successMessage: z.string().max(200).default("Thanks! We'll be in touch."),
  }),
  FILE: z.object({ fileName: z.string().max(200).default(""), description: z.string().max(200).optional() }),
  FOLDER: z.object({ defaultOpen: z.boolean().default(false) }),
  PRODUCT: z.object({ productId: z.string().max(64).default("") }),
  SOCIALS: z.object({ size: z.enum(["sm", "md", "lg"]).default("md") }),
  DIVIDER: z.object({ style: z.enum(["line", "space", "dots"]).default("line") }),
} satisfies Record<BlockType, z.ZodType>;

export type BlockDataMap = { [K in BlockType]: z.infer<(typeof blockDataSchemas)[K]> };

/** Block types that require a URL. */
export const URL_BLOCK_TYPES: BlockType[] = ["LINK", "AFFILIATE", "EMBED", "FILE"];

export const blockBaseSchema = z.object({
  type: z.enum(BlockType),
  title: z.string().trim().max(120).default(""),
  url: z.union([httpUrl, z.string().startsWith("/"), z.literal("")]).optional().nullable(),
  data: z.record(z.string(), z.unknown()).default({}),
  thumbnail: thumbnailSchema.optional(),
  layout: z.enum(BlockLayout).default("CLASSIC"),
  animation: z.enum(BlockAnimation).default("NONE"),
  isActive: z.boolean().default(true),
  startsAt: z.coerce.date().nullable().optional(),
  endsAt: z.coerce.date().nullable().optional(),
  tabId: z.string().nullable().optional(),
  parentId: z.string().nullable().optional(),
});

export const createBlockSchema = blockBaseSchema;
export type CreateBlockInput = z.input<typeof createBlockSchema>;
export const updateBlockSchema = blockBaseSchema.partial().omit({ type: true });
export type UpdateBlockInput = z.input<typeof updateBlockSchema>;

export const reorderBlocksSchema = z.object({
  items: z
    .array(z.object({ id: z.string(), order: z.number().int().min(0), parentId: z.string().nullable().optional() }))
    .max(500),
});

export const tabInputSchema = z.object({
  title: z.string().trim().min(1).max(40),
});

export const BLOCK_TYPE_META: Record<BlockType, { label: string; description: string }> = {
  LINK: { label: "Link", description: "Button linking to any URL" },
  AFFILIATE: { label: "Affiliate link", description: "Link with disclosure + coupon code" },
  HEADER: { label: "Header", description: "Section title" },
  TEXT: { label: "Text", description: "Paragraph / rich text" },
  IMAGE: { label: "Image", description: "Image or banner (optionally linked)" },
  EMBED: { label: "Media embed", description: "YouTube, Spotify, SoundCloud, Vimeo, TikTok" },
  EMAIL_SIGNUP: { label: "Email signup", description: "Collect subscribers" },
  FORM: { label: "Custom form", description: "Lead form with custom fields" },
  FILE: { label: "File download", description: "PDF, eBook, price list…" },
  FOLDER: { label: "Folder", description: "Collapsible group of links" },
  PRODUCT: { label: "Product", description: "Show a product from your shop" },
  SOCIALS: { label: "Social icons", description: "Your social icons row" },
  DIVIDER: { label: "Divider", description: "Line or spacing" },
};
