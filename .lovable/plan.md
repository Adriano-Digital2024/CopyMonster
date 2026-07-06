# Auditoria da integração Mautic

## Estado atual (o que está OK)

- **OAuth callback** (`mautic-callback`): troca `code` por tokens, criptografa via AES-GCM (`_shared/mautic-crypto.ts`) e faz upsert em `mautic_tokens` (id=`primary`). Fluxo completo e funcional.
- **Tokens persistidos**: `mautic_tokens` tem 1 linha (`id=primary`), com access + refresh criptografados. Última renovação: `2026-07-05 03:51 UTC`.
- **Triggers no banco**: `trg_mautic_sync_insert` (AFTER INSERT) e `trg_mautic_sync_update` (AFTER UPDATE OF subscription_status, com `WHEN old IS DISTINCT FROM new`) — corretas.
- **Função `notify_mautic_on_profile_change`**: usa `net.http_post` (pg_net) com args nomeados e header `Authorization: Bearer <anon>`. Correção do `extensions.http_post` já aplicada.
- **`mautic-sync`**: mapeia `subscription_status → Free|Starter|Pro|Legend`, tenta refresh 5min antes do vencimento, cria via `POST /api/contacts/new`, atualiza via `PATCH /api/contacts/{id}/edit`, faz fallback (cria se `plan_update` não achou contato). Estrutura sólida.

## Problemas / riscos identificados

1. **Nunca foi testado end-to-end em produção.**
   - `mautic-sync` tem **zero logs** de Edge Function.
   - Último `profiles.created_at` = `2026-06-22`, anterior à correção da trigger (2026-07-02). Nenhum INSERT/UPDATE real passou pelo caminho corrigido.
   - `net._http_response` tem apenas 1 registro histórico, não relacionado ao Mautic.
   - **Consequência:** não há prova de que a cadeia trigger → pg_net → edge → Mautic API funciona.

2. **Token de acesso vencido no momento (`expires_at = 2026-07-05 04:51`, agora `2026-07-06`).**
   - O caminho de refresh existe e deve funcionar (refresh token do Mautic ainda dentro do prazo típico de 14 dias), mas nunca foi exercitado. Se o refresh falhar, o primeiro cadastro real retornará 401 e o contato não será criado.

3. **Falhas são silenciosas.**
   - Se `net.http_post` lançar exceção (extensão indisponível, argumento inválido), o `EXCEPTION WHEN OTHERS` só emite `RAISE WARNING` — invisível fora dos logs do Postgres.
   - Se `mautic-sync` retornar 4xx/5xx, a resposta é descartada (pg_net é fire-and-forget). Não há retry nem tabela de auditoria.

4. **Race condition no refresh.**
   - Dois eventos simultâneos podem tentar renovar o mesmo refresh token; o Mautic invalida o anterior a cada rotação, quebrando a segunda chamada.

5. **Ausência de healthcheck manual.** Não há forma simples de o admin verificar "o Mautic está respondendo agora?" sem cadastrar um usuário fake.

## Como resolver, em ordem de prioridade

### 1. Validar o fluxo end-to-end antes de mais nada
- Fazer um `UPDATE public.profiles SET subscription_status = subscription_status WHERE id = '<algum id de teste>'` — não, isso não dispara (WHEN exige `DISTINCT`).
- Alternativa: temporariamente alterar o `subscription_status` de um perfil de teste para outro valor e voltar, observando:
  - `net._http_response` (status 2xx do edge),
  - logs de `mautic-sync`,
  - contato aparecendo no Mautic com `plan` correto.
- Se der ruim, os passos 2–4 abaixo cobrem cada modo de falha.

### 2. Adicionar healthcheck + endpoint de teste manual no `mautic-sync`
- Aceitar `type: "ping"` que só valida tokens (refresh se preciso) e chama `GET /api/contacts?limit=1`. Retorna 200/erro estruturado.
- Permite ao admin disparar via `supabase.functions.invoke('mautic-sync', { body: { type: 'ping' } })` e ver na hora se OAuth/rede/API estão OK.

### 3. Auditoria persistente das sincronizações
- Criar tabela `public.mautic_sync_log` (id, created_at, email, event_type, status, http_status, error, mautic_contact_id) com GRANTs e RLS admin-only.
- `mautic-sync` grava uma linha por invocação (sucesso ou falha). Substitui a "cegueira" atual.

### 4. Retry + serialização de refresh
- No `mautic-sync`: se `POST /api/contacts/new` ou `PATCH .../edit` retornar 401, forçar refresh imediato e repetir 1 vez (cobre casos em que o token expirou entre a checagem e a chamada).
- Serializar refresh com `SELECT ... FOR UPDATE` na linha `mautic_tokens` para evitar duas renovações concorrentes.

### 5. Tornar o trigger observável
- Trocar o `RAISE WARNING` por `INSERT INTO mautic_sync_log (..., status='queue_failed', error=SQLERRM)` no bloco `EXCEPTION`, para não perder falhas antes mesmo de sair do Postgres.

### 6. Backfill opcional
- Após confirmar que a integração funciona, oferecer script/edge (`mautic-sync` com `type: "backfill"`) que percorre `profiles` e cria/atualiza contatos existentes no Mautic — os 7 perfis atuais nunca foram enviados.

## Arquivos que serão tocados (na fase de execução, fora do plan mode)

- `supabase/functions/mautic-sync/index.ts` — adicionar `ping`, retry em 401, logging na nova tabela, `FOR UPDATE` no select do token.
- `supabase/migrations/<ts>_mautic_sync_log.sql` — nova tabela + GRANTs + RLS (admin only via `has_role`).
- `supabase/migrations/<ts>_mautic_trigger_logging.sql` — recriar `notify_mautic_on_profile_change` gravando falhas na `mautic_sync_log`.
- (Opcional) `supabase/functions/mautic-sync/index.ts` — suportar `type: "backfill"`.

Nenhuma mudança em frontend, em `sender-sync`, em `agentes-sync`, nem em outras triggers.

## Resposta direta à pergunta

- **Está em total funcionamento?** Não com certeza — o código está tecnicamente correto, mas nunca foi exercitado com dados reais desde a correção do `extensions.http_post → net.http_post`. Token atual está vencido; primeiro evento real vai testar o refresh pela primeira vez.
- **Se `mautic-sync` der erro, como resolver?** Depende do erro:
  - **`Mautic not connected` / falha ao ler `mautic_tokens`**: refazer o OAuth pelo `mautic-callback` (link de autorização do Mautic).
  - **`Failed to refresh Mautic token` (401 no refresh)**: refresh token expirou/foi invalidado — refazer OAuth.
  - **Erro de rede/5xx da API do Mautic**: transitório; após implementar retry (passo 4) resolve sozinho. Enquanto não houver retry, reenviar manualmente via endpoint `ping`/`backfill`.
  - **Silêncio total (sem log)**: quase certamente a trigger não disparou ou o `pg_net` falhou no enqueue — a `mautic_sync_log` do passo 3/5 tornará isso visível.
  - **Contato não recebe `plan`**: verificar se o alias custom field no Mautic é exatamente `plan` (texto curto). Já confirmado no `MAUTIC_INTEGRATION_PLAN.md`, mas revalidar no painel.
