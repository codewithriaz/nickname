# Owner rules (must be followed for every change)

These are the project owner's standing requirements (originally written in Bangla).

1. **Tech stack** — Next.js + TypeScript, fully type-safe.
2. **Structure** — `src/` directory, clean architecture, scalable folders.
3. **Backend** — Prisma ORM; PostgreSQL or MongoDB chosen per requirement (this project: PostgreSQL).
4. **Rendering** — choose SSR / ISR / CSR per page; public pages optimised for SEO + performance.
5. **API layer** — one Base API Service; all API requests centralised.
6. **Axios** — used for all API communication; interceptors for auth, error handling, token refresh.
7. **Admin panel** — TanStack Query for fetching/caching, TanStack Table for data tables.
8. **Dates** — Day.js only.
9. **Global state** — Zustand when needed.
10. **Documentation** — keep `CLAUDE.md` at root updated with: overview, current plan, pending,
    completed, important decisions, known issues — so work can resume without re-reading code.
11. **Components** — shared (used in many places) → `src/components`; page/feature-only →
    inside that page/feature folder.
12. **Code quality** — reusable, scalable, maintainable; type safety, performance, SEO, clean
    architecture first; avoid unnecessary re-renders, duplicate code and hardcoded values.

Working preference: work autonomously, add any tech needed, do not ask repeatedly — finish in one go.
