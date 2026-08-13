-- =============================================================================
-- CopyMonster — Diagnóstico do estado do programa de afiliados
-- =============================================================================
-- Rode no Supabase Dashboard → SQL Editor → New query.
-- Cole os 6 resultados de volta para decidir se a Etapa 1 (PENDING_VALIDATION)
-- precisa de backfill SQL ou pode ser implementada limpa.
--
-- NÃO modifica nenhum dado. Somente leitura.
-- =============================================================================

-- 1. Comissões por status (define se há ELIGIBLE que precisam rebaixar)
SELECT status, count(*) AS total,
       COALESCE(SUM(commission_amount), 0) AS valor_total
FROM affiliate.commissions
GROUP BY status
ORDER BY total DESC;

-- 2. Ledger entries (confirma o bug do CREDIT ausente)
SELECT entry_type, reference_type, count(*) AS total,
       COALESCE(SUM(amount), 0) AS valor_total
FROM finance.ledger_entries
GROUP BY entry_type, reference_type
ORDER BY total DESC;

-- 3. Payout requests por status
SELECT status, count(*) AS total,
       COALESCE(SUM(amount), 0) AS valor_total
FROM finance.payout_requests
GROUP BY status
ORDER BY total DESC;

-- 4. Afiliados por KYC/active
SELECT kyc_status, active, count(*) AS total
FROM affiliate.profiles
GROUP BY kyc_status, active
ORDER BY total DESC;

-- 5. Regra de comissão vigente (para conferir retention_days configurado)
SELECT version_name, percentage, retention_days, min_payout_amount, is_current
FROM affiliate.commission_rules
WHERE is_current = true;

-- 6. Amostra de comissões ELIGIBLE (caso existam, para backfill)
SELECT id, affiliate_id, stripe_event_id, commission_amount,
       status, eligible_at, created_at
FROM affiliate.commissions
WHERE status = 'ELIGIBLE'
ORDER BY created_at DESC
LIMIT 10;