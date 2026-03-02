

## Correcao dos Eventos Meta Pixel

3 alteracoes:

### 1. AgentChat.tsx — ViewContent → Lead
Trocar `trackViewContent` por `trackLead` quando o usuario abre um agente (faz mais sentido pois indica interesse real).

### 2. Index.tsx — Adicionar ViewContent
Disparar `ViewContent` na landing page (`/`), pois e o primeiro contato do visitante com o conteudo.

### 3. Auth.tsx — Remover Lead do signup
Manter apenas `CompleteRegistration`. O `Lead` ja sera capturado no AgentChat, entao nao faz sentido duplicar no signup.

### Arquivos:
- `src/pages/dashboard/AgentChat.tsx` — trocar `trackViewContent` por `trackLead`
- `src/pages/Index.tsx` — adicionar `useMetaPixel` + `trackViewContent` no mount
- `src/pages/Auth.tsx` — remover linha `trackLead`

