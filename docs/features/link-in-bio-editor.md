# Link-in-bio editor (dashboard)

**Status:** ✅ Done (2026-10-20)

## What it does
- **Profiles**: one account → many profiles (limit per plan). Switcher in the top bar (`useWorkspaceStore.activeProfileId`, persisted).
- **13 block types**: LINK, AFFILIATE, HEADER, TEXT, IMAGE, EMBED (YouTube/Vimeo/Spotify/SoundCloud/TikTok/FB), EMAIL_SIGNUP, FORM (custom fields), FILE (download), FOLDER (collapsible, children via `parentId`), PRODUCT (from shop), SOCIALS, DIVIDER.
- Per block: thumbnail (emoji/image), layout (classic/highlight/grid/carousel — consecutive grid/carousel blocks are grouped), 7 animations, schedule (`startsAt/endsAt`, paid), tab, active toggle, duplicate, drag-and-drop reorder (dnd-kit), click counter.
- **Tabs** (paid): `Tab` model; public page shows a tab bar; deep link `/{username}?tab={slug}`.
- **Appearance**: templates gallery (premium lock), full theme editor (background solid/gradient/image+overlay, text color, 8 fonts incl. Hind Siliguri, 6 button styles, radius, colors, avatar shape), profile info, socials.
  Theme = template theme + `Profile.theme` overrides (`resolveTheme()` in `src/schemas/theme.ts`).
- **Page settings**: username, publish, share button, search bar, socials position, sensitive-content gate, hide branding (paid), footer text/logo, SEO (paid), Pinterest verify, FB Pixel + GA (paid), timed redirect (paid), custom domain (Pro), verified-badge request, delete.
- **Live preview**: `LivePreview` renders the real `ProfileView` with query data; appearance passes unsaved overrides.
- **Audience**: subscribers / form submissions table, search, CSV export (paid).

## Key files
- Schemas: `src/schemas/{block,profile,theme}.ts`
- Server: `src/server/services/{profile,block,tab,subscriber}.service.ts`
- API: `/api/profiles`, `/api/profiles/[id]` (+`/blocks`, `/blocks/reorder`, `/tabs`, `/domain`, `/verification`, `/subscribers`, `/subscribers/export`), `/api/blocks/[id]` (+`/duplicate`), `/api/tabs/[id]`, `/api/subscribers/[id]`, `/api/upload`
- Client: `src/features/profiles/{api,hooks}.ts`, `components/editor/*`, `components/appearance/*`, `components/settings/*`, `components/live-preview.tsx`; audience in `src/features/audience`
- Shared: `src/components/common/{theme-editor,template-thumb,image-upload,qr-code}.tsx`

## Data model
`Profile` (JSON: `theme`, `socials`, `seo`, `settings`), `Tab`, `Block` (JSON `data` validated per type by `blockDataSchemas`), `Subscriber`.

## How to extend
- **New block type**: add enum value in `prisma/schema.prisma` → migrate → add data schema in `blockDataSchemas` + `BLOCK_TYPE_META` → icon/group in `editor/block-meta.ts` → fields in `block-editor.tsx` → render case in `src/components/profile-renderer/blocks.tsx`.
- **New profile setting**: add to `profileSettingsSchema` (has defaults, no migration needed).

## Known issues / TODO
- Folder children can be moved via "Inside folder" select, not drag-and-drop.
- Instagram post sync, AI chat, social planner (Linktree/Liinks extras) not implemented — need external APIs.
