-- 1) Lock down SECURITY DEFINER helper functions
REVOKE EXECUTE ON FUNCTION public.upsert_user_integration(uuid, text, text, text, timestamptz, text, text, text, text[]) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_decrypted_token(uuid, text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(text) FROM PUBLIC, anon, authenticated;

-- Trigger-only functions: no direct callers needed
REVOKE EXECUTE ON FUNCTION public.check_version_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_sender_on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_agentes_on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_mautic_on_profile_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- has_role must remain callable by authenticated because RLS policies invoke it
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 2) Discounts: enforce admin-only read via RESTRICTIVE policy (defense in depth)
CREATE POLICY "Discounts readable only by admins (restrictive)"
ON public.discounts
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (public.has_role(auth.uid(), 'admin'::app_role));