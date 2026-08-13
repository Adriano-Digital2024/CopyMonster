-- =============================================================================
-- ETAPA 1: Adicionar estado PENDING_VALIDATION + idempotência CREDIT no ledger
-- =============================================================================
-- Modelo alvo (alinhado à política comercial):
--   Stripe cobra → comissão nasce em HOLDING por retention_days (35 dias).
--   Cron diário: HOLDING → PENDING_VALIDATION (depois do prazo + sem refund).
--   Admin valida: PENDING_VALIDATION → ELIGIBLE  (+ CREDIT no ledger — só
--   neste momento o saldo do afiliado aumenta. Antes era automático em 45d).
--   Afiliado pede saque → REQUESTED. Admin executa PayPal → EXECUTED (+ DEBIT).
--
-- Antes: cron promovia HOLDING → ELIGIBLE direto, sem intervenção do admin
-- e sem checar reembolso. O saldo era creditado "magicamente" só por tempo.
-- =============================================================================

-- 1. Novo valor no ENUM de status da comissão.
--    ADD VALUE precisa ser executado fora de uma transação envolvente,
--    por isso usamos DO $$ ... END $$; (não pode estar dentro de IF
--    EXISTS de forma trivial —riding em exception para idempotência).
DO $$ BEGIN
  ALTER TYPE affiliate.commission_status ADD VALUE IF NOT EXISTS 'PENDING_VALIDATION';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Identificador único parcial no ledger para CREDITs de comissão.
--    Impede INSERT duplicado caso o admin aprove duas vezes a mesma
--    comissão (duplo click / race) — DB defende-in-depth references.
--    (Paralelo ao idx_ledger_payout_unique que já protege DEBITs de saque.)
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_commission_unique
  ON finance.ledger_entries (reference_id)
  WHERE reference_type = 'COMMISSION';

-- 3. Verificação (informativo — seguro rodar).
SELECT typname, enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'commission_status'
ORDER BY e.enumsortorder;