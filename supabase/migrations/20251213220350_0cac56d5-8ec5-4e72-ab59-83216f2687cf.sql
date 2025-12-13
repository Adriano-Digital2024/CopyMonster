-- Drop and recreate constraint with ALL existing categories plus campaigns
ALTER TABLE public.agents DROP CONSTRAINT IF EXISTS agents_category_check;

ALTER TABLE public.agents ADD CONSTRAINT agents_category_check 
  CHECK (category IN ('copywriting', 'sales', 'social', 'email', 'ads', 'marketing', 'campaigns'));