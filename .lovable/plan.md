

## Correcao: Salvar Copy Completa Apenas Uma Vez no Final

---

### Problema Atual

O botao "Salvar" aparece em CADA mensagem individual do assistente. Isso causa:
- Confusao: o usuario nao sabe qual mensagem salvar
- Fragmentacao: se clicar em uma mensagem, salva apenas aquele trecho, nao a copy completa
- UX ruim: multiplos botoes de salvar poluem a interface

### Solucao

Remover os botoes de salvar individuais por mensagem e implementar um UNICO botao "Salvar Copy Completa" no header do chat que:

1. So aparece quando existe pelo menos 1 mensagem do assistente
2. So aparece para agentes que NAO sao `brand-positioning-monster`
3. Ao clicar, concatena TODO o conteudo das mensagens do assistente em um unico texto
4. Salva como UM unico registro na tabela `copy_results`
5. Abre o dialog de nomeacao UMA unica vez
6. Apos salvo, o botao muda para indicador "Salvo" para evitar duplicatas

### Alteracoes Tecnicas

**Arquivo:** `src/components/chat/ChatInterface.tsx`

1. **Remover** os botoes de salvar individuais dentro do loop de mensagens (linhas 648-661)
2. **Adicionar** um botao "Salvar Copy" no header do chat (ao lado dos botoes Export e Clear), visivel apenas quando:
   - `agentSlug !== 'brand-positioning-monster'`
   - Existe conteudo do assistente
   - A copy ainda nao foi salva nesta sessao
3. **Modificar** `saveCopyResult` para concatenar TODAS as mensagens do assistente em um unico conteudo antes de salvar
4. **Adicionar** estado `isCopySaved` (boolean) para controlar se a sessao ja foi salva - substituindo o `savedCopyIds` (Set por mensagem)

**Fluxo resultante:**
```text
Usuario interage com agente -> Varias mensagens sao trocadas
-> Ao terminar, usuario clica "Salvar Copy" no header
-> Dialog de nomeacao aparece UMA vez
-> Copy completa (todas as respostas concatenadas) e salva
-> Botao muda para "Salvo"
```

### Riscos

- Zero risco funcional - nenhuma logica de backend e alterada
- O agente de posicionamento continua usando seu sistema proprio de salvamento
- O conteudo salvo sera mais completo (toda a conversa vs fragmento individual)

