import type { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, hint, className }: { label: string; value: React.ReactNode; icon?: LucideIcon; hint?: React.ReactNode; className?: string }) {
  return (
    <Card className={cn("p-4", className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {Icon && <Icon className="size-4 text-muted-foreground" />}
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tabular-nums">{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}
