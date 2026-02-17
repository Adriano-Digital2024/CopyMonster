

## Correcao dos 4 Problemas Criticos de Seguranca

### 1. Idempotencia Stripe - Tabela webhook_events

**Migracao SQL:**
- Criar tabela `webhook_events` com colunas: `id` (serial PK), `event_id` (varchar unique not null), `processed_at` (timestamptz default now)
- RLS habilitado sem politicas publicas (apenas service role acessa via webhook)

**`supabase/functions/stripe-webhook/index.ts`:**
- Apos verificar a assinatura do webhook e antes do `switch(event.type)`, consultar `webhook_events` pelo `event.id`
- Se ja existe: retornar `200 OK` com `{ received: true, message: "Already processed" }`
- Se nao existe: processar normalmente e inserir `event_id` na tabela apos sucesso

---

### 2. Autenticacao JWT no create-checkout-session

**`supabase/functions/create-checkout-session/index.ts` - reescrita:**
- Remover aceitacao de `userId` e `userEmail` do body
- Extrair token do header `Authorization`
- Criar cliente Supabase com `SUPABASE_URL` + `SUPABASE_ANON_KEY`
- Chamar `supabase.auth.getUser(token)` para verificar JWT
- Usar `user.id` e `user.email` verificados do JWT
- Aceitar apenas `priceId` e `planId` do body
- Rejeitar com 401 se nao houver token valido

**`src/pages/dashboard/Billing.tsx`:**
- Remover `userEmail` e `userId` do body da chamada `supabase.functions.invoke`
- Enviar apenas `{ priceId, planId }` (o SDK ja envia o JWT automaticamente no header)
- Remover import de `loadStripe` e variavel `stripePromise` (dead code)

---

### 3. CORS Headers Atualizados

Atualizar o objeto `corsHeaders` em todas as 4 edge functions para incluir os headers do cliente Supabase:

```text
Funcoes afetadas:
- supabase/functions/chat-stream/index.ts (linha 4-7)
- supabase/functions/create-checkout-session/index.ts (linha 4-7)
- supabase/functions/stripe-webhook/index.ts (linha 8-10)
- supabase/functions/agent-test/index.ts (linha 4-7)
- supabase/functions/admin-users/index.ts (linha 4-7)
```

Novo valor padrao:
```text
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version'
```

---

### 4. ProtectedRoute Wrapper Centralizado

**Novo arquivo: `src/components/ProtectedRoute.tsx`**
- Importar `useAuth` do AuthContext
- Se `isLoading`: renderizar spinner centralizado (evita flash de conteudo)
- Se `!user`: redirecionar para `/auth` com `<Navigate>`
- Se autenticado: renderizar `<Outlet />` para rotas filhas
- Prop opcional `requireAdmin` para rotas `/admin/*` que verifica `user.isAdmin`

**`src/App.tsx` - Reestruturar rotas:**
- Agrupar rotas `/dashboard/*` dentro de `<Route element={<ProtectedRoute />}>`
- Agrupar rotas `/admin/*` dentro de `<Route element={<ProtectedRoute requireAdmin />}>`
- Rotas publicas (`/`, `/start`, `/auth`, `/reset-password`, `/update-password`, legais) ficam fora

---

### Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Criar tabela `webhook_events` |
| `supabase/functions/stripe-webhook/index.ts` | Idempotencia com checagem pre-processamento |
| `supabase/functions/create-checkout-session/index.ts` | JWT auth via getUser, remover body userId/email |
| `supabase/functions/chat-stream/index.ts` | CORS headers atualizados |
| `supabase/functions/agent-test/index.ts` | CORS headers atualizados |
| `supabase/functions/admin-users/index.ts` | CORS headers atualizados |
| `src/pages/dashboard/Billing.tsx` | Remover userId/email do body + dead code |
| `src/components/ProtectedRoute.tsx` | Novo componente |
| `src/App.tsx` | Rotas protegidas com wrapper |
