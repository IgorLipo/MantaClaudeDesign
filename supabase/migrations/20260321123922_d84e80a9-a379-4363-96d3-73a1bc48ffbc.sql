
-- 1. Fix infinite recursion: create helper functions that bypass RLS
CREATE OR REPLACE FUNCTION public.is_job_owner(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.jobs WHERE id = _job_id AND owner_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_job_assigned(_job_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.job_assignments WHERE job_id = _job_id AND scaffolder_id = _user_id
  )
$$;

-- 2. Drop and recreate jobs policies to eliminate recursion
DROP POLICY IF EXISTS "Admins can manage all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Owners can read own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Owners can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Owners can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Scaffolders can read assigned jobs" ON public.jobs;

CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can read own jobs" ON public.jobs FOR SELECT TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Owners can insert jobs" ON public.jobs FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners can update own jobs" ON public.jobs FOR UPDATE TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Scaffolders can read assigned jobs" ON public.jobs FOR SELECT TO authenticated
  USING (is_job_assigned(id, auth.uid()));

-- 3. Drop and recreate job_assignments policies to eliminate recursion
DROP POLICY IF EXISTS "Admins can manage assignments" ON public.job_assignments;
DROP POLICY IF EXISTS "Owners can read assignments for their jobs" ON public.job_assignments;
DROP POLICY IF EXISTS "Scaffolders can read own assignments" ON public.job_assignments;

CREATE POLICY "Admins can manage assignments" ON public.job_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Owners can read assignments for their jobs" ON public.job_assignments FOR SELECT TO authenticated
  USING (is_job_owner(job_id, auth.uid()));

CREATE POLICY "Scaffolders can read own assignments" ON public.job_assignments FOR SELECT TO authenticated
  USING (scaffolder_id = auth.uid());

-- 4. Fix photos policies to also avoid recursion
DROP POLICY IF EXISTS "Authenticated can read photos for their jobs" ON public.photos;

CREATE POLICY "Owners and scaffolders can read photos for their jobs" ON public.photos FOR SELECT TO authenticated
  USING (is_job_owner(job_id, auth.uid()) OR is_job_assigned(job_id, auth.uid()));

-- 5. Fix quotes policies to also avoid recursion
DROP POLICY IF EXISTS "Owners can read quotes for their jobs" ON public.quotes;
DROP POLICY IF EXISTS "Owners can update quotes for their jobs" ON public.quotes;

CREATE POLICY "Owners can read quotes for their jobs" ON public.quotes FOR SELECT TO authenticated
  USING (is_job_owner(job_id, auth.uid()));

CREATE POLICY "Owners can update quotes for their jobs" ON public.quotes FOR UPDATE TO authenticated
  USING (is_job_owner(job_id, auth.uid()));

-- 6. Create job_comments table for stakeholder chat
CREATE TABLE public.job_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.job_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage comments" ON public.job_comments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Job stakeholders can read comments" ON public.job_comments FOR SELECT TO authenticated
  USING (is_job_owner(job_id, auth.uid()) OR is_job_assigned(job_id, auth.uid()));

CREATE POLICY "Job stakeholders can insert comments" ON public.job_comments FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND (
      is_job_owner(job_id, auth.uid()) OR
      is_job_assigned(job_id, auth.uid()) OR
      has_role(auth.uid(), 'admin'::app_role) OR
      has_role(auth.uid(), 'engineer'::app_role)
    )
  );

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_comments;
