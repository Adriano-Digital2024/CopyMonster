
ALTER TABLE public.copy_results ADD COLUMN is_edited boolean NOT NULL DEFAULT false;
ALTER TABLE public.positioning_mappings ADD COLUMN document text;
ALTER TABLE public.positioning_mappings ADD COLUMN is_edited boolean NOT NULL DEFAULT false;
