-- Allow public (anon) read of job_invites so invite links work before login
DROP POLICY IF EXISTS "Authenticated can read invites" ON public.job_invites;

CREATE POLICY "Public can read invites"
ON public.job_invites
FOR SELECT
TO anon, authenticated
USING (true);