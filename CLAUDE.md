# Manta Ray Energy — Project Instructions

> This file is the source of truth for Claude Code working on this repo.
> The app was exported from Lovable and is now maintained directly.
> The Lovable project is **frozen / untouched**. All future work lives in the `MantaClaudeDesign` GitHub repo.

---

## 1. Product Overview

**Manta Ray Energy** is a mobile-first operations platform for managing solar-installation jobs across four roles:

- **System Owner** — end customer, one app, one job
- **Admin** — operational hub (single production account, no signup)
- **Scaffolder** — quotes + before/after scaffolding photos
- **Engineer** — executes roof work, produces site report PDF

### Main lifecycle

```
Admin creates job → Case No. entered → invite link generated →
System Owner completes onboarding → Admin reviews →
Scaffolders quote → Admin approves → Engineers execute →
Site report completed → Final PDF generated.
```

---

## 2. Roles (detail)

### System Owner
- Signs up through invite link (or normal flow)
- Completes onboarding **against an existing Admin-created job** (no new job is created on owner side)
- Sees **one application only**
- Views address, map, uploaded photos, status card, shared PDFs
- **No operational chat**

### Admin
- Single production Admin account (pre-created — no signup flow)
- Full visibility across all jobs
- Creates jobs first, then invites owner
- Inputs SolarEdge **Case No.**
- Generates invite links
- Assigns **multiple** Scaffolders / Engineers (not single-overwrite)
- Approves quotes, controls status transitions
- Exports jobs to Excel

### Scaffolder
- Registers as Scaffolder (appears in Admin assignment options automatically)
- Receives assigned jobs
- Uploads **Before Scaffolding** / **After Scaffolding** photos
- Submits quotes
- Chats only with Admin

### Engineer
- Registers as Engineer
- Receives assigned jobs
- Uploads **Before Roof Work** / **After Roof Work** photos
- Completes site report
- Generates final PDF
- Chats only with Admin

---

## 3. Authentication Model

### Production Auth
- Single login screen
- Signup roles: **System Owner, Scaffolder, Engineer**
- Admin: **no signup**, one pre-created production account
- Persistent session across refreshes and returning visits

### Production Relationship Model
Users relate through: `users`, `roles`, `jobs`, `assignments`.

---

## 4. Admin-First Job Creation Flow

Admin starts **every** job.

1. Admin creates **draft job**
2. Admin enters **SolarEdge Case No.**
3. Job status starts as `awaiting_owner_details`
4. System generates **secure invite link**
5. Admin shares invite link

**Invite message example:**
> "Welcome to Manta Ray Energy. Please use this secure link to complete your property details for Case No. XXXX."

System Owner opens link → signs up / signs in → onboarding **attaches to existing job** (no new job created).

**Case No. persists in:** Admin jobs list, Job details, Scaffolder views, Engineer views, System Owner view, exports, PDFs.

---

## 5. System Owner Onboarding

### Job Type Options
- New Job
- Service
- Full Site Replacement

### Property Flow
- Address autocomplete
- Google Maps
- Pin adjustment on roof

### Additional Field
- **Number of panels on the roof** — stored on job, shown in exports / PDFs

### Guided Photo Flow
Each photo on its **own screen**. Suggested categories:
- Front of building
- Access area
- Side angle

### Onboarding PDF
Generated **immediately after onboarding**. Contains: address, map, pin location, uploaded photos, case number, job type, panel count.
Available to: Admin, Scaffolder, Engineer.

---

## 6. Owner Application Page

After onboarding the System Owner lands on **one application page**.

Shows: address, saved map, final pin, uploaded photos, status card.

Status card is driven by **Admin status updates**.

**Initial state:**
> Status: Waiting for Approval
>
> Message: "We've sent your photos and location to Manta Ray. We'll update you once the scaffolder has reviewed the photos and SolarEdge has approved the job."

---

## 7. Assignments

Multiple assignments allowed. Admin can assign multiple Scaffolders and multiple Engineers.

**Implementation note:** repeat assignment rows — **not** single overwrite. Job details must clearly show multiple assigned names.

---

## 8. Quote Flow

Quote history visible for Admin + Scaffolders.

