## Objetivo

Evolução **visual premium** do CopyMonster — mais clean, hierarquia melhor, sidebar moderna, cards de agentes mais respiráveis — preservando 100% da lógica, rotas, i18n, integrações, cores da marca (amarelo `51 98% 33%`) e funcionalidades.

## Escopo (somente camada visual)

Arquivos tocados (apenas estilos/JSX de apresentação):

1. `src/index.css` — adicionar tokens de profundidade
2. `src/components/layouts/DashboardLayout.tsx` — sidebar premium
3. `src/components/layouts/AdminLayout.tsx` — mesmo tratamento
4. `src/pages/dashboard/Agents.tsx` — grid e cards refinados
5. `src/pages/admin/AdminAgents.tsx` — cards refinados
6. `src/pages/Dashboard.tsx` — header/cards (refino leve)
7. `src/pages/admin/AdminDashboard.tsx` — refino leve

**Não muda:** menuItems, rotas, handlers, hooks, traduções (todas chaves `t(...)` mantidas), permissões, lógica de trial/credits, comportamento dos botões, integrações.

## Mudanças visuais

### Design tokens (`index.css`)
- Adicionar variáveis sem alterar cores existentes:
  - `--surface-1`, `--surface-2` para níveis sutis de elevação derivados do `--card`
  - `--shadow-soft`, `--shadow-elevated` (mais sutis que o atual)
  - `--sidebar-background` ligeiramente mais escuro que `--card` no dark, mais claro no light
- Manter LOCKED: `--border`, `--input`, `--primary` (amarelo), `--background`.

### Sidebar (Dashboard + Admin)
- Largura mantida (w-64); fundo `bg-sidebar` com leve gradiente vertical sutil
- Logo com padding reduzido e divisor mais sutil
- **Agrupamento visual** com seções rotuladas (labels minúsculos `text-xs uppercase tracking-wider text-muted-foreground/60`):
  - Dashboard: "Workspace" (Positioning, Overview, Agents, Campaigns, Copy Results, Library, Performance) / "Intelligence" (Ads, Performance Overview, Market Radar) / "Account" (Billing, Settings)
  - Admin: "Visão geral" / "Gestão" / "Conteúdo & IA" / "Sistema"
- Itens: altura 9, `rounded-md`, ícone 4×4, hover `bg-muted/50`, ativo com `bg-primary/10 text-primary` + barra lateral de 2px à esquerda (`before:` pseudo)
- Badge "Em breve" / "Start" com estilo mais discreto (outline em vez de fundo cheio)
- Footer do usuário em card compacto (avatar com inicial + nome + créditos), botão logout `ghost` com ícone
- Scrollbar custom já existe — mantida

### Header
- Altura 14, `backdrop-blur` sutil, borda inferior `border-border/60`
- Espaçamento melhor entre NotificationBell / LanguageSwitcher / ThemeToggle

### Página Agents (user + admin)
- Header de página: título + subtítulo com mais respiro (mb-8)
- Grid responsivo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4` (admin mantém 3 cols para densidade)
- Cards de agente refinados:
  - Padding `p-5`, `rounded-xl`, borda `border-border/60`
  - Hover: leve `translate-y-[-2px]`, `shadow-elevated`, borda `border-primary/40`
  - Ícone com fundo suave (mantém cor do agente, já existe)
  - Tipografia: nome `text-base font-semibold`, descrição `text-sm line-clamp-2`
  - Botão CTA `variant="ghost"` com seta `ArrowRight` em vez de botão sólido full-width (reduz peso visual); admin mantém botão "Configure"
  - Badge superior direita mais sutil (`variant="outline"`)
- Separadores entre categorias com label discreto + contagem

### Conteúdo (`main`)
- `max-w-7xl mx-auto` + padding `p-6 lg:p-10` para respiração
- Fundo do `main` com `bg-background`, contraste com sidebar mais notável

### Microinterações
- `transition-colors`/`transition-all` 200ms em itens de sidebar e cards
- Sem framer-motion novo (não introduzir libs)

## O que NÃO muda

- Nenhum texto exibido: todos os `t('...')` permanecem idênticos
- menuItems (mesmos itens, mesmas paths, mesmos ícones — só agrupados visualmente)
- Lógica de `useAuth`, `canUseAgents`, `TrialExpiredModal`, redirecionamentos
- Cores primárias (amarelo CopyMonster), variáveis LOCKED de borda
- Estrutura de rotas, hooks, edge functions, banco, i18n

## Validação pós-implementação

- Preview em desktop e mobile (sheet sidebar funciona)
- Trocar tema dark/light — contraste mantido
- Navegar entre páginas — itens ativos destacados corretamente
- Confirmar que badges "Em breve" e bloqueios de agentes seguem aparecendo
