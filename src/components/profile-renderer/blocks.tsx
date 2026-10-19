import type { CSSProperties, ReactNode } from "react";
import { ChevronDown, Download, ShoppingBag } from "lucide-react";
import type { BlockDTO } from "@/types/dto";
import type { PublicProfileData } from "@/types/public";
import type { ProfileTheme } from "@/schemas/theme";
import type { BlockDataMap } from "@/schemas/block";
import { blockDataSchemas } from "@/schemas/block";
import { cn, toEmbedUrl } from "@/lib/utils";
import { formatMoney } from "@/lib/money";
import { routes } from "@/config/site";
import { buttonStyle, cardRadius } from "./theme-style";
import { SocialIcon } from "./social-icon";
import { CustomFormBlock, EmailSignupForm } from "./forms";

type Ctx = {
  data: PublicProfileData;
  theme: ProfileTheme;
  btn: CSSProperties;
  radius: string;
  tabSlug: (tabId: string | null) => string;
  preview?: boolean;
};

function parseData<T extends BlockDTO["type"]>(type: T, data: unknown): BlockDataMap[T] {
  const r = blockDataSchemas[type].safeParse(data ?? {});
  return (r.success ? r.data : blockDataSchemas[type].parse({})) as BlockDataMap[T];
}

function Thumb({ block, size = "size-10" }: { block: BlockDTO; size?: string }) {
  const t = block.thumbnail;
  if (!t) return null;
  if (t.kind === "emoji") return <span className={cn("flex shrink-0 items-center justify-center text-2xl", size)}>{t.value}</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={t.value} alt="" className={cn("shrink-0 rounded-lg object-cover", size)} loading="lazy" />;
}

const wrap = (block: BlockDTO, ctx: Ctx, children: ReactNode, extra?: string) => (
  <div
    key={block.id}
    data-nk-tab={ctx.tabSlug(block.tabId)}
    data-nk-search={`${block.title} ${block.url ?? ""}`.toLowerCase()}
    className={cn(block.animation !== "NONE" && `nk-anim-${block.animation}`, extra)}
  >
    {children}
  </div>
);

function LinkButton({ block, ctx }: { block: BlockDTO; ctx: Ctx }) {
  const isAffiliate = block.type === "AFFILIATE";
  const d = isAffiliate ? parseData("AFFILIATE", block.data) : parseData("LINK", block.data);
  const highlight = block.layout === "HIGHLIGHT";
  const imageThumb = block.thumbnail?.kind === "image" ? block.thumbnail.value : null;
  return (
    <a
      href={block.url || "#"}
      data-nk-block={block.id}
      rel={isAffiliate ? "sponsored noopener" : "noopener"}
      className={cn("group relative block w-full text-center font-medium hover:-translate-y-0.5 active:translate-y-0", highlight ? "p-0 overflow-hidden" : "px-4 py-3.5")}
      style={ctx.btn}
    >
      {highlight && imageThumb ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageThumb} alt="" className="aspect-[2/1] w-full object-cover" loading="lazy" />
          <span className="block px-4 py-3 text-base font-semibold">{block.title}</span>
        </>
      ) : (
        <span className={cn("flex items-center gap-3", block.thumbnail ? "justify-between" : "justify-center", highlight && "px-4 py-5 text-lg font-semibold")}>
          <Thumb block={block} />
          <span className="flex-1 leading-snug">
            {block.title || block.url}
            {"description" in d && d.description && <span className="mt-0.5 block text-xs font-normal opacity-75">{d.description}</span>}
          </span>
          {block.thumbnail && <span className="size-10 shrink-0" />}
        </span>
      )}
      {isAffiliate && (
        <span className="mt-1.5 flex flex-wrap items-center justify-center gap-2 pb-1 text-[11px] font-normal opacity-80">
          <span className="rounded-full border border-current px-2 py-0.5">{(d as BlockDataMap["AFFILIATE"]).disclosure}</span>
          {(d as BlockDataMap["AFFILIATE"]).couponCode && (
            <span className="rounded-full bg-black/10 px-2 py-0.5 font-mono font-semibold">Code: {(d as BlockDataMap["AFFILIATE"]).couponCode}</span>
          )}
        </span>
      )}
      {"highlightLabel" in d && d.highlightLabel && (
        <span className="absolute -top-2 right-3 rounded-full bg-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{d.highlightLabel}</span>
      )}
    </a>
  );
}

