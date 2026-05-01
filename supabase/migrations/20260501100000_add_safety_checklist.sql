-- Safety Checklist for Engineer Job Flow
-- Engineers must complete a safety checklist before starting work at a site.
-- This prevents job status transition to "in_progress" without safety confirmation.

-- 1. Create the safety_checklists table
CREATE TABLE IF NOT EXISTS public.safety_checklists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  engineer_id UUID NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT DEFAULT '',
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Each engineer can only have one checklist per job
  UNIQUE(job_id, engineer_id)
);

CREATE INDEX IF NOT EXISTS safety_checklists_job_id_idx ON public.safety_checklists(job_id);
CREATE INDEX IF NOT EXISTS safety_checklists_engineer_id_idx ON public.safety_checklists(engineer_id);

ALTER TABLE public.safety_checklists ENABLE ROW LEVEL SECURITY;

-- 2. RLS Policies
-- Engineers can manage their own checklists
CREATE POLICY "Engineers can manage own safety checklists"
  ON public.safety_checklists FOR ALL TO authenticated
  USING (engineer_id = auth.uid())
  WITH CHECK (engineer_id = auth.uid());

-- Admins can manage all safety checklists
CREATE POLICY "Admins can manage all safety checklists"
  ON public.safety_checklists FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Owners can read safety checklists for their jobs
CREATE POLICY "Owners can read safety checklists for own jobs"
  ON public.safety_checklists FOR SELECT TO authenticated
  USING (public.is_job_owner(job_id, auth.uid()));

-- 3. Function: upsert safety checklist (create or complete)
CREATE OR REPLACE FUNCTION public.upsert_safety_checklist(
  _job_id UUID,
  _items JSONB,
  _notes TEXT DEFAULT ''
)
RETURNS public.safety_checklists
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_checklist public.safety_checklists%ROWTYPE;
  v_all_checked BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate that all items are checked
  SELECT bool_and((item->>'checked')::boolean)
  INTO v_all_checked
  FROM jsonb_array_elements(_items) AS item;

  IF NOT COALESCE(v_all_checked, false) THEN
    RAISE EXCEPTION 'All safety checklist items must be checked';
  END IF;

  -- Upsert: one row per (job_id, engineer_id)
  INSERT INTO public.safety_checklists (job_id, engineer_id, items, notes, completed, completed_at, updated_at)
  VALUES (_job_id, auth.uid(), _items, _notes, true, now(), now())
  ON CONFLICT (job_id, engineer_id)
  DO UPDATE SET
    items = _items,
    notes = _notes,
    completed = true,
    completed_at = COALESCE(safety_checklists.completed_at, now()),
    updated_at = now()
  RETURNING * INTO v_checklist;

  RETURN v_checklist;
END;
$$;

REVOKE ALL ON FUNCTION public.upsert_safety_checklist(UUID, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.upsert_safety_checklist(UUID, JSONB, TEXT) TO authenticated;

-- 4. Function: check if engineer has completed safety checklist for a job
CREATE OR REPLACE FUNCTION public.has_completed_safety_checklist(_job_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.safety_checklists
    WHERE job_id = _job_id AND engineer_id = auth.uid() AND completed = true
  )
$$;

REVOKE ALL ON FUNCTION public.has_completed_safety_checklist(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_completed_safety_checklist(UUID) TO authenticated;

-- 5. Update engineer_update_job_status to require safety checklist before starting work
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

  IF _new_status = 'in_progress'::public.job_status THEN
    IF v_job.status <> 'scheduled'::public.job_status THEN
      RAISE EXCEPTION 'Only scheduled jobs can be started';
    END IF;

    -- Require safety checklist before starting work
    SELECT EXISTS (
      SELECT 1 FROM public.safety_checklists
      WHERE job_id = _job_id AND engineer_id = auth.uid() AND completed = true
    ) INTO v_has_safety_checklist;

    IF NOT v_has_safety_checklist THEN
      RAISE EXCEPTION 'Safety checklist must be completed before starting work';
    END IF;

  ELSIF _new_status = 'completed'::public.job_status THEN
    IF v_job.status <> 'in_progress'::public.job_status THEN
      RAISE EXCEPTION 'Only in-progress jobs can be completed';
    END IF;

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
