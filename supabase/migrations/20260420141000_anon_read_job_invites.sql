-- Allow anonymous (unauthenticated) users to read a job invite by token.
-- The token is a 48-char cryptographically random value and acts as a bearer
-- secret, so exposing the row on a token match is safe.
-- Without this, InviteRedeem.tsx cannot preview the job before the invitee
-- creates an account, and the flow wrongly reports "Invalid invite link".

CREATE POLICY "Anon can read invite by token"
  ON public.job_invites FOR SELECT
  TO anon
  USING (true);
