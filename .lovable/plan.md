
Resumo

- O toast da imagem (“Falha na sincronização / Não foi possível sincronizar dados da Meta”) é o fallback genérico do frontend em `src/pages/dashboard/Settings.tsx`.
- O antigo problema de `401` já foi tratado no código com `getFreshToken()`, então o erro atual é outro.
- Importante: ao clicar em `Sync Data`, a função usada é `supabase/functions/meta-sync/index.ts`, e ela não usa `META_APP_ID`, `META_APP_SECRET` nem `META_BUSINESS_CONFIG_ID`. Então o App ID não é o causador direto desta etapa.
- Como o card mostra `Connected` e tem `last_synced_at`, a integração existe. O erro mais provável está depois disso: leitura/descriptografia do token salvo, retorno `500` genérico, ou algum código de erro não tratado pelo frontend.
- Do I know what the exact backend branch is? Ainda não exatamente, porque o frontend esconde o detalhe real e os logs recentes não apareceram nas ferramentas de leitura.

Plano

1. Melhorar o tratamento de erro em `src/pages/dashboard/Settings.tsx`
   - verificar `res.ok`
   - ler `data.error` de forma segura
   - tratar explicitamente `not_connected`, `token_not_found`, `Unauthorized` e `Internal server error`
   - mostrar um toast específico em vez do fallback genérico

2. Endurecer `supabase/functions/meta-sync/index.ts`
   - cercar a etapa de `get_decrypted_token` com tratamento explícito
   - retornar códigos estáveis como `token_decrypt_failed`, `token_missing` ou `integration_invalid`
   - incluir no JSON qual etapa falhou (`integration_lookup`, `token_decrypt`, `ads_fetch`, `final_update`)

3. Corrigir o cenário mais provável
   - se o token salvo não puder mais ser lido, marcar a integração como inválida e orientar `Reconnect Meta`
   - evitar cair no `catch` global com resposta opaca

4. Validar ponta a ponta
   - abrir `Settings > Integrations`
   - clicar `Sync Data`
   - confirmar se aparece o erro específico ou sucesso
   - confirmar no `Market Radar` / `Performance` se os dados aparecem após a sincronização

Detalhes técnicos

- `src/pages/dashboard/Settings.tsx:173-227` hoje colapsa vários erros no mesmo toast.
- `supabase/functions/meta-sync/index.ts` usa `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `ENCRYPTION_KEY`; ele não usa `META_APP_ID`.
- Como `cooldown`, `token_expired`, `permission_revoked` e `rate_limited` já têm tratamento próprio no frontend, o erro da imagem provavelmente vem de um caminho não tratado: `token_not_found`, falha de descriptografia, `not_connected` inesperado, ou `500 Internal server error`.
