# Marketing pages & SEO

**Status:** ✅ Done (2026-10-20)

Pages (route group `src/app/(marketing)`): `/` (hero with username claim + live phone mockups rendered by the real
`ProfileView`, feature sections, price comparison vs Liinks/Linktree, FAQ), `/features`, `/pricing` (plan cards +
full comparison table, from DB), `/templates` (from DB), `/terms`, `/privacy`. Plus `robots.ts`, `sitemap.ts`
(static pages + every published profile & shop, cached hourly), global `not-found.tsx`.

All static/ISR: plans & templates come from cached queries tagged `plans` / `templates`, revalidated when admin edits.
Copy lives in `src/features/marketing/content.ts` (single source for features/FAQ/competitor prices).
