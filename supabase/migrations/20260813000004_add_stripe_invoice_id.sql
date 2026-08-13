-- =============================================================================
-- ETAPA 2: Adicionar stripe_invoice_id para ligar reembolsos a comissões
-- =============================================================================
-- Sem esta coluna, quando chega o webhook `charge.refunded`, não há
-- maneira robusta de localizar a comissão correspondente. O event.id do
-- charge.refunded é diferente do event.id do invoice.paid original, mas
-- ambos referenciam a mesma `invoice.id` Stripe.
--
-- stripe-to-affiliate passa a gravar stripe_invoice_id no momento da
-- criação da comissão. O handler de charge.refunded busca por ela.
-- Idempotente (IF NOT EXISTS). Sem backfill: comissões existentes, se
-- houver, continuam sem invoice_id (e reembolsos pré-existentes não
-- terão mais como ser atribuídos — prática aceitável já que não há
-- comissões em produção).
-- =============================================================================

ALTER TABLE affiliate.commissions
  ADD COLUMN IF NOT EXISTS stripe_invoice_id text;

-- Index para busca rápida por invoice_id quando chega webhook de reembolso.
CREATE INDEX IF NOT EXISTS idx_commissions_stripe_invoice_id
  ON affiliate.commissions (stripe_invoice_id)
  WHERE stripe_invoice_id IS NOT NULL;

-- Idempotência do DEBIT REFUND no ledger (defesa-in-depth: impede
-- duplicar a reversão de saldo se o webhook charge.refunded disparar
-- duas vezes para a mesma comissão — Stripe retry em 5xx).
CREATE UNIQUE INDEX IF NOT EXISTS idx_ledger_refund_unique
  ON finance.ledger_entries (reference_id)
  WHERE reference_type = 'REFUND';

-- Verificação (informativo).
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'affiliate'
  AND table_name = 'commissions'
ORDER BY ordinal_position;