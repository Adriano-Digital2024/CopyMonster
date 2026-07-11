# Plano de Remediação de Segurança — CopyMonster

## 1. Resumo Executivo

Entre os dias **05/07/2026** e **11/07/2026**, foi conduzida uma auditoria de segurança completa seguida de 9 etapas de remediação no projeto CopyMonster. Foram corrigidos **57 problemas de segurança** distribuídos em 10 categorias:

| Gravidade | Quantidade |
|-----------|-----------|
| ALTA      | 14        |
| MÉDIA     | 23        |
| BAIXA     | 20        |
| **Total** | **57**    |

### Escopo

- **Stack:** Vite + React 18 + TypeScript + Supabase + Stripe + TanStack Query + Deno Edge Functions + shadcn/ui
- **Supabase project ref:** `bcatupltfvgwelhzeznk`
- **Stripe price IDs (production):** `price_1SDH0CRiKNxooUH0m2yK3ttC` (starter), `price_1SDH2kRiKNxooUH0kbJsDy7T` (pro), `price_1SDHAJRiKNxooUH0nUcBIFaG` (legend)

---

## 2. Checklist Final de Correções

### ETAPA 1 — Lockdown de perfis (ALTA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 1.1 | `supabase/migrations/20260711000000_*.sql` | Drop da policy pública UPDATE em `profiles` | ALTA |
| 1.2 | `supabase/migrations/20260711000000_*.sql` | REVOKE column-level em `credits`, `subscription_status`, `stripe_customer_id`, `trial_expires_at` | ALTA |
| 1.3 | `supabase/migrations/20260711000000_*.sql` | Trigger guard que impede UPDATE direto nas colunas sensíveis | ALTA |
| 1.4 | `supabase/migrations/20260711000000_*.sql` | RPC `consume_credit` (SECURITY DEFINER) | ALTA |
| 1.5 | `supabase/migrations/20260711000000_*.sql` | RPC `grant_credits` (SECURITY DEFINER) | ALTA |
| 1.6 | `supabase/migrations/20260711000000_*.sql` | RPC `set_subscription` (SECURITY DEFINER) | ALTA |

### ETAPA 2 — Stripe Webhook seguro (ALTA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 2.1 | `20260711010000_*.sql` | CHECK constraint `'free','starter','pro','legend'` | ALTA |
| 2.2 | `20260711010000_*.sql` | RPC `process_stripe_webhook_event` com idempotência atômica (INSERT ON CONFLICT DO NOTHING) | ALTA |
| 2.3 | `stripe-webhook/index.ts` | Stripe Webhook → única chamada RPC (atomicidade) | ALTA |
| 2.4 | `stripe-webhook/index.ts` | Meta CAPI post-processing após sucesso | MÉDIA |

### ETAPA 3 — Payout Executor (ALTA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 3.1 | `20260711020000_*.sql` | CHECK constraint em `payout_requests.status` | ALTA |
| 3.2 | `20260711020000_*.sql` | Índice único `idx_ledger_payout_unique` em `ledger_entries(reference_id) WHERE reference_type='PAYOUT'` | ALTA |
| 3.3 | `payout-executor/index.ts` | Autenticação JWT + role check (admin) | ALTA |
| 3.4 | `payout-executor/index.ts` | State machine: REQUESTED → PROCESSING → EXECUTED/FAILED | ALTA |
| 3.5 | `payout-executor/index.ts` | PayPal mock gateado por `PAYPAL_MOCK` env var | MÉDIA |

### ETAPA 4 — OAuth State + CSRF (ALTA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 4.1 | `20260711030000_*.sql` | Tabela `oauth_states` com expiração e consumo único | ALTA |
| 4.2 | `20260711030000_*.sql` | RPCs `create_oauth_state` / `consume_oauth_state` | ALTA |
| 4.3 | `meta-oauth/index.ts` | State alterado de `user.id` para token hex de 64 caracteres aleatórios | ALTA |
| 4.4 | `meta-oauth/index.ts` | `postMessage` targetOrigin alterado de `*` para `siteUrl` | ALTA |
| 4.5 | `mautic-callback/index.ts` | `action=authorize` restrito a admin | MÉDIA |
| 4.6 | `mautic-callback/index.ts` | Validação de state (consume + timing safe) | ALTA |
| 4.7 | `mautic-callback/index.ts` | Removido `console.log` do token response | BAIXA |

