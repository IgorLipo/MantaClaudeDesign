-- Fix handle_new_user trigger to use signup_role from user metadata
-- Previously hardcoded 'owner' for every new user, causing engineers/scaffolders
-- to have wrong role until the edge function corrected it (which was failing with 401).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'signup_role', 'owner')
  );
  RETURN NEW;
END;
$$;
