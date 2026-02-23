

## Limpeza Total de Formatacao - Entrega Premium Classe Superior

---

### Problema Identificado

Duas fontes de poluicao na entrega dos agentes:

1. **Google Ads agent** - O campo `output_structure` no banco de dados usa labels como `H1:`, `H2:`, `D1:` que o LLM reproduz literalmente na saida
2. **Edge Function (chat-stream)** - O codigo que monta o system prompt usa headers markdown (`#`, `##`) internamente para separar secoes. O LLM ve esses simbolos e replica o estilo na resposta ao usuario

---

### Correcoes

**1. Atualizar output_structure do Google Ads no banco de dados**

Substituir os labels `H1:`, `H2:`, `D1:` por labels limpos e profissionais:

| Antes | Depois |
|-------|--------|
| `H1: (max 30 characters)` | `Headline 1: (max 30 characters)` |
| `H2: (max 30 characters)` | `Headline 2: (max 30 characters)` |
| `D1: (max 90 characters)` | `Description 1: (max 90 characters)` |

Isso elimina a aparencia de "codigo HTML" na entrega.

**2. Remover todos os marcadores markdown do prompt construction no edge function**

No arquivo `supabase/functions/chat-stream/index.ts`, substituir TODOS os headers `#` e `##` por labels em texto simples com separadores limpos:

| Antes (codigo) | Depois (codigo) |
|-----------------|-----------------|
| `# IDENTITY` | `IDENTITY:` |
| `# ROLE` | `ROLE:` |
| `# PERSONA` | `PERSONA:` |
| `# CORE FUNCTION` | `CORE FUNCTION:` |
| `# QUALITY RULES` | `QUALITY RULES:` |
| `# EXPECTED INPUTS` | `EXPECTED INPUTS:` |
| `# MANDATORY OUTPUT STRUCTURE` | `OUTPUT STRUCTURE:` |
| `# SETTINGS` | `SETTINGS:` |
| `# REFERENCE EXAMPLES` | `REFERENCE EXAMPLES:` |
| `## Example 1` | `Example 1:` |
| `# ADDITIONAL INSTRUCTIONS` | `ADDITIONAL INSTRUCTIONS:` |
| `## Target Audience` | `Target Audience:` |
| `## Pain Points` | `Pain Points:` |
| (todos os `##` do DNA context) | (sem `##`, apenas label com `:`) |

Tambem atualizar os headers no `getUniversalLanguageRules`:
| Antes | Depois |
|-------|--------|
| `# REGRA DE IDIOMA OBRIGATORIA` | `REGRA DE IDIOMA OBRIGATORIA:` |
| `# FORMATTING RULES (MANDATORY)` | `FORMATTING RULES (MANDATORY):` |

**3. Reforcar regra de formatacao no prompt universal**

Adicionar instrucao explicita contra labels tipo H1/H2/D1:
- "NEVER use labels like H1, H2, H3, D1, D2 in your output"
- "Use full descriptive labels: Headline 1, Headline 2, Description 1"

---

### Arquivos Alterados

1. `supabase/functions/chat-stream/index.ts` - Remover todos os `#` e `##` do prompt construction + reforcar regras
2. Banco de dados: UPDATE no `output_structure` do agente `google-ads`

### Riscos

- Zero risco funcional - apenas mudanca de formatacao no system prompt (o LLM nao precisa de markdown para entender secoes)
- O LLM interpreta labels em texto simples tao bem quanto headers markdown
- Deploy do edge function necessario apos alteracao

