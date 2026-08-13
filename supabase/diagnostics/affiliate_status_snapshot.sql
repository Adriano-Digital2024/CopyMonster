-- CopyMonster — Diagnóstico afiliados (leitura apenas)
-- Cole num NEW query no Supabase SQL Editor.

SELECT '1_commissions'::text AS chk, status::text AS k1,
       count(*)::text AS total,
       COALESCE(SUM(commission_amount), 0)::text AS valor
FROM affiliate.commissions GROUP BY status

UNION ALL

SELECT '2_ledger'::text, entry_type::text,
       count(*)::text,
       COALESCE(SUM(amount), 0)::text
FROM finance.ledger_entries GROUP BY entry_type

UNION ALL

SELECT '3_payouts'::text, status::text,
       count(*)::text,
       COALESCE(SUM(amount), 0)::text
FROM finance.payout_requests GROUP BY status

UNION ALL

SELECT '4_profiles'::text, kyc_status::text,
       count(*)::text,
       '0'::text
FROM affiliate.profiles GROUP BY kyc_status

UNION ALL

SELECT '5_rule'::text,
       COALESCE(version_name, '(sem regra ativa)'::text),
       COALESCE(percentage::text, '0'),
       COALESCE(retention_days::text, '45')
FROM affiliate.commission_rules WHERE is_current = true;