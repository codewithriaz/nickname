import { BadgeCheck, ShoppingBag } from "lucide-react";
import type { PublicProfileData } from "@/types/public";
import { absoluteUrl, routes, siteConfig } from "@/config/site";
import { avatarRadius, bottomImagePadding, buttonStyle, pageStyle } from "./theme-style";
import { BlockList, SocialsRow } from "./blocks";
import { ProfileClient } from "./profile-client";
import { ShareButton } from "./share-button";
import { SensitiveGate } from "./sensitive-gate";
import { Pixels } from "./pixels";
import { initials } from "@/lib/utils";

/**
 * Shared renderer for public profiles (server-rendered for SEO) and the dashboard live
 * preview (rendered inside a client component with `preview`).
 */
export function ProfileView({ data, preview, initialTab }: { data: PublicProfileData; preview?: boolean; initialTab?: string }) {
  const { profile, theme } = data;
  const settings = profile.settings;
  const containerId = `nk-${profile.id}`;
  const hasSocialBlock = data.blocks.some((b) => b.type === "SOCIALS");

  return (
    <div className="relative min-h-full w-full" style={pageStyle(theme)}>
      {settings.sensitive && <SensitiveGate message={settings.sensitiveMessage} preview={preview} />}
      {!preview && data.pixels && <Pixels {...data.pixels} />}
      <main className="relative mx-auto flex min-h-dvh w-full max-w-[560px] flex-col px-4 pb-10 pt-12" style={{ paddingBottom: bottomImagePadding(theme) }}>
        {settings.showShare && !preview && <ShareButton url={absoluteUrl(routes.profile(profile.username))} name={profile.displayName} bio={profile.bio} />}

        <header className="flex flex-col items-center text-center">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt={profile.displayName} className="size-24 object-cover shadow-lg" style={{ borderRadius: avatarRadius(theme.avatarShape) }} />
          ) : (
            <div
              className="flex size-24 items-center justify-center text-2xl font-bold shadow-lg"
              style={{ borderRadius: avatarRadius(theme.avatarShape), background: theme.button.color, color: theme.button.textColor }}
            >
              {initials(profile.displayName)}
            </div>
          )}
          <h1 className="mt-4 flex items-center gap-1.5 text-xl font-bold">
            {profile.displayName}
            {profile.verified && <BadgeCheck className="size-5 fill-sky-500 text-white" aria-label="Verified" />}
          </h1>
          <p className="text-sm opacity-70">@{profile.username}</p>
          {profile.bio && <p className="mt-3 max-w-sm whitespace-pre-line text-sm leading-relaxed opacity-90">{profile.bio}</p>}
          {settings.socialsPosition === "top" && !hasSocialBlock && (
            <div className="mt-4">
              <SocialsRow data={data} />
            </div>
          )}
        </header>

        <div className="mt-6">
          <ProfileClient profileId={profile.id} tabs={data.tabs} showSearch={settings.showSearch} preview={preview} initialTab={initialTab} containerId={containerId} />
          <div id={containerId} className="flex flex-col gap-3">
            <BlockList data={data} preview={preview} />
            {data.store && data.store.productCount > 0 && !data.blocks.some((b) => b.url === routes.shop(profile.username)) && (
              <a href={routes.shop(profile.username)} className="flex items-center justify-center gap-2 px-4 py-3.5 font-semibold" style={buttonStyle(theme)} data-nk-search="shop">
                <ShoppingBag className="size-4" /> Visit shop · {data.store.productCount} products
              </a>
            )}
          </div>
        </div>

        {settings.socialsPosition === "bottom" && !hasSocialBlock && (
          <div className="mt-8">
            <SocialsRow data={data} />
          </div>
        )}

        <footer className="mt-auto flex flex-col items-center gap-2 pt-10 text-xs opacity-70">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {settings.footerLogoUrl && <img src={settings.footerLogoUrl} alt="" className="h-8 w-auto" />}
          {settings.footerText && <p>{settings.footerText}</p>}
          {data.showBranding && (
            <a href={`${siteConfig.url}/?ref=profile`} className="rounded-full px-3 py-1.5 font-semibold" style={{ background: "color-mix(in srgb, var(--nk-text) 10%, transparent)" }}>
              ⚡ Made with {siteConfig.name}
            </a>
          )}
        </footer>
      </main>
    </div>
  );
}
