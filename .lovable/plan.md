
> Esta entrega é **somente documentação** (texto para copiar/colar). Nenhum arquivo do repositório será criado ou alterado se você aprovar este plano — ao confirmar, eu apenas formalizo o conteúdo abaixo como referência oficial do projeto.

---

# 1. Apresentação do Projeto

**Nome oficial:** CopyMonster
**Domínio de produção:** copymonster.me
**Tagline sugerida (EN):** *"Your Brand DNA, your AI agents, your data — open source."*
**Tagline sugerida (PT):** *"O DNA da sua marca + IA + dados de anúncios, em uma única plataforma aberta."*

**Problema que resolve:**
Criadores de copy, agências e times de marketing convivem com três dores simultâneas:
1. Ferramentas de IA genéricas (ChatGPT, Jasper, Copy.ai) que não conhecem a marca e geram copy “sem alma”.
2. Plataformas de inteligência de anúncios (AdCreative, Foreplay) que mostram dados mas não conectam com geração de copy.
3. Fechamento total do código — impossível auto-hospedar, customizar ou auditar prompts.

**Solução:**
CopyMonster combina **12 blocos de DNA de Marca** (6 estruturais + 6 adaptativos) com **agentes de IA especialistas**, alimentados por **dados reais do Meta Ads/Instagram** do próprio usuário. O DNA evolui automaticamente conforme a performance — algo que nenhum concorrente entrega.

**Público-alvo:**
- **Primário:** Copywriters freelancers e pequenas agências (2–20 pessoas) que rodam tráfego pago.
- **Secundário:** Infoprodutores, e-commerces D2C e times de marketing in-house.
- **Enterprise:** Agências grandes, holdings e times que precisam multi-workspace, SSO e self-hosting por compliance.

**Diferenciais competitivos (todos):**
1. **Brand DNA evolutivo** — 12 blocos versionados, alguns imutáveis (voz, audiência), outros que evoluem com IA.
2. **Loop fechado IA ↔ Meta Ads** — não é só ler dados; o DNA Intelligence Engine sugere ajustes nos blocos adaptativos com base em ROAS/CTR reais.
3. **Multi-agente especialista** — cada agente (Hook, VSL, Headline, Email, Anúncios) tem prompt, modelo e few-shots próprios, configuráveis via admin.
4. **Multilíngue real** — auto-detecção de idioma, system prompts sempre em inglês, output limpo no idioma do usuário (PT/EN/ES).
5. **Gamificação** — XP/níveis (Novice → Legend) atrelados a ações, aumentam retenção.
6. **Versionamento de DNA** — histórico completo, comparação entre versões, clone via “Smart Version”.
7. **Open-Core (novo)** — alternativa MIT a Jasper/Copy.ai/AdCreative, auto-hospedável.
8. **Stack moderno** — React + Vite + Supabase + Edge Functions; deploy em qualquer Docker host ou Cloudflare Pages.

**Posicionamento vs concorrentes:**
| Eixo | CopyMonster | Jasper | Copy.ai | AdCreative.ai | Anyword |
|---|---|---|---|---|---|
| Open Source / Self-host | ✅ MIT | ❌ | ❌ | ❌ | ❌ |
| Brand DNA persistente versionado | ✅ 12 blocos | Parcial (Brand Voice) | Parcial | ❌ | Parcial |
| Integração Meta Ads nativa | ✅ | ❌ | ❌ | ✅ (criativos) | ❌ |
| Evolução automática via performance | ✅ | ❌ | ❌ | ❌ | Parcial |
| Multi-agente configurável | ✅ | Parcial | ✅ | ❌ | ❌ |
| Preço entrada | $47 / grátis self-host | $49 | $49 | $39 | $49 |

---

# 2. Stack Tecnológica Completa

