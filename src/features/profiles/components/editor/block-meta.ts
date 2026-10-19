import {
  AlignLeft,
  BadgePercent,
  Download,
  Folder,
  Heading,
  Image as ImageIcon,
  Link2,
  Mail,
  Minus,
  PlaySquare,
  ShoppingBag,
  Share2,
  ClipboardList,
  type LucideIcon,
} from "lucide-react";
import type { BlockType } from "@/generated/prisma/enums";
import { BLOCK_TYPE_META } from "@/schemas/block";

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  LINK: Link2,
  AFFILIATE: BadgePercent,
  HEADER: Heading,
  TEXT: AlignLeft,
  IMAGE: ImageIcon,
  EMBED: PlaySquare,
  EMAIL_SIGNUP: Mail,
  FORM: ClipboardList,
  FILE: Download,
  FOLDER: Folder,
  PRODUCT: ShoppingBag,
  SOCIALS: Share2,
  DIVIDER: Minus,
};

export const BLOCK_GROUPS: { title: string; types: BlockType[] }[] = [
  { title: "Links", types: ["LINK", "AFFILIATE", "FOLDER", "FILE"] },
  { title: "Content", types: ["HEADER", "TEXT", "IMAGE", "EMBED", "DIVIDER", "SOCIALS"] },
  { title: "Grow & sell", types: ["PRODUCT", "EMAIL_SIGNUP", "FORM"] },
];

export { BLOCK_TYPE_META };
