"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { track } from "@/features/public/api";
import type { TabDTO } from "@/types/dto";

/**
 * Client island for the public profile: page-view + click tracking (delegated),
 * tab switching and search filtering — the blocks themselves stay server-rendered.
 */
export function ProfileClient({
  profileId,
  tabs,
  showSearch,
  preview,
  initialTab,
  containerId,
}: {
  profileId: string;
  tabs: TabDTO[];
  showSearch: boolean;
  preview?: boolean;
  initialTab?: string;
  containerId: string;
}) {
  const [activeTab, setActiveTab] = useState<string>(() =>
    initialTab && tabs.some((t) => t.slug === initialTab) ? initialTab : "main",
  );
  const [query, setQuery] = useState("");

  // Deep link: /username?tab=slug (read on the client so the page stays statically cacheable)
  useEffect(() => {
    if (preview) return;
    const fromUrl = new URLSearchParams(window.location.search).get("tab");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from URL after hydration
    if (fromUrl && tabs.some((t) => t.slug === fromUrl)) setActiveTab(fromUrl);
  }, [tabs, preview]);

  // Page view + delegated click tracking
  useEffect(() => {
    if (preview) return;
    track({ type: "PAGE_VIEW", profileId });
    const container = document.getElementById(containerId);
    if (!container) return;
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>("[data-nk-block]");
      if (el?.dataset.nkBlock) track({ type: "LINK_CLICK", profileId, blockId: el.dataset.nkBlock });
    };
    container.addEventListener("click", onClick);
    return () => container.removeEventListener("click", onClick);
  }, [profileId, preview, containerId]);

  // Search filtering (DOM-level so blocks remain server components)
  useEffect(() => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const q = query.trim().toLowerCase();
    container.querySelectorAll<HTMLElement>("[data-nk-search]").forEach((el) => {
      el.hidden = !!q && !(el.dataset.nkSearch ?? "").includes(q);
    });
  }, [query, containerId]);

  const selectTab = (slug: string) => {
    setActiveTab(slug);
    if (!preview) {
      const url = new URL(window.location.href);
      if (slug === "main") url.searchParams.delete("tab");
      else url.searchParams.set("tab", slug);
      window.history.replaceState(null, "", url);
    }
  };

  return (
    <>
      {tabs.length > 0 && (
        <style>{`#${containerId} [data-nk-tab]:not([data-nk-tab="${activeTab.replace(/[^a-z0-9-]/gi, "")}"]){display:none}`}</style>
      )}
      {tabs.length > 0 && (
        <nav className="mb-4 flex gap-1 overflow-x-auto no-scrollbar rounded-full p-1" style={{ background: "color-mix(in srgb, var(--nk-text) 8%, transparent)" }}>
          {[{ slug: "main", title: "Home" }, ...tabs].map((t) => (
            <button
              key={t.slug}
              type="button"
              onClick={() => selectTab(t.slug)}
              className="flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition"
              style={
                activeTab === t.slug
                  ? { background: "var(--nk-text)", color: "var(--nk-bg-contrast, #fff)" }
                  : { color: "var(--nk-text)", opacity: 0.75 }
              }
            >
              {t.title}
            </button>
          ))}
        </nav>
      )}
      {showSearch && (
        <label className="mb-4 flex items-center gap-2 rounded-full px-4 py-2.5 text-sm" style={{ background: "color-mix(in srgb, var(--nk-text) 8%, transparent)" }}>
          <Search className="size-4 opacity-60" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search links…"
            className="w-full bg-transparent outline-none placeholder:opacity-60"
            style={{ color: "var(--nk-text)" }}
          />
        </label>
      )}
    </>
  );
}
