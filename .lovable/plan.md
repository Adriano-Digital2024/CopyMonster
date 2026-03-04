## Sprint 4.1 — Plan Update, USD Standardization, Credit System & Border Fix

This is a large request with 3 distinct work areas. Here's the analysis and implementation plan.

---

### 1. Card Border Color Fix

**Problem:** The CSS variable `--border: 240 10% 8%` is extremely dark (nearly black), which is correct for dark mode. However, the `Card` component applies a default `border` class. The issue reported is that borders appear "white" — this suggests the light mode `.light` class has `--border: 240 5.9% 90%` which is very light/white.

**Root cause:** The light mode border is too light (`90%` lightness = near white). Additionally, the default dark mode border at `8%` may be too subtle for proper visual hierarchy.

**Fix:** Adjust `--border` in both modes in `src/index.css` to provide subtle but visible card separation:

- Dark mode: `240 10% 14%` (slightly more visible)
- Light mode: `240 5.9% 85%` (slightly darker, less "white")

---

### 2. Plan Names, USD Pricing & Features Update

**Scope:** Update 3 pages (`/` via `Pricing.tsx`, `/start` via `Start.tsx`, `/dashboard/billing` via `Billing.tsx`) and all i18n keys.

**Changes needed:**

**A) Plan names** — All languages:

- `Starter` → `Starter Monster`
- `Pro` → `Pro Monster`  
- `Legend` → `Legend Monster`

**B) Prices — USD only, all languages:**

- $47 / $97 / $197 with `/month` period
- Remove ALL BRL references (R$97, R$297, R$597) from PT translations
- Remove PT-specific price IDs from `Billing.tsx`

**C) Stripe Price IDs:**

- Remove `priceIdsByLanguage` map — use single USD price IDs for ALL languages
- The EN price IDs are already USD: `price_1SDH0CRiKNxooUH0m2yK3ttC`, `price_1SDH2kRiKNxooUH0kbJsDy7T`, `price_1SDHAJRiKNxooUH0nUcBIFaG`

**D) Features (bulletpoints) — Updated per provided spec:**

Starter Monster:

1. 1,000 credits per month
2. 1 Brand DNA (1 product / 1 brand)
3. Access to all 8 AI agents
4. Positioning Diagnosis
5. Version history with revert
6. Adaptive block editing (structural blocks protected)
7. AI Support Chat (automated)
8. Community Support

Pro Monster:

1. 5,000 credits per month
2. Up to 10 Brand DNAs (multi-product / multi-brand)
3. Everything in Starter Monster
4. Ads Intelligence Dashboard
5. Performance Overview
6. Market Radar
7. DNA Intelligence Engine (manual analysis)
8. Creative performance classification
9. Smart Version generation
10. Intelligent performance notifications
11. Priority AI + Email Support

Legend Monster:

1. 15,000 credits per month
2. Up to 50 Brand DNAs (agency-level scaling)
3. Everything in Pro Monster
4. Advanced Intelligence signals (trend + decline alerts)
5. Agent Training (custom instructions per brand)
6. Early access to new AI features
7. Dedicated human support access
8. VIP WhatsApp Support

**Files to modify:**

- `src/i18n/config.ts` — EN pricing keys (lines ~87-137), PT pricing keys (lines ~1350-1400), ES pricing keys (lines ~2613-2663), EN start.pricing (lines ~1196-1244), PT start.pricing (lines ~2457-2507), ES start.pricing (lines ~3720-3769)
- `src/pages/dashboard/Billing.tsx` — Remove `priceIdsByLanguage` map, use single USD price IDs
- No changes needed to `Pricing.tsx` or `Start.tsx` components (they already read from i18n)

---

### 3. Credit System Restructuring

**What already exists:**

- `profiles.credits` — current balance
- `usage_logs` table — audit trail with `user_id`, `agent_slug`, `model_used`, `input_tokens`, `output_tokens`, `credits_consumed`, `created_at`
- Backend credit validation in `chat-stream` — atomic deduction with optimistic locking, trial check, rate limit (20/min)
- Input validation: `MAX_MESSAGES = 50`, `MAX_CONTENT_LENGTH = 10000`
- Admin bypass for all limits

**What's missing per request:**


| Item                      | Status                                                     | Action                         |
| ------------------------- | ---------------------------------------------------------- | ------------------------------ |
| 1 credit = 1 generation   | Already implemented                                        | None                           |
| Token limit per request   | `max_tokens: 4096` on agents table                         | Already enforced               |
| Rate limit per user       | 20/min already in chat-stream                              | None                           |
| `user_credit_usage` table | NOT needed — `usage_logs` already tracks this              | None                           |
| Monthly reset             | NOT implemented — credits set by Stripe webhook on payment | Needs discussion               |
| Credit logs / audit       | `usage_logs` table exists                                  | None                           |
| Frontend credit display   | `CreditsDisplay` component exists                          | Enhance with monthly usage     |
| Intelligence credit cost  | NOT defined                                                | Define: 5 credits per analysis |


