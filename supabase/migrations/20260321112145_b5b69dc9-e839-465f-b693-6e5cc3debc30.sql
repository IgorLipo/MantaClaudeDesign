
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'owner', 'scaffolder', 'engineer');
CREATE TYPE public.job_status AS ENUM ('draft', 'submitted', 'photo_review', 'quote_pending', 'quote_submitted', 'negotiating', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.review_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE public.review_decision AS ENUM ('accepted', 'rejected', 'countered');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- User roles (separate table per security guidelines)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- Regions
CREATE TABLE public.regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  postcode_prefix TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.regions ENABLE ROW LEVEL SECURITY;

-- Jobs
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  lat DOUBLE PRECISION DEFAULT 0,
  lng DOUBLE PRECISION DEFAULT 0,
  status job_status NOT NULL DEFAULT 'draft',
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  scheduled_date TIMESTAMPTZ,
  scheduled_duration INTEGER DEFAULT 0,
  completion_date TIMESTAMPTZ,
  completion_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Job assignments
CREATE TABLE public.job_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  scaffolder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  region_id UUID REFERENCES public.regions(id) ON DELETE SET NULL,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_assignments ENABLE ROW LEVEL SECURITY;

-- Quotes
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  scaffolder_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  review_decision review_decision,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ
);
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- Photos
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE NOT NULL,
  uploader_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  review_status review_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  message TEXT NOT NULL DEFAULT '',
  read BOOLEAN NOT NULL DEFAULT false,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Audit logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT DEFAULT '',
  changes JSONB DEFAULT '{}',
  ip TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
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
  VALUES (NEW.id, 'owner');
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS Policies

-- Profiles: users can read all, update own
CREATE POLICY "Anyone authenticated can read profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (user_id = auth.uid());

-- User roles: users can read own, admins can manage
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Regions: everyone reads, admins manage
CREATE POLICY "Authenticated can read regions" ON public.regions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage regions" ON public.regions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Jobs: owners see own, admins see all, scaffolders see assigned
CREATE POLICY "Admins can manage all jobs" ON public.jobs FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners can read own jobs" ON public.jobs FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners can insert jobs" ON public.jobs FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners can update own jobs" ON public.jobs FOR UPDATE TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Scaffolders can read assigned jobs" ON public.jobs FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.job_assignments WHERE job_id = id AND scaffolder_id = auth.uid())
);

-- Job assignments
CREATE POLICY "Admins can manage assignments" ON public.job_assignments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Scaffolders can read own assignments" ON public.job_assignments FOR SELECT TO authenticated USING (scaffolder_id = auth.uid());
CREATE POLICY "Owners can read assignments for their jobs" ON public.job_assignments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND owner_id = auth.uid())
);

-- Quotes
CREATE POLICY "Admins can manage quotes" ON public.quotes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Scaffolders can manage own quotes" ON public.quotes FOR ALL TO authenticated USING (scaffolder_id = auth.uid());
CREATE POLICY "Owners can read quotes for their jobs" ON public.quotes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND owner_id = auth.uid())
);
CREATE POLICY "Owners can update quotes for their jobs" ON public.quotes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND owner_id = auth.uid())
);

-- Photos
CREATE POLICY "Admins can manage photos" ON public.photos FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read photos for their jobs" ON public.photos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.jobs WHERE id = job_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.job_assignments WHERE job_id = photos.job_id AND scaffolder_id = auth.uid())))
);
CREATE POLICY "Users can upload photos" ON public.photos FOR INSERT TO authenticated WITH CHECK (uploader_id = auth.uid());

-- Notifications: users see own
CREATE POLICY "Users can read own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System can insert notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);

-- Audit logs: admins only
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
