ALTER TABLE public.photos ADD COLUMN photo_category text NOT NULL DEFAULT 'general';

COMMENT ON COLUMN public.photos.photo_category IS 'Category: general (owner), before, after';