function Tile({ block, ctx }: { block: BlockDTO; ctx: Ctx }) {
  const img = block.thumbnail?.kind === "image" ? block.thumbnail.value : null;
  return (
    <a href={block.url || "#"} data-nk-block={block.id} className="relative flex aspect-square flex-col justify-end overflow-hidden text-left" style={{ ...ctx.btn, borderRadius: ctx.radius }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {img && <img src={img} alt="" className="absolute inset-0 size-full object-cover" loading="lazy" />}
      {!img && block.thumbnail && (
        <span className="absolute inset-0 flex items-center justify-center text-4xl">
          <Thumb block={block} size="size-14" />
        </span>
      )}
      <span className={cn("relative p-3 text-sm font-semibold leading-tight", img && "bg-gradient-to-t from-black/70 to-transparent text-white")}>{block.title}</span>
    </a>
  );
}

export function SocialsRow({ data, size = "md" }: { data: PublicProfileData; size?: "sm" | "md" | "lg" }) {
  if (!data.profile.socials.length) return null;
  const cls = size === "sm" ? "size-5" : size === "lg" ? "size-8" : "size-6";
  return (
    <div className="flex flex-wrap items-center justify-center gap-4">
      {data.profile.socials.map((s, i) => (
        <a key={`${s.platform}-${i}`} href={s.url} target="_blank" rel="noopener" aria-label={s.platform} className="opacity-90 transition hover:scale-110 hover:opacity-100">
          <SocialIcon platform={s.platform} className={cls} />
        </a>
      ))}
    </div>
  );
}

function renderSingle(block: BlockDTO, ctx: Ctx, children: BlockDTO[]): ReactNode {
  switch (block.type) {
    case "LINK":
    case "AFFILIATE":
      return wrap(block, ctx, <LinkButton block={block} ctx={ctx} />);
    case "HEADER": {
      const d = parseData("HEADER", block.data);
      return wrap(block, ctx, <h2 className={cn("pt-3 text-lg font-semibold", d.align === "left" ? "text-left" : "text-center")}>{block.title}</h2>);
    }
    case "TEXT": {
      const d = parseData("TEXT", block.data);
      return wrap(
        block,
        ctx,
        <div className={cn("whitespace-pre-line text-sm leading-relaxed opacity-90", d.align === "left" ? "text-left" : "text-center")}>
          {block.title && <p className="mb-1 font-semibold">{block.title}</p>}
          {d.text}
        </div>,
      );
    }
    case "IMAGE": {
      const d = parseData("IMAGE", block.data);
      if (!d.imageUrl) return null;
      // eslint-disable-next-line @next/next/no-img-element
      const img = <img src={d.imageUrl} alt={d.alt || block.title} className="w-full object-cover" style={{ borderRadius: ctx.radius }} loading="lazy" />;
      return wrap(
        block,
        ctx,
        d.linkUrl ? (
          <a href={d.linkUrl} data-nk-block={block.id}>
            {img}
          </a>
        ) : (
          img
        ),
      );
    }
    case "EMBED": {
      const embed = block.url ? toEmbedUrl(block.url) : null;
      if (!embed) return null;
      return wrap(
        block,
        ctx,
        <div className="overflow-hidden" style={{ borderRadius: ctx.radius }}>
          {block.title && <p className="mb-2 text-center text-sm font-medium">{block.title}</p>}
          <iframe
            src={embed.src}
            title={block.title || "Embedded media"}
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; fullscreen"
            className={cn("w-full border-0", embed.aspect === "video" ? "aspect-video" : embed.aspect === "audio" ? "h-[152px]" : "aspect-[9/16] max-h-[640px]")}
            style={{ borderRadius: ctx.radius }}
          />
        </div>,
      );
    }
    case "EMAIL_SIGNUP": {
      const d = parseData("EMAIL_SIGNUP", block.data);
      return wrap(block, ctx, <EmailSignupForm profileId={ctx.data.profile.id} blockId={block.id} preview={ctx.preview} buttonStyle={ctx.btn} radius={ctx.radius} title={block.title} {...d} />);
    }
    case "FORM": {
      const d = parseData("FORM", block.data);
      return wrap(block, ctx, <CustomFormBlock profileId={ctx.data.profile.id} blockId={block.id} preview={ctx.preview} buttonStyle={ctx.btn} radius={ctx.radius} title={block.title} {...d} />);
    }
    case "FILE": {
      const d = parseData("FILE", block.data);
      return wrap(
        block,
        ctx,
        <a href={block.url || "#"} data-nk-block={block.id} download={d.fileName || true} className="flex items-center justify-center gap-2 px-4 py-3.5 font-medium" style={ctx.btn}>
          <Download className="size-4" /> {block.title || d.fileName || "Download"}
        </a>,
      );
    }
    case "FOLDER": {
      const d = parseData("FOLDER", block.data);
      return wrap(
        block,
        ctx,
        <details open={d.defaultOpen} className="group" style={{ ...ctx.btn, padding: 0 }}>
          <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3.5 font-medium [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-3">
              <Thumb block={block} size="size-8" />
              {block.title || "Folder"}
            </span>
            <ChevronDown className="size-4 transition group-open:rotate-180" />
          </summary>
          <div className="space-y-2 px-3 pb-3">
            {children.map((c) => (
              <a key={c.id} href={c.url || "#"} data-nk-block={c.id} className="block rounded-xl bg-black/5 px-4 py-3 text-center text-sm font-medium hover:bg-black/10">
                {c.title || c.url}
              </a>
            ))}
            {children.length === 0 && <p className="py-2 text-center text-xs opacity-60">Empty folder</p>}
          </div>
        </details>,
      );
    }
    case "PRODUCT": {
      const d = parseData("PRODUCT", block.data);
      const p = ctx.data.products[d.productId];
      if (!p) return null;
      const href = p.type === "AFFILIATE" && p.affiliateUrl ? p.affiliateUrl : routes.product(ctx.data.profile.username, p.slug);
      return wrap(
        block,
        ctx,
        <a href={href} data-nk-block={block.id} className="flex items-center gap-3 p-2.5 text-left" style={ctx.btn}>
          {p.images[0] ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.images[0]} alt={p.name} className="size-16 shrink-0 rounded-xl object-cover" loading="lazy" />
          ) : (
            <span className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-black/10">
              <ShoppingBag className="size-6" />
            </span>
          )}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{block.title || p.name}</span>
            <span className="text-sm">
              {formatMoney(p.price, ctx.data.store?.currency)}
              {p.comparePrice && p.comparePrice > p.price && <s className="ml-2 opacity-60">{formatMoney(p.comparePrice, ctx.data.store?.currency)}</s>}
            </span>
          </span>
          <span className="rounded-full bg-black px-3 py-1.5 text-xs font-semibold text-white">Buy</span>
        </a>,
      );
    }
    case "SOCIALS": {
      const d = parseData("SOCIALS", block.data);
      return wrap(block, ctx, <SocialsRow data={ctx.data} size={d.size} />);
    }
    case "DIVIDER": {
      const d = parseData("DIVIDER", block.data);
      return wrap(
        block,
        ctx,
        d.style === "space" ? <div className="h-4" /> : d.style === "dots" ? <p className="text-center tracking-[0.5em] opacity-50">•••</p> : <hr className="border-current opacity-20" />,
      );
    }
    default:
      return null;
  }
}