**Frontend**
- React 18 + Vite 5 + TypeScript 5
- Tailwind CSS 3 + shadcn/ui (Radix)
- React Router DOM, TanStack Query, React Hook Form + Zod
- i18next (PT/EN/ES, traduções inline em `src/i18n/config.ts`)
- Framer Motion, Lucide Icons, Recharts, Sonner

**Backend (Supabase / Lovable Cloud)**
- PostgreSQL 15 com RLS em todas as tabelas públicas
- Supabase Auth (email/senha + magic link)
- Supabase Storage (uploads de marca / few-shots)
- Edge Functions (Deno) para toda lógica server-side
- `pg_cron` + `pg_net` para jobs agendados
- `pgcrypto` (`extensions.pgp_sym_encrypt`) para tokens Meta

**Integrações externas**
- **Lovable AI Gateway** (default) ou OpenAI/Anthropic via chave própria
- **Meta Graph API** (Ads + Instagram Business)
- **Stripe** (assinaturas e webhook)
- **Sender.net** (marketing automation, sync via `pg_net`)
- **Meta Pixel + CAPI** (tracking)

**Edge Functions atuais**
`chat-stream`, `agent-test`, `dna-intelligence`, `meta-oauth`, `meta-sync`, `meta-disconnect`, `meta-token-refresh`, `meta-webhook`, `agentes-sync`, `sender-sync`, `create-checkout-session`, `stripe-webhook`, `admin-users`.

**Infraestrutura**
- Build: `npm run build` → `dist/`
- Container: Node 18-alpine + `serve` na porta `3030`
- Deploy alvo: Docker, Cloudflare Pages, Vercel, Netlify, Lovable Hosting

**Requisitos mínimos self-hosting**
- Docker 20+ ou Node 18+ / pnpm
- Conta Supabase (free tier funciona) **ou** Postgres 15 + Supabase OSS
- Domínio com HTTPS (Cloudflare grátis)
- ~512MB RAM / 1 vCPU para frontend; banco escala conforme uso
- Opcional: chave OpenAI/Anthropic; Stripe; Meta App; Sender.net

---

# 3. Funcionalidades — Core (MIT) vs Enterprise

## 3.1 CORE (MIT, Open Source, self-hosted)

A regra de ouro: **o core precisa ser um produto completo, não uma demo**.

| Módulo | Descrição |
|---|---|
| Autenticação | Email/senha, recovery, update password, single-tenant |
| Brand DNA | 12 blocos completos, versionamento, comparação, export |
| Agentes IA | Todos os agentes públicos (Hook, Headline, VSL, Email, Ads, etc.) configuráveis localmente |
| Chat com agentes | Streaming, histórico, anexar contexto do DNA |
| Biblioteca de copies | Salvar, organizar, exportar (TXT/MD/PDF) |
| Gamificação | XP, níveis, conquistas |
| i18n | PT/EN/ES |
| Tema claro/escuro | Completo |
| Cookie consent / GDPR | Banner + página de políticas |
| Deploy | Docker, Cloudflare Pages, Vercel |
| AI Gateway plugável | OpenAI, Anthropic, OpenRouter, Ollama (BYO key) |

## 3.2 ENTERPRISE (comercial, código fechado ou license-restricted)

Critério: funcionalidades que (a) dependem de integrações caras/com revisão de app, (b) só fazem sentido em escala multi-tenant, ou (c) exigem operação contínua.

| Módulo | Por que é Enterprise |
|---|---|
| **Meta Ads & Instagram Integration** | Exige App Review Meta, refresh tokens, webhooks, conformidade LGPD/GDPR |
| **DNA Intelligence Engine** | Análise automatizada com IA aplicada sobre dados reais — alto custo computacional |
| **Market Radar** | Necessita Meta Ad Library API + classificação ML contínua |
| **Performance Overview / Ads Intelligence** | Dashboards conectados a dados Meta |
| **Multi-tenant / Workspaces** | Isolamento, billing por workspace, roles granulares |
| **SSO (Google Workspace, Okta, Azure AD)** | SAML/OIDC |
| **Admin Panel completo** | Gestão de usuários, créditos, descontos, modelos, KB |
| **Billing nativo (Stripe)** | Planos, cupons, webhooks, gestão de assinatura |
| **White-label** | Logo, domínio, emails customizáveis |
| **Auditoria & Compliance Logs** | Trilha completa para LGPD/SOC2 |
| **Suporte SLA, onboarding, treinamento** | Serviço |
| **Cloud gerenciada (copymonster.me)** | Infra gerenciada + backups |

