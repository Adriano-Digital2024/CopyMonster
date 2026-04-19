-- Trigger function: sync profile changes to external "agentes de lançamento" Supabase
CREATE OR REPLACE FUNCTION public.notify_agentes_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _payload jsonb;
  _event_type text;
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

  PERFORM net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/agentes-sync',
    body := _payload::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXR1cGx0ZnZnd2VsaHplem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjIyNjUsImV4cCI6MjA3Njk5ODI2NX0.naM7i7VVD4RHGCI5FbTunNToZVZ-nDAP881VUa7WJBg'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[agentes-sync] Failed to queue HTTP request: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- Drop existing triggers if any (idempotent)
DROP TRIGGER IF EXISTS trg_agentes_sync_insert ON public.profiles;
DROP TRIGGER IF EXISTS trg_agentes_sync_update ON public.profiles;

-- Trigger on INSERT (new lead)
CREATE TRIGGER trg_agentes_sync_insert
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_agentes_on_profile_change();

-- Trigger on UPDATE (plan/contact changes)
CREATE TRIGGER trg_agentes_sync_update
AFTER UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.notify_agentes_on_profile_change();
