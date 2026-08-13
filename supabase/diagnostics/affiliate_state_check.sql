-- =============================================================================
-- CopyMonster — Diagnóstico do estado do programa de afiliados
-- =============================================================================
-- Rode no Supabase Dashboard → SQL Editor → New query.
-- Tudo em UMA única query (UNION ALL) para o Supabase mostrar num só resultado.
-- NÃO modifica nenhum dado. Somente leitura.
-- =============================================================================

SELECT '1_commissions' AS check, status::text AS key1, ''::text AS key2,
       count(*)::text AS total,
       COALESCE(SUM(commission_amount), 0)::text AS valor
FROM affiliate.commissions
GROUP BY status

UNION ALL

SELECT '2_ledger', entry_type::text, reference_type::text,
       count(*)::text, COALESCE(SUM(amount), 0)::text
FROM finance.ledger_entries
GROUP BY entry_type, reference_type

UNION ALL

SELECT '3_payouts', status::text, ''::text,
       count(*)::text, COALESCE(SUM(amount), 0)::text
FROM finance.payout_requests
GROUP BY status

UNION ALL

SELECT '4_profiles', kyc_status::text, active::text,
       count(*)::text, '0'::text
FROM affiliate.profiles
GROUP BY kyc_status, active

UNION ALL

SELECT '5_rule_active'::text,
       COALESCE(version_name, '(nenhuma regra ativa)'::text),
       COALESCE(percentage::text || '% / retencao ' || retention_days || 'd / min $' || min_payout_amount, ''::text),
       CASE WHEN is_current THEN '1' ELSE '0' END,
       '0'::text
FROM affiliate.commission_rules
WHERE is_current = true

UNION ALL

SELECT '6_eligible_sample'::text,
       COALESCE(stripe_event_id, '(sem ELIGIBLE)'::text),
       COALESCE(commission_amount::text, ''::text),
       COALESCE(status::text, ''::text),
       COALESCE(extract(epoch from created_at)::text, ''::text)
FROM affiliate.commissions
WHERE status = 'ELIGIBLE'
ORDER BY created_at DESC
LIMIT 10;