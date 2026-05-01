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
