"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DropdownItem = { label: ReactNode; onClick: () => void; icon?: ReactNode; destructive?: boolean; disabled?: boolean };

export function Dropdown({ trigger, items, align = "right", className }: { trigger: ReactNode; items: (DropdownItem | null | false)[]; align?: "left" | "right"; className?: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className={cn("relative inline-block", className)}>
      <div onClick={() => setOpen((o) => !o)}>{trigger}</div>
      {open && (
        <div className={cn("absolute z-40 mt-1 min-w-44 rounded-xl border border-border bg-white p-1 shadow-xl", align === "right" ? "right-0" : "left-0")}>
          {items.filter(Boolean).map((item, i) => {
            const it = item as DropdownItem;
            return (
              <button
                key={i}
                type="button"
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-muted disabled:opacity-50",
                  it.destructive && "text-destructive",
                )}
              >
                {it.icon}
                {it.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
