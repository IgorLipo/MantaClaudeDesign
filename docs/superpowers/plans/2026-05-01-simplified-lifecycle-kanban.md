# Simplified Job Lifecycle + Admin Kanban + Settings Control — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce job statuses from 11 to 6, add drag-and-drop kanban board, StatusDropdown, per-job settings JSONB, and global admin settings.

**Architecture:** Centralized status constants (`src/constants/status.ts`) replace 5 duplicate copies across the codebase. New components (KanbanBoard, StatusDropdown, JobSettingsPanel) compose into existing pages. Settings flow: `admin_settings.default_job_settings` → merged into `jobs.job_settings` on create → UI reads `job_settings` with fallback to defaults.

**Tech Stack:** React 18.3 + TypeScript 5.8, Supabase (PostgreSQL), Tailwind 3.4 + shadcn/ui, @hello-pangea/dnd (kanban drag-and-drop)

---

### Task 1: Database Migration

**Files:**
- Create: `supabase/migrations/20260502000000_simplify_statuses_add_settings.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- 1. Add 'planning' to job_status enum
ALTER TYPE public.job_status ADD VALUE IF NOT EXISTS 'planning' BEFORE 'scheduled';

-- 2. Migrate old statuses to 'planning'
UPDATE jobs SET status = 'planning'
WHERE status IN ('draft', 'submitted', 'photo_review', 'quote_pending', 'quote_submitted', 'negotiating');

-- 3. Add job_settings JSONB column
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_settings JSONB DEFAULT '{}';

-- 4. Create admin_settings table (single-row, id always 1)
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  default_job_settings JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO admin_settings (id, default_job_settings) VALUES (1, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_full_access" ON admin_settings FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Update redeem_job_invite: awaiting_owner_details → planning (not draft)
CREATE OR REPLACE FUNCTION public.redeem_job_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.job_invites%ROWTYPE;
  v_job public.jobs%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_invite FROM public.job_invites WHERE token = _token;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid invite link';
  END IF;

  IF v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'Invite link has expired';
  END IF;

  SELECT * INTO v_job FROM public.jobs WHERE id = v_invite.job_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job no longer exists';
  END IF;

  IF v_invite.used_at IS NOT NULL AND v_invite.used_by <> auth.uid() THEN
    RAISE EXCEPTION 'Invite already used';
  END IF;

  IF v_job.owner_id IS NULL THEN
    UPDATE public.jobs
      SET owner_id = auth.uid(),
          status = CASE WHEN status = 'awaiting_owner_details'::public.job_status THEN 'planning'::public.job_status ELSE status END,
          updated_at = now()
      WHERE id = v_job.id;
  ELSIF v_job.owner_id <> auth.uid() THEN
    RAISE EXCEPTION 'This job already belongs to another owner';
  END IF;

  UPDATE public.job_invites
    SET used_at = COALESCE(used_at, now()),
        used_by = COALESCE(used_by, auth.uid())
    WHERE id = v_invite.id;

  RETURN v_job.id;
END;
$$;

-- 6. Update engineer_update_job_status to check job_settings gates
CREATE OR REPLACE FUNCTION public.engineer_update_job_status(_job_id UUID, _new_status public.job_status)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_report_status text;
  v_has_safety_checklist BOOLEAN;
  v_settings JSONB;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF NOT public.has_role(auth.uid(), 'engineer'::public.app_role) THEN
    RAISE EXCEPTION 'Only engineers can use this action';
  END IF;

  SELECT *
  INTO v_job
  FROM public.jobs
  WHERE id = _job_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Job not found';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.job_assignments ja
    WHERE ja.job_id = _job_id
      AND ja.scaffolder_id = auth.uid()
      AND ja.assignment_role = 'engineer'
  ) THEN
    RAISE EXCEPTION 'You are not assigned to this job';
  END IF;

  -- Load merged settings: global defaults + per-job overrides
  v_settings := COALESCE(v_job.job_settings, '{}'::jsonb);

  -- Check engineer_can_change_status
  IF (v_settings->>'engineer_can_change_status')::boolean IS FALSE THEN
    RAISE EXCEPTION 'Status changes are disabled for engineers on this job';
  END IF;

  IF _new_status = 'in_progress'::public.job_status THEN
    IF v_job.status <> 'scheduled'::public.job_status THEN
      RAISE EXCEPTION 'Only scheduled jobs can be started';
    END IF;

    -- Safety checklist gate (respects job_settings override)
    IF (v_settings->>'safety_checklist_required')::boolean IS NOT FALSE THEN
      SELECT EXISTS (
        SELECT 1 FROM public.safety_checklists
        WHERE job_id = _job_id AND engineer_id = auth.uid() AND completed = true
      ) INTO v_has_safety_checklist;

      IF NOT v_has_safety_checklist THEN
        RAISE EXCEPTION 'Safety checklist must be completed before starting work';
      END IF;
    END IF;

  ELSIF _new_status = 'completed'::public.job_status THEN
    IF v_job.status <> 'in_progress'::public.job_status THEN
      RAISE EXCEPTION 'Only in-progress jobs can be completed';
    END IF;

    -- Site report gate (respects job_settings override)
    IF (v_settings->>'site_report_required')::boolean IS NOT FALSE THEN
      SELECT sr.status
      INTO v_report_status
      FROM public.site_reports sr
      WHERE sr.job_id = _job_id
        AND sr.engineer_id = auth.uid()
      ORDER BY sr.updated_at DESC
      LIMIT 1;

      IF COALESCE(v_report_status, '') <> 'submitted' THEN
        RAISE EXCEPTION 'Site report must be submitted before completion';
      END IF;
    END IF;
  ELSE
    RAISE EXCEPTION 'This status change is not allowed for engineers';
  END IF;

  UPDATE public.jobs
  SET status = _new_status,
      updated_at = now()
  WHERE id = _job_id
  RETURNING * INTO v_job;

  RETURN v_job;
END;
$$;

REVOKE ALL ON FUNCTION public.engineer_update_job_status(UUID, public.job_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.engineer_update_job_status(UUID, public.job_status) TO authenticated;
```

