

## Auditoria e Atualizacao - DNA como Nucleo Obrigatorio do CopyMonster

### Resultado da Auditoria

#### Estado Atual - Problemas Identificados

**1. SEM VALIDACAO DE DNA ANTES DE GERAR COPY**
- `AgentChat.tsx` carrega o agente e verifica `localStorage.getItem('positioning_mapping_id')` para contexto opcional
- Se nao encontra, simplesmente ignora e permite gerar copy SEM DNA algum
- O usuario pode acessar qualquer agente diretamente via URL (`/dashboard/agents/vsl-monster`) sem ter DNA
- O `chat-stream` edge function NAO valida se o usuario possui DNA - processa qualquer mensagem

**2. COPY GERADA COM "OK" - EXPLICACAO TECNICA**
- O usuario digitou "OK", o `ChatInterface.handleSend()` enviou para `chat-stream`
- O edge function usou apenas o `system_prompt` do agente (sem DNA)
- O LLM gerou copy baseado APENAS no prompt do agente + "OK" como input
- Resultado: copy 100% generica, sem dados do negocio do usuario
- Nenhum fallback foi usado - a copy veio do system_prompt puro do agente

**3. SEM CONTROLE DE LIMITE DE DNAs POR PLANO**
- Tabela `profiles` tem `subscription_status` (free/starter/pro/legend)
- Nao existe contagem de DNAs criados nem limite por plano
- Qualquer usuario pode criar DNAs ilimitados

**4. SEM SELETOR DE DNA AO ABRIR AGENTE**
- `AgentChat.tsx` so carrega DNA se `positioning_mapping_id` estiver no localStorage
- Isso so acontece quando o usuario vem do `AgentSelectionModal` (pos-DNA)
- Acesso direto ao agente = sem DNA

**5. CARDS DE PLANOS SEM INFO DE LIMITE DE DNAs**
- Features dos planos listam apenas creditos, agentes e suporte

---

### Plano de Implementacao

#### Fase 1: Migracao SQL - Adicionar coluna `max_dna_projects`

Nenhuma nova coluna necessaria na tabela `profiles` - o `subscription_status` ja controla o plano. Os limites serao mapeados no codigo.

Porem precisamos de uma query para contar DNAs existentes do usuario de forma eficiente.

#### Fase 2: Hook `useDnaGuard` - Validacao Central de DNA

Criar `src/hooks/useDnaGuard.ts` - hook reutilizavel que:
- Busca `positioning_mappings` do usuario com status `completed`
- Retorna `{ hasDna, dnaCount, dnaList, dnaLimit, isLoading, canCreateMore }`
- Mapeia limites por plano: Starter=1, Pro=10, Legend=50, free=1 (trial)
- Sera usado em todos os pontos de controle

#### Fase 3: Bloqueio de Acesso - `AgentChat.tsx`

Ao carregar `AgentChat`:
1. Chamar `useDnaGuard()` para verificar se usuario tem DNA completo
2. Se NAO tem DNA:
   - Mostrar modal de alerta com mensagem (nos 3 idiomas):
     - PT: "O CopyMonster identificou que voce ainda nao criou o DNA do seu negocio. Crie agora para que suas copys tenham um desempenho de classe superior."
     - EN: "CopyMonster noticed you haven't created your business DNA yet. Create it now so your copies achieve superior performance."
     - ES: "CopyMonster noto que aun no has creado el ADN de tu negocio. Crealo ahora para que tus copys tengan un rendimiento de clase superior."
   - Botao unico: Redirecionar para `/dashboard/positioning`
   - NAO renderizar o ChatInterface

3. Se TEM DNA (1 ou mais):
   - Mostrar seletor dropdown/modal com lista de DNAs do usuario (titulo + data)
   - Usuario seleciona qual DNA usar
   - Passar `positioning_mapping_id` selecionado para o `ChatInterface`
   - O DNA e injetado no contexto via `chat-stream` (ja funciona - linhas 401-428)

#### Fase 4: Bloqueio na Pagina de Agentes - `Agents.tsx`

Na lista de agentes (`/dashboard/agents`):
1. Chamar `useDnaGuard()`
2. Se NAO tem DNA: mostrar banner no topo da pagina com mesma mensagem + botao de redirecionar
3. Cards de agentes ficam visiveis mas com overlay/desabilitados
4. Click em qualquer agente redireciona para `/dashboard/positioning` com toast

#### Fase 5: Bloqueio no Dashboard - `Dashboard.tsx`

No quick access de agentes:
1. Se nao tem DNA: ao clicar em qualquer agente (exceto Brand Positioning Monster), mostrar toast e redirecionar para `/dashboard/positioning`

#### Fase 6: Validacao Backend - `chat-stream`

