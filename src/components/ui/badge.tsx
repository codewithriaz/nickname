import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const tones = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-green-700",
  warning: "bg-warning-soft text-amber-700",
  danger: "bg-destructive-soft text-red-700",
  dark: "bg-foreground text-white",
} as const;
export type BadgeTone = keyof typeof tones;

export function Badge({ tone = "default", children, className }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", tones[tone], className)}>{children}</span>;
}
