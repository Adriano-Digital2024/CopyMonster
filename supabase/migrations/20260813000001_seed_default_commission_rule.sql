-- =============================================================================
-- ETAPA R: Semear a primeira regra de comissão default (versão v1 - Default 2026)
-- =============================================================================
-- Problema: em produção NÃO existe nenhuma linha com is_current=true em
-- affiliate.commission_rules. Sem regra ativa, o webhook stripe-to-affiliate
-- retorna "No active commission rule" e descarta TODAS as comissões —
-- afiliados cadastrados nunca ganham nada.
--
-- Esta migration é idempotente: só insere se não existir nenhuma regra ativa.
-- É defensiva: garante que a coluna min_payout_amount existe antes de usá-la.
-- =============================================================================

-- 1. Garante a coluna min_payout_amount (adicionada originalmente em
--    20260715000000_fix_affiliate_schema.sql). Se aquela migration já rodou,
--    isto é no-op (IF NOT EXISTS).
ALTER TABLE affiliate.commission_rules
  ADD COLUMN IF NOT EXISTS min_payout_amount decimal(12,2) DEFAULT 100;

-- 2. Semeia a regra default APENAS se nenhuma regra is_current=true existir.
--    Evita sobrescrever eventual regra que um admin já tenha criado pelo UI.
INSERT INTO affiliate.commission_rules (
  version_name,
  percentage,
  retention_days,
  min_payout_amount,
  is_current,
  active
)
SELECT
  'v1 - Default 2026',
  30.00,
  35,
  50.00,
  true,
  true
WHERE NOT EXISTS (
  SELECT 1 FROM affiliate.commission_rules WHERE is_current = true
);

-- 3. Verificação (informativo, seguro rodar).
SELECT version_name, percentage, retention_days, min_payout_amount,
       is_current, active, created_at
FROM affiliate.commission_rules
ORDER BY is_current DESC, created_at DESC;