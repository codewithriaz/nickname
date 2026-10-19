export const SOCIAL_PLATFORMS = [
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
  { key: "facebook", label: "Facebook", placeholder: "https://facebook.com/page" },
  { key: "tiktok", label: "TikTok", placeholder: "https://tiktok.com/@username" },
  { key: "youtube", label: "YouTube", placeholder: "https://youtube.com/@channel" },
  { key: "x", label: "X (Twitter)", placeholder: "https://x.com/username" },
  { key: "whatsapp", label: "WhatsApp", placeholder: "https://wa.me/8801XXXXXXXXX" },
  { key: "messenger", label: "Messenger", placeholder: "https://m.me/page" },
  { key: "telegram", label: "Telegram", placeholder: "https://t.me/username" },
  { key: "linkedin", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "threads", label: "Threads", placeholder: "https://threads.net/@username" },
  { key: "pinterest", label: "Pinterest", placeholder: "https://pinterest.com/username" },
  { key: "snapchat", label: "Snapchat", placeholder: "https://snapchat.com/add/username" },
  { key: "spotify", label: "Spotify", placeholder: "https://open.spotify.com/artist/..." },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "discord", label: "Discord", placeholder: "https://discord.gg/invite" },
  { key: "twitch", label: "Twitch", placeholder: "https://twitch.tv/username" },
  { key: "website", label: "Website", placeholder: "https://example.com" },
  { key: "email", label: "Email", placeholder: "mailto:you@example.com" },
  { key: "phone", label: "Phone", placeholder: "tel:+8801XXXXXXXXX" },
] as const;

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]["key"];
export const SOCIAL_PLATFORM_KEYS = SOCIAL_PLATFORMS.map((p) => p.key) as [SocialPlatform, ...SocialPlatform[]];
