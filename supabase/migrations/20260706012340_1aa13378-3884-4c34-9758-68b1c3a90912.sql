
-- Audit log for Mautic sync events
CREATE TABLE public.mautic_sync_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  email text,
  event_type text NOT NULL,
  status text NOT NULL,
  http_status int,
  mautic_contact_id bigint,
  error text
);

GRANT SELECT, INSERT ON public.mautic_sync_log TO authenticated;
GRANT ALL ON public.mautic_sync_log TO service_role;

ALTER TABLE public.mautic_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view mautic sync log"
ON public.mautic_sync_log
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_mautic_sync_log_created_at ON public.mautic_sync_log(created_at DESC);
CREATE INDEX idx_mautic_sync_log_email ON public.mautic_sync_log(email);

-- Update trigger function to log queue failures into the new audit table
CREATE OR REPLACE FUNCTION public.notify_mautic_on_profile_change()
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

  PERFORM net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-sync',
    body := _payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXR1cGx0ZnZnd2VsaHplem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjIyNjUsImV4cCI6MjA3Njk5ODI2NX0.naM7i7VVD4RHGCI5FbTunNToZVZ-nDAP881VUa7WJBg'
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
