CREATE OR REPLACE FUNCTION public.engineer_update_job_status(_job_id uuid, _new_status public.job_status)
RETURNS public.jobs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.jobs%ROWTYPE;
  v_report_status text;
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

REVOKE ALL ON FUNCTION public.engineer_update_job_status(uuid, public.job_status) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.engineer_update_job_status(uuid, public.job_status) TO authenticated;