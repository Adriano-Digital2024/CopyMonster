-- ============================================================================
-- ETAPA 6: Server-side price allowlist
-- Cria a tabela allowed_prices que mapeia Stripe price_id → plan_id + credits.
-- A edge function create-checkout-session valida contra esta tabela e deriva
-- o planId do priceId, nunca confiando no planId enviado pelo cliente.
-- ============================================================================

-- 1. Criar tabela de preços permitidos
CREATE TABLE IF NOT EXISTS public.allowed_prices (
  price_id text PRIMARY KEY,
  plan_id text NOT NULL,
  credits int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. RLS — apenas service_role pode ler/escrever (edge functions usam service_role)
ALTER TABLE public.allowed_prices ENABLE ROW LEVEL SECURITY;

-- Sem políticas para authenticated/anon — acessível apenas via service_role.

-- 3. Inserir os preços atuais (hardcoded no frontend Billing.tsx)
INSERT INTO public.allowed_prices (price_id, plan_id, credits, active) VALUES
  ('price_1SDH0CRiKNxooUH0m2yK3ttC', 'starter', 1000, true),
  ('price_1SDH2kRiKNxooUH0kbJsDy7T', 'pro', 5000, true),
  ('price_1SDHAJRiKNxooUH0nUcBIFaG', 'legend', 15000, true)
ON CONFLICT (price_id) DO UPDATE
  SET plan_id = EXCLUDED.plan_id,
      credits = EXCLUDED.credits,
      active = EXCLUDED.active,
      updated_at = now();

-- 4. Índice para lookup por plan_id (validar que apenas um price ativo por plano)
CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_prices_active_plan
  ON public.allowed_prices(plan_id)
  WHERE active = true;

-- 5. RPC para validar um price_id e retornar plan_id + credits (service_role only)
CREATE OR REPLACE FUNCTION public.validate_price_id(p_price_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'valid', true,
    'plan_id', ap.plan_id,
    'credits', ap.credits
  ) INTO v_result
  FROM public.allowed_prices ap
  WHERE ap.price_id = p_price_id
    AND ap.active = true;

  IF v_result IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN v_result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_price_id(text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_price_id(text) TO service_role;

-- 6. RPC para rate limiting de criação de checkout sessions
--    Registra a tentativa e retorna true se dentro do limite
CREATE OR REPLACE FUNCTION public.check_checkout_rate_limit(
  p_user_id uuid,
  p_max_per_hour int DEFAULT 5
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count int;
BEGIN
  -- Contar tentativas na última hora
  SELECT count(*) INTO v_count
  FROM public.checkout_attempts
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 hour';

  -- Registrar esta tentativa
  INSERT INTO public.checkout_attempts (user_id)
  VALUES (p_user_id);

  -- Limpar tentativas antigas (housekeeping leve)
  DELETE FROM public.checkout_attempts
  WHERE created_at < now() - interval '24 hours';

  RETURN v_count < p_max_per_hour;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_checkout_rate_limit(uuid, int)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_checkout_rate_limit(uuid, int) TO service_role;

-- 7. Tabela de tentativas de checkout (para rate limiting)
CREATE TABLE IF NOT EXISTS public.checkout_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.checkout_attempts ENABLE ROW LEVEL SECURITY;

-- Sem políticas — apenas service_role acessa.

CREATE INDEX IF NOT EXISTS idx_checkout_attempts_user_created
  ON public.checkout_attempts(user_id, created_at DESC);