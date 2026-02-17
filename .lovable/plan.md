

## Editar Copy Gerada - Plano Ajustado

### Banco de Dados

**Migracao SQL (2 colunas):**
- `copy_results`: adicionar `is_edited boolean DEFAULT false`
- `positioning_mappings`: adicionar `document text` + `is_edited boolean DEFAULT false`
  - Coluna `document` armazena o texto final (substituido ao editar, sem coluna separada)

---

### CopyResults.tsx - Botao Editar + Modal

**Novos estados:** `editingResult`, `editContent`

**Botao Pencil:** posicionado entre Copy e Trash2 (ao lado do Copiar, nao entre Copiar e Excluir). Ordem final dos botoes: Star | Copy | Pencil | Trash2

**Modal de edicao:**
- Dialog com Textarea preenchida com conteudo atual
- Contador de caracteres: `X/2000` abaixo do textarea
- Aviso visual (texto vermelho) se ultrapassar 2000
- Botao Cancelar com confirmacao: se texto foi alterado e usuario clica Cancelar, exibe AlertDialog "Descartar alteracoes?" (Sim/Nao)
- Botao Salvar faz UPDATE no supabase (`content` + `is_edited: true`)

**Badge "Editado":** exibido ao lado do badge do agente quando `is_edited === true`

---

### ExportDocumentModal.tsx - Edicao do Documento

**Novas props:**
- `onSaveEdit?: (content: string) => void`
- `isEdited?: boolean`

**Comportamento interno:**
- Estado `isEditing` e `editableContent`
- Botao Pencil ao lado de Copiar (antes de Baixar)
- Ao clicar: troca `<pre>` por `<Textarea>` com contador `X/2000`
- Botoes Salvar/Cancelar substituem Copiar/Baixar no modo edicao
- Cancelar com alteracoes nao salvas: AlertDialog de confirmacao
- Ao salvar: chama `onSaveEdit(editableContent)`

---

### Library.tsx - Integracao

- Tipo `PositioningMapping` recebe `document?: string` e `is_edited?: boolean`
- No `handleViewMapping`: se `mapping.document` existe, usa-lo como conteudo; senao, gera via `getMessagesFromConversation`
- `onSaveEdit` faz UPDATE em `positioning_mappings` com `document = content` e `is_edited = true`
- Badge "Editado" no card quando `is_edited === true`

---

### i18n/config.ts - Novas chaves (3 idiomas)

| Chave | EN | PT | ES |
|-------|-----|-----|-----|
| copyResults.edit | Edit | Editar | Editar |
| copyResults.editTitle | Edit Copy | Editar Copy | Editar Copy |
| copyResults.editDesc | Edit the generated content | Edite o conteudo gerado | Edita el contenido generado |
| copyResults.toast.edited | Copy updated | Copy atualizada | Copy actualizada |
| copyResults.editedBadge | Edited | Editado | Editado |
| copyResults.charCount | {{count}}/{{max}} characters | {{count}}/{{max}} caracteres | {{count}}/{{max}} caracteres |
| copyResults.charLimitWarning | Character limit exceeded | Limite de caracteres excedido | Limite de caracteres excedido |
| copyResults.discardChanges | Discard changes? | Descartar alteracoes? | Descartar cambios? |
| copyResults.discardChangesDesc | Unsaved changes will be lost | As alteracoes nao salvas serao perdidas | Los cambios no guardados se perderan |
| copyResults.discard | Discard | Descartar | Descartar |
| positioning.editDocument | Edit Document | Editar Documento | Editar Documento |
| positioning.toast.documentEdited | Document updated | Documento atualizado | Documento actualizado |
| positioning.editedBadge | Edited | Editado | Editado |
| common.save | Save | Salvar | Guardar |

---

### Resumo de Arquivos

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | 3 colunas novas (2 tabelas) |
| `src/i18n/config.ts` | ~14 chaves x 3 idiomas |
| `src/pages/dashboard/CopyResults.tsx` | Modal edicao + Pencil + badge + confirmacao |
| `src/components/positioning/ExportDocumentModal.tsx` | Modo edicao inline + confirmacao |
| `src/pages/dashboard/Library.tsx` | onSaveEdit handler + badge + tipo |
| `src/integrations/supabase/types.ts` | Tipos atualizados |

