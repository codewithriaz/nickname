import type { CSSProperties } from "react";
import { fontVar } from "@/config/fonts";
import type { ProfileTheme } from "@/schemas/theme";

const RADIUS = { none: "0px", sm: "6px", md: "12px", lg: "18px", full: "9999px" } as const;

export function pageStyle(theme: ProfileTheme): CSSProperties {
  const bg = theme.background;
  const overlay = `linear-gradient(rgba(0,0,0,${bg.overlay}), rgba(0,0,0,${bg.overlay}))`;
  const background =
    bg.type === "gradient"
      ? `linear-gradient(${bg.gradientAngle}deg, ${bg.gradientFrom}, ${bg.gradientTo})`
      : bg.type === "image" && bg.imageUrl
        ? bg.imageMode === "bottom"
          ? `${overlay}, url("${bg.imageUrl}") bottom center / min(100%, 640px) auto no-repeat, ${bg.color}`
          : `${overlay}, url("${bg.imageUrl}") center/cover no-repeat`
        : bg.color;
  return {
    background,
    backgroundColor: bg.color,
    color: theme.textColor,
    textShadow: theme.textShadow ? "0 1px 3px rgba(0,0,0,.35)" : undefined,
    fontFamily: `${fontVar(theme.font)}, ui-sans-serif, system-ui, sans-serif`,
    ["--nk-text" as string]: theme.textColor,
    ["--btn-color" as string]: theme.button.color,
  };
}

/** Rough "torn paper" edges: jagged top & bottom, slightly uneven sides. */
const TORN_CLIP = (() => {
  const top = [0, 3, 1, 4, 0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 0, 2, 4, 1, 3, 1, 0];
  const bottom = [2, 0, 3, 1, 4, 0, 2, 3, 0, 4, 1, 2, 0, 3, 1, 4, 0, 2, 1, 3, 1];
  const n = top.length - 1;
  const pts = [
    ...top.map((y, i) => `${(i / n) * 100}% ${y}px`),
    `calc(100% - 2px) 50%`,
    ...bottom.map((y, i) => `${100 - (i / n) * 100}% calc(100% - ${y}px)`),
    `2px 50%`,
  ];
  return `polygon(${pts.join(", ")})`;
})();

/** Extra bottom space so content never covers a bottom-anchored background image (2:1 artwork). */
export const bottomImagePadding = (theme: ProfileTheme) =>
  theme.background.type === "image" && theme.background.imageUrl && theme.background.imageMode === "bottom" ? "calc(min(50vw, 320px) + 24px)" : undefined;

export function buttonStyle(theme: ProfileTheme): CSSProperties {
  const { style, radius, color, textColor } = theme.button;
  const base: CSSProperties = {
    borderRadius: RADIUS[radius],
    color: textColor,
    textShadow: "none",
    transition: "transform .15s ease, box-shadow .15s ease",
  };
  switch (style) {
    case "torn":
      return { ...base, borderRadius: 0, background: color, border: "none", clipPath: TORN_CLIP };
    case "outline":
      return { ...base, border: `2px solid ${color}`, background: "transparent" };
    case "soft":
      return { ...base, background: `color-mix(in srgb, ${color} 18%, transparent)`, border: "1px solid transparent" };
    case "shadow":
      return { ...base, background: color, boxShadow: "0 8px 24px -6px rgba(0,0,0,.25)" };
    case "hard-shadow":
      return { ...base, background: color, border: "2px solid #000", boxShadow: "4px 4px 0 #000" };
    case "glass":
      return {
        ...base,
        background: "rgba(255,255,255,.14)",
        border: "1px solid rgba(255,255,255,.28)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
      };
    default:
      return { ...base, background: color, border: "1px solid transparent" };
  }
}

export const avatarRadius = (shape: ProfileTheme["avatarShape"]) => (shape === "circle" ? "9999px" : shape === "rounded" ? "24px" : "4px");
export const cardRadius = (theme: ProfileTheme) => RADIUS[theme.button.radius === "full" ? "lg" : theme.button.radius];
