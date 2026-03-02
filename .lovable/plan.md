

## Analise do Meta Pixel - Problemas Encontrados

### Estado Atual

O Pixel ID `848000381146545` esta corretamente configurado em `src/lib/meta-pixel.ts`. A infraestrutura e solida:
- `MetaPixelTracker` no App.tsx rastreia PageView em todas as rotas automaticamente
- Hook `useMetaPixel` existe com todos os eventos padrao (Lead, Purchase, CompleteRegistration, etc.)
- Consentimento de cookies e respeitado antes de carregar o pixel

### Problema Principal: NENHUM evento esta sendo disparado

O hook `useMetaPixel()` NAO e utilizado em nenhum componente da aplicacao. Isso significa que:

| Evento | Status | Onde deveria estar |
|--------|--------|--------------------|
| PageView | Funcionando | MetaPixelTracker (automatico) |
| CompleteRegistration | NAO disparado | Auth.tsx (apos signup) |
| Lead | NAO disparado | Auth.tsx (apos signup) |
| InitiateCheckout | NAO disparado | Billing.tsx (ao clicar em assinar) |
| StartTrial | NAO disparado | AuthContext.tsx (apos criar conta free) |
| Purchase | NAO disparado | stripe-webhook (servidor) |
| ViewContent | NAO disparado | Agents.tsx, AgentChat.tsx |

### Plano de Correcao

**1. Auth.tsx** - Adicionar tracking de `CompleteRegistration` e `Lead` no callback de signup bem-sucedido

**2. Billing.tsx** - Adicionar tracking de `InitiateCheckout` na funcao `handleCheckout` antes de redirecionar para o Stripe

**3. AgentChat.tsx** - Adicionar tracking de `ViewContent` quando o usuario abre um agente especifico

**4. Noscript fallback no index.html** - Adicionar a tag `<noscript>` do Meta Pixel para usuarios com JavaScript desabilitado (pratica recomendada pelo Meta)

### Arquivos a alterar:
1. `src/pages/Auth.tsx` - CompleteRegistration + Lead
2. `src/pages/dashboard/Billing.tsx` - InitiateCheckout
3. `src/pages/dashboard/AgentChat.tsx` - ViewContent
4. `index.html` - noscript fallback tag

### Nota sobre Purchase
O evento Purchase deveria ser disparado no servidor (stripe-webhook) via Conversions API, nao no frontend. Por ora, nao sera adicionado no cliente pois o usuario ja saiu do site ao pagar no Stripe.

