-- ============================================================================
-- ETAPA 1: Lockdown profiles sensitive fields
-- Removes the open UPDATE RLS policy, adds column-level REVOKE on
-- credits/subscription_status/stripe_customer_id/trial_expires_at, creates
-- SECURITY DEFINER RPCs for service-role-only mutations, and adds a
-- defense-in-depth BEFORE UPDATE guard trigger.
-- ============================================================================

-- 1. Drop the open UPDATE policy (allows any authenticated user to write any column)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 2. Recreate with same name but scoped to authenticated + WITH CHECK
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Revoke column-level UPDATE on sensitive fields from non-service roles
--    service_role bypasses this restriction (Supabase superuser-like role)
--    authenticated users can still UPDATE non-sensitive columns (first_name,
--    phone, preferred_language, internal_role, xp, level, etc.)
REVOKE UPDATE (credits, subscription_status, stripe_customer_id, trial_expires_at)
  ON public.profiles FROM authenticated, anon;

-- 4. RPC: consume_credit — atomically decrement credits (service_role only)
--    Returns new balance on success, -1 if user not found, -2 if insufficient
CREATE OR REPLACE FUNCTION public.consume_credit(p_user_id uuid, p_amount int DEFAULT 1)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
BEGIN
  SELECT credits INTO v_current
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  IF v_current < p_amount THEN
    RETURN -2;
  END IF;

  UPDATE public.profiles
  SET credits = v_current - p_amount
  WHERE id = p_user_id;

  RETURN v_current - p_amount;
END;
$$;

-- 5. RPC: grant_credits — atomically add credits (service_role only)
--    Returns new balance on success, -1 if user not found
CREATE OR REPLACE FUNCTION public.grant_credits(
  p_user_id uuid,
  p_amount int,
  p_reason text DEFAULT 'system'
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current int;
BEGIN
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'p_amount must be a positive integer';
  END IF;

  SELECT credits INTO v_current
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN -1;
  END IF;

  UPDATE public.profiles
  SET credits = v_current + p_amount
  WHERE id = p_user_id;

  RETURN v_current + p_amount;
END;
$$;

-- 6. RPC: set_subscription — atomically set subscription_status + optionally
--    grant credits in a single transaction (service_role only)
--    NOTE: The DB CHECK constraint currently allows ('free','pro','legend').
--    'starter' will be added in ETAPA 2. Until then, calling with 'starter'
--    will raise a CHECK constraint violation from the UPDATE.
CREATE OR REPLACE FUNCTION public.set_subscription(
  p_user_id uuid,
  p_status text,
  p_credits_to_grant int DEFAULT 0
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_credits int;
  v_new_credits int;
BEGIN
  IF p_status NOT IN ('free', 'starter', 'pro', 'legend') THEN
    RAISE EXCEPTION 'Invalid subscription status: %', p_status;
  END IF;

  SELECT credits INTO v_current_credits
  FROM public.profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Profile not found: %', p_user_id;
  END IF;

  v_new_credits := CASE
    WHEN p_credits_to_grant > 0 THEN v_current_credits + p_credits_to_grant
    ELSE v_current_credits
  END;

  UPDATE public.profiles
  SET subscription_status = p_status, credits = v_new_credits
  WHERE id = p_user_id;

  RETURN p_status;
END;
$$;

-- 7. Lock down RPCs: only service_role may execute
REVOKE EXECUTE ON FUNCTION public.consume_credit(uuid, int)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.grant_credits(uuid, int, text)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_subscription(uuid, text, int)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.consume_credit(uuid, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.grant_credits(uuid, int, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.set_subscription(uuid, text, int) TO service_role;

-- 8. Guard trigger function — defense-in-depth: blocks non-service-role
--    callers from modifying sensitive columns even if column-level REVOKE
--    is somehow bypassed. Fires BEFORE UPDATE, before update_updated_at.
CREATE OR REPLACE FUNCTION public.guard_sensitive_profile_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_jwt text;
  v_is_service_role boolean := false;
BEGIN
  v_jwt := current_setting('request.jwt.claims', true);

  IF v_jwt IS NOT NULL AND v_jwt != '' THEN
    BEGIN
      v_is_service_role := (v_jwt::json->>'role') = 'service_role';
    EXCEPTION WHEN OTHERS THEN
      v_is_service_role := false;
    END;
  END IF;

  IF NOT v_is_service_role THEN
    IF NEW.credits IS DISTINCT FROM OLD.credits THEN
      RAISE EXCEPTION 'Direct modification of credits is not allowed. Use consume_credit() or grant_credits() RPC.';
    END IF;

    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status THEN
      RAISE EXCEPTION 'Direct modification of subscription_status is not allowed. Use set_subscription() RPC.';
    END IF;

    IF NEW.stripe_customer_id IS DISTINCT FROM OLD.stripe_customer_id THEN
      RAISE EXCEPTION 'Direct modification of stripe_customer_id is not allowed.';
    END IF;

    IF NEW.trial_expires_at IS DISTINCT FROM OLD.trial_expires_at THEN
      RAISE EXCEPTION 'Direct modification of trial_expires_at is not allowed.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- 9. Create the guard trigger (BEFORE UPDATE, fires before update_profiles_updated_at)
DROP TRIGGER IF EXISTS guard_sensitive_profile_fields ON public.profiles;
CREATE TRIGGER guard_sensitive_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_sensitive_profile_fields();

-- 10. Revoke EXECUTE on guard function from clients (trigger invocation still works)
REVOKE EXECUTE ON FUNCTION public.guard_sensitive_profile_fields()
  FROM PUBLIC, anon, authenticated;
