# Contributing to CopyMonster

Thanks for your interest in contributing! CopyMonster is an open-source
(MIT) AI copy platform built around a mandatory **Brand DNA** flow.
Contributions of all kinds are welcome: bug reports, new agents, new LLM
providers, translations, docs, and performance improvements.

All communication, code, comments, commit messages, and documentation in
this repository must be in **English**.

---

## Quick Links

- [Code of Conduct](#code-of-conduct)
- [Local Development](#local-development)
- [Branching & Commits](#branching--commits)
- [Pull Request Checklist](#pull-request-checklist)
- [Adding a New Agent Prompt](#adding-a-new-agent-prompt)
- [Adding a New LLM Provider](#adding-a-new-llm-provider)
- [Security](#security)

---

## Code of Conduct

Be respectful, inclusive, and constructive. Harassment, discrimination, or
personal attacks of any kind will not be tolerated. Report incidents to
conduct@copymonster.me.

---

## Local Development

Requirements:

- Node.js 18+ and `npm` (or `pnpm`)
- Docker 20+ (optional but recommended)
- A Supabase project (free tier works)

```bash
git clone https://github.com/YOUR_USER/copymonster.git
cd copymonster
cp .env.example .env
# fill in your VITE_SUPABASE_* values

# Option A: Docker
docker compose up -d --build
# → http://localhost:3030

# Option B: Local dev server
npm install
npm run dev
# → http://localhost:8080
```

Backend secrets (OpenAI / Anthropic / OpenRouter / Mistral / Meta / Stripe)
belong in Supabase Edge Function secrets, **not** in the committed `.env`.

---

## Branching & Commits

- Branch from `main`: `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`.
- Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat: add OpenRouter provider`
  - `fix(chat): handle empty stream chunks`
  - `docs(readme): clarify DNA-first flow`
- Keep PRs focused — one logical change per PR.

---

## Pull Request Checklist

Before opening a PR:

- [ ] Code builds: `npm run build`
- [ ] No new TypeScript errors
- [ ] No hard-coded colors — use design tokens from `src/index.css`
- [ ] All user-facing strings go through `i18next` (`src/i18n/config.ts`)
- [ ] No emojis in UI — use Lucide icons
- [ ] Updated docs if behavior changed
- [ ] Linked the related issue (if any)

---

## Adding a New Agent Prompt

Agents are database-driven (`agents` table in Supabase). To add a public
agent in the Core:

1. Add the default prompt template under `src/lib/prompts/agent-prompts.ts`.
2. Insert a row in `agents` via a migration in `supabase/migrations/`
   (slug, display name, default model, default temperature, few-shot examples).
3. Add i18n keys for the agent label/description in all three locales
   (`pt`, `en`, `es`) inside `src/i18n/config.ts`.
4. Verify it appears in `/dashboard/agents` and that a chat session works.

Always keep system prompts in **English**. User-facing labels go through i18n.

---

## Adding a New LLM Provider

The Core supports BYO LLM. Currently wired: **Lovable AI Gateway** (default),
**OpenAI**, **Anthropic**. Documented but not yet wired in edge functions:
**OpenRouter**, **Mistral**, **Ollama** — PRs welcome.

To add a provider:

1. Add a new branch to the provider switch in
   `supabase/functions/chat-stream/index.ts` and
   `supabase/functions/agent-test/index.ts`.
2. Read the API key from `Deno.env.get("<PROVIDER>_API_KEY")`.
3. Map the provider's streaming format to the Server-Sent Events shape the
   frontend already consumes — do not change the frontend contract.
4. Add a `provider` enum value (if needed) so it can be selected in the
   admin `Models` page.
5. Add an entry to `.env.example` and a section to the README.
6. Test with at least one model and document the cost characteristics.

---

## Translations

All UI strings live in `src/i18n/config.ts` (inline objects, not external
JSON files — this is intentional). To add or update a translation:

1. Add the key under all three languages: `pt`, `en`, `es`.
2. Keep keys stable; never delete a key without checking callers.
3. Do not introduce a new locale without prior discussion in an issue.

---

## Security

Never open a public issue for a vulnerability. See [SECURITY.md](./SECURITY.md)
for the private reporting process.

---

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](./LICENSE) covering the Core. Enterprise modules are
governed by a separate commercial license and are not accepted as community
contributions.