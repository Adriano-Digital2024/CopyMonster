
## Correcoes e Melhorias - 6 Tarefas

---

### TAREFA 1: Corrigir Popup de Salvamento do Positioning (i18n quebrado)

**Problema:** O dialog de salvamento na pagina `/dashboard/positioning` usa as chaves `positioning.saveDialogDesc`, `positioning.mappingTitle` e `positioning.confirmSave`, mas no `config.ts` essas chaves nao existem. Os nomes reais sao `saveDialogDescription`, e nao existe `mappingTitle` (como label) nem `confirmSave`.

**Correcao:** Adicionar as chaves faltantes no objeto `positioning` dentro de `config.ts` nos 3 idiomas:

| Chave | EN | PT | ES |
|-------|----|----|-----|
| `saveDialogDesc` | "You completed {{blocks}} of 12 blocks. Do you want to save this mapping?" | "Voce completou {{blocks}} de 12 blocos. Deseja salvar este mapeamento?" | "Completaste {{blocks}} de 12 bloques. Deseas guardar este mapeo?" |
| `mappingTitle` | "Mapping Title" | "Titulo do Mapeamento" | "Titulo del Mapeo" |
| `confirmSave` | "Save Mapping" | "Salvar Mapeamento" | "Guardar Mapeo" |

**Arquivo:** `src/i18n/config.ts` - adicionar 3 chaves no bloco `positioning` em EN (~linha 515), PT (~linha 1578), ES (~linha 2641)

---

### TAREFA 2: Renomear menus laterais "Biblioteca" e "Resultados de Copy"

**Alteracao:**

| Chave | Antes (EN) | Depois (EN) | Antes (PT) | Depois (PT) | Antes (ES) | Depois (ES) |
|-------|-----------|-------------|-----------|-------------|-----------|-------------|
| `dashboard.menu.library` | Library | DNA Library | Biblioteca | Biblioteca DNA | Biblioteca | Biblioteca DNA |
| `dashboard.menu.copyResults` | Copy Results | My Copies | Resultados de Copy | Minhas Copys | Resultados de Copy | Mis Copys |

**Arquivo:** `src/i18n/config.ts` - linhas 253-254 (EN), 1316-1317 (PT), 2379-2380 (ES)

Tambem atualizar os mesmos campos nos JSON de dashboard: `src/i18n/locales/en/dashboard.json`, `src/i18n/locales/pt/dashboard.json`, `src/i18n/locales/es/dashboard.json`

---

### TAREFA 3: Atualizar mensagem inicial do chat para agentes nao-DNA

**Problema atual:** A mensagem exibida e "Pergunte qualquer coisa ou forneca instrucoes para comecar" - confunde o usuario pois o agente carrega o DNA automaticamente.

**Correcao:** Atualizar `chat.startConversationDesc` nos 3 idiomas:

| Idioma | Novo texto |
|--------|-----------|
| EN | "Type OK to proceed with the copy using your Brand DNA structure." |
| PT | "Digite OK para prosseguir com a copy usando a estrutura do seu DNA de Marca." |
| ES | "Escribe OK para continuar con la copy usando la estructura de tu DNA de Marca." |

**Arquivo:** `src/i18n/config.ts` - linhas 500 (EN), 1563 (PT), 2626 (ES)

---

### TAREFA 4: Corrigir popup de nomeacao para agente de posicionamento

**Problema:** O ChatInterface mostra o popup "Nome da Copy - Defina um nome para a copy" para TODOS os agentes, inclusive o posicionamento. Para o agente de posicionamento, isso e incorreto pois trata-se de um mapeamento de DNA, nao uma copy.

**Correcao:** No `ChatInterface.tsx`, impedir que o `saveCopyResult` seja chamado quando o `agentSlug` for `brand-positioning-monster`. O agente de posicionamento ja tem seu proprio sistema de salvamento em `Positioning.tsx` (autoSaveMapping + handleSave).

**Arquivo:** `src/components/chat/ChatInterface.tsx`
- Linha 75: adicionar condicao `if (agentSlug === 'brand-positioning-monster') return;` no inicio da funcao `saveCopyResult`
- Isso impede o popup de nomeacao de copy E o salvamento em `copy_results` para o agente de posicionamento

---

### TAREFA 5: Corrigir salvamento fragmentado do DNA (12 blocos)

**Problema:** O ChatInterface chama `saveCopyResult` em CADA resposta do assistente (linhas 334 e 482), criando uma entrada em `copy_results` para CADA bloco. Alem disso, o popup de nomeacao aparece multiplas vezes.

**Diagnostico:** A Tarefa 4 ja resolve isso bloqueando `saveCopyResult` para o agente de posicionamento. O sistema de salvamento correto ja existe em `Positioning.tsx`:
- `autoSaveMapping()` cria UM unico registro em `positioning_mappings` quando o fluxo completa
- `handleSave/confirmSave` permite salvar/atualizar manualmente com nomeacao unica
- O `savedMappingId` garante que atualizacoes subsequentes vao para o MESMO registro

**Verificacao adicional:** Confirmar que `autoSaveMapping` nao cria duplicatas - a condicao `if (savedMappingId) return` na linha 136 ja previne isso.

**Nenhuma alteracao adicional necessaria** - a Tarefa 4 resolve completamente o problema de salvamento fragmentado.

---

### TAREFA 6: Adicionar info de DNA nos cards de planos em /dashboard/billing

**Analise:** A pagina `/dashboard/billing` ja usa `t('pricing.${plan.id}.features', { returnObjects: true })` e o config.ts JA possui as features com info de DNA:
- Starter: "1 Brand DNA project" (linha 99)
- Pro: "Up to 10 Brand DNA projects" (linha 114)
- Legend: "Up to 50 Brand DNA projects" (linha 130)

**Conclusao:** Os cards em `/dashboard/billing` JA exibem a informacao de DNA corretamente. Nenhuma alteracao necessaria.

---

### Ordem de Execucao

1. `src/i18n/config.ts` - Todas as alteracoes de traducao (Tarefas 1, 2, 3)
2. `src/i18n/locales/*/dashboard.json` - Atualizar menus (Tarefa 2)
3. `src/components/chat/ChatInterface.tsx` - Bloquear saveCopyResult para positioning (Tarefa 4+5)

### Riscos

- **Zero risco funcional** - nenhuma logica de negocio ou banco e alterada
- O salvamento do positioning continua funcionando pelo seu proprio sistema dedicado
- Os outros agentes continuam salvando copys normalmente
