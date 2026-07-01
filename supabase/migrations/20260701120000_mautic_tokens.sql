-- Table to store encrypted Mautic OAuth2 tokens (server-to-server integration)
-- Encryption/decryption is handled inside the edge functions using Web Crypto API
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
