# Simplified Job Lifecycle + Admin Kanban + Settings Control

## Overview

Simplify job statuses from 11 to 6 (5 active + cancelled). Add kanban board for Admin. Add per-job and global settings control for Admin.

## 1. Database Migration

Single migration file: `supabase/migrations/YYYYMMDDHHMMSS_simplify_statuses_add_settings.sql`

### 1.1 Status Enum

```sql
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'planning' BEFORE 'scheduled';

-- Migrate old statuses to 'planning'
UPDATE jobs SET status = 'planning'
WHERE status IN ('draft', 'submitted', 'photo_review', 'quote_pending', 'quote_submitted', 'negotiating');
```

Old enum values stay (Postgres can't drop enum values easily). Frontend enforcement ignores them.

### 1.2 Job Settings JSONB

```sql
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_settings JSONB DEFAULT '{}';
```

Schema:
```json
{
  "scaffolder_can_chat": true,
  "scaffolder_can_upload_photos": true,
  "scaffolder_can_submit_quotes": true,
  "scaffolder_can_see_owner_docs": true,
  "engineer_can_chat": true,
  "engineer_can_upload_photos": true,
  "engineer_can_change_status": true,
  "engineer_can_edit_site_report": true,
  "owner_can_see_status": true,
  "owner_can_see_docs": true,
  "owner_can_edit_address": true,
  "owner_can_upload_photos": true,
  "safety_checklist_required": true,
  "site_report_required": true,
  "quote_approval_required": false,
  "photo_evidence_required": false,
  "custom_checkpoints": [
    {"id": "uuid", "step": "planning", "label": "Verify panel count", "completed": false, "completed_by": null, "completed_at": null}
  ]
}
```

### 1.3 Global Admin Settings Table

```sql
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_job_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO admin_settings (id, default_job_settings) VALUES (1, '{}')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_full_access" ON admin_settings FOR ALL TO authenticated
USING (is_admin_user(auth.uid()));
```

### 1.4 Updated RPC: engineer_update_job_status

Gate checks against `job_settings`:
- `engineer_can_change_status` must not be `false`
- `safety_checklist_required` gates `in_progress` transition
- `site_report_required` gates `completed` transition

### 1.5 Updated RPC: redeem_job_invite

- `awaiting_owner_details` → `planning` (was `draft`)

## 2. Centralized Status Constants

New file: `src/constants/status.ts`

```ts
export const ACTIVE_STATUSES = [
  'awaiting_owner_details',
  'planning',
  'scheduled',
  'in_progress',
  'completed',
] as const;

export const ALL_STATUSES = [...ACTIVE_STATUSES, 'cancelled'] as const;

export const STATUS_LABELS: Record<string, string> = { ... };
export const STATUS_VARIANTS: Record<string, string> = { ... };
export const STATUS_TRANSITIONS: Record<string, string[]> = { ... };
export const KANBAN_COLUMNS = ACTIVE_STATUSES;
export const STATUS_FILTERS = { ... };
```

All files (Jobs.tsx, JobDetail.tsx, Dashboard.tsx, useNotificationTriggers.ts, exportJobsXlsx.ts) import from here. Delete 4-5 duplicate copies.

## 3. Badge & Color Updates

### Badge variants (badge.tsx)
- Remove: `draft`, `review`
- `pending` → for `planning` status
- Keep: `scheduled`, `active`, `complete`, `cancelled`

### CSS (index.css) + Tailwind (tailwind.config.ts)
- Remove: `--status-draft`, `--status-review`
- Keep: `--status-pending` (amber, used by planning), `--status-scheduled`, `--status-active`, `--status-complete`, `--status-cancelled`

## 4. Status Dropdown

New file: `src/components/jobs/StatusDropdown.tsx`

Replaces status buttons in JobDetail.tsx. Shows available transitions as dropdown options. Enforces role permissions. Admin: all transitions. Engineer: only via RPC (scheduled→in_progress→completed). Scaffolder: none.

## 5. Kanban Board

New file: `src/components/jobs/KanbanBoard.tsx`

Dependency: `@hello-pangea/dnd`

- 5 columns (no cancelled column): awaiting_owner_details, planning, scheduled, in_progress, completed
- Job cards draggable between columns → triggers status update via Supabase
- Cards show: Case No., address, assigned Scaffolder(s), assigned Engineer(s)
- Admin only component
- Overflow: horizontal scroll

## 6. Jobs Page Toggle

Modify: `src/pages/Jobs.tsx`

Add view toggle: List | Kanban. Same filter tabs apply to both views. Default: List (preserves current behavior).

## 7. Job Settings Panel

New file: `src/components/jobs/JobSettingsPanel.tsx`

Collapsible panel inside JobDetail, admin only. Reads/writes `job_settings` JSONB column. Four sections with toggle switches:

- **Scaffolder:** chat, upload photos, submit quotes, see owner docs
- **Engineer:** chat, upload photos, change status, edit site report
- **Owner:** see status, see docs, edit address, upload photos
- **Requirements:** safety checklist, site report, quote approval, photo evidence

Plus custom checkpoints section — add/remove text items per step, with completion toggle.

Changes saved immediately via Supabase upsert on `job_settings` column.

## 8. Global Admin Settings Page

New file: `src/pages/AdminSettings.tsx`

Mirrors JobSettingsPanel layout but reads/writes `admin_settings.default_job_settings`. When creating new jobs, AdminCreateJobDialog merges global defaults into the job's `job_settings`.

Route: `/admin/settings` (admin only).

## 9. Settings Enforcement

Every UI element controlled by `job_settings` must check the relevant toggle:

| Component | Check |
|-----------|-------|
| Photo upload buttons | `scaffolder_can_upload_photos` / `owner_can_upload_photos` |
| Chat inputs | `scaffolder_can_chat` / `engineer_can_chat` |
| SiteReport edit | `engineer_can_edit_site_report` |
| StatusDropdown | `engineer_can_change_status` |
| Owner status card | `owner_can_see_status` |
| Owner docs tab | `owner_can_see_docs` |
| Owner address edit | `owner_can_edit_address` |
| SafetyChecklistDialog | `safety_checklist_required` (also server-side in RPC) |
| Site report gate | `site_report_required` (also server-side in RPC) |

Resolution: `job_settings` (per-job) overrides `admin_settings.default_job_settings` (global defaults).

## 10. Files Changed Summary

### New
- `src/constants/status.ts`
- `src/components/jobs/KanbanBoard.tsx`
- `src/components/jobs/StatusDropdown.tsx`
- `src/components/jobs/JobSettingsPanel.tsx`
- `src/components/jobs/CheckpointList.tsx`
- `src/pages/AdminSettings.tsx`
- `supabase/migrations/YYYYMMDDHHMMSS_simplify_statuses_add_settings.sql`

### Modified
- `src/components/ui/badge.tsx`
- `src/index.css`
- `tailwind.config.ts`
- `src/pages/Jobs.tsx`
- `src/pages/JobDetail.tsx`
- `src/pages/Dashboard.tsx`
- `src/hooks/useNotificationTriggers.ts`
- `src/lib/exportJobsXlsx.ts`
- `src/pages/OwnerOnboarding.tsx`
- `src/components/jobs/AdminCreateJobDialog.tsx`
- `src/pages/SiteReport.tsx`
- `src/integrations/supabase/types.ts` (regenerate)

### Not in scope
- Scaffolder/Engineer/Owner registration changes
- Real-time chat (future)
- Email notifications
- App Store packaging

## 11. Status Transition Diagram

```
awaiting_owner_details ──→ planning ──→ scheduled ──→ in_progress ──→ completed
        │                     │            │             │               │
        └───── cancelled ←────┴────────────┴─────────────┴───────────────┘
                                   (admin revive: cancelled → planning)
```

## 12. Testing

- StatusDropdown: renders correct options per role and current status
- KanbanBoard: drag card → status updated in DB
- JobSettingsPanel: toggle → `job_settings` updated
- AdminSettings: toggle → `admin_settings.default_job_settings` updated
- Settings enforcement: toggles hide/show correct UI elements
- Migration: old statuses become `planning`, new jobs start as `awaiting_owner_details`
- RPC: `engineer_update_job_status` respects `job_settings` gates
