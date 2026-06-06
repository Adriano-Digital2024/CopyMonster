# Plano (revisado): Meta Token Refresh + Platform Webhook + Cron

## Escopo

Implementar somente **Platform Webhooks** da Meta (eventos `deauthorize` e `data_deletion_request`, enviados via `signed_request` form-urlencoded). **Não** implementar Graph API Webhooks (`X-Hub-Signature-256`, `entry[].changed_fields`) — fica para fase futura.

## Análise de não-quebra

- `meta-oauth`, `meta-sync`, `meta-disconnect`: **não tocadas**.
- Schemas: **sem alterações** em `user_integrations`, `ads_data`, `instagram_data`, `creative_classifications`.
- Tabela `integration_logs` já existe (confirmado em `<supabase-tables>`) com colunas `id, user_id, provider, event_type, details (jsonb), created_at` — vou reusar. `user_id` é `NOT NULL`, então em webhook sem usuário ainda mapeado uso um UUID zero (`00000000-...`) OU pulo o insert e uso `console.log`. **Decisão**: para eventos sem `user_id` resolvido (assinatura inválida etc.) uso apenas `console.log`; quando o `meta_user_id` resolver para um `user_id`, insiro em `integration_logs`.
- Reutilizo RPCs `get_decrypted_token` e `upsert_user_integration` (já fazem encrypt/decrypt via `ENCRYPTION_KEY`).

## 1) `supabase/functions/meta-token-refresh/index.ts`

- Auth: exige `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` (compara constant-time).
- Seleciona `user_integrations` onde `provider='meta'` AND `status IN ('connected','token_expired')` AND `token_expires_at < now() + interval '7 days'`.
- Para cada (chunks de 10, delay 500ms):
  1. `get_decrypted_token` → token atual
  2. `GET https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=...&client_secret=...&fb_exchange_token=...`
  3. Sucesso → `upsert_user_integration` (preserva `meta_user_id`, `meta_ad_account_id`, `instagram_account_id`, `scopes` lidos antes) + log `token_refreshed`
  4. Falha (`error.code` 190/200) → `UPDATE status='token_expired', disconnected_at=now()` + log `token_refresh_failed`
- Retorna `{ renewed, failed, skipped, total }`. Nunca loga secret nem token bruto.

## 2) `supabase/functions/meta-webhook/index.ts` (Platform Webhooks)

`verify_jwt = false` em `supabase/config.toml`.

### GET (handshake)
- Lê `hub.mode`, `hub.verify_token`, `hub.challenge`.
- Se `hub.verify_token === META_WEBHOOK_VERIFY_TOKEN` → retorna `hub.challenge` em `text/plain` 200. Senão 403.

### POST (Platform events — signed_request)
1. `req.formData()` → extrai campo `signed_request`.
2. Split em `.` → `[encodedSig, encodedPayload]`.
3. Decodifica `encodedSig` de base64url → bytes da assinatura recebida.
4. Calcula `HMAC-SHA256(encodedPayload, META_APP_SECRET)` → bytes esperados.
5. **Constant-time compare**. Se inválido → 403.
6. Decodifica `encodedPayload` (base64url → JSON). Payload tem shape:
   - Deauthorize: `{ user_id, algorithm, issued_at }`
   - Data deletion: `{ user_id, algorithm, issued_at, confirmation_code? }` (e o endpoint precisa gerar confirmation_code se não vier)

### Roteamento por path/query
Meta App permite URLs separadas para Deauthorize Callback URL e Data Deletion Request URL. Vou diferenciar pelo query param `action`:
- `?action=deauthorize` → handler de desautorização
- `?action=data-deletion` → handler de exclusão de dados
(Usuário configura no painel Meta: `.../meta-webhook?action=deauthorize` e `.../meta-webhook?action=data-deletion`.)

### Handler deauthorize
- `meta_user_id = payload.user_id`
- `UPDATE user_integrations SET status='permission_revoked', disconnected_at=now() WHERE provider='meta' AND meta_user_id=$1`
- Log em `integration_logs` (com o `user_id` interno resolvido).
- Retorna `{ success: true }`.

### Handler data_deletion_request
- Resolve `user_id` interno a partir do `meta_user_id`.
- Gera `confirmation_code = crypto.randomUUID()` (se payload não trouxer).
- DELETE em cascade (mesma filosofia do `meta-disconnect` + dados Meta-vinculados):
  - `ads_data WHERE user_id=$1`
  - `instagram_data WHERE user_id=$1`
  - `creative_classifications WHERE user_id=$1`
  - `integration_logs WHERE user_id=$1 AND provider='meta'`
  - `user_integrations WHERE user_id=$1 AND provider='meta'`
- **NÃO** apaga `copy_results`, `positioning_mappings`, `messages`, `profiles` — esses não são "Meta data".
- Resposta **exata conforme spec Meta**:
```json
{
  "url": "https://copymonster.me/legal/data-deletion-status?code=<confirmation_code>",
  "confirmation_code": "<confirmation_code>"
}
```
> Nota da Meta spec oficial: o response DEVE conter `url` e `confirmation_code` como campos top-level — esse é o formato exigido. (Se preferir omitir `confirmation_code` do response e embutir só na URL, ajusto, mas a doc oficial pede ambos.)
- Cria a página `/legal/data-deletion-status?code=...` (rota estática simples já existente em `src/pages/legal/`) — apenas adiciono `DataDeletionStatus.tsx` que exibe o code recebido + status "Processed".

## 3) Migration: pg_cron diário

```sql
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
  'meta-token-refresh-daily',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/meta-token-refresh',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY_HARDCODED>'
    ),
    body := '{}'::jsonb
  );
  $$
);
```
Executada via tool `supabase--insert` (não migration), seguindo o mesmo padrão dos triggers `notify_*` que hardcodam a key.

## 4) Novo secret necessário

- `META_WEBHOOK_VERIFY_TOKEN` — string aleatória que vai no painel Meta App.

Demais (`META_APP_ID`, `META_APP_SECRET`, `ENCRYPTION_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) já existem.

## 5) `supabase/config.toml`

```toml
[functions.meta-token-refresh]
verify_jwt = false

[functions.meta-webhook]
verify_jwt = false
```

## 6) Como testar

1. **Token refresh**: `curl -X POST .../meta-token-refresh -H "Authorization: Bearer <SERVICE_ROLE>"` → ver `{renewed, failed, skipped, total}`.
2. **Webhook handshake**: `curl ".../meta-webhook?hub.mode=subscribe&hub.verify_token=<TOKEN>&hub.challenge=12345"` → resposta `12345`.
3. **Webhook signed_request inválido**: `curl -X POST ".../meta-webhook?action=deauthorize" -F "signed_request=invalid.payload"` → 403.
4. **Cron**: `SELECT * FROM cron.job WHERE jobname='meta-token-refresh-daily';`
5. **Configurar no Meta App**:
   - Deauthorize Callback URL: `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/meta-webhook?action=deauthorize`
   - Data Deletion Request URL: `https://bcatupltfvgwelhzeznk.supabase.co/functions/v1/meta-webhook?action=data-deletion`
   - (Se for Graph API Webhook subscribed: Verify Token = valor de `META_WEBHOOK_VERIFY_TOKEN`.)

## Fora de escopo (não será feito)

- Graph API Webhooks (`X-Hub-Signature-256`, subscriptions, `entry[].changes`).
- Mudanças em UI / `useMetaIntegration.ts` (estados já cobertos).
- Alterações em `meta-oauth`, `meta-sync`, `meta-disconnect`.
- Alterações em schema (`integration_logs` já tem as colunas necessárias).
