

## Criar 4 Novos Agentes Especializados

### Novos Agentes

| # | Nome | Slug | Categoria | Icone |
|---|------|------|-----------|-------|
| 1 | Anuncios de Alta Conversao Monster | `high-conversion-ads-monster` | copywriting | Megaphone |
| 2 | Stories Estrategicos Monster | `strategic-stories-monster` | social | Newspaper |
| 3 | Reels & TikTok Monster | `reels-tiktok-monster` | social | Clapperboard |
| 4 | Carrossel Monster | `carousel-monster` | copywriting | FileText |

---

### Etapa 1: Inserir Agentes no Banco de Dados (Supabase)

Inserir 4 registros na tabela `agents` com todos os 20+ campos configurados, seguindo o padrao existente:

- **high-conversion-ads-monster**: Frameworks PAS e AIDA automaticos, headlines com formula de valor, bullets irresistiveis. Foco em maximizar cliques.
- **strategic-stories-monster**: Transforma perguntas simples em autoridade, conexao emocional, CTAs sutis que vendem sem parecer forcado.
- **reels-tiktok-monster**: Hook magnetico nos primeiros 3 segundos, estrutura de retencao, narrativas que prendem e convertem.
- **carousel-monster**: Copy para posts carrossel de 3 a 12 slides, estrutura persuasiva por slide, storytelling visual.

Cada agente recebe:
- system_prompt completo em formato language-neutral (detecta idioma automatico)
- quality_rules com regras de formatacao limpa (sem markdown, emojis, etc.)
- output_structure profissional
- model_id: `mistralai/mistral-large-latest`
- Parametros: temperature 0.8, max_tokens 3000, top_p 0.9
- sort_order sequencial apos os existentes

---

### Etapa 2: Atualizar Codigo do Frontend

#### 2.1 Mapeamento de traducao (`slugToTranslationKey`)

Adicionar nos 3 arquivos que possuem esse mapeamento:

| Arquivo | Novos mapeamentos |
|---------|-------------------|
| `src/pages/dashboard/Agents.tsx` | 4 novos slugs |
| `src/components/positioning/AgentSelectionModal.tsx` | 4 novos slugs |
| `src/pages/admin/AdminAgents.tsx` | Ja usa dados do DB diretamente (nenhuma alteracao) |

Mapeamentos:
```
'high-conversion-ads-monster': 'highConversionAds'
'strategic-stories-monster': 'strategicStories'
'reels-tiktok-monster': 'reelsTiktok'
'carousel-monster': 'carousel'
```

#### 2.2 Icones

O `iconMap` nos componentes ja inclui todos os icones necessarios (Megaphone, Newspaper, Clapperboard, FileText). Nenhuma alteracao necessaria.

---

### Etapa 3: Traducoes (i18n)

Adicionar em todos os 3 idiomas (PT, EN, ES):

#### Nomes e descricoes dos agentes (`agents.list.*`)
#### Mensagens de boas-vindas (`chat.welcome.*`)

**Portugues** (exemplo):
- `agents.list.highConversionAds.name`: "Anuncios de Alta Conversao Monster"
- `agents.list.highConversionAds.description`: "Frameworks PAS e AIDA aplicados automaticamente. Headlines com formula de valor e bullets irresistiveis que maximizam o clique."
- `chat.welcome.high_conversion_ads_monster.title`: "Vamos Criar Anuncios que Convertem de Verdade"
- `chat.welcome.high_conversion_ads_monster.description`: "Me conte sobre seu produto, publico e plataforma. Vou criar anuncios com frameworks PAS e AIDA que param o scroll e geram cliques."

(Mesmo padrao para os outros 3 agentes, nos 3 idiomas)

---

### Etapa 4: Painel Admin

O painel admin (`AdminAgents.tsx`) ja busca agentes diretamente do banco e exibe automaticamente. Os novos agentes aparecerao sem alteracoes de codigo. A pagina de configuracao individual (`/admin/agents/:slug`) tambem ja funciona para qualquer agente do banco.

---

### Resumo de Alteracoes

| Componente | Acao |
|------------|------|
| Supabase `agents` table | INSERT 4 novos registros com prompts completos |
| `src/pages/dashboard/Agents.tsx` | Adicionar 4 slugs ao `slugToTranslationKey` |
| `src/components/positioning/AgentSelectionModal.tsx` | Adicionar 4 slugs ao `slugToTranslationKey` |
| `src/i18n/locales/pt/common.json` | Adicionar nomes, descricoes e welcome messages |
| `src/i18n/locales/en/common.json` | Adicionar nomes, descricoes e welcome messages |
| `src/i18n/locales/es/common.json` | Adicionar nomes, descricoes e welcome messages |

Nenhuma alteracao necessaria no admin, layouts, rotas ou edge functions - a arquitetura existente suporta novos agentes automaticamente.