/** Renders top-level blocks, grouping consecutive GRID / CAROUSEL items. */
export function BlockList({ data, preview }: { data: PublicProfileData; preview?: boolean }) {
  const theme = data.theme;
  const tabMap = new Map(data.tabs.map((t) => [t.id, t.slug]));
  const ctx: Ctx = {
    data,
    theme,
    btn: buttonStyle(theme),
    radius: cardRadius(theme),
    tabSlug: (id) => (id && tabMap.get(id)) || "main",
    preview,
  };
  const top = data.blocks.filter((b) => !b.parentId);
  const childrenOf = (id: string) => data.blocks.filter((b) => b.parentId === id);

  const out: ReactNode[] = [];
  for (let i = 0; i < top.length; i++) {
    const b = top[i];
    const groupable = (b.type === "LINK" || b.type === "AFFILIATE") && (b.layout === "GRID" || b.layout === "CAROUSEL");
    if (groupable) {
      const group: BlockDTO[] = [b];
      while (i + 1 < top.length && top[i + 1].layout === b.layout && (top[i + 1].type === "LINK" || top[i + 1].type === "AFFILIATE")) group.push(top[++i]);
      out.push(
        <div key={`g-${b.id}`} className={b.layout === "GRID" ? "grid grid-cols-2 gap-3" : "-mx-4 flex snap-x gap-3 overflow-x-auto px-4 no-scrollbar"}>
          {group.map((g) =>
            wrap(
              g,
              ctx,
              <Tile block={g} ctx={ctx} />,
              b.layout === "CAROUSEL" ? "w-40 shrink-0 snap-start" : undefined,
            ),
          )}
        </div>,
      );
      continue;
    }
    out.push(renderSingle(b, ctx, b.type === "FOLDER" ? childrenOf(b.id) : []));
  }
  return <>{out}</>;
}
