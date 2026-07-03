# Onboarding Interativo para Novos Usuários

Sequência guiada de 4 passos (spotlight + tooltip) exibida no primeiro login, traduzida em EN/PT/ES, com persistência no Supabase.

## 1. Banco de dados

Adicionar coluna em `profiles`:

- `has_completed_onboarding boolean not null default false`

Nenhuma outra alteração de schema. RLS existente já permite ao usuário atualizar o próprio perfil.

## 2. Traduções (i18n)

Adicionar chaves em `src/i18n/config.ts` (EN/PT/ES) sob `onboarding.*`:

- `step1.title/body` — "Start here. This is where your Brand DNA is born."
- `step2.title/body` — "Answer 12 questions..."
- `step3.title/body` — "Click Save. Your DNA is now stored..."
- `step4.title/body` — "Now pick any agent, type ok..."
- `next`, `skip`, `finish`, `progress` (ex.: "Passo {{current}} de {{total}}")

Idioma vem automaticamente de `useTranslation()` (já configurado).

## 3. Componente de Onboarding

Novo diretório `src/components/onboarding/`:

- `OnboardingProvider.tsx` — context provider montado dentro de `ProtectedRoute` que:
  - Lê `user.has_completed_onboarding` do `AuthContext`
  - Se `false`, ativa o tour após montagem do dashboard
  - Expõe `startTour()`, `skip()`, `complete()`, `next()`, `currentStep`
- `OnboardingTour.tsx` — overlay que renderiza:
  - Backdrop escuro semi-transparente com "buraco" (spotlight) no elemento alvo, calculado via `getBoundingClientRect()` do target
  - Card tooltip posicionado próximo ao alvo (usa componentes shadcn `Card` + `Button`), com animações `animate-fade-in` / `animate-scale-in`
  - Botões `Next` / `Skip` (ou `Finish` no último passo) traduzidos
  - Indicador de progresso (1/4, 2/4…)
  - Fechamento por ESC dispara `skip`
- `useOnboardingTarget.ts` — hook utilitário que registra refs por `data-onboarding-id`

Os passos são configurados por seletor `data-onboarding-id`:

1. `sidebar-positioning` → item "Positioning Start" no `DashboardLayout`
2. `positioning-questions` → área de perguntas na página `/dashboard/positioning`
3. `positioning-save` → botão Save no topo do chat de positioning
4. `sidebar-agents` → item "Agents" no menu lateral

Se o usuário não estiver na rota do passo, o tour navega automaticamente para a rota correspondente antes de exibir o tooltip. Se o alvo não existir após timeout curto, pula esse passo.

## 4. Instrumentação

Adicionar atributo `data-onboarding-id="..."` (sem alterar visual/lógica) em:

- `src/components/layouts/DashboardLayout.tsx` — itens "Positioning" e "Agents" do menu
- `src/pages/dashboard/Positioning.tsx` — container das perguntas e botão Save

## 5. Persistência

Ao concluir ou pular:

- `UPDATE profiles SET has_completed_onboarding = true WHERE id = auth.uid()`
- Atualizar `user` local via `updateUser()` do `AuthContext`
- `AuthContext` passa a incluir `has_completed_onboarding` no perfil carregado

## 6. Integração no App

Montar `<OnboardingProvider>` dentro de `ProtectedRoute` (ou envolvendo `DashboardLayout`) para só rodar em rotas autenticadas. Não impacta rotas públicas.

## 7. Responsividade e estilo

- Card tooltip com `max-w-sm`, padding responsivo
- Em telas < `sm`, tooltip vira modal centralizado (spotlight ainda destaca o alvo quando visível)
- Cores via tokens (`bg-card`, `text-foreground`, `border-border`, `bg-primary`)
- Ícones Lucide (`ChevronRight`, `X`)
- Animações via classes `animate-fade-in`, `animate-scale-in` já existentes

## Detalhes técnicos

- Sem novas dependências (sem `react-joyride`); implementação nativa com portal + `ResizeObserver` para reposicionar
- Spotlight: `box-shadow: 0 0 0 9999px rgba(0,0,0,.6)` no elemento clonado posicionado sobre o target
- Fluxo do passo 3 requer que o usuário complete o formulário; o tour aguarda o botão Save existir no DOM (polling curto, timeout ~15s → skip do passo)
- `has_completed_onboarding` é escrito uma única vez; nunca reexibido depois

## Fora de escopo

- Não altera o fluxo de positioning, chat ou agentes
- Não adiciona tracking analítico novo
- Não reabre o tour manualmente (pode ser adicionado depois via botão em Settings)
