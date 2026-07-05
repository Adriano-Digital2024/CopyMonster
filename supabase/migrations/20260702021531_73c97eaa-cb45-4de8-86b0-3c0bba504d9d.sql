CREATE OR REPLACE FUNCTION public.notify_mautic_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _payload jsonb;
  _event_type text;
  _auth text;
  _headers jsonb;
  _result bigint;
  _email text;
  _first_name text;
  _phone text;
  _status text;
BEGIN
  IF TG_OP = 'INSERT' THEN
    _event_type := 'new_user';
  ELSIF TG_OP = 'UPDATE' THEN
    _event_type := 'plan_update';
  END IF;

  _email := NEW.email;
  _first_name := NEW.first_name;
  _phone := COALESCE(NEW.phone, '');
  _status := NEW.subscription_status;

  _auth := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXR1cGx0ZnZnd2VsaHplem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjIyNjUsImV4cCI6MjA3Njk5ODI2NX0.naM7i7VVD4RHGCI5FbTunNToZVZ-nDAP881VUa7WJBg';

  _payload := jsonb_build_object(
    'type', _event_type,
    'record', jsonb_build_object(
      'email', _email,
      'first_name', _first_name,
      'phone', _phone,
      'subscription_status', _status
    )
  );

  _headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', _auth
  );

  _result := net.http_post(
    'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/mautic-sync',
    _payload::text,
    _headers::jsonb
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '[mautic-sync] Failed: % %', SQLSTATE, SQLERRM;
  RETURN NEW;
END;
$function$;