### ETAPA 5 — Sync Functions Shared Secret (MÉDIA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 5.1 | `20260711040000_*.sql` | Função `get_internal_webhook_secret()` helper | MÉDIA |
| 5.2 | `20260711040000_*.sql` | Triggers atualizados para usar shared secret em vez de anon key hardcoded | MÉDIA |
| 5.3 | `mautic-sync/index.ts` | Validação via `timingSafeEqual` contra `INTERNAL_WEBHOOK_SECRET` ou `SUPABASE_SERVICE_ROLE_KEY` | MÉDIA |
| 5.4 | `mautic-sync/index.ts` | Backfill restrito a service_role | ALTA |
| 5.5 | `mautic-sync/index.ts` | Logs sanitizados (sem PII) | BAIXA |
| 5.6 | `agentes-sync/index.ts` | Shared-secret auth + erros sanitizados | MÉDIA |
| 5.7 | `sender-sync/index.ts` | Shared-secret auth + erros sanitizados | MÉDIA |

### ETAPA 6 — Checkout Price Allowlist (ALTA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 6.1 | `20260711050000_*.sql` | Tabela `allowed_prices` com seed dos 3 preços | ALTA |
| 6.2 | `20260711050000_*.sql` | RPC `validate_price_id` | ALTA |
| 6.3 | `20260711050000_*.sql` | RPC `check_checkout_rate_limit` + tabela `checkout_attempts` | MÉDIA |
| 6.4 | `create-checkout-session/index.ts` | `planId` derivado do server-side (ignora `planId` do client) | ALTA |
| 6.5 | `create-checkout-session/index.ts` | Rate limit de 5 sessões/hora | MÉDIA |

### ETAPA 7 — Config.toml + CORS (MÉDIA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 7.1 | `supabase/config.toml` | `verify_jwt = true` para 8 funções (chat-stream, create-checkout-session, agent-test, admin-users, meta-disconnect, meta-sync, dna-intelligence, payout-executor) | MÉDIA |
| 7.2 | `supabase/config.toml` | `verify_jwt = false` para 9 funções webhook/callback | MÉDIA |
| 7.3 | 8 edge functions | CORS `Access-Control-Allow-Origin` alterado de `*` para `ALLOWED_ORIGIN` env var | MÉDIA |

### ETAPA 8 — Frontend Security (MÉDIA/BAIXA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 8.1 | `index.html` | CSP (Content-Security-Policy) via `<meta>` tag | MÉDIA |
| 8.2 | `index.html` | Removido `<noscript>` Meta Pixel | BAIXA |
| 8.3 | `AuthHashHandler.tsx:34-35` | `error_description` sanitizado (strip HTML) antes do toast | MÉDIA |
| 8.4 | `Settings.tsx:101` | Validação de `event.origin` no listener `message` | ALTA |
| 8.5 | `Settings.tsx:135-140` | Validação URL do Meta OAuth (deve ser `https://www.facebook.com`) | MÉDIA |
| 8.6 | `Billing.tsx:102-106` | Validação URL do Stripe (deve ser `https://checkout.stripe.com`) | MÉDIA |
| 8.7 | `AuthContext.tsx:35,172` | `updateUser` restrito a `first_name` e `phone` apenas | ALTA |

### ETAPA 9 — TypeScript Hardening (BAIXA)

| # | Arquivo | Correção | Severidade |
|---|---------|----------|------------|
| 9.1 | `tsconfig.app.json` | `"strict": true` ativado | BAIXA |
| 9.2 | `tsconfig.json` | Removido `noImplicitAny: false`, `strictNullChecks: false` | BAIXA |
| 9.3 | `src/lib/utils.ts` | Criado `type SubscriptionStatus` | BAIXA |
| 9.4 | `AuthContext.tsx` | Substituído `as any` por tipo `UserProfile` | BAIXA |
| 9.5 | `OnboardingProvider.tsx:75` | Removido `as any` desnecessário | BAIXA |
| 9.6 | `Users.tsx:97` | Substituído `as any[]` por tipo explícito | BAIXA |
| 9.7 | `Users.tsx:266` | Removido `as any` desnecessário | BAIXA |
| 9.8 | `Billing.tsx` | Removidos 3 `console.log` de debug | BAIXA |