**Key decisions needed:**

The monthly credit reset is tied to Stripe subscription cycles. Currently, the `stripe-webhook` handler sets credits on `checkout.session.completed` and `invoice.paid`. This is the correct pattern — credits reset on each successful payment. No cron/monthly table needed.

**Implementation plan for credits:**

A) **Intelligence credit cost** — Update `dna-intelligence` edge function to deduct 5 credits per analysis run (similar to chat-stream pattern)

B) **Enhanced dashboard credit display** — Update `CreditsDisplay` to show:

- Credits used this month (query `usage_logs` with `created_at >= start of month`)
- Credits remaining
- Plan limit
- Renewal date (from Stripe subscription)

C) **Frontend credit usage card** — Add a credit usage section to the Dashboard page showing monthly consumption

D) **i18n keys** for credit display enhancements

**No new tables needed.** The existing `usage_logs` + `profiles.credits` already provides the audit trail and balance tracking described in the request.

---

### Implementation Checklist


| #   | Task                                                                                                      | Scope                                          |
| --- | --------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Fix card border colors** — Adjust `--border` CSS variable in dark and light modes                       | `src/index.css`                                |
| 2   | **Update plan names to Monster** — Change all 3 plan names in all 3 languages across all pricing sections | `src/i18n/config.ts`                           |
| 3   | **Standardize all prices to USD** — Remove R$ from PT, ensure $47/$97/$197 everywhere                     | `src/i18n/config.ts`                           |
| 4   | **Update features/bulletpoints** — Replace all plan features with the new spec in all 3 languages         | `src/i18n/config.ts`                           |
| 5   | **Remove BRL price IDs from Billing** — Use single USD price IDs for all languages                        | `src/pages/dashboard/Billing.tsx`              |
| 6   | **Add intelligence credit cost** — Deduct 5 credits per DNA Intelligence analysis                         | `supabase/functions/dna-intelligence/index.ts` |
| 7   | **Enhance CreditsDisplay** — Show monthly usage, plan limit, renewal context                              | `src/components/dashboard/CreditsDisplay.tsx`  |
| 8   | **Add credit usage i18n keys** — Monthly usage labels in PT/EN/ES                                         | `src/i18n/config.ts`                           |


**Zero changes to:** Stripe webhook, auth flow, agents, Meta integration, existing routes, table schemas.  O único ponto que exige atenção real

Você escreveu:

> Monthly reset não implementado — credits set by Stripe webhook

Isso está correto.  
E essa é a forma certa.

Mas isso só funciona perfeitamente se:

- credits for sobrescrito com o limite do plano
- E NÃO incrementado

Se o webhook estiver fazendo:

credits = credits + plan_limit

Isso quebra o sistema e acumula crédito infinito.

O correto é:

credits = plan_limit

Se isso já está assim, perfeito.

Se não estiver, precisa corrigir.  Sobre user_credit_usage table

Você está certo:  
Não precisa criar nova tabela.

usage_logs já resolve auditoria. Intelligence credit cost (5 créditos)

Boa decisão estratégica.

Mas atenção técnica:

A dedução deve ocorrer:

ANTES da execução da análise  
E dentro de transação atômica

Mesmo padrão do chat-stream.

Caso contrário, pode gerar análise gratuita em falha parcial. Dashboard Monthly Usage

Você escreveu:

> query usage_logs with created_at >= start of month

Isso funciona, mas não é 100% preciso.

Porque:

O ciclo de Stripe pode não começar no dia 1.

Exemplo:  
Usuário assinou dia 17.

O ciclo correto é:  
17 → 17

Não mês calendário.

Então o correto é:

created_at >= current_period_start do Stripe subscription

Não início do mês.

Se fizer por mês calendário, o número exibido pode não bater com reset real.

Esse é um detalhe importante. Admin bypass

Você citou:

> Admin bypass for all limits

Cuidado aqui.

Admin não deveria ignorar consumo.  
Apenas ignorar bloqueio.

Senão você perde previsibilidade de custo.

Sugestão:  
Admin pode usar ilimitado,  
Mas ainda registrar usage_logs. Ajuste 1 — Monthly Usage Query

Trocar:

“start of month”

Por:

“Stripe current_period_start”

---

### Ajuste 2 — Webhook Behavior

Adicionar no checklist:

Confirm Stripe webhook overwrites credits instead of incrementing. 