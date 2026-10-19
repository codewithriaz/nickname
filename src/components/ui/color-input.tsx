"use client";

import { cn } from "@/lib/utils";

export function ColorInput({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label?: string; className?: string }) {
  return (
    <label className={cn("flex items-center gap-2 rounded-xl border border-input bg-white px-2 h-10", className)}>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="size-6 cursor-pointer rounded-md border-0 bg-transparent p-0" aria-label={label} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm font-mono uppercase focus:outline-none"
        maxLength={9}
        aria-label={label}
      />
    </label>
  );
}
