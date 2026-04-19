

# Solar Scaffold Pro — Phase 1 Plan

## Overview

Build a mobile-first PWA for UK solar installation operations, adapting the prompt's spec to Lovable's stack (React + Vite + Tailwind + Lovable Cloud). The app will have role-based views (Admin, Owner, Scaffolder, Engineer) with the same FinancePulse-inspired UI polish.

## What Changes from the Original Prompt

| Original | Lovable Adaptation |
|---|---|
| NestJS backend | Lovable Cloud (database + edge functions + auth) |
| Prisma ORM | Supabase client SDK |
| Next.js admin | React + Vite (same app, admin layout) |
| Expo React Native | PWA installable on iPhone from Safari |
| BullMQ/Redis | Edge functions + database-driven queues |
| JWT local auth | Lovable Cloud auth (email/password) |

## Phase 1 Scope (This Build)

### 1. Database Schema
Create these tables with RLS:
- **profiles** — id, user_id, first_name, last_name, phone, avatar_url
- **user_roles** — user_id, role (ADMIN/OWNER/SCAFFOLDER/ENGINEER)
- **regions** — id, name, code, postcode_prefix, is_active
- **jobs** — id, title, description, address, lat, lng, status (state machine enum), owner_id, scheduled_date, scheduled_duration, completion_date, completion_notes
- **job_assignments** — job_id, scaffolder_id, region_id, assigned_by
- **quotes** — job_id, scaffolder_id, amount, notes, submitted_at, review_decision, reviewed_by
- **photos** — job_id, uploader_id, url, review_status (PENDING/APPROVED/REJECTED)
- **notifications** — user_id, type, title, message, read, data (jsonb)
- **audit_logs** — user_id, action, entity, entity_id, changes (jsonb), ip

### 2. Authentication
- Email/password signup and login
- Role assignment on registration (default OWNER, admins created via seed)
- Auth-gated routes, role-based access

### 3. Core Pages (Mobile-First + Admin Layout)
- **Login/Register** — branded Solar Scaffold Pro login
- **Dashboard** — KPI cards (Total Jobs, Pending, In Progress, Completed), recent activity, job pipeline chart
- **Jobs List** — filterable table/cards with status badges
- **Job Detail** — full info, status transitions, photo gallery, quotes, assignments
- **Scaffolders** — list with regions and assigned jobs
- **Regions** — region management with scaffolder mapping
- **Notifications** — bell icon + notification center
- **Audit Log** — paginated log (admin only)
- **Settings** — profile, company, notification preferences

### 4. Branding
- Emerald green (#059669) primary color
- Solar/construction iconography
- "Solar Scaffold Pro" branding throughout
- Dark mode support

### 5. PWA Setup
- Service worker via vite-plugin-pwa
- Manifest with app name, icons, theme color
- Install prompt page

## Build Order

1. **Auth + database schema + seed data** — tables, RLS, auth pages, seed 4 demo users
2. **App shell + navigation** — sidebar (desktop), bottom nav (mobile), role-based menu
3. **Dashboard** — KPI cards, job pipeline, recent activity
4. **Jobs CRUD** — list, create, detail, status transitions
5. **Quotes + Photos** — submission, review, file upload to storage
6. **Scaffolders + Regions** — management pages
7. **Notifications + Audit** — in-app notifications, audit log
8. **Settings + PWA** — preferences, installability

## Technical Notes

- All existing FinancePulse code will be replaced with Solar Ops pages/components
- Reuse shadcn/ui components and the polished card/chart patterns from the current project
- RLS policies enforce role-based access at the database level
- Edge functions handle complex operations (PDF reports, notification dispatch) in later phases

