

## Correcao: Chaves de traducao aparecendo como texto no popup de creditos

### Causa Raiz

O componente `ChatInterface.tsx` (linha 55) usa:
```
useTranslation(['common', 'dashboard'])
```

Isso configura `common` como namespace padrao e usa o prefixo `common:` em todas as chamadas `t()`. Porem, o sistema i18n do projeto usa apenas o namespace `translation` (padrao do i18next). Nao existe namespace `common` nem `dashboard`.

Resultado: todas as chamadas como `t('common:chat.creditUsedTitle')` falham e exibem a chave crua na tela.

### Correcao

**Arquivo:** `src/components/chat/ChatInterface.tsx`

1. **Linha 55** - Alterar de `useTranslation(['common', 'dashboard'])` para `useTranslation()`

2. **Todas as chamadas `t()`** - Remover o prefixo `common:` de todas as ocorrencias no arquivo:
   - `t('common:chat.creditUsedTitle')` -> `t('chat.creditUsedTitle')`
   - `t('common:chat.creditUsedDesc', ...)` -> `t('chat.creditUsedDesc', ...)`
   - `t('common:chat.insufficientCreditsTitle')` -> `t('chat.insufficientCreditsTitle')`
   - `t('common:chat.insufficientCreditsDesc')` -> `t('chat.insufficientCreditsDesc')`
   - `t('common:chat.inputPlaceholder')` -> `t('chat.inputPlaceholder')`
   - `t('common:chat.creditsAvailable', ...)` -> `t('chat.creditsAvailable', ...)`
   - `t('common:trial.expired.title')` -> `t('trial.expired.title')`
   - `t('common:trial.expired.description')` -> `t('trial.expired.description')`
   - E todas as demais (~20 ocorrencias no arquivo)

### Impacto

- Apenas 1 arquivo modificado: `ChatInterface.tsx`
- Nenhuma chave nova necessaria (ja existem no namespace `translation`)
- Nenhuma rota, layout ou logica alterada
- Corrige: popup de credito, placeholder do input, texto de creditos disponiveis, mensagens de erro, e todas as notificacoes do chat

