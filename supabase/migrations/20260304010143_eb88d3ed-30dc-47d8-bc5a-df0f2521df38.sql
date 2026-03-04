-- Add language column to dna_update_suggestions
ALTER TABLE public.dna_update_suggestions 
ADD COLUMN language text DEFAULT 'pt-BR';

-- Make language NOT NULL for future inserts (existing rows get default)
ALTER TABLE public.dna_update_suggestions 
ALTER COLUMN language SET NOT NULL;

-- Create a function to enforce version limits per plan
CREATE OR REPLACE FUNCTION public.check_version_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_version_count integer;
  v_limit integer;
BEGIN
  -- Get user's plan
  SELECT subscription_status INTO v_plan
  FROM public.profiles
  WHERE id = NEW.user_id;

  -- Count existing versions for this mapping
  SELECT COUNT(*) INTO v_version_count
  FROM public.dna_versions
  WHERE mapping_id = NEW.mapping_id AND user_id = NEW.user_id;

  -- Determine limit based on plan
  v_limit := CASE v_plan
    WHEN 'starter' THEN 50
    WHEN 'free' THEN 50
    WHEN 'pro' THEN 500
    WHEN 'legend' THEN 1000
    ELSE 50
  END;

  IF v_version_count >= v_limit THEN
    RAISE EXCEPTION 'Version limit reached for plan %. Max: %', v_plan, v_limit;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger to enforce version limits on insert
CREATE TRIGGER enforce_version_limit
BEFORE INSERT ON public.dna_versions
FOR EACH ROW
EXECUTE FUNCTION public.check_version_limit();
