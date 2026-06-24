-- Clean Slate: wipe all operational data + all non-admin users.
-- KEEPS: admin@mantaray.energy, regions (lookup config), admin_settings.
-- Run in Supabase SQL editor (it uses auth schema, needs service/dashboard access).
-- This is destructive and irreversible. Take a backup first if unsure.

BEGIN;

-- 1. Operational data (child tables first to respect FKs; CASCADE covers the rest).
TRUNCATE TABLE
  safety_checklists,
  site_reports,
  quotes,
  job_assignments,
  photos,
  job_invites,
  notifications,
  audit_logs,
  jobs
RESTART IDENTITY CASCADE;

-- 2. Delete all auth users EXCEPT the admin login.
--    profiles + user_roles rows cascade from auth.users deletion (FK on delete cascade),
--    but we also clean them explicitly in case cascade is not configured.
DELETE FROM auth.users
WHERE email <> 'admin@mantaray.energy';

DELETE FROM public.profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.user_roles
WHERE user_id NOT IN (SELECT id FROM auth.users);

DELETE FROM public.scaffolder_regions
WHERE scaffolder_id NOT IN (SELECT id FROM auth.users);

-- 3. Sanity check — should show only the admin user + its role.
--    (SELECT runs inside the txn; review before COMMIT.)
-- SELECT u.email, r.role FROM auth.users u LEFT JOIN public.user_roles r ON r.user_id = u.id;

COMMIT;
