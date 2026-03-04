

## Sprint 2.1 — Hardening (CONCLUÍDO)

### Correções implementadas:

1. **Índices de performance** — Criados 4 índices:
   - `ads_data`: `(user_id, date_range_start)` e `(user_id, ad_id)`
   - `instagram_data`: `(user_id, synced_at)` e `(user_id, post_id)`

2. **Verificação de expiração de token** — `meta-sync` verifica `token_expires_at` ANTES de chamar a Meta API:
   - Token expirado → status `token_expired`, retorna erro 401
   - Token expirando em < 7 dias → log de warning, sync continua

3. **Detecção de error codes da Meta** — Função `classifyMetaError()`:
   - Code 190 / subcode 463,467 → `token_expired`
   - Code 10, 102 → `permission_revoked`
   - Code 4 → `rate_limited`
   - Status da integração atualizado automaticamente

4. **Busca de criativos** — `fetchCreativeData()`:
   - Após coletar insights, busca `creative{body,title}` em batch (50 por vez)
   - Popula `ad_creative_body` e `ad_creative_title` em `ads_data`
   - Fundamental para o DNA Intelligence Engine

5. **Frontend atualizado** — Novos status mapeados:
   - Badge com variant `destructive` para `token_expired`, `permission_revoked`, `error`
   - Mensagem de alerta visual para status de erro
   - Botão "Reconectar Meta" para `token_expired` e `permission_revoked`

6. **i18n completo** — ~12 novas chaves em PT/EN/ES:
   - Status: `tokenExpired`, `permissionRevoked`, `rateLimited`
   - Erros: `permissionRevoked`, `permissionRevokedDesc`, `rateLimited`, `rateLimitedDesc`
   - Ação: `reconnect`

### Limitações conhecidas da v1 (documentadas):
- **Rate limit global**: Sem proteção contra múltiplos usuários simultâneos. Aceitável para v1 com poucos usuários. Para escalar: pg_cron + fila.
- **Sem retry automático**: Erros 429 da Meta retornam mensagem ao usuário sem retry.
- **Dados preservados ao desconectar**: Comportamento intencional — dados históricos são ativos estratégicos.
- **Leaked Password Protection**: Requer plano pago do Supabase, será ativado futuramente.
