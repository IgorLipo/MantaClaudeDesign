# Manta Ray Energy

A mobile-first operations platform for managing UK solar-installation jobs across four roles: **System Owner**, **Admin**, **Scaffolder**, **Engineer**.

> Exported from Lovable and now maintained directly. The full product spec lives in [`CLAUDE.md`](./CLAUDE.md). Stale / pre-divergence material is archived under [`docs/_archive/`](./docs/_archive).

## Quick start

```sh
npm install
cp .env.example .env   # fill with your Supabase keys
npm run dev            # http://localhost:8080
```

## Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Vite dev server on port 8080 |
| `npm run build` | Production build to `dist/` |
| `npm run build:dev` | Dev-mode build |
| `npm run preview` | Serve the built `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Vitest (single run) |
| `npm run test:watch` | Vitest watch mode |

## Stack

- **Frontend**: React 18 + TypeScript + Vite 5 + Tailwind 3 + shadcn/ui + Radix
- **Backend**: Supabase (PostgreSQL + Auth + Storage + Edge Functions on Deno)
- **State**: TanStack React Query
- **Forms**: React Hook Form + Zod
- **PWA**: vite-plugin-pwa + Workbox
- **Deploy**: Vercel (auto from `main`)

## Supabase layout

- `supabase/migrations/` — SQL migrations (applied in order)
- `supabase/functions/` — Edge functions (`admin-invite-user`, `create-admin`, `get-maps-key`, `summarize-report`, `update-signup-role`)
- `supabase/config.toml` — points at the current Supabase project ref

## Repo conventions

- **`main`** is the active branch; Vercel auto-deploys from it.
- Secrets live in `.env` (never committed) and in Vercel / Supabase dashboards.
- Per-phase work is made as small, reviewable commits — see `CLAUDE.md` §19.

## Roles summary

| Role | Access |
|------|--------|
| **System Owner** | Invite-link onboarding, one job app, status card, no chat |
| **Admin** | Single pre-created account, full job lifecycle + exports |
| **Scaffolder** | Assigned jobs, before/after scaffolding photos, quote flow |
| **Engineer** | Assigned jobs, before/after roof photos, site report PDF |

Full behavior spec: [`CLAUDE.md`](./CLAUDE.md).
