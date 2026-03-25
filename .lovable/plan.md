

## Fix: Signup Broken by Sender.net Trigger

### Root Cause

The `notify_sender_on_profile_change()` trigger calls `extensions.http_post()` which does not exist. The `pg_net` extension uses the `net` schema, and the function signature is `net.http_post(url, body, params, headers, timeout_milliseconds)`.

This trigger fires on every INSERT into `profiles`, which happens inside the `handle_new_user()` auth trigger. The error aborts the entire signup transaction.

### Fix

Run a migration that replaces the function to use the correct `net.http_post()` call:

```sql
CREATE OR REPLACE FUNCTION public.notify_sender_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Use net.http_post (correct pg_net function)
  PERFORM net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/sender-sync',
    body := _payload::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJjYXR1cGx0ZnZnd2VsaHplem5rIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0MjIyNjUsImV4cCI6MjA3Njk5ODI2NX0.naM7i7VVD4RHGCI5FbTunNToZVZ-nDAP881VUa7WJBg'
    )
  );

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log but don't block signup if Sender sync fails
  RAISE WARNING '[sender-sync] Failed to queue HTTP request: %', SQLERRM;
  RETURN NEW;
END;
$$;
```

Key changes:
1. `extensions.http_post()` → `net.http_post()` (correct schema)
2. `body` passed as `jsonb` (correct type for pg_net)
3. Added `EXCEPTION WHEN OTHERS` block so Sender sync failures never block signups

### Files changed
- New SQL migration only. No application code changes.

