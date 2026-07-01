-- Remove active Sender triggers from the official project.
-- The sender-sync edge function remains in the codebase as an open-source option,
-- but it will no longer be triggered automatically in production.
DROP TRIGGER IF EXISTS on_profile_insert_sender_sync ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_plan_update_sender_sync ON public.profiles;
