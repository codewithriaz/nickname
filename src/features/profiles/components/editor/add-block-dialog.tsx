"use client";

import { Dialog } from "@/components/ui/dialog";
import type { BlockType } from "@/generated/prisma/enums";
import { BLOCK_GROUPS, BLOCK_ICONS, BLOCK_TYPE_META } from "./block-meta";

export function AddBlockDialog({ open, onClose, onPick, loading }: { open: boolean; onClose: () => void; onPick: (type: BlockType) => void; loading?: boolean }) {
  return (
    <Dialog open={open} onClose={onClose} title="Add a block" description="Choose what to add to your page" size="lg">
      <div className="space-y-5">
        {BLOCK_GROUPS.map((g) => (
          <div key={g.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{g.title}</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {g.types.map((type) => {
                const Icon = BLOCK_ICONS[type];
                return (
                  <button
                    key={type}
                    type="button"
                    disabled={loading}
                    onClick={() => onPick(type)}
                    className="flex items-start gap-3 rounded-2xl border border-border p-3 text-left transition hover:border-primary hover:bg-primary-soft/40 disabled:opacity-50"
                  >
                    <span className="rounded-xl bg-primary-soft p-2 text-primary">
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold">{BLOCK_TYPE_META[type].label}</span>
                      <span className="block text-xs text-muted-foreground">{BLOCK_TYPE_META[type].description}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </Dialog>
  );
}
