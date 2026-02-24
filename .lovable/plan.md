

## Analise Completa: Problemas de Interacao no Chat

---

### Problema 1: Conteudo desaparece ao trocar de aba

**Causa raiz:** As mensagens do chat sao armazenadas APENAS em `useState` (linha 59 do ChatInterface.tsx). React state e volatil - existe apenas em memoria. Quando o navegador coloca a aba em segundo plano por tempo suficiente, o browser pode descartar o estado da pagina (especialmente em dispositivos moveis ou com pouca memoria), causando um re-render que zera o state.

**Correcao:** Persistir as mensagens em `sessionStorage` usando o `agentSlug` como chave. Assim, mesmo que o componente re-monte, as mensagens sao recuperadas automaticamente.

Alteracoes no `ChatInterface.tsx`:
- Criar uma chave de sessao: `const sessionKey = agentSlug ? \`chat_session_\${agentSlug}\` : null`
- Inicializar `messages` lendo de `sessionStorage` se existir dados salvos
- Adicionar `useEffect` que salva em `sessionStorage` toda vez que `messages` mudar
- No `handleClear`, tambem limpar o `sessionStorage`
- Tambem persistir `isCopySaved` no sessionStorage para manter o estado de salvamento

---

### Problema 2: Usuario nao percebe o botao de salvar

**Causa raiz:** O botao "Salvar Copy" esta no header do chat (linha 584-594), como um icone pequeno ao lado de Export e Clear. Nao ha nenhuma notificacao visual que chame atencao do usuario quando a copy termina de ser gerada.

**Correcao:** Adicionar um banner/alerta flutuante que aparece AUTOMATICAMENTE quando o streaming termina e existe conteudo do assistente. Esse banner fica visivel acima da area de input, com um botao de acao direto para salvar.

Alteracoes no `ChatInterface.tsx`:
- Adicionar estado `showSaveReminder` (boolean)
- Nos callbacks de `handleSend` e `handleAutoStart`, no `finally` block, verificar se existe conteudo do assistente e se o agente nao e `brand-positioning-monster` e se a copy ainda nao foi salva. Se sim, setar `showSaveReminder = true`
- Renderizar um banner animado entre as mensagens e o input (antes do `<div className="p-4 border-t">`) com:
  - Icone de Save
  - Texto: "Sua copy esta pronta! Clique para salvar"
  - Botao de acao que chama `saveCompleteCopy`
  - Botao de dismissal (X)
- Quando `isCopySaved` mudar para true, esconder o banner
- Quando `handleClear` for chamado, esconder o banner

---

### Resumo das alteracoes

**Arquivo unico:** `src/components/chat/ChatInterface.tsx`

1. Persistencia em sessionStorage (resolve conteudo sumindo)
2. Banner de notificacao pos-streaming (resolve falta de visibilidade do salvar)
3. Manter o botao de salvar no header tambem (opcao redundante para quem ja conhece)

**Nenhuma alteracao de backend necessaria.**

