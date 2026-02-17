
## Correcoes de dominio pre-deploy

Substituicoes simples de `copymonster.app` para `copymonster.me` em 6 arquivos:

### Edge Functions (HTTP-Referer)

| Arquivo | Linha | De | Para |
|---------|-------|----|------|
| `supabase/functions/chat-stream/index.ts` | 466 | `https://copymonster.app` | `https://copymonster.me` |
| `supabase/functions/agent-test/index.ts` | 99 | `https://copymonster.app` | `https://copymonster.me` |

### Paginas Legais (emails de contato)

| Arquivo | Linhas | De | Para |
|---------|--------|----|------|
| `src/pages/legal/PrivacyPolicy.tsx` | 116 | `privacy@copymonster.app` | `privacy@copymonster.me` |
| `src/pages/legal/TermsOfService.tsx` | 122 | `legal@copymonster.app` | `legal@copymonster.me` |
| `src/pages/legal/CookiePolicy.tsx` | 126 | `privacy@copymonster.app` | `privacy@copymonster.me` |
| `src/pages/legal/GDPR.tsx` | 32, 98, 154 | `gdpr@copymonster.app` | `gdpr@copymonster.me` |

### Total: 8 substituicoes em 6 arquivos

Nenhuma alteracao de logica, rotas ou banco de dados. Apenas find-and-replace de strings.
