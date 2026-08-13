-- =============================================================================
-- CopyMonster — Diagnóstico do programa de afiliados (versão à prova de cache)
-- =============================================================================
-- Rode no Supabase Dashboard → SQL Editor → New query.
-- Tudo em UMA única query (UNION ALL). Cada coluna é cast explicitamente para text.
-- NÃO modifica nenhum dado. Somente leitura.
-- =============================================================================

WITH snapshot AS (
  SELECT
    '1_commissions'::text                       AS chk,
    status::text                                AS k1,
    ''::text                                    AS k2,
    count(*)::text                              AS total,
    COALESCE(SUM(commission_amount), 0)::text   AS valor
  FROM affiliate.commissions
  GROUP BY status

  UNION ALL

  SELECT
    '2_ledger'::text,
    entry_type::text,
    reference_type::text,
    count(*)::text,
    COALESCE(SUM(amount), 0)::text
  FROM finance.ledger_entries
  GROUP BY entry_type, reference_type

  UNION ALL

  SELECT
    '3_payouts'::text,
    status::text,
    ''::text,
    count(*)::text,
    COALESCE(SUM(amount), 0)::text
  FROM finance.payout_requests
  GROUP BY status

  UNION ALL

  SELECT
    '4_profiles'::text,
    kyc_status::text,
    active::text,
    count(*)::text,
    '0'::text
  FROM affiliate.profiles
  GROUP BY kyc_status, active

  UNION ALL

  SELECT
    '5_rule_active'::text,
    COALESCE(version_name, '(nenhuma regra ativa)'::text),
    COALESCE(
      percentage::text || '% / retencao ' || retention_days || 'd / min $' || min_payout_amount,
      ''::text
    ),
    CASE WHEN is_current THEN '1'::text ELSE '0'::text END,
    '0'::text
  FROM affiliate.commission_rules
  WHERE is_current = true

  UNION ALL

  SELECT * FROM (
    SELECT
      '6_eligible_sample'::text                  AS chk,
      COALESCE(stripe_event_id, '(sem ELIGIBLE)'::text) AS k1,
      COALESCE(commission_amount::text, ''::text) AS k2,
      COALESCE(status::text, ''::text)           AS total,
      COALESCE(extract(epoch from created_at)::bigint::text, ''::text) AS valor
    FROM affiliate.commissions
    WHERE status = 'ELIGIBLE'
    ORDER BY created_at DESC
    LIMIT 10
  ) sample_eligible
)
SELECT * FROM snapshot;