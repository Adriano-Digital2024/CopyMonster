
## Remocao Completa de Headlines e Insights

### Relatorio de Dependencias Encontradas

**Headlines** - presente em 6 arquivos + 1 tabela DB:
| Local | Tipo | Pode remover? |
|-------|------|---------------|
| `src/pages/dashboard/Headlines.tsx` | Pagina completa | Sim - exclusiva |
| `src/pages/admin/AdminHeadlines.tsx` | Pagina admin | Sim - exclusiva |
| `src/App.tsx` | Import + Rota | Sim - remover import e rota |
| `src/components/layouts/DashboardLayout.tsx` | Item menu lateral | Sim - remover item |
| `src/components/layouts/AdminLayout.tsx` | Item menu admin | Sim - remover item |
| `src/pages/dashboard/Performance.tsx` | Contagem headlines | Sim - variavel existe mas NAO e exibida na UI |
| `src/i18n/config.ts` | Traducoes (3 idiomas) | Sim - remover bloco `headlines` |
| Tabela `headlines` (Supabase) | Tabela + RLS | NAO remover agora - manter no banco |

**Insights** - presente em 3 arquivos + 1 tabela DB:
| Local | Tipo | Pode remover? |
|-------|------|---------------|
| `src/pages/dashboard/Insights.tsx` | Pagina completa | Sim - exclusiva |
| `src/App.tsx` | Import + Rota | Sim - remover import e rota |
| `src/components/layouts/DashboardLayout.tsx` | Item menu lateral | Sim - remover item |
| `src/i18n/config.ts` | Traducoes (3 idiomas) | Sim - remover bloco `insights` |
| Tabela `insights` (Supabase) | Tabela + RLS | NAO remover agora - manter no banco |

**NAO existe admin panel para Insights** - apenas Headlines tem pagina admin.

### O que NAO sera tocado
- Tabelas `headlines` e `insights` no banco permanecem (remocao de tabelas e uma operacao destrutiva separada)
- Nenhuma outra funcionalidade e afetada
- `copy_results` continua funcionando normalmente (sem dependencia)
- Nenhum edge function usa essas tabelas

### Ordem de Execucao

**Passo 1: `src/App.tsx`**
- Remover import de `Headlines` (linha 27)
- Remover import de `Insights` (linha 28)
- Remover import de `AdminHeadlines` (linha 43)
- Remover rota `/dashboard/headlines` (linha 87)
- Remover rota `/dashboard/insights` (linha 88)
- Remover rota `/admin/headlines` (linha 100)

**Passo 2: `src/components/layouts/DashboardLayout.tsx`**
- Remover item de menu `headlines` (linha 80)
- Remover item de menu `insights` (linha 81)
- Remover imports de icones `Newspaper` e `Lightbulb` que ficarem sem uso

**Passo 3: `src/components/layouts/AdminLayout.tsx`**
- Remover item de menu `Headlines` (linha 71)
- Remover import do icone `Type` se ficar sem uso

**Passo 4: `src/pages/dashboard/Performance.tsx`**
- Remover `headlines` do estado `realStats` (linha 31)
- Remover query de contagem de headlines do `Promise.all` (linha 46)
- Remover atribuicao `headlines` no `setRealStats` (linha 53)

**Passo 5: `src/i18n/config.ts`**
- Remover chave `headlines` do menu do dashboard nos 3 idiomas (EN, PT, ES)
- Remover chave `insights` do menu do dashboard nos 3 idiomas
- Remover bloco completo `headlines: { title, subtitle, ... }` nos 3 idiomas
- Remover bloco completo `insights: { title, subtitle, ... }` nos 3 idiomas

**Passo 6: Deletar arquivos**
- Deletar `src/pages/dashboard/Headlines.tsx`
- Deletar `src/pages/dashboard/Insights.tsx`
- Deletar `src/pages/admin/AdminHeadlines.tsx`

### Riscos
- **Zero risco estrutural** - nenhuma outra pagina ou componente depende dessas funcionalidades
- As tabelas permanecem no banco para eventual uso futuro ou migracao de dados
- Performance.tsx busca headlines mas nunca exibe o dado - remocao limpa o codigo sem impacto visual
