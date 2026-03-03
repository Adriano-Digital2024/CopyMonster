
-- Function to upsert user integration with encrypted token
CREATE OR REPLACE FUNCTION public.upsert_user_integration(
  p_user_id uuid,
  p_provider text,
  p_access_token text,
  p_encryption_key text,
  p_token_expires_at timestamptz,
  p_meta_user_id text,
  p_meta_ad_account_id text,
  p_instagram_account_id text,
  p_scopes text[]
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_integrations (
    user_id, provider, status, encrypted_access_token, token_expires_at,
    meta_user_id, meta_ad_account_id, instagram_account_id, scopes, connected_at
  ) VALUES (
    p_user_id, p_provider, 'connected',
    pgp_sym_encrypt(p_access_token, p_encryption_key)::bytea,
    p_token_expires_at, p_meta_user_id, p_meta_ad_account_id,
    p_instagram_account_id, p_scopes, now()
  )
  ON CONFLICT (user_id, provider) DO UPDATE SET
    status = 'connected',
    encrypted_access_token = pgp_sym_encrypt(p_access_token, p_encryption_key)::bytea,
    token_expires_at = p_token_expires_at,
    meta_user_id = p_meta_user_id,
    meta_ad_account_id = p_meta_ad_account_id,
    instagram_account_id = p_instagram_account_id,
    scopes = p_scopes,
    connected_at = now(),
    disconnected_at = null;
END;
$$;

-- Function to get decrypted token
CREATE OR REPLACE FUNCTION public.get_decrypted_token(
  p_user_id uuid,
  p_provider text,
  p_encryption_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
BEGIN
  SELECT pgp_sym_decrypt(encrypted_access_token, p_encryption_key)
  INTO v_token
  FROM public.user_integrations
  WHERE user_id = p_user_id AND provider = p_provider AND status = 'connected';
  
  RETURN v_token;
END;
$$;
