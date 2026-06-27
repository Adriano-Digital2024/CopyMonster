# Open-Core Final Strategy — Implementation Plan

All new text/files in **English**. No business logic, routing, i18n keys, or UI behavior changes — this plan only touches repo metadata, docs, and the AI provider configuration surface.

---

## 1. Final Open-Core Split (locked)

**CORE (MIT, free, self-hostable)**
- Brand DNA (12 blocks, full) — *mandatory entry point*
- All public AI agents (Hook, Headline, VSL, Email, Ads, etc.)
- Chat with agents, Library, Gamification, i18n (PT/EN/ES)
- Basic Meta Ads connection (OAuth + read) — hook to Enterprise
- BYO LLM: Lovable AI Gateway, OpenAI, Anthropic, **OpenRouter**, **Mistral**, Ollama

**ENTERPRISE (commercial)**
- DNA Intelligence Engine (automatic evolution, A/B test variants, additional Intelligence products)
- Market Radar
- Advanced Meta Ads (Performance Overview deep metrics, multi-account, IG insights)
- Multi-tenant / Workspaces
- SSO (Google, Okta, Azure AD)
- White-label
- Admin Panel (full)
- SLA & priority support

---

## 2. New Positioning (English-only across repo)

> **CopyMonster is the only open-source AI copy platform that forces you to map your Brand DNA before writing a single word. The result? Copy that converts — because it's built on strategy, not generic prompts.**

---

## 3. Pricing (locked)

| Plan | Price |
|---|---|
| Core (MIT) | $0 |
| Starter Cloud | $47/mo |
| Pro Cloud | $97/mo |
| Legend Cloud | $197/mo |
| Enterprise Cloud | $1,500+/mo |
| Enterprise Self-Hosted | $8k–$20k/yr |

---

## 4. Files to Create / Update (immediate action)

### 4.1 `LICENSE` (new) — MIT, copyright "CopyMonster".

### 4.2 `README.md` (full replacement)
English-only. Structure:
1. Hero — name, tagline, badges (MIT, React, Supabase, Docker, Cloudflare Pages).
2. **"DNA First" section** (highlighted) — explains the mandatory 12-block DNA flow and why it's the differentiator vs Jasper/Copy.ai.
3. Quickstart (Docker + Cloudflare Pages).
4. Tech stack.
5. Comparison table vs Jasper / Copy.ai / AdCreative / Anyword (Open Source, Self-host, DNA-first, Meta loop, BYO LLM, price).
6. **Core vs Enterprise** table (matches §1).
7. **Supported LLM providers** — Lovable AI Gateway, OpenAI, Anthropic, OpenRouter, Mistral, Ollama (env var names + where to plug in).
8. Roadmap, Community, License.
9. **Enterprise section** (verbatim block):
   ```
   ## Enterprise

   Features available in the Enterprise plan:
   - Multi-tenant (multiple workspaces)
   - SSO
   - White-label
   - Automatic DNA evolution
   - Priority support

   Contact: enterprise@copymonster.me
   ```

### 4.3 `CONTRIBUTING.md` (new) — English
- Code of conduct reference, branch model, conventional commits, PR checklist, local dev (`docker compose up`), how to add a new agent prompt, how to add a new LLM provider, CLA note (optional), security policy pointer.

### 4.4 `.env.example` (update existing)
Add commented entries for new providers (publishable/non-secret placeholders only; real keys via Supabase secrets):
```
# AI providers (choose one or more; configured server-side via Supabase secrets)
# LOVABLE_API_KEY=
# OPENAI_API_KEY=
# ANTHROPIC_API_KEY=
# OPENROUTER_API_KEY=
# MISTRAL_API_KEY=
# OLLAMA_BASE_URL=http://localhost:11434
```
Keep existing `VITE_SUPABASE_*` and `VITE_STRIPE_PUBLISHABLE_KEY` untouched.

### 4.5 `SECURITY.md` (new, small) — how to report vulnerabilities (security@copymonster.me), supported versions.

### 4.6 `.lovable/plan.md` — replace with this finalized strategy as the reference doc.

---

## 5. LLM Providers — Documentation-Only Scope

This plan **documents** OpenRouter and Mistral as supported BYO options in README + `.env.example` + CONTRIBUTING. It does **not** modify edge functions (`chat-stream`, `agent-test`, `dna-intelligence`) in this iteration — the Lovable AI Gateway already proxies OpenAI/Anthropic/Google models, and adding raw OpenRouter/Mistral SDK paths is a separate build task to avoid touching production logic.

A follow-up plan (separate approval) will:
- Add `provider` column handling in the `models` admin table for `openrouter` and `mistral`.
- Extend `chat-stream` / `agent-test` switch with two new branches.
- No UI change required — admin Models page already supports arbitrary providers via the existing form.

---

## 6. Repository Go-Public Checklist (manual, outside code)

User-side actions after this plan is implemented:
1. GitHub repo → Settings → Visibility → Public.
2. Add topics: `open-source`, `ai`, `copywriting`, `brand-dna`, `meta-ads`, `supabase`, `react`, `vite`.
3. Set repo description to the new tagline.
4. Enable Discussions + Issues templates (optional follow-up).
5. Create `enterprise@copymonster.me` and `security@copymonster.me` aliases.

---

## 7. Out of Scope (explicitly NOT touched)

- No changes to `src/` components, pages, routes, contexts, hooks.
- No changes to i18n JSON files.
- No changes to Supabase migrations or edge functions.
- No changes to `package.json` dependencies.
- No folder restructure into `core/` + `enterprise/` (deferred to a dedicated future plan).
- No pricing page UI update (deferred — current Stripe products keep working).

---

## 8. Deliverable Summary

| File | Action |
|---|---|
| `LICENSE` | create (MIT) |
| `README.md` | replace (English, DNA-first) |
| `CONTRIBUTING.md` | create |
| `SECURITY.md` | create |
| `.env.example` | append LLM provider placeholders |
| `.lovable/plan.md` | replace with this finalized strategy |

Zero risk to running app — all changes are repo metadata and documentation.
