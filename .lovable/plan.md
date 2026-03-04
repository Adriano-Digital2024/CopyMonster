

## Validação Sprint 2 — Análise e Gaps Identificados

Após revisão completa do código das 3 Edge Functions e do frontend, aqui está o diagnóstico honesto de cada ponto:

---

### 1. Refresh automático do token — GAP ENCONTRADO

**Estado atual:** O `meta-oauth` troca o short-lived token por um long-lived token (~60 dias) e armazena `token_expires_at`. Porém, **não existe mecanismo de renovação automática**. Quando o token expira, o sync simplesmente falhará com erro da Meta API sem atualizar o status para `token_expired`.

**Correção necessária:** No `meta-sync`, adicionar verificação de `token_expires_at` ANTES de chamar a API. Se expirado ou próximo (< 7 dias), atualizar status para `token_expired` e retornar erro claro ao frontend.

---

### 2. Tratamento de erros da Meta API — PARCIAL

**Estado atual:** Erros são logados em `integration_logs` com `event_type: 'api_error'`, mas o `status` da integração em `user_integrations` **nunca é atualizado** quando ocorre token inválido ou permissão removida. O frontend continua mostrando "connected" mesmo com token morto. Não há prevenção contra loops — cada sync tenta novamente mesmo com erros permanentes.

**Correção necessária:** Detectar error codes da Meta (190 = token inválido, 10 = permissão removida, etc.) e atualizar o `status` da integração para valores como `token_expired` ou `error`. O frontend deve reagir a esses status.

---

### 3. Rate Limit Global — GAP

**Estado atual:** Existe cooldown de 15 min por usuário, mas **zero proteção global**. Se 100 usuários sincronizarem simultaneamente, todos atingem o rate limit do App na Meta.

**Correção recomendada (v2):** Isso é aceitável para a v1 com poucos usuários. Para escalar, será necessário implementar uma fila (pg_cron + batch processing) ou semáforo global. Documentar como limitação conhecida da v1.

---

### 4. Performance e Indexação — GAP

**Estado atual:** As tabelas `ads_data` e `instagram_data` **não possuem índices** além do PK. Queries por `user_id` e `date_range_start` serão lentas com crescimento.

**Correção necessária:** Migração SQL para criar índices:
- `ads_data`: index em `(user_id, date_range_start)` e `(user_id, ad_id)`
- `instagram_data`: index em `(user_id, synced_at)` e `(user_id, post_id)`

---

### 5. Dados ao Desconectar — PRESERVADOS (correto)

**Estado atual:** O `meta-disconnect` limpa tokens e atualiza status para `disconnected`, mas **preserva** `ads_data` e `instagram_data`. Isso é o comportamento correto — dados históricos são ativos estratégicos.

**Nenhuma correção necessária**, apenas documentar como intencional.

---

### 6. Métricas vs Criativos — GAP PARCIAL

**Estado atual:** A tabela `ads_data` tem campos `ad_creative_body` e `ad_creative_title`, mas o `meta-sync` **não os preenche**. A API call não solicita `ad.creative{body,title}` nos fields.

**Correção necessária:** Após coletar insights, fazer uma chamada adicional para `GET /{ad_id}?fields=creative{body,title,link_url}` para associar o copy ao desempenho. Isso é fundamental para o DNA Intelligence Engine.

---

### 7. Status Estruturado — GAP

**Estado atual:** O campo `status` em `user_integrations` usa apenas `connected` e `disconnected`. Não há tratamento para `token_expired`, `permission_revoked`, `rate_limited` ou `error`.

**Correção necessária:** Expandir os status possíveis e atualizar o `meta-sync` para transicionar entre eles com base nos erros da Meta API. O frontend já lida com status via Badge — basta mapear os novos valores.

---

### 8. Segurança — CONFIRMADO

- Tokens são criptografados via `pgp_sym_encrypt()` na function `upsert_user_integration` (SECURITY DEFINER)
- `ENCRYPTION_KEY` é acessada apenas via `Deno.env.get()` nas Edge Functions
- Nenhum `console.log` contém tokens — apenas user IDs e status
- O frontend nunca recebe tokens — apenas status e metadados
- Decriptação ocorre apenas no `meta-sync` via `get_decrypted_token` (SECURITY DEFINER)

---

### Plano de Correções (Sprint 2.1 — Hardening)

**Migração SQL:**
1. Adicionar índices de performance em `ads_data` e `instagram_data`

**Edge Function `meta-sync` — Atualizar:**
1. Verificar `token_expires_at` antes de chamar a API — se expirado, setar status `token_expired` e retornar erro
2. Detectar error codes da Meta (190, 10, 4) e atualizar status da integração (`token_expired`, `permission_revoked`, `rate_limited`)
3. Após coletar insights de ads, fazer chamada adicional para buscar `creative{body,title}` e popular `ad_creative_body` / `ad_creative_title`

**Frontend `Settings.tsx` — Atualizar:**
1. Mapear novos status (`token_expired`, `error`, `permission_revoked`) no Badge e mostrar mensagem/ação apropriada (ex: "Reconectar")

**i18n — Adicionar ~8 chaves:**
1. Mensagens para `token_expired`, `permission_revoked`, `reconnect` nos 3 idiomas

**Nenhuma alteração em:**
- Rotas existentes, Stripe, agentes, auth, tabelas atuais
- Apenas updates em `meta-sync`, `Settings.tsx`, e nova migração SQL

