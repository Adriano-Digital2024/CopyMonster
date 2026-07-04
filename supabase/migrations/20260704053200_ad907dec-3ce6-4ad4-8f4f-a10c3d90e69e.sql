-- Revoke EXECUTE from public/anon/authenticated on SECURITY DEFINER functions
-- that should only run as triggers or from server-side (service_role) contexts.

-- Trigger functions: only executed by the trigger system, never called directly
REVOKE ALL ON FUNCTION public.notify_sender_on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_mautic_on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_agentes_on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.check_version_limit() FROM PUBLIC, anon, authenticated;

-- Sensitive server-only functions (admin/token management)
REVOKE ALL ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.get_decrypted_token(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.upsert_user_integration(uuid, text, text, text, timestamptz, text, text, text, text[]) FROM PUBLIC, anon, authenticated;

-- Ensure service_role retains full access for server-side use
GRANT EXECUTE ON FUNCTION public.notify_sender_on_profile_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_mautic_on_profile_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_agentes_on_profile_change() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_version_limit() TO service_role;
GRANT EXECUTE ON FUNCTION public.promote_user_to_admin(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_decrypted_token(uuid, text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_user_integration(uuid, text, text, text, timestamptz, text, text, text, text[]) TO service_role;

-- has_role is used inside RLS policies; signed-in users MUST retain EXECUTE.
-- Just ensure anon cannot call it directly.
REVOKE ALL ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, service_role;
