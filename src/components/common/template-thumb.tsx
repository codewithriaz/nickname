import type { ProfileTheme } from "@/schemas/theme";
import { avatarRadius, buttonStyle, pageStyle } from "@/components/profile-renderer/theme-style";
import { cn } from "@/lib/utils";

/** Miniature rendering of a theme (template gallery, marketing page, admin). */
export function TemplateThumb({ theme, className, label }: { theme: ProfileTheme; className?: string; label?: string }) {
  return (
    <div className={cn("flex aspect-[9/14] w-full flex-col items-center gap-2 overflow-hidden px-4 pt-6", className)} style={pageStyle(theme)}>
      <div className="size-10 shadow" style={{ borderRadius: avatarRadius(theme.avatarShape), background: theme.button.color }} />
      <div className="h-2 w-16 rounded-full" style={{ background: theme.textColor, opacity: 0.8 }} />
      {label && <p className="text-[10px] font-semibold">{label}</p>}
      <div className="mt-1 flex w-full flex-col gap-1.5">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-6 w-full" style={buttonStyle(theme)} />
        ))}
      </div>
    </div>
  );
}
