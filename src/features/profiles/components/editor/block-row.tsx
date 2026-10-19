"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, Copy, GripVertical, MousePointerClick, Pencil, Trash2 } from "lucide-react";
import type { BlockDTO } from "@/types/dto";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, compactNumber } from "@/lib/utils";
import { BLOCK_ICONS, BLOCK_TYPE_META } from "./block-meta";

type Props = {
  block: BlockDTO;
  childBlocks?: BlockDTO[];
  tabTitle?: string;
  onEdit: (b: BlockDTO) => void;
  onToggle: (b: BlockDTO, active: boolean) => void;
  onDuplicate: (b: BlockDTO) => void;
  onDelete: (b: BlockDTO) => void;
};

function RowBody({ block, tabTitle, onEdit, onToggle, onDuplicate, onDelete, handle }: Props & { handle?: React.ReactNode }) {
  const Icon = BLOCK_ICONS[block.type];
  const scheduled = block.startsAt || block.endsAt;
  const subtitle = block.url || (block.type === "TEXT" ? String(block.data.text ?? "").slice(0, 60) : BLOCK_TYPE_META[block.type].description);
  return (
    <div className={cn("flex items-center gap-2 rounded-2xl border border-border bg-white p-2.5 pr-3", !block.isActive && "opacity-60")}>
      {handle}
      <span className="rounded-xl bg-primary-soft p-2 text-primary">
        <Icon className="size-4" />
      </span>
      <button type="button" onClick={() => onEdit(block)} className="min-w-0 flex-1 text-left">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold">{block.title || BLOCK_TYPE_META[block.type].label}</span>
          {tabTitle && <Badge>{tabTitle}</Badge>}
          {scheduled && <CalendarClock className="size-3.5 text-amber-500" />}
          {block.animation !== "NONE" && <Badge tone="primary">{block.animation.toLowerCase()}</Badge>}
        </span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </button>
      {["LINK", "AFFILIATE", "FILE", "PRODUCT"].includes(block.type) && (
        <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex" title="Clicks">
          <MousePointerClick className="size-3.5" /> {compactNumber(block.clicks)}
        </span>
      )}
      <Switch checked={block.isActive} onCheckedChange={(v) => onToggle(block, v)} />
      <Button variant="ghost" size="icon-sm" onClick={() => onEdit(block)} aria-label="Edit">
        <Pencil className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => onDuplicate(block)} aria-label="Duplicate" className="hidden sm:inline-flex">
        <Copy className="size-4" />
      </Button>
      <Button variant="ghost" size="icon-sm" onClick={() => onDelete(block)} aria-label="Delete">
        <Trash2 className="size-4 text-destructive" />
      </Button>
    </div>
  );
}

/** Draggable row (memoised: only re-renders when its own block changes). */
export const SortableBlockRow = memo(function SortableBlockRow(props: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.block.id });
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={cn(isDragging && "relative z-10 shadow-xl")}>
      <RowBody
        {...props}
        handle={
          <button type="button" className="cursor-grab touch-none rounded-lg p-1 text-muted-foreground hover:bg-muted active:cursor-grabbing" {...attributes} {...listeners} aria-label="Drag to reorder">
            <GripVertical className="size-4" />
          </button>
        }
      />
      {props.childBlocks && props.childBlocks.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 border-l-2 border-dashed border-border pl-3">
          {props.childBlocks.map((c) => (
            <RowBody key={c.id} {...props} block={c} childBlocks={undefined} />
          ))}
        </div>
      )}
    </div>
  );
});
