-- ============================================================================
-- ETAPA 3: Secure payout-executor
-- 1. Adiciona CHECK constraint no status de payout_requests
-- 2. Cria unique partial index em ledger_entries para evitar débitos duplicados
-- ============================================================================

-- 1. CHECK constraint em finance.payout_requests.status
--    Estados: REQUESTED → APPROVED → PROCESSING → EXECUTED (ou FAILED)
--    'PAID' mantido para backward compatibility com dados existentes
DO $$
DECLARE
  v_constraint_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'finance.payout_requests'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) LIKE '%status%'
  ) INTO v_constraint_exists;

  IF NOT v_constraint_exists THEN
    ALTER TABLE finance.payout_requests
      ADD CONSTRAINT payout_requests_status_check
      CHECK (status IN ('REQUESTED', 'APPROVED', 'PROCESSING', 'EXECUTED', 'FAILED', 'PAID'));
    RAISE NOTICE 'Added payout_requests_status_check constraint';
  ELSE
    RAISE NOTICE 'Status CHECK constraint already exists on payout_requests';
  END IF;
END $$;

-- 2. Unique partial index em ledger_entries para referências de PAYOUT
--    Defense-in-depth: mesmo que a edge function seja chamada duas vezes,
--    apenas UMA entrada DEBIT pode existir por payout.
--    Se houver duplicatas existentes, remova-as antes de criar o índice:
--      DELETE FROM finance.ledger_entries
--      WHERE reference_type = 'PAYOUT'
--        AND id NOT IN (
--          SELECT MIN(id) FROM finance.ledger_entries
--          WHERE reference_type = 'PAYOUT'
--          GROUP BY reference_id
--        );
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_payout_unique
  ON finance.ledger_entries(reference_id)
  WHERE reference_type = 'PAYOUT';