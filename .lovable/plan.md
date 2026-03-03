

## Sprint 2: Meta Ads Integration — Respostas e Decisões Arquiteturais

Abaixo estão as confirmações para cada ponto levantado, seguidas do plano de implementação detalhado.

---

### 1. Segurança e Criptografia — CONFIRMADO

- **Criptografia antes do armazenamento**: Tokens serão criptografados no Edge Function (`meta-oauth`) usando `pgcrypto` com `pgp_sym_encrypt(token, ENCRYPTION_KEY)` ANTES de qualquer INSERT. O banco nunca recebe texto puro.
- **ENCRYPTION_KEY isolada**: Armazenada exclusivamente como Supabase Secret, acessível apenas por Edge Functions via `Deno.env.get()`. Nunca exposta ao frontend.
- **Tokens em logs**: Todos os `console.log` nas Edge Functions usarão apenas IDs e status — nunca valores de token. Exemplo: `[meta-oauth] Token stored for user ${userId}` (sem o token).

---

### 2. Isolamento por Usuário — CONFIRMADO

- Todas as Edge Functions extraem `user_id` do JWT via `supabase.auth.getUser(token)` (padrão já usado em `chat-stream`).
- Todas as queries filtram por `user_id` autenticado.
- Todas as tabelas novas terão RLS com política `auth.uid() = user_id`.
- Nenhuma operação aceita `user_id` via body — sempre extraído do token.

---

### 3. Modelo de Execução do meta-sync — DECISÃO: HÍBRIDO

**Recomendação aplicada:**
- **Sync manual** como padrão: botão "Atualizar dados" na UI, com cooldown de 15 minutos entre syncs por usuário.
- **Preparado para automático**: a arquitetura suporta `pg_cron` futuro, mas NÃO será ativado agora.
- **Rate limit interno**: Edge Function verifica `last_synced_at` antes de chamar a Meta API. Se < 15 min, rejeita.
- **Retry**: Em caso de erro 429 da Meta, responde ao usuário com mensagem clara (sem retry automático na v1). Erros são logados em `integration_logs`.

---

### 4. Logs de Auditoria — CONFIRMADO

A tabela `integration_logs` registrará todos os seguintes eventos via `event_type`:
- `connected` — OAuth concluído com sucesso
- `disconnected` — Usuário desconectou
- `token_refreshed` — Token renovado automaticamente
- `api_error` — Erro na chamada à Meta API (com detalhes no campo `details` jsonb)
- `permission_denied` — Permissão insuficiente detectada
- `data_synced` — Sync concluído com sucesso (com contagem de registros)
- `sync_rejected` — Sync rejeitado por cooldown

---

### 5. Permissões OAuth — Princípio do Menor Privilégio

Permissões exatas solicitadas:
- `ads_read` — Leitura de dados de anúncios (métricas, campanhas)
- `read_insights` — Leitura de insights de performance
- `instagram_basic` — Informações básicas do perfil Instagram
- `instagram_manage_insights` — Métricas de posts do Instagram

**Nenhuma permissão de escrita.** Nenhum `ads_management`, `business_management` ou `publish_*`.

---

### 6. Métricas Ampliadas — CONFIRMADO

A tabela `ads_data` será expandida para incluir as métricas de funil solicitadas:

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `view_content` | integer | ViewContent events |
| `initiate_checkout` | integer | InitiateCheckout events |
| `purchases` | integer | Purchase events |
| `purchase_value` | numeric | Valor total de Purchase |
| `cost_per_view_content` | numeric | Calculado: spend / view_content |
| `cost_per_initiate_checkout` | numeric | Calculado: spend / initiate_checkout |
| `cost_per_purchase` | numeric | Calculado: spend / purchases |

Essas métricas serão coletadas via Meta Marketing API usando `action_type` filtering nos insights. Associadas ao `ad_name` e `campaign_name` para análise por anúncio.

---

### 7. i18n — CONFIRMADO

- Todas as novas strings adicionadas em `src/i18n/config.ts` nos 3 idiomas (PT/EN/ES).
- Zero texto hardcoded — 100% via `t()`.
- Erros da Meta API traduzidos com chaves como `integrations.errors.tokenExpired`.
- Status de conexão, botões, tooltips, notificações — tudo localizado.

---

### 8. Preservação Estrutural — CONFIRMADO

- Zero alterações em rotas existentes
- Zero alterações em componentes existentes (exceto Settings.tsx que ganha uma nova tab)
- Stripe, agentes, auth, tabelas atuais intactos
- Implementação 100% modular: novas tabelas, novos edge functions, nova tab em Settings

---

### 9. Dados: Cache + Histórico

- `ads_data` e `instagram_data` mantêm **histórico permanente** com `date_range_start` / `date_range_end`.
- Cada sync adiciona registros novos (INSERT), não sobrescreve.
- Isso permite análise temporal e alimenta futuramente o DNA Intelligence Engine.
- Cleanup opcional futuro: dados > 12 meses podem ser arquivados.

---

### Plano de Implementação (Sprint 2)

**Passo 1: Secrets**
- Solicitar ao usuário: `META_APP_ID`, `META_APP_SECRET`, `ENCRYPTION_KEY`

**Passo 2: Migração SQL**
- Habilitar `pgcrypto` extension
- Criar tabelas: `user_integrations`, `integration_logs`, `ads_data` (com métricas de funil ampliadas), `instagram_data`
- RLS em todas as tabelas

**Passo 3: Edge Functions**
- `meta-oauth`: Inicia OAuth, recebe callback, criptografa e armazena tokens, registra log
- `meta-disconnect`: Revoga token, atualiza status, registra log
- `meta-sync`: Coleta dados da Meta API com cooldown de 15min, armazena métricas incluindo ViewContent/InitiateCheckout/Purchase, registra log

**Passo 4: Frontend**
- Nova tab "Integrações" em `/dashboard/settings` com connect/disconnect Meta, status, último sync
- ~60 chaves i18n (PT/EN/ES)

**Passo 5: config.toml**
- Adicionar as 3 novas functions com `verify_jwt = false`

