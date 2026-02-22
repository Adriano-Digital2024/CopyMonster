

## Atualizacao CopyMonster - Edicao Ilimitada e Nomeacao de Copys

### Resumo

Duas atualizacoes principais: (1) remover limite de 2000 caracteres na edicao de copys e corrigir cor da scrollbar, (2) adicionar campo de nome personalizado para copys com tag de categoria do agente.

---

### 1. Remocao do Limite de Caracteres na Edicao

**Arquivos afetados:**

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/dashboard/CopyResults.tsx` | Remover constante `MAX_CHARS`, remover contador e warning do modal de edicao, adicionar classe de scrollbar escura ao Textarea |
| `src/components/positioning/ExportDocumentModal.tsx` | Remover constante `MAX_CHARS`, remover contador e warning do modal de edicao |
| `src/i18n/config.ts` | Remover chaves `charCount` e `charLimitWarning` dos 3 idiomas (EN linha 432-433, PT linha 1499-1500, ES linha 2566-2567) |
| `src/i18n/locales/*/dashboard.json` | Nao possuem essas chaves (estao apenas no config.ts) |

**Detalhes tecnicos:**

- `CopyResults.tsx`: Remover `const MAX_CHARS = 2000` (linha 33), remover bloco de contador/warning (linhas 372-379), adicionar classe CSS `[&::-webkit-scrollbar-thumb]:bg-muted-foreground/30 [&::-webkit-scrollbar-track]:bg-transparent` ao Textarea para corrigir scrollbar branca
- `ExportDocumentModal.tsx`: Remover `const MAX_CHARS = 2000` (linha 30), remover bloco de contador/warning (linhas 223-230)
- O botao "Salvar" nao tem condicao de bloqueio por MAX_CHARS, entao nao ha impacto em logica existente

---

### 2. Nomeacao Manual de Copy pelo Usuario

**Migracao SQL:**
- Adicionar coluna `title` (text, nullable, default null) na tabela `copy_results`
- Nullable para manter compatibilidade com copys ja existentes

**Arquivos afetados:**

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | `ALTER TABLE copy_results ADD COLUMN title text DEFAULT NULL` |
| `src/integrations/supabase/types.ts` | Adicionar campo `title` ao tipo `copy_results` |
| `src/components/chat/ChatInterface.tsx` | Apos auto-save, mostrar dialog para nomear a copy |
| `src/pages/dashboard/CopyResults.tsx` | Exibir titulo como ponto principal + badge de categoria |
| `src/pages/admin/AdminCopyResults.tsx` | Exibir titulo na coluna de preview |
| `src/i18n/config.ts` | Adicionar chaves de traducao para os 3 idiomas |
| `src/i18n/locales/*/dashboard.json` | Adicionar chaves de traducao |

**Fluxo de nomeacao no ChatInterface:**

1. Agente gera a copy e `saveCopyResult()` salva no banco (fluxo atual, sem alteracao)
2. Apos salvar com sucesso, exibir um Dialog com:
   - Campo "Nome da Copy" (Input text, obrigatorio)
   - Sugestao automatica: nome do agente + data (ex: "VSL Monster - 22/02/2026")
   - Botao "Salvar Nome"
3. Ao salvar, fazer UPDATE no `copy_results` com o titulo definido pelo usuario
4. Se o usuario fechar sem salvar, a copy permanece sem titulo (exibe nome do agente como fallback)

**Exibicao no CopyResults.tsx:**

Cada card mostrara:
- **Titulo principal**: o nome definido pelo usuario (ou fallback para nome do agente)
- **Badge de categoria**: tag discreta com nome do agente (ex: "VSL Monster") como badge secondary
- Data e demais acoes permanecem identicas

**Traducoes novas (3 idiomas):**

```text
PT: copyName: "Nome da Copy", copyNamePlaceholder: "Ex: VSL Produto X", copyNameSuggestion: "Sugestão", saveName: "Salvar Nome", nameRequired: "Defina um nome para a copy"
EN: copyName: "Copy Name", copyNamePlaceholder: "E.g. VSL Product X", copyNameSuggestion: "Suggestion", saveName: "Save Name", nameRequired: "Define a name for the copy"
ES: copyName: "Nombre de la Copy", copyNamePlaceholder: "Ej: VSL Producto X", copyNameSuggestion: "Sugerencia", saveName: "Guardar Nombre", nameRequired: "Define un nombre para la copy"
```

---

### Impacto Zero em Funcionalidades Existentes

- A coluna `title` e nullable, entao copys antigas continuam funcionando
- O auto-save do ChatInterface nao e alterado (salva primeiro, nomeia depois)
- RLS existente da tabela `copy_results` ja cobre o novo campo
- AdminCopyResults mostra titulo se existir, senao fallback para agent_slug
- ExportDocumentModal e Positioning nao sao afetados

