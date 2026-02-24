

## Correcao: Banner "Salvar" aparece prematuramente

### Problema
O `triggerSaveReminder()` e chamado no bloco `finally` de `handleSend` (linha 559), que executa apos CADA troca de mensagem. Isso significa que o banner "Sua copy esta pronta" aparece logo apos a primeira resposta do agente - que e apenas uma lista de perguntas, nao a copy final.

### Solucao
Mostrar o banner SOMENTE quando existirem pelo menos 2 mensagens do assistente (a primeira e sempre perguntas de esclarecimento, a copy real vem depois que o usuario responde).

### Alteracao unica

**Arquivo:** `src/components/chat/ChatInterface.tsx`

Modificar a funcao `triggerSaveReminder` (linhas 124-128) para verificar a quantidade de mensagens do assistente antes de exibir o banner:

```typescript
const triggerSaveReminder = useCallback(() => {
  if (agentSlug && agentSlug !== 'brand-positioning-monster' && !isCopySaved) {
    // Only show reminder when there are at least 2 assistant messages
    // (first is always clarifying questions, actual copy comes after)
    setMessages(currentMessages => {
      const assistantCount = currentMessages.filter(m => m.role === 'assistant').length;
      if (assistantCount >= 2) {
        setShowSaveReminder(true);
      }
      return currentMessages;
    });
  }
}, [agentSlug, isCopySaved]);
```

Isso garante que:
- Na primeira interacao (agente faz perguntas) → banner NAO aparece
- Apos o usuario responder e receber a copy final → banner aparece corretamente
- Agentes que entregam em uma unica resposta sem perguntas continuam sem banner prematuro