- [ ] **Step 2: Commit migration**

```bash
git add supabase/migrations/20260502000000_simplify_statuses_add_settings.sql
git commit -m "feat: simplify job statuses to 6, add job_settings + admin_settings"
```

---

### Task 2: Centralized Status Constants

**Files:**
- Create: `src/constants/status.ts`

- [ ] **Step 1: Write the constants file**

```ts
// src/constants/status.ts
// Single source of truth for all job status labels, variants, transitions, and filter groups.

export const ACTIVE_STATUSES = [
  'awaiting_owner_details',
  'planning',
  'scheduled',
  'in_progress',
  'completed',
] as const;

export const ALL_STATUSES = [...ACTIVE_STATUSES, 'cancelled'] as const;

export type JobStatus = (typeof ALL_STATUSES)[number];

export const STATUS_LABELS: Record<string, string> = {
  awaiting_owner_details: 'Awaiting Owner',
  planning: 'Planning',
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  // Legacy fallbacks — keep for DB rows not yet migrated
  draft: 'Planning',
  submitted: 'Planning',
  photo_review: 'Planning',
  quote_pending: 'Planning',
  quote_submitted: 'Planning',
  negotiating: 'Planning',
};

export const STATUS_VARIANTS: Record<string, string> = {
  awaiting_owner_details: 'draft',
  planning: 'pending',
  scheduled: 'scheduled',
  in_progress: 'active',
  completed: 'complete',
  cancelled: 'cancelled',
  // Legacy fallbacks
  draft: 'pending',
  submitted: 'pending',
  photo_review: 'pending',
  quote_pending: 'pending',
  quote_submitted: 'pending',
  negotiating: 'pending',
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  awaiting_owner_details: ['planning', 'cancelled'],
  planning: ['scheduled', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: ['cancelled'],
  cancelled: ['planning'],
};

export const KANBAN_COLUMNS = [...ACTIVE_STATUSES];

export const PENDING_STATUSES: string[] = ['awaiting_owner_details', 'planning'];
export const ACTIVE_FILTER_STATUSES: string[] = ['scheduled', 'in_progress'];
```

- [ ] **Step 2: Commit**

```bash
git add src/constants/status.ts
git commit -m "feat: add centralized status constants"
```

---

### Task 3: Badge & Color Updates

**Files:**
- Modify: `src/components/ui/badge.tsx:16-17`
- Modify: `src/index.css:51-64,296-306`
- Modify: `tailwind.config.ts:77-91`

- [ ] **Step 1: Update badge variants**

In `src/components/ui/badge.tsx`, remove the `draft` and `review` variants. The `pending` variant now covers `planning`.

```tsx
// Replace lines 16-17 (draft and review variants) — keep all others:
variant: {
  default: "border-transparent bg-primary text-primary-foreground hover:bg-primary-emphasis",
  secondary: "border-transparent bg-subtle text-subtle-foreground",
  destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90",
  outline: "border-border text-foreground",
  soft: "border-transparent bg-primary-soft text-primary",
  pending:   "border-transparent bg-status-pending-soft text-status-pending",
  scheduled: "border-transparent bg-status-scheduled-soft text-status-scheduled",
  active:    "border-transparent bg-status-active-soft text-status-active",
  complete:  "border-transparent bg-status-complete-soft text-status-complete",
  cancelled: "border-transparent bg-status-cancelled-soft text-status-cancelled",
},
```

- [ ] **Step 2: Update CSS status colors**

In `src/index.css`, remove `--status-draft`, `--status-draft-soft`, `--status-review`, `--status-review-soft` from both `:root` and `.dark` blocks. Keep `--status-pending` (amber, used by `planning`).

In `:root` (lines 51-64), replace with:
```css
/* ── Semantic status ─────────────────────── */
--status-pending: 38 92% 50%;     /* amber — planning */
--status-pending-soft: 43 100% 94%;
--status-scheduled: 262 72% 62%;  /* violet */
--status-scheduled-soft: 260 100% 96%;
--status-active: 22 96% 46%;      /* ember (in_progress) */
--status-active-soft: 22 96% 96%;
--status-complete: 158 64% 40%;   /* emerald */
--status-complete-soft: 152 76% 94%;
--status-cancelled: 0 72% 51%;    /* rose */
--status-cancelled-soft: 0 100% 96%;
```

In `.dark` (lines 159-172), similarly remove draft/review vars.

