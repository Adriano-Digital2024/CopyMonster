

## Correção: Mover DNA Updates para dentro da Biblioteca DNA

O problema é que "Atualizações & Evolução do DNA" ficou como item separado no sidebar apontando para `/dashboard/positioning/updates`, quando deveria estar vinculada à página oficial do DNA em `/dashboard/library`.

### Mudanças

**1. Mudar a rota de `/dashboard/positioning/updates` para `/dashboard/library/updates`**
- `App.tsx`: Alterar a rota do `DnaUpdates`

**2. Remover "DNA Updates" como item separado do sidebar**
- `DashboardLayout.tsx`: Remover o item `{ icon: GitBranch, path: '/dashboard/positioning/updates' }` do array `menuItems`

**3. Adicionar acesso ao DNA Updates dentro da página Library**
- `Library.tsx`: Adicionar um botão/card no topo da página (ao lado do header ou como card de destaque) que leva o usuário a `/dashboard/library/updates` — visível apenas quando há DNAs completos
- Usar o ícone `GitBranch` e as labels i18n já existentes (`dashboard.menu.dnaUpdates`)

**4. Atualizar referências internas**
- `DnaUpdates.tsx`: Nenhuma mudança necessária (já usa `DashboardLayout`)
- Qualquer link interno apontando para `/dashboard/positioning/updates` será atualizado para `/dashboard/library/updates`

### Resultado
- O sidebar fica limpo, sem item confuso
- DNA Updates fica acessível a partir da página oficial "Biblioteca DNA"
- A rota `/dashboard/library/updates` deixa claro que é uma subpágina da Library

