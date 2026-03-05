

## Diagnóstico: `ERR_BLOCKED_BY_RESPONSE` no Meta OAuth

### Problema Real

O código backend está correto -- a URL gerada já contém `config_id=1920808931973572` (confirmado nos network requests). O problema é que o `window.open()` tenta abrir um popup do Facebook a partir do iframe do preview Lovable, e o Facebook bloqueia isso com o header `X-Frame-Options: DENY`.

Porém, mesmo em produção, popups podem ser bloqueados por pop-up blockers. A solução mais robusta é usar `window.location.href` como fallback quando o popup falhar.

### Mudança Proposta

**Arquivo:** `src/pages/dashboard/Settings.tsx` (linhas 96-98)

Alterar a lógica de `handleConnectMeta` para:
1. Tentar abrir popup com `window.open()`
2. Se o popup for bloqueado (retorna `null`), redirecionar a página inteira com `window.location.href`

```typescript
if (data.url) {
  const popup = window.open(data.url, 'meta-oauth', 'width=600,height=700');
  if (!popup || popup.closed) {
    // Popup blocked - redirect full page instead
    window.location.href = data.url;
  }
} else {
  throw new Error('No OAuth URL returned');
}
```

Isso também requer ajustar o callback no backend para redirecionar de volta ao app em vez de usar `window.opener.postMessage` quando não há popup. Precisamos atualizar o `meta-oauth` edge function para detectar isso.

### Mudança no Backend

**Arquivo:** `supabase/functions/meta-oauth/index.ts`

No callback de sucesso/erro, em vez de apenas tentar `window.opener.postMessage`, adicionar fallback de redirecionamento:

```html
<script>
  if (window.opener) {
    window.opener.postMessage({type:'meta-oauth-success'},'*');
    window.close();
  } else {
    window.location.href = 'SITE_URL/dashboard/settings?meta=success';
  }
</script>
```

Usar a variável `siteUrl` (já lida do env) para construir o redirect.

### Resumo das Mudanças

1. **Frontend** (`Settings.tsx`): fallback de `window.location.href` quando popup é bloqueado
2. **Backend** (`meta-oauth/index.ts`): fallback de redirect no callback quando `window.opener` não existe
3. **Frontend** (`Settings.tsx`): detectar query param `?meta=success` ou `?meta=error` no carregamento da página para atualizar o estado da integração