In the `[data-status]` component styles (lines 296-306), replace with:
```css
[data-status] {
  @apply inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium;
}
[data-status="awaiting_owner_details"] { background: hsl(var(--status-cancelled-soft) / 0.5); color: hsl(var(--status-cancelled)); }
[data-status="planning"]   { background: hsl(var(--status-pending-soft));    color: hsl(var(--status-pending)); }
[data-status="scheduled"]   { background: hsl(var(--status-scheduled-soft));   color: hsl(var(--status-scheduled)); }
[data-status="in_progress"] { background: hsl(var(--status-active-soft));      color: hsl(var(--status-active)); }
[data-status="completed"]   { background: hsl(var(--status-complete-soft));    color: hsl(var(--status-complete)); }
[data-status="cancelled"]   { background: hsl(var(--status-cancelled-soft));   color: hsl(var(--status-cancelled)); }
```

- [ ] **Step 3: Update Tailwind config status colors**

In `tailwind.config.ts`, remove `draft`, `draft-soft`, `review`, `review-soft` from the `status` color object (lines 78-83). Keep `pending` and `pending-soft` (now used by `planning`).

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/badge.tsx src/index.css tailwind.config.ts
git commit -m "feat: update badges/colors for 6-status system"
```

---

### Task 4: Update Supabase Types

**Files:**
- Modify: `src/integrations/supabase/types.ts:598-614,738-758`

- [ ] **Step 1: Add `planning` to the job_status enum type and constants**

In the `Enums` type interface (lines 598-614), add `'planning'` after `'awaiting_owner_details'`:
```ts
job_status:
  | "awaiting_owner_details"
  | "planning"
  | "draft"
  | "submitted"
  | "photo_review"
  | "quote_pending"
  | "quote_submitted"
  | "negotiating"
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled"
```

In the `Constants.public.Enums` (lines 742-754), add `"planning"` after `"awaiting_owner_details"`:
```ts
job_status: [
  "awaiting_owner_details",
  "planning",
  "draft",
  // ... rest unchanged
],
```

Also add `job_settings` to the jobs table Row/Insert/Update types. Add to the `Tables<'jobs'>` interface:
```ts
job_settings: Json | null
```

- [ ] **Step 2: Commit**

```bash
git add src/integrations/supabase/types.ts
git commit -m "feat: add planning status + job_settings to generated types"
```

---

### Task 5: StatusDropdown Component

**Files:**
- Create: `src/components/jobs/StatusDropdown.tsx`

- [ ] **Step 1: Write the StatusDropdown component**

```tsx
// src/components/jobs/StatusDropdown.tsx
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATUS_LABELS, STATUS_TRANSITIONS } from "@/constants/status";

interface Props {
  currentStatus: string;
  role: string;
  onChange: (newStatus: string) => void;
  disabled?: boolean;
}