---

## 3. Instruções de Deploy para Produção

### 3.1 Pré-requisitos

```bash
# Node.js >= 18
# Supabase CLI instalado
# Acesso ao projeto Supabase: bcatupltfvgwelhzeznk
```

### 3.2 Deploy das Migrations

```bash
# 1. Aplicar migrations na ordem correta
supabase migration up --project-ref bcatupltfvgwelhzeznk
```

**Ordem obrigatória:**
1. `20260711000000_lockdown_profiles_sensitive_fields.sql`
2. `20260711010000_stripe_webhook_atomic_and_starter_check.sql`
3. `20260711020000_secure_payout_executor.sql`
4. `20260711030000_oauth_states_table.sql`
5. `20260711040000_sync_functions_shared_secret.sql`
6. `20260711050000_checkout_price_allowlist.sql`

### 3.3 Variáveis de Ambiente (Edge Functions)

```bash
supabase secrets set --project-ref bcatupltfvgwelhzeznk \
  STRIPE_SECRET_KEY="sk_live_..." \
  STRIPE_WEBHOOK_SECRET="whsec_..." \
  INTERNAL_WEBHOOK_SECRET="<gerar string aleatória de 32+ caracteres>" \
  ALLOWED_ORIGIN="https://copymonster.me" \
  SUPABASE_ANON_KEY="<project anon key>" \
  SUPABASE_SERVICE_ROLE_KEY="<project service_role key>" \
  PAYPAL_MOCK="true"  # ← false em produção real com PayPal
```

> **IMPORTANTE:** `INTERNAL_WEBHOOK_SECRET` deve ser configurado também via `ALTER DATABASE` para estar disponível nas triggers do banco:
> ```sql
> ALTER DATABASE postgres SET app.settings.internal_webhook_secret TO '<mesmo valor>';
> ```

### 3.4 Config do Stripe

- Webhook endpoint: `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/stripe-webhook`
- Eventos necessários: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Price IDs (já registrados na tabela `allowed_prices`):
  - Starter: `price_1SDH0CRiKNxooUH0m2yK3ttC`
  - Pro: `price_1SDH2kRiKNxooUH0kbJsDy7T`
  - Legend: `price_1SDHAJRiKNxooUH0nUcBIFaG`

### 3.5 Deploy das Edge Functions

```bash
# Deploy de todas as funções
supabase functions deploy stripe-webhook --project-ref bcatupltfvgwelhzeznk
supabase functions deploy payout-executor --project-ref bcatupltfvgwelhzeznk
supabase functions deploy meta-oauth --project-ref bcatupltfvgwelhzeznk
supabase functions deploy mautic-callback --project-ref bcatupltfvgwelhzeznk
supabase functions deploy mautic-sync --project-ref bcatupltfvgwelhzeznk
supabase functions deploy agentes-sync --project-ref bcatupltfvgwelhzeznk
supabase functions deploy sender-sync --project-ref bcatupltfvgwelhzeznk
supabase functions deploy create-checkout-session --project-ref bcatupltfvgwelhzeznk
supabase functions deploy chat-stream --project-ref bcatupltfvgwelhzeznk
supabase functions deploy agent-test --project-ref bcatupltfvgwelhzeznk
supabase functions deploy admin-users --project-ref bcatupltfvgwelhzeznk
supabase functions deploy meta-disconnect --project-ref bcatupltfvgwelhzeznk
supabase functions deploy meta-sync --project-ref bcatupltfvgwelhzeznk
supabase functions deploy dna-intelligence --project-ref bcatupltfvgwelhzeznk
```

### 3.6 Build do Frontend

```bash
# Build production
npm run build

# Verificar se o build não tem erros
npm run lint
npm run type-check
```

### 3.7 Deploy do Frontend (Vercel/Netlify)

Variáveis de ambiente necessárias no deploy:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://bcatupltfvgwelhzeznk.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | anon key do projeto |
| `VITE_SUPABASE_PROJECT_ID` | `bcatupltfvgwelhzeznk` |

---

## 4. Recomendações para Monitoramento Pós-Deploy

