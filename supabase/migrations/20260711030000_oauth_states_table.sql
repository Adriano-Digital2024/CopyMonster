-- ============================================================================
-- ETAPA 4: OAuth state validation (CSRF protection)
-- Cria tabela oauth_states para armazenar tokens de state criptográficos
-- usados por meta-oauth e mautic-callback.
-- ============================================================================

-- 1. Criar tabela de states OAuth
CREATE TABLE IF NOT EXISTS public.oauth_states (
  state text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL
);

-- 2. Índice para lookup por user_id + provider (limpar states expirados)
CREATE INDEX IF NOT EXISTS idx_oauth_states_user_provider
  ON public.oauth_states(user_id, provider);

-- 3. RLS — apenas service_role pode acessar (edge functions usam service_role)
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Sem políticas para authenticated/anon — a tabela é acessível apenas via
-- service_role (que bypassa RLS). Edge functions usam service_role.

-- 4. RPC para criar um state OAuth (chamada pela edge function com service_role)
CREATE OR REPLACE FUNCTION public.create_oauth_state(
  p_user_id uuid,
  p_provider text,
  p_ttl_seconds int DEFAULT 600
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_state text;
BEGIN
  -- Gerar state criptográfico (32 bytes hex = 64 chars)
  v_state := encode(gen_random_bytes(32), 'hex');

  -- Limpar states expirados deste user+provider (housekeeping)
  DELETE FROM public.oauth_states
  WHERE user_id = p_user_id
    AND provider = p_provider
    AND expires_at < now();

  -- Limpar states expirados globalmente (housekeeping leve)
  DELETE FROM public.oauth_states WHERE expires_at < now();

  -- Inserir novo state
  INSERT INTO public.oauth_states (state, user_id, provider, expires_at)
  VALUES (v_state, p_user_id, p_provider, now() + (p_ttl_seconds || ' seconds')::interval);

  RETURN v_state;
END;
$$;

-- 5. RPC para consumir (validar + deletar) um state OAuth (single-use)
CREATE OR REPLACE FUNCTION public.consume_oauth_state(
  p_state text,
  p_provider text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Validar e deletar atomicamente (single-use)
  DELETE FROM public.oauth_states
  WHERE state = p_state
    AND provider = p_provider
    AND expires_at > now()
  RETURNING user_id INTO v_user_id;

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN v_user_id;
END;
$$;

-- 6. Permissões — apenas service_role
REVOKE EXECUTE ON FUNCTION public.create_oauth_state(uuid, text, int)
  FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.consume_oauth_state(text, text)
  FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.create_oauth_state(uuid, text, int) TO service_role;
GRANT EXECUTE ON FUNCTION public.consume_oauth_state(text, text) TO service_role;