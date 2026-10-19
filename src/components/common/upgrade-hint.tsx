import Link from "next/link";
import { Lock } from "lucide-react";

export function UpgradeHint({ text, className }: { text: string; className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 rounded-2xl bg-muted/70 p-6 text-center ${className ?? ""}`}>
      <Lock className="size-5 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{text}</p>
      <Link href="/dashboard/billing" className="text-sm font-semibold text-primary">
        Upgrade plan →
      </Link>
    </div>
  );
}