export function StatusDropdown({ currentStatus, role, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);

  const available = STATUS_TRANSITIONS[currentStatus] || [];

  // Scaffolders cannot change status at all
  if (role === "scaffolder" || role === "owner") return null;

  // Engineers: only scheduled→in_progress, in_progress→completed (enforced server-side)
  if (role === "engineer") {
    if (currentStatus === "scheduled") {
      available.length = 0;
      available.push("in_progress");
    } else if (currentStatus === "in_progress") {
      available.length = 0;
      available.push("completed");
    } else {
      return null;
    }
  }

  // Admin: all transitions
  // (available already populated from STATUS_TRANSITIONS)

  if (available.length === 0) return null;

  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      value={currentStatus}
      onValueChange={(v) => {
        if (v !== currentStatus) {
          onChange(v);
        }
        setOpen(false);
      }}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px] h-9 text-xs">
        <SelectValue placeholder={STATUS_LABELS[currentStatus] || currentStatus} />
      </SelectTrigger>
      <SelectContent>
        {available.map((s) => (
          <SelectItem key={s} value={s} className="text-xs">
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/StatusDropdown.tsx
git commit -m "feat: add StatusDropdown component"
```

---

### Task 6: Update JobDetail.tsx

**Files:**
- Modify: `src/pages/JobDetail.tsx:36-105,277-328`

- [ ] **Step 1: Replace local status maps with centralized constants**

Replace lines 36-65 (statusMap, statusVariantOf, transitions) with imports:

```tsx
import { STATUS_LABELS, STATUS_VARIANTS, STATUS_TRANSITIONS } from "@/constants/status";
```

Remove the old `statusMap`, `statusVariantOf`, and `transitions` definitions.

Update `ownerStatusInfo` (lines 68-105) to use new statuses:
```tsx
const ownerStatusInfo: Record<string, { title: string; message: string }> = {
  planning: {
    title: "Planning",
    message: "We're reviewing your property details. We'll update you once the team has reviewed your submission.",
  },
  scheduled: {
    title: "Scheduled",
    message: "Your installation has been scheduled. Check the details below.",
  },
  in_progress: {
    title: "Work In Progress",
    message: "The installation team is currently working on your property.",
  },
  completed: {
    title: "Completed",
    message: "Your solar panel installation is complete! Thank you for choosing us.",
  },
  cancelled: {
    title: "Cancelled",
    message: "This job has been cancelled. Please contact us if you have questions.",
  },
};
```

- [ ] **Step 2: Replace status buttons with StatusDropdown**

In `updateStatus` (line 277), remove the client-side gate for engineers (server handles it now). Replace with RPC call for engineers, direct update for admin.

Then find where status buttons are rendered (the row of buttons showing available transitions) and replace with:
```tsx
<StatusDropdown
  currentStatus={job.status}
  role={role}
  onChange={updateStatus}
/>
```

Also update all `statusMap[...]` calls to `STATUS_LABELS[...]` and `statusVariantOf(...)` to `STATUS_VARIANTS[...]` throughout the file.

- [ ] **Step 3: Commit**

```bash
git add src/pages/JobDetail.tsx
git commit -m "feat: wire StatusDropdown + centralized constants into JobDetail"
```

---

### Task 7: Install @hello-pangea/dnd

- [ ] **Step 1: Install the dependency**

```bash
cd /Users/igorlipovetsky/GrokMantaLovable && npm install @hello-pangea/dnd
```

Expected: installs successfully, updates `package.json` and `package-lock.json`.

- [ ] **Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: install @hello-pangea/dnd for kanban drag-and-drop"
```

---

### Task 8: KanbanBoard Component

**Files:**
- Create: `src/components/jobs/KanbanBoard.tsx`

- [ ] **Step 1: Write the KanbanBoard component**

```tsx
// src/components/jobs/KanbanBoard.tsx
import { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, User } from "lucide-react";
import { KANBAN_COLUMNS, STATUS_LABELS, STATUS_VARIANTS } from "@/constants/status";
import { useToast } from "@/hooks/use-toast";
import { logAudit } from "@/hooks/useAuditLog";
import { useAuth } from "@/contexts/AuthContext";

interface JobCard {
  id: string;
  title: string;
  case_no: string | null;
  address: string | null;
  status: string;
}

interface AssignInfo {
  job_id: string;
  scaffolderNames: string[];
  engineerNames: string[];
}

export function KanbanBoard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [assigns, setAssigns] = useState<AssignInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const [{ data: jobData }, { data: assignData }, { data: profileData }] = await Promise.all([
      supabase.from("jobs").select("id,title,case_no,address,status").order("created_at", { ascending: false }),
      supabase.from("job_assignments").select("job_id,scaffolder_id,assignment_role"),
      supabase.from("profiles").select("user_id,first_name,last_name"),
    ]);

    if (jobData) setJobs(jobData);

    if (assignData && profileData) {
      const profileMap = new Map<string, string>();
      (profileData || []).forEach((p: any) => {
        profileMap.set(p.user_id, `${p.first_name || ""} ${p.last_name || ""}`.trim() || "Unknown");
      });

      const grouped: Record<string, { scaffolderNames: string[]; engineerNames: string[] }> = {};
      (assignData || []).forEach((a: any) => {
        if (!grouped[a.job_id]) grouped[a.job_id] = { scaffolderNames: [], engineerNames: [] };
        const name = profileMap.get(a.scaffolder_id) || "Unknown";
        if (a.assignment_role === "engineer") {
          grouped[a.job_id].engineerNames.push(name);
        } else {
          grouped[a.job_id].scaffolderNames.push(name);
        }
      });

      setAssigns(
        Object.entries(grouped).map(([job_id, info]) => ({
          job_id,
          scaffolderNames: info.scaffolderNames,
          engineerNames: info.engineerNames,
        }))
      );
    }

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getAssigns = (jobId: string) =>
    assigns.find((a) => a.job_id === jobId) || { scaffolderNames: [], engineerNames: [] };

  const onDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const newStatus = destination.droppableId;
    const jobId = draggableId;

    // Optimistic update
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );

    const { error } = await supabase
      .from("jobs")
      .update({ status: newStatus as any, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Move failed", description: error.message, variant: "destructive" });
      fetchData(); // revert
    } else {
      logAudit(user?.id, "status_change", "job", jobId, { from: source.droppableId, to: newStatus, via: "kanban" });
    }
  };

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => (
          <div key={col} className="min-w-[280px] max-w-[320px] flex-1">
            <div className="h-8 w-24 bg-muted rounded animate-pulse mb-3" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted rounded animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((col) => {
          const colJobs = jobs.filter((j) => j.status === col);
          return (
            <div key={col} className="min-w-[280px] max-w-[320px] flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={STATUS_VARIANTS[col] as any}>{STATUS_LABELS[col]}</Badge>
                <span className="text-xs text-muted-foreground">{colJobs.length}</span>
              </div>
              <Droppable droppableId={col}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`space-y-2 min-h-[120px] rounded-lg p-2 transition-colors duration-quick ${
                      snapshot.isDraggingOver ? "bg-subtle ring-1 ring-primary/30" : ""
                    }`}
                  >
                    {colJobs.map((job, idx) => {
                      const info = getAssigns(job.id);
                      return (
                        <Draggable key={job.id} draggableId={job.id} index={idx}>
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`shadow-xs transition-shadow duration-quick ${
                                snapshot.isDragging ? "shadow-md ring-1 ring-primary/30" : ""
                              }`}
                            >
                              <CardContent className="p-3 space-y-2">
                                <div className="flex items-start justify-between gap-2">
                                  {job.case_no && (
                                    <span className="font-mono text-[10px] text-muted-foreground/70 truncate">
                                      {job.case_no}
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm font-medium leading-tight truncate">
                                  {job.title}
                                </div>
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <MapPin className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{job.address || "No address"}</span>
                                </div>
                                {(info.scaffolderNames.length > 0 || info.engineerNames.length > 0) && (
                                  <div className="space-y-0.5 pt-1 border-t border-border/60">
                                    {info.scaffolderNames.length > 0 && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <User className="h-2.5 w-2.5 shrink-0" />
                                        <span className="truncate">S: {info.scaffolderNames.join(", ")}</span>
                                      </div>
                                    )}
                                    {info.engineerNames.length > 0 && (
                                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                        <User className="h-2.5 w-2.5 shrink-0" />
                                        <span className="truncate">E: {info.engineerNames.join(", ")}</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/jobs/KanbanBoard.tsx
git commit -m "feat: add KanbanBoard with drag-and-drop"
```

---

### Task 9: Update Jobs Page with List/Kanban Toggle

**Files:**
- Modify: `src/pages/Jobs.tsx`

- [ ] **Step 1: Add toggle and KanbanBoard to Jobs page**

Replace the local `statusMap`, `statusVariant`, `pendingStatuses`, `activeStatuses` with imports from `@/constants/status`.

Add a view toggle state and a toggle button group next to the filter tabs:

```tsx
import { useState } from "react"; // add KanbanBoard import
import { LayoutList, Columns2 } from "lucide-react";
import { KanbanBoard } from "@/components/jobs/KanbanBoard";
import { STATUS_LABELS, STATUS_VARIANTS, PENDING_STATUSES, ACTIVE_FILTER_STATUSES } from "@/constants/status";

// Inside the component, add:
const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

// Update filter logic to use new constants:
// pendingStatuses → PENDING_STATUSES
// activeStatuses → ACTIVE_FILTER_STATUSES

// Replace statusVariant(job.status) with STATUS_VARIANTS[job.status]
// Replace statusMap[job.status] with STATUS_LABELS[job.status]
```

Add the toggle button group near the filter tabs:
```tsx
<div className="inline-flex items-center gap-1 bg-muted/60 ring-1 ring-border/60 rounded-md p-1 ml-auto">
  <button
    onClick={() => setViewMode("list")}
    className={cn(
      "px-3 h-8 rounded text-xs font-medium transition-all duration-quick",
      viewMode === "list"
        ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <LayoutList className="h-3.5 w-3.5" />
  </button>
  <button
    onClick={() => setViewMode("kanban")}
    className={cn(
      "px-3 h-8 rounded text-xs font-medium transition-all duration-quick",
      viewMode === "kanban"
        ? "bg-card text-foreground shadow-xs ring-1 ring-border/60"
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    <Columns2 className="h-3.5 w-3.5" />
  </button>
</div>
```

Render `KanbanBoard` when in kanban mode (instead of the list), and show filter tabs in both modes but hide search in kanban:
```tsx
{viewMode === "kanban" ? (
  <div className="animate-em-enter" style={{ animationDelay: "160ms" }}>
    <KanbanBoard />
  </div>
) : (
  // existing list rendering
)}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Jobs.tsx
git commit -m "feat: add List/Kanban toggle to Jobs page"
```

---

### Task 10: Update Dependent Files (Dashboard, Notifications, Export, Onboarding)

**Files:**
- Modify: `src/pages/Dashboard.tsx:16-34`
- Modify: `src/hooks/useNotificationTriggers.ts:26-48`
- Modify: `src/lib/exportJobsXlsx.ts:17-23`
- Modify: `src/pages/OwnerOnboarding.tsx:187,198`

- [ ] **Step 1: Update Dashboard.tsx**

Replace local `statusMap`, `statusVariant`, `pendingStatuses`, `activeStatuses` with imports:
```tsx
import { STATUS_LABELS, STATUS_VARIANTS, PENDING_STATUSES, ACTIVE_FILTER_STATUSES } from "@/constants/status";
```

Remove the old local definitions (lines 16-34). Update references:
- `statusMap[j.status]` → `STATUS_LABELS[j.status]`
- `statusVariant(j.status)` → `STATUS_VARIANTS[j.status]`
- `pendingStatuses.includes(j.status)` → `PENDING_STATUSES.includes(j.status)`
- `activeStatuses.includes(j.status)` → `ACTIVE_FILTER_STATUSES.includes(j.status)`

- [ ] **Step 2: Update useNotificationTriggers.ts**

Replace local `statusLabels` with import:
```tsx
import { STATUS_LABELS } from "@/constants/status";
```

Remove local `statusLabels` definition (lines 26-31). Use `STATUS_LABELS[newStatus]`.

Update notification trigger statuses:
- `ownerStatuses`: `["scheduled", "in_progress", "completed", "cancelled"]`
- `scaffolderStatuses`: `["scheduled", "in_progress", "completed", "cancelled"]` (remove `quote_pending`)
- `engineerStatuses`: keep `["scheduled", "in_progress", "completed"]`

- [ ] **Step 3: Update exportJobsXlsx.ts**

Replace local `statusLabel` with import:
```tsx
import { STATUS_LABELS } from "@/constants/status";
```

Remove local definition (lines 17-23). Use `STATUS_LABELS[job.status]`.

- [ ] **Step 4: Update OwnerOnboarding.tsx**

Line 187: Change `"submitted"` to `"planning"`:
```tsx
updates.status = "planning";
```

Line 198: Change `"draft"` to `"planning"` and `"submitted"` to `"planning"`:
```tsx
status: "planning" as any,
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/hooks/useNotificationTriggers.ts src/lib/exportJobsXlsx.ts src/pages/OwnerOnboarding.tsx
git commit -m "feat: migrate all dependent files to centralized status constants"
```

---

### Task 11: JobSettingsPanel Component

**Files:**
- Create: `src/components/jobs/JobSettingsPanel.tsx`

- [ ] **Step 1: Write JobSettingsPanel**

```tsx
// src/components/jobs/JobSettingsPanel.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, GripVertical, Plus, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Checkpoint {
  id: string;
  step: string;
  label: string;
  completed: boolean;
  completed_by: string | null;
  completed_at: string | null;
}

interface JobSettings {
  scaffolder_can_chat: boolean;
  scaffolder_can_upload_photos: boolean;
  scaffolder_can_submit_quotes: boolean;
  scaffolder_can_see_owner_docs: boolean;
  engineer_can_chat: boolean;
  engineer_can_upload_photos: boolean;
  engineer_can_change_status: boolean;
  engineer_can_edit_site_report: boolean;
  owner_can_see_status: boolean;
  owner_can_see_docs: boolean;
  owner_can_edit_address: boolean;
  owner_can_upload_photos: boolean;
  safety_checklist_required: boolean;
  site_report_required: boolean;
  quote_approval_required: boolean;
  photo_evidence_required: boolean;
  custom_checkpoints: Checkpoint[];
}

const DEFAULTS: JobSettings = {
  scaffolder_can_chat: true,
  scaffolder_can_upload_photos: true,
  scaffolder_can_submit_quotes: true,
  scaffolder_can_see_owner_docs: true,
  engineer_can_chat: true,
  engineer_can_upload_photos: true,
  engineer_can_change_status: true,
  engineer_can_edit_site_report: true,
  owner_can_see_status: true,
  owner_can_see_docs: true,
  owner_can_edit_address: true,
  owner_can_upload_photos: true,
  safety_checklist_required: true,
  site_report_required: true,
  quote_approval_required: false,
  photo_evidence_required: false,
  custom_checkpoints: [],
};

interface Props {
  jobId: string;
  currentSettings: Record<string, any> | null;
}

export function JobSettingsPanel({ jobId, currentSettings }: Props) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<JobSettings>(() => ({
    ...DEFAULTS,
    ...currentSettings,
    custom_checkpoints: (currentSettings as any)?.custom_checkpoints || [],
  }));
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const toggle = (key: keyof Omit<JobSettings, "custom_checkpoints">) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("jobs")
      .update({ job_settings: settings as any, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Settings saved" });
    }
    setSaving(false);
  };

  const addCheckpoint = () => {
    const cp: Checkpoint = {
      id: crypto.randomUUID(),
      step: "planning",
      label: "",
      completed: false,
      completed_by: null,
      completed_at: null,
    };
    setSettings((prev) => ({
      ...prev,
      custom_checkpoints: [...prev.custom_checkpoints, cp],
    }));
  };

  const removeCheckpoint = (id: string) => {
    setSettings((prev) => ({
      ...prev,
      custom_checkpoints: prev.custom_checkpoints.filter((c) => c.id !== id),
    }));
  };

  const updateCheckpoint = (id: string, field: Partial<Checkpoint>) => {
    setSettings((prev) => ({
      ...prev,
      custom_checkpoints: prev.custom_checkpoints.map((c) => (c.id === id ? { ...c, ...field } : c)),
    }));
  };

  const steps = ["planning", "scheduled", "in_progress", "completed"];

  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border border-border/60 rounded-lg">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-left font-medium text-sm">
        Job Settings
        <ChevronDown className={`h-4 w-4 transition-transform duration-quick ${open ? "rotate-180" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-4 pb-4 space-y-4">
        {/* Scaffolder */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scaffolder</legend>
          {(["scaffolder_can_chat", "scaffolder_can_upload_photos", "scaffolder_can_submit_quotes", "scaffolder_can_see_owner_docs"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>{k.replace(/^scaffolder_can_/, "").replace(/_/g, " ")}</Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        {/* Engineer */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engineer</legend>
          {(["engineer_can_chat", "engineer_can_upload_photos", "engineer_can_change_status", "engineer_can_edit_site_report"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>{k.replace(/^engineer_can_/, "").replace(/_/g, " ")}</Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        {/* Owner */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</legend>
          {(["owner_can_see_status", "owner_can_see_docs", "owner_can_edit_address", "owner_can_upload_photos"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>{k.replace(/^owner_can_/, "").replace(/_/g, " ")}</Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        {/* Requirements */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requirements</legend>
          {(["safety_checklist_required", "site_report_required", "quote_approval_required", "photo_evidence_required"] as const).map((k) => (
            <div key={k} className="flex items-center justify-between gap-2">
              <Label className="text-xs cursor-pointer" htmlFor={k}>{k.replace(/_/g, " ")}</Label>
              <Switch id={k} checked={settings[k]} onCheckedChange={() => toggle(k)} />
            </div>
          ))}
        </fieldset>

        {/* Custom Checkpoints */}
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Custom Checkpoints</legend>
          {settings.custom_checkpoints.map((cp) => (
            <div key={cp.id} className="flex items-center gap-2">
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                className="text-xs border border-border rounded px-1 py-0.5 bg-card"
                value={cp.step}
                onChange={(e) => updateCheckpoint(cp.id, { step: e.target.value })}
              >
                {steps.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <Input
                className="h-7 text-xs flex-1"
                placeholder="Checkpoint label"
                value={cp.label}
                onChange={(e) => updateCheckpoint(cp.id, { label: e.target.value })}
              />
              <button onClick={() => removeCheckpoint(cp.id)} className="shrink-0">
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={addCheckpoint}>
            <Plus className="h-3 w-3 mr-1" /> Add checkpoint
          </Button>
        </fieldset>

        <Button size="sm" className="w-full" onClick={save} disabled={saving}>
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </CollapsibleContent>
    </Collapsible>
  );
}
```

- [ ] **Step 2: Wire JobSettingsPanel into JobDetail.tsx**

Add import:
```tsx
import { JobSettingsPanel } from "@/components/jobs/JobSettingsPanel";
```

Add the panel in the admin section of JobDetail (below the existing admin controls), gated by `role === "admin"`:
```tsx
{role === "admin" && (
  <div className="mt-6">
    <JobSettingsPanel jobId={id!} currentSettings={(job as any)?.job_settings || {}} />
  </div>
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/jobs/JobSettingsPanel.tsx src/pages/JobDetail.tsx
git commit -m "feat: add JobSettingsPanel for per-job admin control"
```

---

### Task 12: AdminSettings Page

**Files:**
- Create: `src/pages/AdminSettings.tsx`

- [ ] **Step 1: Write AdminSettings page**

```tsx
// src/pages/AdminSettings.tsx
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface DefaultSettings {
  scaffolder_can_chat: boolean;
  scaffolder_can_upload_photos: boolean;
  scaffolder_can_submit_quotes: boolean;
  scaffolder_can_see_owner_docs: boolean;
  engineer_can_chat: boolean;
  engineer_can_upload_photos: boolean;
  engineer_can_change_status: boolean;
  engineer_can_edit_site_report: boolean;
  owner_can_see_status: boolean;
  owner_can_see_docs: boolean;
  owner_can_edit_address: boolean;
  owner_can_upload_photos: boolean;
  safety_checklist_required: boolean;
  site_report_required: boolean;
  quote_approval_required: boolean;
  photo_evidence_required: boolean;
}

const DEFAULTS: DefaultSettings = {
  scaffolder_can_chat: true,
  scaffolder_can_upload_photos: true,
  scaffolder_can_submit_quotes: true,
  scaffolder_can_see_owner_docs: true,
  engineer_can_chat: true,
  engineer_can_upload_photos: true,
  engineer_can_change_status: true,
  engineer_can_edit_site_report: true,
  owner_can_see_status: true,
  owner_can_see_docs: true,
  owner_can_edit_address: true,
  owner_can_upload_photos: true,
  safety_checklist_required: true,
  site_report_required: true,
  quote_approval_required: false,
  photo_evidence_required: false,
};

export default function AdminSettings() {
  const { role } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [settings, setSettings] = useState<DefaultSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (role !== "admin") {
      navigate("/");
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("admin_settings")
        .select("default_job_settings")
        .eq("id", 1)
        .single();

      if (data?.default_job_settings) {
        setSettings({ ...DEFAULTS, ...(data.default_job_settings as any) });
      }
      setLoading(false);
    };
    load();
  }, [role, navigate]);

  const toggle = (key: keyof DefaultSettings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert({ id: 1, default_job_settings: settings as any, updated_at: new Date().toISOString() });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Default settings saved" });
    }
    setSaving(false);
  };

  if (loading) return null;

  return (
    <div className="min-h-screen">
      <section className="border-b border-border/60">
        <div className="p-4 lg:p-10 max-w-3xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="font-display text-3xl lg:text-4xl tracking-tight text-foreground">
            Default Job Settings
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            These defaults apply to all new jobs. Per-job overrides in Job Settings take precedence.
          </p>
        </div>
      </section>

      <div className="p-4 lg:p-10 max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Global Defaults</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Scaffolder</legend>
              {(["scaffolder_can_chat", "scaffolder_can_upload_photos", "scaffolder_can_submit_quotes", "scaffolder_can_see_owner_docs"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>{k.replace(/^scaffolder_can_/, "").replace(/_/g, " ")}</Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Engineer</legend>
              {(["engineer_can_chat", "engineer_can_upload_photos", "engineer_can_change_status", "engineer_can_edit_site_report"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>{k.replace(/^engineer_can_/, "").replace(/_/g, " ")}</Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Owner</legend>
              {(["owner_can_see_status", "owner_can_see_docs", "owner_can_edit_address", "owner_can_upload_photos"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>{k.replace(/^owner_can_/, "").replace(/_/g, " ")}</Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Requirements</legend>
              {(["safety_checklist_required", "site_report_required", "quote_approval_required", "photo_evidence_required"] as const).map((k) => (
                <div key={k} className="flex items-center justify-between gap-2">
                  <Label className="text-xs cursor-pointer" htmlFor={`g-${k}`}>{k.replace(/_/g, " ")}</Label>
                  <Switch id={`g-${k}`} checked={settings[k]} onCheckedChange={() => toggle(k)} />
                </div>
              ))}
            </fieldset>

            <Button className="w-full" onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Default Settings"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add route for AdminSettings in App.tsx**

In `src/App.tsx`, add the import:
```tsx
import AdminSettings from "./pages/AdminSettings";
```

Add the route inside the authenticated `<Routes>` block, after the existing admin routes:
```tsx
<Route path="/admin/settings" element={<ProtectedRoute roles={["admin"]}><AdminSettings /></ProtectedRoute>} />
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/AdminSettings.tsx
git commit -m "feat: add AdminSettings page for global job defaults"
```

---

### Task 13: Settings Enforcement in UI Components

**Files:**
- Modify: `src/pages/JobDetail.tsx` (photo upload, chat, status dropdown, owner sections)
- Modify: `src/components/jobs/SafetyChecklistDialog.tsx` (respect `safety_checklist_required`)
- Modify: `src/components/jobs/AdminCreateJobDialog.tsx` (merge global defaults into new job)

- [ ] **Step 1: Add job_settings resolution helper**

Add to `src/pages/JobDetail.tsx` (or a new utility) a helper that resolves settings with defaults:

```tsx
function resolveSetting(job: any, key: string): boolean {
  const settings = (job as any)?.job_settings || {};
  if (key in settings) return settings[key] !== false;
  return true; // default: everything enabled
}
```

- [ ] **Step 2: Gate UI elements by settings**

Photo upload buttons — wrap or disable based on `resolveSetting(job, 'scaffolder_can_upload_photos')` / `owner_can_upload_photos` / `engineer_can_upload_photos`.

Chat inputs — gate by `scaffolder_can_chat` / `engineer_can_chat`.

SiteReport edit button — gate by `engineer_can_edit_site_report`.

StatusDropdown — gate by `engineer_can_change_status` (also checked server-side).

Owner status card — gate by `owner_can_see_status`.

Owner docs tab — gate by `owner_can_see_docs`.

Owner address edit — gate by `owner_can_edit_address`.

SafetyChecklistDialog — gate by `safety_checklist_required` (both client and server).

For each gated element, wrap in a conditional:
```tsx
{resolveSetting(job, 'scaffolder_can_upload_photos') && (
  <Button /* ... photo upload button ... */ />
)}
```

- [ ] **Step 3: Merge global defaults into new job on create**

In `AdminCreateJobDialog.tsx`, after creating a job with `status: "awaiting_owner_details"`, also merge the global defaults:

```tsx
// After job creation, before generating invite:
const { data: adminSettings } = await supabase
  .from("admin_settings")
  .select("default_job_settings")
  .eq("id", 1)
  .single();

if (adminSettings?.default_job_settings && Object.keys(adminSettings.default_job_settings).length > 0) {
  await supabase
    .from("jobs")
    .update({ job_settings: adminSettings.default_job_settings })
    .eq("id", job.id);
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/JobDetail.tsx src/components/jobs/AdminCreateJobDialog.tsx
git commit -m "feat: enforce job_settings across all UI components"
```

---

### Task 14: Run Migration Against Supabase

- [ ] **Step 1: Apply migration**

If the project has a migration runner, use it. Otherwise, run the SQL directly via the Supabase dashboard or CLI:

```bash
# If using Supabase CLI:
supabase db push
# Or: manually run the SQL file via Supabase SQL editor
```

Verify: `SELECT * FROM jobs LIMIT 1;` — should show `job_settings` column as `{}`.
Verify: Old `draft`/`submitted` jobs now show `planning`.

- [ ] **Step 2: Build check**

```bash
cd /Users/igorlipovetsky/GrokMantaLovable && npm run build
```

Expected: build succeeds with no TypeScript errors.

---

### Task 15: Manual Verification Checklist

- [ ] **Step 1: Verify status transitions work**

- Admin: Create job → status = `awaiting_owner_details`. Open job → StatusDropdown shows `planning` and `cancelled`.
- Admin: Move to `planning` → Dropdown shows `scheduled`, `cancelled`.
- Admin: Move to `scheduled` → Dropdown shows `in_progress`, `cancelled`.
- Engineer: `scheduled` job → only `in_progress` available. Safety checklist gate enforced.
- Engineer: `in_progress` → only `completed` available. Site report gate enforced.
- Admin: `completed` job → only `cancelled` available.
- Admin: `cancelled` → only `planning` available (revive).

- [ ] **Step 2: Verify kanban drag-and-drop**

- Navigate to Jobs page, toggle to Kanban view.
- Drag a card from one column to another → status updates in DB.
- Toast confirms success or shows error.

- [ ] **Step 3: Verify settings**

- Open a job as admin → JobSettingsPanel visible, toggle a setting, save → `job_settings` updated.
- Disable `scaffolder_can_upload_photos` → upload buttons hidden for scaffolder.
- Navigate to `/admin/settings` → toggle a global default, save → `admin_settings.default_job_settings` updated.
- Create a new job → verify `job_settings` matches global defaults.

- [ ] **Step 4: Verify badge colors**

- Each of the 6 statuses renders correct color variant in Jobs list, JobDetail, and Dashboard.
