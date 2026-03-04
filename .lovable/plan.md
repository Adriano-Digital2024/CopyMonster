## Sprint 3 — Gap Analysis & Checklist

After thorough review of the codebase, database schema, and existing implementations, here is what **already exists** vs **what's missing** for Sprint 3.

---

### Already Implemented (from previous sprints)


| Item                                                                                                                                             | Status |
| ------------------------------------------------------------------------------------------------------------------------------------------------ | ------ |
| `dna_versions` table with `version_label`, `version_type`, `source`, `blocks` (jsonb snapshot), `is_active`                                      | Done   |
| `dna_update_suggestions` table with `block_key`, `current_value`, `suggested_value`, `justification`, `impact_estimate`, `data_source`, `status` | Done   |
| RLS on both tables (user isolation + admin access)                                                                                               | Done   |
| `useDnaVersions` hook (fetch, active version tracking)                                                                                           | Done   |
| `useDnaGuard` hook with DNA limits per plan (free:1, starter:1, pro:10, legend:50)                                                               | Done   |
| `DnaVersionSelector` component (select version in dialog)                                                                                        | Done   |
| `DnaVersionBadge` component                                                                                                                      | Done   |
| `DnaUpdates` page at `/dashboard/library/updates` (view suggestions, apply as new version, dismiss, version history)                             | Done   |
| DNA Updates banner in Library page                                                                                                               | Done   |
| Route `/dashboard/library/updates` registered in App.tsx                                                                                         | Done   |
| i18n keys for versions, suggestions, updates (PT/EN/ES)                                                                                          | Done   |
| `user_notifications` table with `title_key`, `message_key`, `action_url`                                                                         | Done   |


---

### What's Missing (Sprint 3 Gaps)

#### 1. Structural vs Adaptive Block Classification — MISSING

No `block_category` metadata exists anywhere. The 12 blocks are not classified as structural or adaptive in the database or code. The document describes which blocks are which, but this separation is not persisted or enforced.

**Needed:**

- Create a config/constant defining which blocks are structural (immutable) vs adaptive (evolutive)
- Enforce in `dna_update_suggestions` that only adaptive blocks can receive suggestions
- Enforce in the `DnaUpdates` UI that structural blocks cannot be modified via suggestions

#### 2. Version Limits per Plan — MISSING

`useDnaGuard` enforces DNA count limits but there are **no version count limits**. The spec requires: Starter: 50 versions/DNA, Pro: 500, Legend: 1000.

**Needed:**

- Add `VERSION_LIMITS` constant alongside `DNA_LIMITS`
- Check version count before creating new versions in `DnaUpdates` and any version-creation flow
- Backend enforcement (ideally a DB function or check in edge functions)

#### 3. `dna_update_suggestions` missing `language` column — MISSING

The spec requires suggestions to respect the DNA's original language. The table lacks a `language` column.

**Needed:**

- Migration to add `language` column to `dna_update_suggestions`

#### 4. New Pages — MISSING

These pages do not exist:

- `/dashboard/ads-intelligence` — Ads Intelligence (structured visualization of collected ad data)
- `/dashboard/performance-overview` — Performance Overview (consolidated Meta + Instagram metrics)
- `/dashboard/market-radar` — Market Radar (placeholder for future trend detection)

**Needed:**

- Create 3 new page components
- Register routes in App.tsx
- Add sidebar navigation items
- Full i18n (PT/EN/ES)

#### 5. Strategic Notifications Flow — PARTIAL

`user_notifications` table exists but there's no mechanism to create notifications when suggestions are generated. No notification bell/UI in the dashboard to display them.

**Needed:**

- Notification display component in dashboard layout (bell icon with count)
- Hook to fetch unread notifications
- Mark-as-read functionality
- i18n for notification templates

#### 6. Version Revert Functionality — MISSING

The spec says "must be possible to revert to any previous version." Current UI shows version history but has no revert action.

**Needed:**

- "Revert to this version" button in version history list
- Logic to deactivate current version and activate selected one

#### 7. Version Comparison — MISSING (documented as future)

The spec mentions "compare versions in the future." No action needed now, but the data structure supports it via `blocks` jsonb snapshots.

