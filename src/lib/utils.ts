import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(input: string, maxLength = 80) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, maxLength);
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function compactNumber(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n);
}

export function percent(part: number, total: number, digits = 1) {
  if (!total) return "0%";
  return `${((part / total) * 100).toFixed(digits)}%`;
}

export function hostnameOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Convert YouTube/Spotify/SoundCloud/Vimeo/TikTok share URLs into embeddable URLs. */
export function toEmbedUrl(raw: string): { src: string; aspect: "video" | "audio" | "square" } | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\.|^m\./, "");
  if (host === "youtu.be") return { src: `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`, aspect: "video" };
  if (host === "youtube.com") {
    const id = url.searchParams.get("v") ?? url.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1];
    return id ? { src: `https://www.youtube-nocookie.com/embed/${id}`, aspect: "video" } : null;
  }
  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? { src: `https://player.vimeo.com/video/${id}`, aspect: "video" } : null;
  }
  if (host === "open.spotify.com") return { src: `https://open.spotify.com/embed${url.pathname}`, aspect: "audio" };
  if (host === "soundcloud.com")
    return { src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(raw)}&visual=true`, aspect: "audio" };
  if (host === "tiktok.com") {
    const id = url.pathname.match(/video\/(\d+)/)?.[1];
    return id ? { src: `https://www.tiktok.com/embed/v2/${id}`, aspect: "square" } : null;
  }
  if (host === "facebook.com" || host === "fb.watch")
    return { src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(raw)}`, aspect: "video" };
  return null;
}

export const isBrowser = typeof window !== "undefined";

/** Escape text before inserting into raw HTML strings. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
