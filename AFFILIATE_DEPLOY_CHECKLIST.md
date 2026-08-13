# Checklist de Deploy — Programa de Afiliados

> Documento operacional para concluir a ativação do programa de afiliados
> em produção. Cobre exclusivamente as etapas **manuais** que não podem ser
> automatizadas via código (Supabase free tier não aplica migrations nem
> redeploya edge functions automaticamente).

## Status atual (o que já foi concluído no repositório)

Todo o código das etapas R, 1, 2, 3, 4, 5, 6 e 7 já está commitado e
pushado para `main`:

| Etapa | Commit | Entrega |
|---|---|---|
| DeepSeek V4 | `2e39908` | Migrations `20260812000000/01/02` + llm-router |
| R | `4f6ff59` | Migration `20260813000001` — regra default `v1 - Default 2026` (30% / 35d / $50) |
| 4 | `028beef` | Migration `20260813000002` — overhaul RLS (INSERT self-register + admin FOR ALL) |
| 5 | `be9b815` | localStorage unificado em `affiliate_ref` |
| 1 | `d9991f1` | Migration `...00003` (PENDING_VALIDATION) + edge fn `approve-commission` + UI ValidationQueue |
| 2 | `c3ecbe7` | Migration `...00004` (stripe_invoice_id) + handler `charge.refunded` no `stripe-to-affiliate` |
| 3 | `cfe7e53` | Sem code change (cron já correto, anotação de race-safety) |
| 6 | `9f155ee` | Schemas `affiliate` + `finance` no types.ts |
| 7 | — | Secrets PayPal (este documento) |

O frontend (Cloudflare Pages) já está em deploy automático a partir de
`main`. As pendências abaixo são **tudo manual** no Supabase e no Stripe.

---

## PENDENTE 1 — Evento `charge.refunded` no Stripe

O webhook `stripe-to-affiliate` já recebe `invoice.paid`. É preciso
adicionar o evento de reembolso para que a comissão seja bloqueada quando
o cliente pede reembolso.

### Passos (Stripe Dashboard)

1. Acesse **Stripe Dashboard → Developers → Webhooks**.
2. Clique no endpoint que aponta para a edge function `stripe-to-affiliate`
   (`https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/stripe-to-affiliate`).
3. No campo **Events to send**, adicione:
   - `charge.refunded` (já deve existir `invoice.paid` — mantenha ambos).
4. Salve.

> Confirmação da política: reembolsos só ocorrem na janela de 7 dias; com
> retenção de 35 dias, a comissão ainda está em HOLDING quando o reembolso
> chega. O handler marca a comissão como `REFUNDED` e ela nunca é promovida
> a `PENDING_VALIDATION` pelo cron.

---

## PENDENTE 2 — Secrets PayPal no `payout-executor`

O `payout-executor` já lê os secrets; falta configurá-los no Supabase.

### Passos (Supabase Dashboard)

1. Acesse **Supabase Dashboard → Edge Functions → `payout-executor` →
   Secrets**.
2. Adicione os seguintes secrets:

| Secret | Valor | Observação |
|---|---|---|
| `PAYPAL_CLIENT_ID` | Client ID do app PayPal | https://developer.paypal.com → Apps & Credentials |
| `PAYPAL_CLIENT_SECRET` | Secret do mesmo app | alternativa aceita: `PAYPAL_SECRET` |
| `PAYPAL_MODE` | `live` | `sandbox` apenas para testes |
| `PAYPAL_MOCK` | `false` | **obrigatório** — sem isso todo payout é simulado |

> ⚠️ **Atenção ao modo mock**: no código, `PAYPAL_MOCK !== 'false'` significa
> que **se você não definir `PAYPAL_MOCK=false`, todos os saques são simulados**
> (batch id `MOCK_...`, nenhum dinheiro é enviado). Só ative `PAYPAL_MODE=live`
> **e** `PAYPAL_MOCK=false` quando estiver pronto para pagamentos reais.
>
> ⚠️ **Valor mínimo**: o saque mínimo é $50 (`min_payout_amount` da regra
> vigente). O PayPal envia o valor exato da `payout_requests`.

### Configuração de teste (opcional)

Para testar sem risco antes de liberar pagamentos reais:

1. Crie um app **sandbox** no PayPal Developer.
2. Use `PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET` do app sandbox.
3. Defina `PAYPAL_MODE=sandbox` e `PAYPAL_MOCK=false`.
4. Após validar o fluxo, troque para o app `live` e `PAYPAL_MODE=live`.

---

## PENDENTE 3 — Redeploy das edge functions alteradas

O Supabase roda a versão publicada no Dashboard — ela **não** é atualizada
pelo `git push`. Redeployar as edge functions que mudaram nas etapas 1–3:

| Edge function | Fonte (raw.githubusercontent.com/main) |
|---|---|
| `stripe-to-affiliate` | `supabase/functions/stripe-to-affiliate/index.ts` |
| `approve-commission` | `supabase/functions/approve-commission/index.ts` |
| `affiliate-eligibility-check` | `supabase/functions/affiliate-eligibility-check/index.ts` |

### Passos (por edge function)

1. Abra **Supabase Dashboard → Edge Functions → `<nome>`**.
2. Substitua o conteúdo pelo código do `main`.
3. **Salvar e implantar**.

> URL base: `https://raw.githubusercontent.com/Adriano-Digital2024/CopyMonster/main/`

---

## PENDENTE 4 — Migration `20260813000004` (se ainda não aplicada)

Confirmar se a última migration do plano já foi rodada no SQL Editor:

```sql
-- Deve retornar a coluna stripe_invoice_id em affiliate.commissions
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'affiliate'
  AND table_name = 'commissions'
  AND column_name = 'stripe_invoice_id';

-- Deve retornar o índice único (idempotência do DEBIT REFUND)
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'finance'
  AND tablename = 'ledger_entries'
  AND indexname = 'idx_ledger_refund_unique';
```

Se vazio, rode o arquivo completo no SQL Editor:
`supabase/migrations/20260813000004_add_stripe_invoice_id.sql`

---

## Verificação final (SQL de sanidade)

Rode no SQL Editor e confira que produção bate com o plano:

```sql
-- 1. Regra ativa (esperado: v1 - Default 2026, 30%, 35d, $50)
SELECT version_name, percentage, retention_days, min_payout_amount, is_current
FROM affiliate.commission_rules
WHERE is_current = true;

-- 2. Enum de status (esperado incluir PENDING_VALIDATION e REFUNDED)
SELECT e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'commission_status'
ORDER BY e.enumsortorder;

-- 3. RLS aplicado (esperado: policies self-register, admins full access, etc.)
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname IN ('affiliate','finance')
ORDER BY tablename, policyname;

-- 4. Afiliados ativos
SELECT id, full_name, kyc_status, active
FROM affiliate.profiles
WHERE active = true;
```

---

## Resumo de pendências

| # | Item | Onde | Feito? |
|---|---|---|---|
| 1 | Evento `charge.refunded` no webhook | Stripe Dashboard | ☐ |
| 2 | Secrets PayPal (`PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_MODE=live`, `PAYPAL_MOCK=false`) | Supabase → payout-executor | ☐ |
| 3 | Redeploy `stripe-to-affiliate`, `approve-commission`, `affiliate-eligibility-check` | Supabase → Edge Functions | ☐ |
| 4 | Migration `20260813000004` (se faltar) | Supabase → SQL Editor | ☐ |