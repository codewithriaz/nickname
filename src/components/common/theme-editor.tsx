"use client";

import type { ProfileTheme } from "@/schemas/theme";
import { AVATAR_SHAPES, BACKGROUND_TYPES, BUTTON_RADII, BUTTON_STYLES } from "@/schemas/theme";
import { Switch } from "@/components/ui/switch";
import { THEME_FONTS, fontVar } from "@/config/fonts";
import { Field } from "@/components/ui/field";
import { ColorInput } from "@/components/ui/color-input";
import { Segmented } from "@/components/ui/segmented";
import { ImageUpload } from "@/components/common/image-upload";
import { cn } from "@/lib/utils";

const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ");

/** Controlled theme editor — parent owns the draft (for live preview + single save). */
export function ThemeEditor({ theme, onChange }: { theme: ProfileTheme; onChange: (t: ProfileTheme) => void }) {
  const bg = theme.background;
  const setBg = (patch: Partial<ProfileTheme["background"]>) => onChange({ ...theme, background: { ...bg, ...patch } });
  const setBtn = (patch: Partial<ProfileTheme["button"]>) => onChange({ ...theme, button: { ...theme.button, ...patch } });

  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Background</h3>
        <Segmented value={bg.type} onChange={(type) => setBg({ type })} options={BACKGROUND_TYPES.map((t) => ({ value: t, label: label(t) }))} />
        {bg.type === "solid" && (
          <Field label="Color">
            <ColorInput value={bg.color} onChange={(color) => setBg({ color })} />
          </Field>
        )}
        {bg.type === "gradient" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <ColorInput value={bg.gradientFrom} onChange={(gradientFrom) => setBg({ gradientFrom, color: gradientFrom })} />
            </Field>
            <Field label="To">
              <ColorInput value={bg.gradientTo} onChange={(gradientTo) => setBg({ gradientTo })} />
            </Field>
            <Field label={`Angle · ${bg.gradientAngle}°`} className="col-span-2">
              <input type="range" min={0} max={360} value={bg.gradientAngle} onChange={(e) => setBg({ gradientAngle: Number(e.target.value) })} className="w-full accent-primary" />
            </Field>
          </div>
        )}
        {bg.type === "image" && (
          <div className="space-y-3">
            <ImageUpload value={bg.imageUrl} onChange={(imageUrl) => setBg({ imageUrl })} aspect="wide" label="Upload background" />
            <Field label="Image position">
              <Segmented
                size="sm"
                value={bg.imageMode ?? "cover"}
                onChange={(imageMode) => setBg({ imageMode })}
                options={[
                  { value: "cover", label: "Full page" },
                  { value: "bottom", label: "Bottom (on color)" },
                ]}
              />
            </Field>
            <Field label={`Dark overlay · ${Math.round(bg.overlay * 100)}%`}>
              <input type="range" min={0} max={0.9} step={0.05} value={bg.overlay} onChange={(e) => setBg({ overlay: Number(e.target.value) })} className="w-full accent-primary" />
            </Field>
            <Field label={bg.imageMode === "bottom" ? "Page color" : "Fallback color"}>
              <ColorInput value={bg.color} onChange={(color) => setBg({ color })} />
            </Field>
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Text & font</h3>
        <Field label="Text color">
          <ColorInput value={theme.textColor} onChange={(textColor) => onChange({ ...theme, textColor })} />
        </Field>
        <Switch label="Text shadow" description="Improves readability on photo backgrounds" checked={!!theme.textShadow} onCheckedChange={(textShadow) => onChange({ ...theme, textShadow })} />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {THEME_FONTS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onChange({ ...theme, font: f.key })}
              className={cn("rounded-xl border px-2 py-2.5 text-sm", theme.font === f.key ? "border-primary bg-primary-soft text-primary" : "border-border")}
              style={{ fontFamily: fontVar(f.key) }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Buttons</h3>
        <Field label="Style">
          <div className="grid grid-cols-3 gap-2">
            {BUTTON_STYLES.map((s) => (
              <button key={s} type="button" onClick={() => setBtn({ style: s })} className={cn("rounded-xl border px-2 py-2 text-xs font-medium", theme.button.style === s ? "border-primary bg-primary-soft text-primary" : "border-border")}>
                {label(s)}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Corners">
          <Segmented size="sm" value={theme.button.radius} onChange={(radius) => setBtn({ radius })} options={BUTTON_RADII.map((r) => ({ value: r, label: label(r) }))} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Button color">
            <ColorInput value={theme.button.color} onChange={(color) => setBtn({ color })} />
          </Field>
          <Field label="Button text">
            <ColorInput value={theme.button.textColor} onChange={(textColor) => setBtn({ textColor })} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Profile picture shape</h3>
        <Segmented value={theme.avatarShape} onChange={(avatarShape) => onChange({ ...theme, avatarShape })} options={AVATAR_SHAPES.map((s) => ({ value: s, label: label(s) }))} />
      </section>
    </div>
  );
}
