

## Plano de Implementacao - 2 Tarefas

---

### TAREFA 1: Gestao de Funcoes Internas (Colaboradores) em /admin/users

#### Analise Tecnica

**Melhor modelagem de banco:**
Adicionar uma coluna `internal_role` do tipo `text` (nullable, default NULL) na tabela `profiles`. Justificativa:
- E uma classificacao organizacional simples (1 funcao por usuario)
- Nao requer tabela relacional - nao existe historico, multiplas funcoes nem hierarquia
- Reaproveita a tabela `profiles` que ja e usada no admin Users
- A RLS existente (admins podem ver/editar todos os perfis) ja cobre esta coluna sem alteracoes

**Impacto tecnico:** Baixo. Uma coluna nova nullable nao quebra nada existente.

#### Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Adicionar coluna `internal_role` text nullable em `profiles` |
| `src/pages/admin/Users.tsx` | Adicionar dropdown de funcao interna + coluna na tabela + logica de salvar |
| `src/i18n/config.ts` | Adicionar traducoes para funcoes internas (EN/PT/ES) |

#### Detalhes de Implementacao

**1. Migracao SQL:**
```text
ALTER TABLE profiles ADD COLUMN internal_role text DEFAULT NULL;
```

**2. Users.tsx - Mudancas:**
- Adicionar `internal_role` ao `UserProfile` interface e ao `fetchUsers` select
- Adicionar nova coluna "Funcao Interna" na tabela de usuarios (entre "Plano" e "Creditos")
- Adicionar dropdown inline na celula da tabela para selecionar/alterar funcao
- Ao trocar funcao, salvar via `supabase.from('profiles').update({ internal_role })` com toast de confirmacao
- Adicionar filtro por funcao interna (novo Select ao lado do filtro de plano)

**3. Traducoes (i18n) - 10 funcoes nos 3 idiomas:**

EN:
- Board/Executive, Product/Technology, Marketing, Sales, Customer Success, Technical Support, Internal Finance, Legal/Compliance, Operations, Data/BI

PT:
- Diretoria, Produto/Tecnologia, Marketing, Vendas, Customer Success, Suporte Tecnico, Financeiro Interno, Juridico/Compliance, Operacoes, Dados/BI

ES:
- Directiva, Producto/Tecnologia, Marketing, Ventas, Customer Success, Soporte Tecnico, Finanzas Internas, Legal/Compliance, Operaciones, Datos/BI

Chaves i18n: `admin.users.internalRole`, `admin.users.internalRoleLabel`, `admin.users.allRoles`, `admin.users.noRole` + uma chave por funcao sob `admin.users.roles.*`

**Riscos:** Zero. Coluna nullable nao impacta login, permissoes, RLS ou qualquer fluxo existente.

---

### TAREFA 2: Atualizacao dos Cards de Planos com Limites de DNA

#### Analise do Estado Atual

Existem 3 locais com cards de planos, usando 2 estruturas i18n diferentes:

| Pagina | Chave i18n usada | Ja tem DNA? |
|--------|------------------|-------------|
| `/` (Index - Pricing component) | `pricing.*.features` (array) | SIM - ja adicionado |
| `/dashboard/billing` (Billing) | `pricing.*.features` (array) | SIM - ja adicionado |
| `/start` (Start - PricingSection) | `start.pricing.*.features.f1-f5` (objeto) | NAO - falta adicionar |

A pagina `/` e `/dashboard/billing` ja mostram os limites de DNA (ex: "1 Brand DNA project", "Ate 10 projetos de DNA de Marca"). Foram adicionados na implementacao anterior do DNA Guard.

A pagina `/start` usa uma estrutura diferente (`start.pricing.*.features.f1, f2...`) e NAO inclui informacao de DNA.

#### Arquivos Afetados

| Arquivo | Alteracao |
|---------|-----------|
| `src/i18n/config.ts` | Adicionar feature de DNA nos `start.pricing` (EN/PT/ES) |

#### Detalhes de Implementacao

Adicionar uma nova feature (f5 para Starter, f6 para Pro, f6 para Legend ou reordenar) com as informacoes de DNA:

**EN `start.pricing`:**
- Starter: adicionar `f5: "1 DNA (1 Brand Positioning Monster Project)"`
- Pro: adicionar `f6: "Up to 10 DNAs (10 Brand Positioning Monster Projects)"`
- Legend: adicionar `f6: "Up to 50 DNAs (50 Brand Positioning Monster Projects)"`

**PT `start.pricing`:**
- Starter: adicionar `f5: "1 DNA (1 Projeto) Brand Positioning Monster"`
- Pro: adicionar `f6: "Ate 10 DNAs (10 Projetos) Brand Positioning Monster"`
- Legend: adicionar `f6: "Ate 50 DNAs (50 Projetos) Brand Positioning Monster"`

**ES `start.pricing`:**
- Starter: adicionar `f5: "1 DNA (1 Proyecto Brand Positioning Monster)"`
- Pro: adicionar `f6: "Hasta 10 DNAs (10 Proyectos Brand Positioning Monster)"`
- Legend: adicionar `f6: "Hasta 50 DNAs (50 Proyectos Brand Positioning Monster)"`

**Start.tsx:** Tambem precisa adicionar `t('start.pricing.*.features.f5')` e `f6` nas arrays de features dos planos (linhas 567-606).

**Riscos:** Zero. Apenas adiciona texto informativo.

---

### Ordem Segura de Execucao

1. Migracao SQL (coluna `internal_role`)
2. Atualizar `src/i18n/config.ts` (traducoes de funcoes internas + features DNA do start.pricing)
3. Atualizar `src/pages/admin/Users.tsx` (dropdown + coluna + filtro)
4. Atualizar `src/pages/Start.tsx` (adicionar features f5/f6 nos arrays de planos)

### Validacao de Limites

Os limites exibidos nos cards (1/10/50) correspondem exatamente aos limites enforced pelo `useDnaGuard.ts`:
```text
free -> 1, starter -> 1, pro -> 10, legend -> 50
```

