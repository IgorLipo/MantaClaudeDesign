
CREATE TABLE public.scaffolder_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scaffolder_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scaffolder_id, region_id)
);

ALTER TABLE public.scaffolder_regions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage scaffolder_regions"
  ON public.scaffolder_regions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Scaffolders can read own region assignments"
  ON public.scaffolder_regions FOR SELECT TO authenticated
  USING (scaffolder_id = auth.uid());

CREATE POLICY "Authenticated can read scaffolder_regions"
  ON public.scaffolder_regions FOR SELECT TO authenticated
  USING (true);