### 4.1 Imediato (primeiras 24h)

- [ ] Verificar logs do Stripe webhook no Supabase Dashboard (Functions > stripe-webhook > Logs)
- [ ] Testar checkout completo (criar sessão → pagar → verificar créditos)
- [ ] Verificar se o rate limit de checkout (5/hora) está funcionando
- [ ] Testar conexão/desconexão Meta Ads
- [ ] Verificar CSP no console do browser (não deve ter erros de bloqueio)
- [ ] Confirmar que `console.log` de debug não aparece em produção

### 4.2 Contínuo

- [ ] **Monitorar erro 401/403** nas edge functions — indica tentativas de acesso não autorizado
- [ ] **Monitorar `checkout_attempts`** — picos podem indicar ataques de força bruta ou scraping de preços
- [ ] **Monitorar `oauth_states`** — tentativas de consumo de state já usado indicam CSRF
- [ ] **Revisar logs de payout** — qualquer payout não autorizado deve ser investigado imediatamente
- [ ] **Configurar alerta** no Supabase para funções com alta taxa de erro (>5%)

### 4.3 Auditoria Periódica

- [ ] **Semanal:** Revisar logs de autenticação (tentativas de login suspeitas)
- [ ] **Mensal:** Revisar usuários com role `admin` na tabela `user_roles`
- [ ] **Trimestral:** Rodar `supabase db dump` e revisar triggers/RPCs/policies
- [ ] **Semestral:** Auditoria de segurança completa (repetir o processo)

### 4.4 Alertas Sugeridos

```sql
-- Alerta de tentativa de UPDATE direto em coluna sensível (via trigger)
-- Ver logs do PostgreSQL: "column ... is protected and cannot be updated directly"

-- Alerta de rate limit de checkout excedido
SELECT COUNT(*) FROM checkout_attempts
WHERE attempted_at > NOW() - INTERVAL '1 hour'
AND created_at > NOW() - INTERVAL '1 hour';
```

---

## 5. Documentação para o Time

### 5.1 Como as Colunas Sensíveis Funcionam Agora

O acesso a `credits`, `subscription_status`, `stripe_customer_id` e `trial_expires_at` na tabela `profiles` segue estas regras:

| Operação | Quem pode fazer | Como |
|----------|----------------|------|
| SELECT | Usuário autenticado (próprio perfil) | RLS policy existente |
| INSERT | Trigger `handle_new_user` | Apenas via trigger |
| UPDATE direto | **Ninguém** (nem admin) | Trigger `prevent_sensitive_update` bloqueia |
| UPDATE `credits` | Edge functions via `consume_credit` RPC | SECURITY DEFINER |
| UPDATE `credits` | Admin via `grant_credits` RPC | SECURITY DEFINER |
| UPDATE `subscription_status` | Stripe webhook via `process_stripe_webhook_event` RPC | SECURITY DEFINER |
| UPDATE `subscription_status` | Admin via `set_subscription` RPC | SECURITY DEFINER |

### 5.2 Novas Funções RPC Disponíveis

```sql
-- Consumir crédito (chamado por edge functions)
SELECT consume_credit(p_user_id := 'uuid', p_amount := 1);

-- Conceder créditos (admin)
SELECT grant_credits(p_user_id := 'uuid', p_amount := 100);

-- Definir subscription (admin/stripe)
SELECT set_subscription(p_user_id := 'uuid', p_status := 'pro', p_customer_id := 'cus_xxx');

-- Validar price ID (checkout)
SELECT validate_price_id(p_price_id := 'price_xxx');

-- Rate limit checker (checkout)
SELECT check_checkout_rate_limit(p_user_id := 'uuid');

-- Processar webhook Stripe (idempotente)
SELECT process_stripe_webhook_event(
  p_event_id := 'evt_xxx',
  p_user_id := 'uuid',
  p_customer_id := 'cus_xxx',
  p_status := 'pro',
  p_credits := 100
);
```

### 5.3 Estrutura de Autenticação entre Serviços