Shows: original quote, countered quote, accepted / declined, timestamps.

---

## 9. Photo Structure

- **System Owner** — original onboarding photos
- **Scaffolder** — Before Scaffolding / After Scaffolding (separate section)
- **Engineer** — Before Roof Work / After Roof Work (separate section)

---

## 10. Chat Logic

System Owner chat is **removed**.

Only active chats:
- Admin ↔ Scaffolder
- Admin ↔ Engineer

Chat must show sent + received messages, full persisted history.

---

## 11. Site Report

Sections (rebuilt from uploaded template):
1. General Details
2. Purpose of Visit
3. Summary
4. Supplied Materials Used
5. Comments
6. Follow-Up Action
7. Evidence

Extras:
- **Engineer Name at top**
- Address prefilled from job, editable
- Evidence images at end
- Editable after submission

---

## 12. PDF Outputs

- **Onboarding PDF** — after System Owner onboarding
- **Site Report PDF** — after Engineer report

PDF must be a real file before sharing.
- Mobile: native share sheet with attached PDF
- Desktop: download PDF
- Site report PDF visually clones the uploaded template closely.

---

## 13. Exports

**Export All Jobs to Excel** (Admin action).

Columns: Case No., Address, Status, Scaffolding Price, Scaffolder's Name, Engineer's Name, Client Name, Optimizer No., Link to Google Maps.

Multiple names → comma-separated in one cell.

---

## 14. Branding

- Replace **all** Solar Scaffold Pro branding with **Manta Ray Energy**
- Design language: **Black / White / Orange** (`--primary: 25 95% 53%` → `#F97316`)

---

## 15. Production Backend Ownership

Current backend: **Lovable-managed Supabase** (project id `gyfwmbmhouohjxgprabz`).

**Long-term recommendation:** external Supabase owned directly by product owner. Migration should include schema, storage bucket, auth users, edge functions.

---

## 16. Recommended Next Improvements (backlog, not in scope yet)

- Invite-only Engineer / Scaffolder creation
- Realtime chat
- Private storage bucket
- Stronger audit logging
- Transactional email
- App Store packaging via Median

---

## 17. Tech Stack (locked)

- **Frontend:** React 18.3 + TypeScript 5.8 + Vite 5.4
- **Styling:** Tailwind 3.4 + shadcn/ui + Radix primitives
- **State:** TanStack React Query 5.83 (installed; underused)
- **Forms:** React Hook Form 7.61 + Zod 3.25
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions / Deno)
- **PWA:** vite-plugin-pwa 1.2 with Workbox
- **Package manager:** npm (lockfile authoritative) — `bun.lock` present but not active
- **Dev server:** port `8080`
- **Path alias:** `@/*` → `./src/*`

### New libs expected to land during improvement work
- `react-leaflet` + OpenStreetMap tiles (maps)
- `jspdf` (PDF)
- `xlsx` (Excel export)
- `framer-motion` (tasteful micro-interactions)

---

## 18. Repo / Deploy State

- **GitHub:** `git@github.com:IgorLipo/MantaClaudeDesign.git` (origin, SSH)
- **Source of truth:** this repo — the Lovable workspace is **frozen**
- **Hosting target:** Vercel (static SPA build from `dist/`)
- **Supabase:** currently still pointing at the Lovable-issued project — migration to a user-owned project is pending (see §15 and the migration checklist in `docs/migration-from-lovable.md` once it exists)

---

## 19. Working Conventions for Claude

- Before any Edit/Write, confirm the current repo root is `/Users/igorlipovetsky/GrokMantaLovable`.
- Never push to `origin/main` without explicit user confirmation.
- Never touch the Lovable workspace at `/Users/igorlipovetsky/claude-code-projects/Ofir/Lovable Manta Ray` — it is archived.
- `.env` is local-only and contains Supabase keys — never read, echo, or commit.
- Prefer incremental, reviewable diffs (one file or small group per step).
- When improving UI, update design tokens in `tailwind.config.ts` + `src/index.css` first, then cascade to components.
- Dev server: `npm run dev` (port 8080). Build: `npm run build`. Lint: `npm run lint`. Test: `npm test`.