---

# 4. Modelo de Negócios Atual

**Monetização hoje:** SaaS recorrente em USD, billing Stripe.

| Plano | Preço/mês | Créditos | DNAs | Agentes | Intelligence |
|---|---|---|---|---|---|
| Free / Trial | $0 | 20 (7 dias) | 1 | Limitado | ❌ |
| Starter | $47 | 1.000 | 1 | 8 | ❌ |
| Pro | $97 | 5.000 | 10 | Todos | Básico |
| Legend | $197 | 15.000 | 50 | Todos | Completo |

Regras: **sem rollover**, 1 crédito por execução de agente, 5 créditos por execução de DNA Intelligence, admins têm acesso ilimitado.

**Custos operacionais principais:**
1. Lovable AI Gateway / OpenAI / Anthropic (variável por uso)
2. Supabase (DB + Edge Functions + Storage)
3. Stripe (2.9% + $0.30 por transação + 0.5% recorrente)
4. Sender.net (faixa free até ~2.5k contatos)
5. Domínio + Cloudflare (negligível)
6. Meta App (grátis, mas custo de manutenção de compliance)

**Público pagante atual:** copywriters e pequenas agências PT-BR, ticket médio $97 (Pro).

---

# 5. Arquitetura de Deploy (Docker + Cloudflare Pages)

## 5.1 Docker (self-host completo)

**`.env`** (raiz):
```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGci...
VITE_SUPABASE_PROJECT_ID=seu-projeto-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # opcional
```

**Subir:**
```bash
git clone https://github.com/SEU_USUARIO/copymonster.git
cd copymonster
cp .env.example .env
# editar .env
docker compose up -d --build
# app em http://localhost:3030
```

**Atrás de reverse proxy (Caddy/Nginx):**
```caddy
copymonster.seudominio.com {
  reverse_proxy localhost:3030
}
```

## 5.2 Cloudflare Pages

1. Fork do repo no GitHub.
2. Cloudflare Dashboard → Pages → Connect to Git.
3. **Build settings:**
   - Framework: Vite
   - Build command: `npm run build`
   - Output: `dist`
   - Node: `18`
