-- ============================================================================
-- ETAPA 5: Shared-secret auth for internal sync edge functions
-- 1. Cria helper para ler INTERNAL_WEBHOOK_SECRET do current_setting
-- 2. Atualiza notify_mautic_on_profile_change() para usar o secret
-- 3. Atualiza notify_agentes_on_profile_change() para usar o secret
-- 4. Atualiza notify_sender_on_profile_change() para usar o secret (triggers
--    foram dropados em 20260701120002, mas a função existe para futuro uso)
-- ============================================================================
-- IMPORTANTE: Após aplicar esta migração, configure o secret:
--   ALTER DATABASE postgres SET app.settings.internal_webhook_secret = '<seu-secret-aleatorio>';
-- E nos secrets da edge function:
--   supabase secrets set INTERNAL_WEBHOOK_SECRET=<mesmo-secret>
-- ============================================================================

-- 1. Helper function to read the webhook secret from DB config
CREATE OR REPLACE FUNCTION public.get_internal_webhook_secret()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('app.settings.internal_webhook_secret', true)
$$;

REVOKE EXECUTE ON FUNCTION public.get_internal_webhook_secret()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_internal_webhook_secret() TO service_role;

-- 2. Update notify_mautic_on_profile_change() — latest version from 20260706012340
CREATE OR REPLACE FUNCTION public.notify_mautic_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _payload jsonb;
  _event_type text;
  _secret text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'new_user';
  ELSIF TG_OP = 'UPDATE' THEN
    _event_type := 'plan_update';
  END IF;

  _payload := jsonb_build_object(
    'type', _event_type,
    'record', jsonb_build_object(
      'email', NEW.email,
      'first_name', NEW.first_name,
      'phone', COALESCE(NEW.phone, ''),
      'subscription_status', NEW.subscription_status
    )
  );

  _secret := public.get_internal_webhook_secret();

  IF _secret IS NULL OR _secret = '' THEN
    INSERT INTO public.mautic_sync_log (email, event_type, status, error)
    VALUES (NEW.email, _event_type, 'queue_failed', 'INTERNAL_WEBHOOK_SECRET not configured');
    RAISE WARNING '[mautic-sync] INTERNAL_WEBHOOK_SECRET not configured — skipping sync';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-sync',
    body := _payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _secret
    )
  );

  INSERT INTO public.mautic_sync_log (email, event_type, status)
  VALUES (NEW.email, _event_type, 'queued');

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO public.mautic_sync_log (email, event_type, status, error)
    VALUES (NEW.email, COALESCE(_event_type, TG_OP), 'queue_failed', SQLERRM);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '[mautic-sync] Failed to log queue failure: %', SQLERRM;
  END;
  RAISE WARNING '[mautic-sync] Failed to queue HTTP request: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 3. Update notify_agentes_on_profile_change() — from 20260419190911
CREATE OR REPLACE FUNCTION public.notify_agentes_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _payload jsonb;
  _event_type text;
  _secret text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'new_lead';
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only fire on relevant changes
    IF NEW.subscription_status IS DISTINCT FROM OLD.subscription_status
       OR NEW.trial_expires_at IS DISTINCT FROM OLD.trial_expires_at
       OR NEW.first_name IS DISTINCT FROM OLD.first_name
       OR NEW.phone IS DISTINCT FROM OLD.phone
       OR NEW.email IS DISTINCT FROM OLD.email THEN
      _event_type := 'plan_update';
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  _payload := jsonb_build_object(
    'type', _event_type,
    'record', jsonb_build_object(
      'id', NEW.id,
      'email', NEW.email,
      'first_name', COALESCE(NEW.first_name, ''),
      'phone', COALESCE(NEW.phone, ''),
      'subscription_status', NEW.subscription_status,
      'created_at', NEW.created_at,
      'trial_expires_at', NEW.trial_expires_at
    )
  );

  _secret := public.get_internal_webhook_secret();

  IF _secret IS NULL OR _secret = '' THEN
    RAISE WARNING '[agentes-sync] INTERNAL_WEBHOOK_SECRET not configured — skipping sync';
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/agentes-sync',
    body := _payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _secret
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[agentes-sync] Failed to queue HTTP request: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- 4. Update notify_sender_on_profile_change() — from 20260314020806
--    Triggers were dropped in 20260701120002, but function is updated
--    for future re-enablement.
CREATE OR REPLACE FUNCTION public.notify_sender_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _payload jsonb;
  _event_type text;
  _secret text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'new_user';
  ELSIF TG_OP = 'UPDATE' THEN
    _event_type := 'plan_update';
  END IF;

  _payload := jsonb_build_object(
    'type', _event_type,
    'record', jsonb_build_object(
      'email', NEW.email,
      'first_name', NEW.first_name,
      'phone', COALESCE(NEW.phone, ''),
      'subscription_status', NEW.subscription_status
    )
  );

  _secret := public.get_internal_webhook_secret();

  IF _secret IS NULL OR _secret = '' THEN
    RAISE WARNING '[sender-sync] INTERNAL_WEBHOOK_SECRET not configured — skipping sync';
    RETURN NEW;
  END IF;

  PERFORM extensions.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/sender-sync',
    body := _payload::text,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || _secret
    )::jsonb
  );

  RETURN NEW;
END;
$$;