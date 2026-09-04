-- ============================================================================
-- Fix: Adicionar preços anuais à tabela allowed_prices
-- O frontend já envia os price_ids anuais, mas a tabela allowed_prices
-- só continha os preços mensais, causando falha na validação server-side.
-- ============================================================================

-- 1. Remover o índice único que impede múltiplos preços ativos por plan_id
DROP INDEX IF EXISTS public.idx_allowed_prices_active_plan;

-- 2. Inserir os preços anuais (plan_id = base name para compatibilidade com webhook)
INSERT INTO public.allowed_prices (price_id, plan_id, credits, active) VALUES
  ('price_1TtcwERiKNxooUH0qUcxjaai', 'starter', 1000, true),
  ('price_1TtcxmRiKNxooUH0YT51blK6', 'pro', 5000, true),
  ('price_1TtczXRiKNxooUH0wjLWYEc6', 'legend', 15000, true)
ON CONFLICT (price_id) DO UPDATE
  SET plan_id = EXCLUDED.plan_id,
      credits = EXCLUDED.credits,
      active = EXCLUDED.active,
      updated_at = now();

-- 3. Recriar o índice único permitindo múltiplos preços ativos por plan_id
--    (mensal + anual ambos ativos para o mesmo plano)
CREATE UNIQUE INDEX IF NOT EXISTS idx_allowed_prices_active_plan
  ON public.allowed_prices(plan_id, price_id)
  WHERE active = true;
