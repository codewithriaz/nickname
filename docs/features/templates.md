# Templates

**Status:** ✅ Done (2026-10-20)

## What it does
Templates are DB rows (`Template.theme` JSON = full `ProfileTheme`). Users pick one in Appearance;
premium ones need `premiumTemplates`. Users can customise on top (stored as `Profile.theme` override).

## Adding templates — two ways
1. **Super admin UI**: `/admin/templates` → New template (live theme editor). Instantly available everywhere.
2. **In code**: append to `TEMPLATE_PRESETS` in `src/config/templates.ts` and run `pnpm db:seed` (upserts by slug).

Theme shape (`src/schemas/theme.ts`): `background{type,color,gradientFrom,gradientTo,gradientAngle,imageUrl,overlay,imageMode}`,
`textColor`, `textShadow`, `font` (keys in `src/config/fonts.ts`), `button{style,radius,color,textColor}`, `avatarShape`.
- `background.imageMode`: `cover` (full-page photo) or `bottom` (solid `color` + 2:1 artwork anchored at the bottom, max 640px wide; content gets extra bottom padding via `bottomImagePadding()`).
- `textShadow`: soft shadow on page text for photo backgrounds (buttons opt out).
- Button styles: fill, outline, soft, shadow, hard-shadow, glass, **torn** (jagged paper edges via `clip-path`, `TORN_CLIP` in `theme-style.ts`).

## Photo templates (added 2026-10-20, from owner's reference screenshot)
| Slug | Look | Background asset |
|---|---|---|
| `orchard` | olive green, light pill buttons, fruit illustration at bottom | `public/templates/orchard-fruits.svg` (hand-made SVG) |
| `lagoon` | turquoise water photo, white pill buttons, text shadow | `public/templates/lagoon.jpg` — photo by Anton Sulsky (Unsplash, `unsplash.com/photos/fj0tFloTPGQ`) |
| `canyon` | warm canyon photo, peach torn-paper buttons, text shadow | `public/templates/canyon.jpg` — photo by Sebastian Boguszewicz (Unsplash, `unsplash.com/photos/YG_Fxyqz9xg`) |
Photos are used under the Unsplash License (free commercial use, no attribution required). Template images live in
`public/templates/` (900×1600 JPEG, ~160 KB) — keep new ones similarly compressed.
To add a **font**: add it in `src/app/fonts.ts` (next/font) and `src/config/fonts.ts`.
To add a **button style**: add to `BUTTON_STYLES` and handle it in `buttonStyle()` (`theme-style.ts`).

## Key files
`src/config/templates.ts` (12 presets), `src/schemas/theme.ts`, `src/components/common/{theme-editor,template-thumb}.tsx`,
`src/features/admin/components/templates-view.tsx`, `/api/templates`, `/api/admin/templates[/id]`, marketing `/templates`.
