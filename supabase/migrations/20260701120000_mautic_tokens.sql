-- Enable pgcrypto extension for token encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create public wrappers so edge functions can call pgp_sym_encrypt/decrypt via RPC
CREATE OR REPLACE FUNCTION public.pgp_sym_encrypt(data TEXT, key TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT extensions.pgp_sym_encrypt(data, key)::TEXT;
$$;

CREATE OR REPLACE FUNCTION public.pgp_sym_decrypt(data TEXT, key TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT extensions.pgp_sym_decrypt(data, key)::TEXT;
$$;

-- Table to store encrypted Mautic OAuth2 tokens (server-to-server integration)
CREATE TABLE IF NOT EXISTS public.mautic_tokens (
  id TEXT PRIMARY KEY,
  encrypted_access_token TEXT NOT NULL,
  encrypted_refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only service role can access tokens
ALTER TABLE public.mautic_tokens ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role can manage mautic tokens"
  ON public.mautic_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