---

### Implementation Checklist for Approval


| #   | Task                                                                                                                                                                                                                                                                                                            | Scope                     |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- |
| 1   | **Define block classification constants** — Create `STRUCTURAL_BLOCKS` and `ADAPTIVE_BLOCKS` arrays in a shared config file. Structural: audience, solution, differentiators, emotional_connection, transformation, voice. Adaptive: pain_points, awareness_stage, urgency, social_proof, objections, promises. | Frontend config           |
| 2   | **Enforce adaptive-only suggestions** — Add validation in `DnaUpdates.handleApply` and future suggestion generation that only adaptive blocks can be modified via suggestions.                                                                                                                                  | Frontend + future backend |
| 3   | **Add version limits per plan** — Add `VERSION_LIMITS` (starter:50, pro:500, legend:1000) to `useDnaGuard`. Check before version creation. Show upgrade message when limit hit.                                                                                                                                 | Frontend hook             |
| 4   | **Add `language` column to `dna_update_suggestions**` — SQL migration adding nullable `language` text column with default from DNA's language.                                                                                                                                                                  | DB migration              |
| 5   | **Create Ads Intelligence page** — `/dashboard/ads-intelligence` showing ads_data with funnel metrics (ViewContent → InitiateCheckout → Purchase), filterable by campaign/date. Charts using recharts.                                                                                                          | New page + route          |
| 6   | **Create Performance Overview page** — `/dashboard/performance-overview` consolidating Meta Ads + Instagram metrics in a single dashboard view.                                                                                                                                                                 | New page + route          |
| 7   | **Create Market Radar page** — `/dashboard/market-radar` as a placeholder structure connected to existing data, ready for future trend detection.                                                                                                                                                               | New page + route          |
| 8   | **Add notification bell component** — Display unread `user_notifications` count in dashboard header with dropdown list and mark-as-read.                                                                                                                                                                        | New component             |
| 9   | **Add version revert functionality** — "Revert" button in version history (DnaUpdates page) that activates a previous version.                                                                                                                                                                                  | UI update                 |
| 10  | **Register all new routes** — Add 3 new routes to App.tsx and sidebar navigation.                                                                                                                                                                                                                               | Router + layout           |
| 11  | **Full i18n for all new pages** — Add ~80 translation keys across PT/EN/ES for the 3 new pages, notification templates, block classification labels, and version limit messages.                                                                                                                                | i18n config               |
| 12  | **Update sidebar navigation** — Add menu items for Ads Intelligence, Performance Overview, and Market Radar under a new "Intelligence" section.                                                                                                                                                                 | Layout component          |


**Zero changes to:** existing routes, Stripe, agents, auth, Meta integration Edge Functions, or current table structures.

Please approve this checklist to proceed with implementation.  Obs: Ajustes Pequenos Antes de Aprovar

Apenas 4 pontos para alinhar melhor com o documento original:

Version Limits — Backend Enforcement

Você colocou:

Frontend hook

Isso é insuficiente.

Deve constar explicitamente:

Backend enforcement obrigatório

Validação no Supabase (function ou trigger)

Nunca depender apenas do frontend

Sugestão de ajuste no checklist:

Adicionar:

“Version limit must also be enforced at database level or via secure backend function.”

Sem isso, você abre brecha para bypass via API.

Structural vs Adaptive — Persistência

Você mencionou config constants.

Isso resolve UI, mas não resolve integridade sistêmica.

O documento original exige que a separação seja persistida, não apenas conceitual.

Melhor ajuste:

Manter constante no frontend

E também registrar block_category na estrutura do DNA (nem que seja metadata no snapshot)

Não precisa reestruturar tabela, mas precisa garantir que não dependa apenas de frontend.

Language Column

Correto adicionar language na dna_update_suggestions.

Apenas acrescente:

Deve ser obrigatória para novas sugestões.

Deve respeitar idioma original do DNA, não idioma ativo da UI.

Pequeno detalhe importante.

Charts Library

Você citou:

Charts using recharts

Evite impor biblioteca se o padrão do projeto já usa outra.

Melhor escrever:

“Use existing charting pattern already adopted in the project.”

Isso evita conflito arquitetural.