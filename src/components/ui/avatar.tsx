import { cn, initials } from "@/lib/utils";

export function Avatar({ src, name, className }: { src?: string | null; name: string; className?: string }) {
  return src ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={name} className={cn("size-9 rounded-full object-cover bg-muted", className)} />
  ) : (
    <span className={cn("inline-flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-pink-500 text-xs font-semibold text-white", className)}>
      {initials(name) || "?"}
    </span>
  );
}
