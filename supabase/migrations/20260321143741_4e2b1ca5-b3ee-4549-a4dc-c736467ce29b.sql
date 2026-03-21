
-- Add channel to job_comments for private conversations
ALTER TABLE public.job_comments ADD COLUMN channel text NOT NULL DEFAULT 'admin_owner';

-- Add service_type and final_price to jobs
ALTER TABLE public.jobs ADD COLUMN service_type text DEFAULT 'installation';
ALTER TABLE public.jobs ADD COLUMN final_price numeric DEFAULT NULL;

-- Drop old open comment policies (replace with channel-based)
DROP POLICY IF EXISTS "Job stakeholders can read comments" ON public.job_comments;
DROP POLICY IF EXISTS "Job stakeholders can insert comments" ON public.job_comments;

-- Owners: admin_owner channel only for their jobs
CREATE POLICY "Owners can read own channel comments" ON public.job_comments
FOR SELECT TO authenticated
USING (channel = 'admin_owner' AND is_job_owner(job_id, auth.uid()));

CREATE POLICY "Owners can insert own channel comments" ON public.job_comments
FOR INSERT TO authenticated
WITH CHECK (channel = 'admin_owner' AND user_id = auth.uid() AND is_job_owner(job_id, auth.uid()));

-- Scaffolders: admin_scaffolder channel only for assigned jobs
CREATE POLICY "Scaffolders can read own channel comments" ON public.job_comments
FOR SELECT TO authenticated
USING (channel = 'admin_scaffolder' AND is_job_assigned(job_id, auth.uid()));

CREATE POLICY "Scaffolders can insert own channel comments" ON public.job_comments
FOR INSERT TO authenticated
WITH CHECK (channel = 'admin_scaffolder' AND user_id = auth.uid() AND is_job_assigned(job_id, auth.uid()));

-- Engineers: admin_engineer channel
CREATE POLICY "Engineers can read own channel comments" ON public.job_comments
FOR SELECT TO authenticated
USING (channel = 'admin_engineer' AND has_role(auth.uid(), 'engineer'::app_role));

CREATE POLICY "Engineers can insert own channel comments" ON public.job_comments
FOR INSERT TO authenticated
WITH CHECK (channel = 'admin_engineer' AND user_id = auth.uid() AND has_role(auth.uid(), 'engineer'::app_role));

-- Remove owner from seeing raw quotes - they only see final_price
DROP POLICY IF EXISTS "Owners can read quotes for their jobs" ON public.quotes;
DROP POLICY IF EXISTS "Owners can update quotes for their jobs" ON public.quotes;
