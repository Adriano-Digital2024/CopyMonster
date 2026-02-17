## Correcao do Sistema de Traducao - Textos Hardcoded e Inconsistencias

### Problema Identificado

Apos analise detalhada de todos os arquivos do dashboard, foram encontrados **textos hardcoded em portugues** que nao passam pelo sistema i18n, alem de datas formatadas com locale fixo `'pt-BR'`. Isso significa que quando o usuario troca para ingles ou espanhol, esses textos permanecem em portugues.

---

### Areas com Falhas (Detalhamento)

#### 1. Settings.tsx - Mensagens de senha hardcoded em portugues (4 toasts)

- Linha 49: `"Senhas nao conferem"` / `"As senhas nao coincidem"`
- Linha 58: `"Senha muito curta"` / `"A senha deve ter no minimo 8 caracteres"`
- Linha 73: `"Senha alterada"` / `"Sua senha foi atualizada com sucesso"`
- Linha 82: `"Erro ao alterar senha"`

**Correcao:** Substituir por `t('dashboard.settings.security.toast.passwordMismatch')`, etc. Adicionar chaves correspondentes nos 3 idiomas em `config.ts`.

#### 2. Billing.tsx - Erros de checkout hardcoded em portugues (5 textos)

- Linha 85: `'Plano nao encontrado'`
- Linha 107: `'Resposta vazia do servidor'`
- Linha 117: `'URL de checkout nao foi criada'`
- Linha 124: `'Ocorreu um erro ao processar seu pagamento'`
- Linha 126: `'Erro no checkout'`

**Correcao:** Substituir por chaves `t('dashboard.billing.errors.*')`. Adicionar nos 3 idiomas.

#### 3. Library.tsx - Datas com locale fixo `'pt-BR'` (linha 385)

- `toLocaleDateString('pt-BR', {...})` deveria usar `toLocaleDateString()` sem locale fixo.

**Correcao:** Usar `toLocaleDateString()` sem parametro, conforme padrao ja documentado.

#### 4. Positioning.tsx - Titulo padrao e datas hardcoded em portugues (4 ocorrencias)

- Linhas 134, 174, 199, 212: `Posicionamento ${new Date().toLocaleDateString('pt-BR')}`

**Correcao:** Usar `t('positioning.defaultTitle', { date: new Date().toLocaleDateString() })` e adicionar chaves: "Positioning" (en), "Posicionamento" (pt), "Posicionamiento" (es).

#### 5. ExportDocumentModal.tsx - Label "Data:" hardcoded em portugues (2 ocorrencias)

- Linhas 55 e 60: `Data: ${new Date().toLocaleDateString('pt-BR')}`

**Correcao:** Substituir por label traduzido e remover locale fixo.

#### 6. CopyResults.tsx - Labels de agentes hardcoded em ingles (8 textos)

- Linhas 110-121: `getAgentLabel()` com nomes fixos como `'VSL Monster'`, `'Sales Page Monster'`, etc.

**Correcao:** Usar o mapeamento `slugToTranslationKey` existente e buscar `t('agents.list.KEY.name')`.

#### 7. Admin - Users.tsx e Analytics.tsx - Datas com locale fixo e textos PT

- Users.tsx linha 254: `toLocaleDateString('pt-BR')`
- Users.tsx linhas 152-155: Toast de senha hardcoded em portugues
- Analytics.tsx linha 139: `toLocaleDateString('pt-BR', ...)`

**Correcao:** Remover locale fixo de datas. Substituir toasts por chaves i18n. Antes de aplicar as correções, ajuste:

1. DATAS: Não use toLocaleDateString() sem parâmetro (isso pega do navegador). 

   Use o idioma ativo do app: toLocaleDateString(currentLanguage)

2. VERIFICAÇÃO ADICIONAL: Busque em TODO o projeto por:

   - 'pt-BR' (locale fixo)

   - toasts ou mensagens em português sem t()

   - textos entre aspas simples ou duplas em componentes React

3. TESTE: Após correções, simule a troca de idioma EN → PT → ES 

   e confirme que nenhum texto fica para trás

4. CONFIRMAÇÃO: Me mostre se encontrou mais arquivos além dos 8 listados

---

### Resumo de Alteracoes por Arquivo


| Arquivo                                              | Tipo de Problema    | Itens                        |
| ---------------------------------------------------- | ------------------- | ---------------------------- |
| `src/pages/dashboard/Settings.tsx`                   | Toasts hardcoded PT | 4 mensagens                  |
| `src/pages/dashboard/Billing.tsx`                    | Erros hardcoded PT  | 5 mensagens                  |
| `src/pages/dashboard/CopyResults.tsx`                | Labels hardcoded EN | 8 nomes de agente            |
| `src/pages/dashboard/Library.tsx`                    | Data locale fixo    | 1 ocorrencia                 |
| `src/pages/dashboard/Positioning.tsx`                | Titulo + data PT    | 4 ocorrencias                |
| `src/components/positioning/ExportDocumentModal.tsx` | Label + data PT     | 2 ocorrencias                |
| `src/pages/admin/Users.tsx`                          | Data + toast PT     | 2 ocorrencias                |
| `src/pages/admin/Analytics.tsx`                      | Data locale fixo    | 1 ocorrencia                 |
| `src/i18n/config.ts`                                 | Novas chaves i18n   | ~15 novas chaves x 3 idiomas |


---

### Detalhes Tecnicos

**Novas chaves de traducao a adicionar no `config.ts` (EN/PT/ES):**

```text
dashboard.settings.security.toast.passwordMismatch / passwordMismatchDesc
dashboard.settings.security.toast.passwordTooShort / passwordTooShortDesc
dashboard.settings.security.toast.passwordChanged / passwordChangedDesc
dashboard.settings.security.toast.passwordError
dashboard.billing.errors.planNotFound
dashboard.billing.errors.emptyResponse
dashboard.billing.errors.noCheckoutUrl
dashboard.billing.errors.checkoutError
dashboard.billing.errors.checkoutErrorDesc
positioning.defaultTitle (com parametro {{date}})
export.dateLabel
```

**Abordagem para datas:** Todas as chamadas `toLocaleDateString('pt-BR')` serao alteradas para `toLocaleDateString()` (sem parametro), que usa automaticamente o locale do navegador do usuario.

**Abordagem para CopyResults agent labels:** Reutilizar o pattern `slugToTranslationKey` + `t('agents.list.KEY.name')` ja usado em Agents.tsx.

**Impacto:** Apenas arquivos listados serao modificados. Nenhuma rota, layout ou logica de negocio sera alterada. Todas as mudancas sao substituicoes de strings - risco minimo de quebra.