4. **Environment variables** (Production e Preview):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_STRIPE_PUBLISHABLE_KEY` (opcional)
5. Adicionar `public/_redirects` (criar) com:
   ```
   /*    /index.html   200
   ```
   (Cloudflare Pages exige fallback SPA explícito.)
6. Custom domain → adicione `copymonster.seudominio.com`.

## 5.3 Supabase (backend self-host)

Duas opções:
- **Supabase Cloud (recomendado para começar):** cria projeto, copia URL+anon key, roda as migrations do diretório `supabase/migrations` via `supabase db push`.
- **Supabase OSS / Docker:** segue [supabase/supabase](https://github.com/supabase/supabase) docker-compose, aponta o frontend para o endpoint local.

**Secrets necessários nas Edge Functions:**
```
LOVABLE_API_KEY        (ou OPENAI_API_KEY / ANTHROPIC_API_KEY)
STRIPE_SECRET_KEY      (opcional, só se usar billing)
META_APP_ID            (opcional, só se usar integração Meta)
META_APP_SECRET
META_WEBHOOK_VERIFY_TOKEN
SENDER_API_KEY         (opcional)
SITE_URL               (ex: https://copymonster.me)
```

---

# 6. Diferenciais Competitivos (resumo para landing/README)

1. **Open Source MIT** — único na categoria copy + ads intelligence.
2. **Brand DNA versionado** — não é “tone of voice”, são 12 dimensões estratégicas.
3. **Closed-loop com Meta Ads** — performance real alimenta sugestões de DNA.
4. **Multi-agente plugável** — adicione agentes via admin sem deploy.
5. **Self-hostable** — seus dados, seus prompts, sua chave de IA.
6. **BYO LLM** — Lovable AI / OpenAI / Anthropic / Ollama.
7. **i18n nativo** PT/EN/ES.
8. **Compliance-ready** — LGPD, GDPR, data deletion callback, cookie banner.

---

# 7. Concorrentes Diretos

| Concorrente | Foco | Por que perdemos hoje | Por que ganhamos com Open-Core |
|---|---|---|---|
| **Jasper** | Copy genérica enterprise | Marca consolidada | MIT + DNA evolutivo + Meta loop |
| **Copy.ai** | Workflows de copy | Templates prontos | Mais profundo (DNA) + dados Meta |
| **AdCreative.ai** | Criação de criativos | Geração de imagem | Foco em copy + DNA + open-source |
| **Anyword** | Copy preditiva | Score preditivo | Loop fechado com Meta Ads real |
| **Foreplay** | Espionar criativos | Catálogo curado | Geração + análise integradas |
| **Writesonic** | Copy + SEO | Editor de blog | Foco vertical em performance ads |

**Mensagem de posicionamento:**
> *“The open-source alternative to Jasper, Copy.ai and AdCreative — self-host, own your data, and let your Brand DNA evolve from real Meta Ads performance.”*

---

# 8. Sugestão de README.md (texto pronto)

````markdown
<div align="center">

# 🧬 CopyMonster

**The open-source AI copy platform that evolves with your Meta Ads performance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Made with React](https://img.shields.io/badge/React-18-blue.svg)](https://react.dev)
[![Powered by Supabase](https://img.shields.io/badge/Supabase-Backend-3FCF8E.svg)](https://supabase.com)
[![Deploy on Cloudflare](https://img.shields.io/badge/Deploy-Cloudflare%20Pages-F38020.svg)](https://pages.cloudflare.com)
[![Docker Ready](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://www.docker.com)

[Website](https://copymonster.me) · [Docs](https://copymonster.me/docs) · [Cloud](https://app.copymonster.me) · [Discord](#) · [Enterprise](mailto:enterprise@copymonster.me)

</div>

---

## Why CopyMonster?

Most AI copy tools are closed black boxes that don’t know your brand.
CopyMonster is different:

- 🧬 **12-block Brand DNA** — structural + adaptive layers, versioned like code.
- 🤖 **Multi-agent system** — Hook, Headline, VSL, Email, Ads — each configurable.
- 📊 **Meta Ads loop** — your real ROAS/CTR feed automatic DNA suggestions.
- 🔓 **MIT licensed** — self-host, fork, audit every prompt.
- 🌍 **Multilingual** — PT, EN, ES out of the box.

> The open-source alternative to **Jasper, Copy.ai and AdCreative.ai**.

## Quickstart (Docker)

```bash
git clone https://github.com/YOUR_USER/copymonster.git
cd copymonster
cp .env.example .env  # edit your Supabase keys
docker compose up -d --build
# → http://localhost:3030
```

## Deploy on Cloudflare Pages

1. Fork this repo
2. Cloudflare Pages → Connect to Git
3. Build command: `npm run build` · Output: `dist`
4. Add env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`
5. Done.

## Tech stack

React 18 · Vite · TypeScript · Tailwind · shadcn/ui · Supabase (Postgres + Edge Functions) · Stripe · Meta Graph API · Recharts · i18next.

## Comparison

| | CopyMonster | Jasper | Copy.ai | AdCreative |
|---|:-:|:-:|:-:|:-:|
| Open Source | ✅ | ❌ | ❌ | ❌ |
| Self-hostable | ✅ | ❌ | ❌ | ❌ |
| Brand DNA versioned | ✅ | ⚠️ | ⚠️ | ❌ |
| Meta Ads integration | ✅ | ❌ | ❌ | ✅ |
| BYO LLM | ✅ | ❌ | ❌ | ❌ |
| Starts at | **$0** | $49 | $49 | $39 |

## Core (free forever) vs Enterprise

| Feature | Core (MIT) | Enterprise |
|---|:-:|:-:|
| Brand DNA (12 blocks, versioning) | ✅ | ✅ |
| All AI agents | ✅ | ✅ |
| BYO LLM (OpenAI / Anthropic / Ollama) | ✅ | ✅ |
| Single user / team | ✅ | ✅ |
| Meta Ads & Instagram integration | — | ✅ |
| DNA Intelligence (auto-evolution) | — | ✅ |
| Market Radar | — | ✅ |
| Multi-workspace / multi-tenant | — | ✅ |
| SSO (Google, Okta, Azure AD) | — | ✅ |
| White-label | — | ✅ |
| SLA & priority support | — | ✅ |

**Need Enterprise?** → [enterprise@copymonster.me](mailto:enterprise@copymonster.me) or book a [demo](https://copymonster.me/enterprise).

## Roadmap

- [ ] Plugin SDK for community agents
- [ ] Google Ads integration
- [ ] TikTok Ads integration
- [ ] Ollama / local-first mode
- [ ] CLI for headless DNA generation
- [ ] Public benchmarks of agent prompts

## Community & Support

- 💬 Discord: discord.gg/copymonster
- 🐦 X / Twitter: @copymonsterhq
- 📧 hello@copymonster.me
- 🏢 Enterprise: enterprise@copymonster.me

## License

[MIT](LICENSE) for the core. Enterprise modules under a separate commercial license — see `/enterprise/LICENSE`.
````

---

# 9. Estrutura de Pastas (atual + proposta Open-Core)

## 9.1 Atual
```
copymonster/
├─ public/                 # estáticos
├─ src/
│  ├─ components/          # UI + features
│  │  ├─ ui/               # shadcn primitives
│  │  ├─ layouts/          # DashboardLayout, AdminLayout
│  │  ├─ chat/, dashboard/, admin/, positioning/, intelligence/, cookie/, tracking/, trial/
│  ├─ contexts/            # AuthContext, CookieConsentContext
│  ├─ hooks/               # useAgents, useDnaVersions, useMetaIntegration, ...
│  ├─ i18n/                # config.ts + locales/{pt,en,es}/*.json
│  ├─ integrations/supabase/  # client + types
│  ├─ lib/                 # configs, prompts, utils
│  ├─ pages/
│  │  ├─ dashboard/        # Agents, Chat, Library, Positioning, AdsIntelligence, MarketRadar, ...
│  │  ├─ admin/            # AdminUsers, AdminAgents, KnowledgeBase, Models, ...
│  │  └─ legal/            # PrivacyPolicy, GDPR, CookiePolicy, DataDeletionStatus
│  ├─ App.tsx · main.tsx · index.css
├─ supabase/
│  ├─ functions/           # edge functions (Deno)
│  ├─ migrations/          # SQL
│  └─ config.toml
├─ Dockerfile · docker-compose.yml · .env.example
├─ vite.config.ts · tailwind.config.ts · tsconfig.json
└─ README.md
```

## 9.2 Proposta Open-Core (mínima ruptura)
```
copymonster/
├─ core/                       # MIT — tudo que vai pro repo público
│  ├─ src/
│  │  ├─ pages/dashboard/      # Agents, Chat, Library, Positioning
│  │  ├─ components/           # UI + chat + positioning
│  │  └─ lib/prompts/          # prompts dos agentes públicos
│  └─ supabase/functions/      # chat-stream, agent-test, sender-sync
├─ enterprise/                 # licença comercial — repo privado
│  ├─ src/
│  │  ├─ pages/dashboard/      # AdsIntelligence, MarketRadar, PerformanceOverview, DnaUpdates
│  │  ├─ pages/admin/          # admin completo
│  │  └─ components/intelligence/
│  └─ supabase/functions/      # meta-*, dna-intelligence, admin-users, stripe-webhook
├─ shared/                     # utilitários compartilhados (i18n, ui primitives, supabase client)
└─ apps/
   ├─ web/                     # entrypoint que monta core + enterprise via feature flags
   └─ docs/                    # site de docs (opcional)
```

**Feature flag central** (`src/lib/edition.ts`):
```ts
export const EDITION = import.meta.env.VITE_EDITION ?? 'core'; // 'core' | 'enterprise'
export const isEnterprise = EDITION === 'enterprise';
```
Componentes Enterprise são importados via `React.lazy` e só montam quando `isEnterprise`. No build Core, o bundler trata o diretório `enterprise/` como external e gera placeholders “Upgrade to Enterprise”.

---

# 10. Modelo Comercial Recomendado

| Tier | Preço | Inclui | Público |
|---|---|---|---|
| **Core (MIT)** | $0 | Self-host, todos agentes públicos, 1 DNA, BYO LLM | Devs, indies, testes |
| **Starter Cloud** | $47/mo | 1.000 créditos, 1 DNA, 8 agentes, cloud gerenciada | Copywriters freelancer |
| **Pro Cloud** | $97/mo | 5.000 créditos, 10 DNAs, todos agentes, Market Radar básico | Profissionais / pequenas agências |
| **Legend Cloud** | $197/mo | 15.000 créditos, 50 DNAs, DNA Intelligence completo | Agências médias |
| **Enterprise Cloud** | $997+/mo | Tudo + multi-workspace + SSO + SLA 99.9% + onboarding | Holdings, in-house grandes |
| **Enterprise Self-Hosted** | $5k–$15k/ano | Licença anual + suporte + atualizações + multi-tenant | Compliance / dados sensíveis |
| **White-Label** | $25k+/ano | Revenda como produto próprio | Agências revendedoras |

**Funil de conversão:**
1. **Aquisição open-source** → README + Product Hunt + “alternative to Jasper”.
2. **Self-host friction** → CTA “Cloud em 1 clique, sem configurar Supabase”.
3. **Cloud Starter** → upgrade automático quando bater limite de créditos.
4. **Pro → Legend** → ativação de Meta Ads dispara prompt “desbloqueie Intelligence”.
5. **Legend → Enterprise** → quando criar 2º workspace ou pedir SSO.

---

# 11. Riscos e Mitigações

| Risco | Mitigação |
|---|---|
| Concorrentes copiarem prompts | Prompts públicos viram commodity; valor é DNA + dados Meta + comunidade |
| Self-host canibalizar cloud | Limites técnicos (sem multi-tenant), suporte como diferencial |
| Custo de IA explodir | BYO LLM no core, Lovable Gateway no cloud com markup |
| Cumprir Meta App Review | Já em andamento (webhook, data deletion, privacy policy) |
| Fragmentação de forks | License MIT no core, CLA opcional, governança via mantenedores |

---

# 12. Próximos Passos Sugeridos

1. **Aprovar este documento** como referência oficial (`docs/STRATEGY.md` futuramente).
2. **Reorganizar repositório** em `core/` + `enterprise/` (migration mecânica, ~1 sprint).
3. **Publicar repositório público** com Core + novo README.
4. **Landing `/opensource`** com comparação e badges.
5. **Submeter ao Product Hunt** + “alternativeto.net” + r/SaaS + r/selfhosted.
6. **Discord da comunidade** + canal de feedback.
7. **Pricing page revisada** com tier Core $0 + Enterprise “Contact us”.

---

**Próxima ação:** se aprovar, sigo apenas referenciando este texto. Para *implementar* a separação `core/` + `enterprise/`, peça em modo build numa próxima conversa — é uma refatoração estrutural que merece plano dedicado.
