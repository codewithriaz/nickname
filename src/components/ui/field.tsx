import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Label({ htmlFor, children, className }: { htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <label htmlFor={htmlFor} className={cn("text-sm font-medium text-foreground", className)}>
      {children}
    </label>
  );
}

/** Label + control + hint/error, consistent spacing everywhere. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  action,
}: {
  label?: ReactNode;
  htmlFor?: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {(label || action) && (
        <div className="flex items-center justify-between gap-2">
          {label && <Label htmlFor={htmlFor}>{label}</Label>}
          {action}
        </div>
      )}
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