No edge function `chat-stream/index.ts`, APOS autenticacao e ANTES de processar:
1. Se `agent_slug` != `brand-positioning-monster`:
   - Verificar se usuario tem pelo menos 1 `positioning_mapping` com `status = 'completed'`
   - Se NAO: retornar erro 403 com mensagem `DNA_REQUIRED`
   - Se SIM mas `positioning_mapping_id` nao foi enviado: retornar erro 400 com mensagem `DNA_SELECTION_REQUIRED`
2. Isso garante que mesmo requests diretos a API nao passam sem DNA

#### Fase 7: Controle de Limite por Plano

**No `useDnaGuard` hook:**
```text
Mapa de limites:
  free -> 1 DNA (trial)
  starter -> 1 DNA
  pro -> 10 DNAs
  legend -> 50 DNAs
```

**Na pagina `/dashboard/positioning` (Positioning.tsx):**
1. Antes de iniciar novo DNA: verificar se usuario atingiu limite
2. Se atingiu: mostrar modal de upgrade (nao bloquear plataforma)
   - "Voce atingiu o limite de X projetos DNA do seu plano Y. Faca upgrade para criar mais projetos."
   - Botoes: "Ver Planos" (vai para /dashboard/billing) + "Continuar no plano atual" (fecha modal)

**Na pagina `/dashboard/library` (Library.tsx):**
1. Mostrar contador: "X/Y projetos DNA utilizados"
2. Botao "Novo Posicionamento" desabilitado quando no limite, com tooltip explicativo

#### Fase 8: Atualizacao dos Cards de Planos (i18n)

Adicionar informacao de limite de DNAs nas features dos 3 planos, nos 3 idiomas:

**EN:**
- Starter: "1 Brand DNA project"
- Pro: "Up to 10 Brand DNA projects"
- Legend: "Up to 50 Brand DNA projects"

**PT:**
- Starter: "1 projeto de DNA de Marca"
- Pro: "Ate 10 projetos de DNA de Marca"
- Legend: "Ate 50 projetos de DNA de Marca"

**ES:**
- Starter: "1 proyecto de ADN de Marca"
- Pro: "Hasta 10 proyectos de ADN de Marca"
- Legend: "Hasta 50 proyectos de ADN de Marca"

Essas linhas serao inseridas como segunda feature de cada plano (apos creditos).

#### Fase 9: Traducoes Novas (i18n - 3 idiomas)

Chaves novas necessarias:

```text
dna.required.title - "DNA do Negocio Necessario" / "Business DNA Required" / "ADN de Negocio Necesario"
dna.required.message - (mensagem completa de redirecionamento)
dna.required.cta - "Criar DNA Agora" / "Create DNA Now" / "Crear ADN Ahora"
dna.selector.title - "Selecione o Projeto DNA" / "Select DNA Project" / "Selecciona el Proyecto ADN"
dna.selector.description - "Escolha qual posicionamento usar..." / "Choose which positioning to use..." / "Elige que posicionamiento usar..."
dna.limit.reached.title - "Limite de Projetos Atingido" / "Project Limit Reached" / "Limite de Proyectos Alcanzado"
dna.limit.reached.message - (mensagem com upgrade)
dna.limit.reached.upgrade - "Ver Planos" / "View Plans" / "Ver Planes"
dna.limit.reached.stay - "Continuar no plano atual" / "Stay on current plan" / "Continuar en el plan actual"
dna.counter - "{{used}}/{{limit}} projetos DNA" (pattern)
```

---

### Resumo de Arquivos Afetados

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `src/hooks/useDnaGuard.ts` | NOVO - Hook central de validacao |
| `src/pages/dashboard/AgentChat.tsx` | Adicionar bloqueio + seletor de DNA |
| `src/pages/dashboard/Agents.tsx` | Adicionar banner/bloqueio sem DNA |
| `src/pages/dashboard/Dashboard.tsx` | Adicionar validacao no quick access |
| `src/pages/dashboard/Positioning.tsx` | Adicionar controle de limite por plano |
| `src/pages/dashboard/Library.tsx` | Adicionar contador de DNAs |
| `src/components/chat/ChatInterface.tsx` | Sem alteracao (ja suporta positioning_mapping_id) |
| `supabase/functions/chat-stream/index.ts` | Adicionar validacao backend de DNA |
| `src/i18n/config.ts` | Adicionar traducoes + features de planos |

### Impacto em Funcionalidades Existentes

- Fluxo de criacao de DNA (Positioning.tsx) NAO e alterado
- ChatInterface NAO e alterado (ja recebe positioning_mapping_id como prop)
- chat-stream ja injeta DNA quando positioning_mapping_id e enviado (linhas 401-428) - apenas adiciona validacao
- Library.tsx mantem todas funcionalidades (renomear, deletar, visualizar) - apenas adiciona contador
- AgentSelectionModal.tsx NAO e alterado (ja funciona com mappingId)
- Stripe webhook NAO e alterado
- RLS policies NAO sao alteradas (queries usam user_id do auth)

