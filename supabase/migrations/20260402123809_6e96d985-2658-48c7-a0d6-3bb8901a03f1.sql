DROP POLICY IF EXISTS "Engineers can read assigned jobs" ON public.jobs;
CREATE POLICY "Engineers can read assigned jobs" ON public.jobs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.job_assignments
      WHERE job_assignments.job_id = jobs.id
        AND job_assignments.scaffolder_id = auth.uid()
        AND job_assignments.assignment_role = 'engineer'
    )
  );