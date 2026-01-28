# Finance Pulse - Sources of Truth

## Last Updated
January 2026 - Phase 3 Complete

---

## Routes

| Path | Page Component | Status |
|------|----------------|--------|
| `/` | `Index.tsx` | ✅ Complete |
| `/reports` | `Reports.tsx` | ✅ Complete |
| `/reports/new` | `ReportBuilder.tsx` | ✅ Complete |
| `/reports/templates` | `ReportTemplates.tsx` | ✅ Complete |
| `/reports/:id` | `ReportBuilder.tsx` | ✅ Complete |
| `/productivity` | `Productivity.tsx` | ✅ Complete |
| `/notifications` | `Notifications.tsx` | ✅ Placeholder |
| `/settings` | `Settings.tsx` | ✅ Placeholder |
| `/settings/:tab` | `Settings.tsx` | ✅ Placeholder |
| `/ai` | `AIPage.tsx` | ✅ Placeholder |
| `*` | `NotFound.tsx` | ✅ Complete |

---

## Navigation Items

Defined in: `src/components/layout/AppShell.tsx`

| Label | Path | Icon |
|-------|------|------|
| Dashboard | `/` | LayoutDashboard |
| Reports | `/reports` | FileText |
| Productivity | `/productivity` | ListTodo |
| Notifications | `/notifications` | Bell |
| Settings | `/settings` | Settings |
| AI Summarizer | `/ai` | Sparkles |

---

## Data Files

| File | Purpose |
|------|---------|
| `src/data/mockDashboard.ts` | Dashboard metrics, transactions, invoices, charts |
| `src/data/mockReports.ts` | Report modules, templates, period options |
| `src/data/mockTasks.ts` | Productivity tasks and cycles (Phase 3) |
| `src/data/mockNotifications.ts` | Notification items (Phase 4) |
| `src/data/mockSettings.ts` | User profile and preferences (Phase 4) |

---

## Component Directories

| Directory | Purpose |
|-----------|---------|
| `src/components/dashboard/` | Dashboard-specific components |
| `src/components/layout/` | App shell, navigation |
| `src/components/ui/` | shadcn/ui primitives |
| `src/components/reports/` | Report builder components |
| `src/components/productivity/` | Task tracking components |
| `src/components/notifications/` | Notification UI (Phase 4) |
| `src/components/settings/` | Settings forms (Phase 4) |

---

## Hooks

| Hook | Purpose | Status |
|------|---------|--------|
| `useReportBuilder` | Report builder state management | ✅ Complete |
| `useTasks` | Task management state | ✅ Complete |
| `useNotifications` | Notification state | Phase 4 |

---

## Database Tables

**None** - Demo version uses mock data only.

---

## Storage Buckets

**None** - Demo version has no file uploads.

---

## Edge Functions

| Function | Purpose | Status |
|----------|---------|--------|
| `summarize` | AI report summarization | Phase 5 (optional) |

---

## Design Tokens

Defined in: `src/index.css` and `tailwind.config.ts`

- Primary: Slate/Navy (`--primary`)
- Accent: Indigo (`--accent`)
- Success: Emerald (`--success`)
- Warning: Amber (`--warning`)
- Charts: Indigo, Emerald, Pink, Blue, Amber
