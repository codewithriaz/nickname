# API keys & public REST API

**Status:** ✅ Done (2026-10-20) — Pro plan (`apiAccess`).

Keys: `nk_…` shown once, stored as SHA-256 (`ApiKey`), revocable, `lastUsedAt` tracked, 120 req/min per key.
Auth header: `Authorization: Bearer nk_…` (or `x-api-key`).

| Method | Endpoint | |
|---|---|---|
| GET | `/api/v1/me` | account + plan |
| GET | `/api/v1/profiles` | your profiles |
| GET/POST | `/api/v1/profiles/{id}/blocks` | list / create blocks (same body as dashboard) |
| GET | `/api/v1/profiles/{id}/analytics?days=30&tz=Asia/Dhaka` | analytics summary |
| GET | `/api/v1/profiles/{id}/orders?page=1` | shop orders |
| GET | `/api/v1/profiles/{id}/subscribers?page=1` | leads |
| GET/POST | `/api/v1/short-links` | list / create short links |

Responses use the standard envelope `{ success, data, meta? }` / `{ success:false, error:{code,message,details} }`.
Files: `src/server/services/api-key.service.ts`, `apiKeyAuthed()` in `src/server/http/handler.ts`, `src/app/api/v1/*`, UI in `account-view.tsx`.