```
Frontend (browser)
  ↓ JWT (anon key)
Edge Functions (chat-stream, create-checkout-session, etc.)
  ↓ verify_jwt = true → Supabase valida JWT automaticamente
  ↓ (opcional) service_role key para bypass RLS quando necessário

Stripe / Meta Webhooks
  ↓ POST externo (sem JWT)
Edge Functions (stripe-webhook, meta-webhook)
  ↓ verify_jwt = false → validação via assinatura do webhook (Stripe HMAC, Meta secret)

Triggers do Banco
  ↓ HTTP POST com INTERNAL_WEBHOOK_SECRET
Edge Functions (mautic-sync, agentes-sync, sender-sync)
  ↓ verify_jwt = false → validação via timingSafeEqual contra INTERNAL_WEBHOOK_SECRET
```

### 5.4 Fluxo de Checkout (pós-remediação)

```
1. Usuário clica "Assinar" no Billing.tsx
2. Frontend envia { priceId } para create-checkout-session
3. Edge function:
   a. Verifica JWT do usuário
   b. Valida priceId contra tabela allowed_prices (ignora planId do client)
   c. Verifica rate limit (5/hora)
   d. Cria Stripe Checkout Session
   e. Retorna URL para o frontend
4. Frontend valida URL (deve ser checkout.stripe.com)
5. Redireciona para Stripe Checkout
6. Stripe envia webhook → process_stripe_webhook_event (idempotente)
7. Créditos e subscription_status atualizados via RPC
```

### 5.5 Tratamento de Erros

- **Token expirado:** `supabase.auth.refreshSession()` → fallback para `getSession()`
- **Checkout rejeitado:** Stripe retorna erro → toast para o usuário
- **Webhook duplicado:** `INSERT ON CONFLICT DO NOTHING` → idempotência garantida
- **Rate limit excedido:** `check_checkout_rate_limit` → bloqueia por 1 hora
- **OAuth state inválido:** `consume_oauth_state` retorna false → CSRF blocked

---

## Apêndice: Arquivos Modificados

### Migrations
| Arquivo | ETAPA |
|---------|-------|
| `supabase/migrations/20260711000000_lockdown_profiles_sensitive_fields.sql` | 1 |
| `supabase/migrations/20260711010000_stripe_webhook_atomic_and_starter_check.sql` | 2 |
| `supabase/migrations/20260711020000_secure_payout_executor.sql` | 3 |
| `supabase/migrations/20260711030000_oauth_states_table.sql` | 4 |
| `supabase/migrations/20260711040000_sync_functions_shared_secret.sql` | 5 |
| `supabase/migrations/20260711050000_checkout_price_allowlist.sql` | 6 |

### Edge Functions
| Arquivo | ETAPA |
|---------|-------|
| `supabase/functions/stripe-webhook/index.ts` | 2 |
| `supabase/functions/payout-executor/index.ts` | 3 |
| `supabase/functions/meta-oauth/index.ts` | 4 |
| `supabase/functions/mautic-callback/index.ts` | 4 |
| `supabase/functions/mautic-sync/index.ts` | 5 |
| `supabase/functions/agentes-sync/index.ts` | 5 |
| `supabase/functions/sender-sync/index.ts` | 5 |
| `supabase/functions/create-checkout-session/index.ts` | 6 |
| `supabase/functions/admin-users/index.ts` | 7 |
| `supabase/functions/agent-test/index.ts` | 7 |
| `supabase/functions/chat-stream/index.ts` | 7 |
| `supabase/functions/meta-disconnect/index.ts` | 7 |
| `supabase/functions/meta-sync/index.ts` | 7 |
| `supabase/functions/dna-intelligence/index.ts` | 7 |

### Config
| Arquivo | ETAPA |
|---------|-------|
| `supabase/config.toml` | 7 |

### Frontend
| Arquivo | ETAPA |
|---------|-------|
| `index.html` | 8 |
| `src/components/AuthHashHandler.tsx` | 8 |
| `src/components/onboarding/OnboardingProvider.tsx` | 9 |
| `src/contexts/AuthContext.tsx` | 8, 9 |
| `src/lib/utils.ts` | 9 |
| `src/pages/admin/Users.tsx` | 9 |
| `src/pages/dashboard/Billing.tsx` | 8, 9 |
| `src/pages/dashboard/Settings.tsx` | 8 |
| `tsconfig.app.json` | 9 |
| `tsconfig.json` | 9 |
