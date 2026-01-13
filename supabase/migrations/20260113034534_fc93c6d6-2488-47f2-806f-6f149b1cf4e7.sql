-- Fix 1: Change has_role function from STABLE to VOLATILE to prevent caching issues
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Fix 2: Remove permissive INSERT policy on usage_logs
-- Edge functions use service_role key which bypasses RLS, so this policy is not needed
DROP POLICY IF EXISTS "System can insert usage logs" ON public.usage_logs;