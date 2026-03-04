## Sprint 4 — DNA Intelligence Engine: Implementation Plan

### What Already Exists

- `ads_data` table with creative body/title, funnel metrics (ViewContent, InitiateCheckout, Purchase, ROAS, CTR, CPA)
- `instagram_data` table with engagement metrics
- `dna_update_suggestions` table with block_key, justification, impact_estimate, status
- `dna_versions` table with jsonb block snapshots, version_type, source
- `user_notifications` table with i18n title/message keys
- `NotificationBell` component in dashboard header
- Block classification system (`STRUCTURAL_BLOCKS` / `ADAPTIVE_BLOCKS` in `dna-block-config.ts`)
- `useDnaGuard` with version limit enforcement
- `DnaUpdates` page with apply/dismiss/revert flows
- Ads Intelligence, Performance Overview, Market Radar pages (data visualization only, no intelligence)
- `meta-sync` edge function with creative data fetching

### What's Missing for Sprint 4

**Nothing exists yet for:**

1. Creative performance classification engine (High Performer / Stable / Underperforming)
2. Recommendation generation logic (pattern detection → suggestion creation)
3. "Generate Smart Version" button
4. Notification triggers when intelligence events occur
5. Classification badges on Ads Intelligence page
6. Decision logging for audit trail

---

### Implementation Plan

#### 1. Edge Function: `dna-intelligence` (NEW)

Core engine that runs analysis on a user's data. Called manually via button or future cron.

**Logic flow:**

1. Authenticate user via JWT
2. Fetch user's `ads_data` (last 30 days) and active DNA (`positioning_mappings` + active `dna_versions`)
3. **Classify creatives** using rule-based scoring:
  - **High Performer**: ROAS > 2x AND CTR > 1.5% AND purchases > 0
  - **Stable**: ROAS 1-2x OR (CTR > 1% AND no purchases decline)
  - **Underperforming**: ROAS < 1x OR CTR < 0.5% OR zero conversions with spend > threshold
4. **Generate recommendations** for adaptive blocks:
  - High Performer: extract winning copy patterns → suggest reinforcing adaptive blocks (promises, urgency, objections)
  - Underperforming: identify weak hooks/angles → suggest alternatives for pain_points, awareness_stage, urgency
5. **Save suggestions** to `dna_update_suggestions` (only adaptive blocks, respecting `isStructuralBlock()`)
6. **Create notifications** in `user_notifications` for each new suggestion
7. **Log decisions** to `integration_logs` with event_type `intelligence_analysis`

#### 2. Database Migration

- New table `creative_classifications`:
  - `id`, `user_id`, `ad_id`, `classification` (high_performer/stable/underperforming), `score`, `metrics_snapshot` (jsonb), `created_at`
  - RLS: users see own, admins see all
  - Index on `(user_id, classification)`
- New table `intelligence_logs`:
  - `id`, `user_id`, `analysis_type`, `input_summary` (jsonb), `output_summary` (jsonb), `suggestions_generated`, `created_at`
  - RLS: users see own, admins see all

#### 3. Frontend: Intelligence Integration

**Ads Intelligence page updates:**

- Add classification badge per creative (color-coded: green/yellow/red)
- Add "Run Intelligence Analysis" button that calls `dna-intelligence`
- Show last analysis timestamp

**DnaUpdates page updates:**

- Add "Generate Smart Version" button:
  - Clones active version
  - Applies all pending suggestions from intelligence
  - Saves as new version with `version_type: 'ai_generated'`, `source: 'intelligence_engine'`
  - Respects plan version limits
- Filter suggestions by source (manual vs intelligence)

**Performance Overview updates:**

- Add summary card showing classification distribution (X high performers, Y stable, Z underperforming)

**Market Radar updates:**

- Show trend signals from classification data (e.g., "3 creatives declined this week")

#### 4. Notification Triggers

The `dna-intelligence` edge function will insert notifications:

- `notifications.intelligence.highPerformer` — when a creative is classified as high performer
- `notifications.intelligence.decline` — when a creative drops from stable to underperforming
- `notifications.intelligence.newSuggestion` — when new DNA suggestions are generated
- `notifications.intelligence.versionCreated` — when a smart version is auto-created

#### 5. i18n (~40 new keys across PT/EN/ES)

- Classification labels, analysis button text, notification templates, smart version labels, intelligence status messages

#### 6. Config: `supabase/config.toml`

- Add `[functions.dna-intelligence]` with `verify_jwt = false` (manual JWT validation in code)

---

### Architecture Summary

```text
User clicks "Run Analysis"
        │
        ▼
  dna-intelligence (Edge Function)
        │
        ├─► Fetch ads_data (last 30 days)
        ├─► Classify each creative (rules-based)
        ├─► Save to creative_classifications
        ├─► Compare with active DNA blocks
        ├─► Generate suggestions (adaptive only)
        ├─► Save to dna_update_suggestions
        ├─► Create user_notifications
        └─► Log to intelligence_logs
        │
        ▼
  Frontend reacts:
  - Badges update on Ads Intelligence
  - NotificationBell shows alerts
  - DnaUpdates shows new suggestions
  - "Generate Smart Version" applies them
```

### Files to Create/Modify


| File                                           | Action                                                               |
| ---------------------------------------------- | -------------------------------------------------------------------- |
| `supabase/functions/dna-intelligence/index.ts` | **CREATE** — Core engine                                             |
| `supabase/migrations/[timestamp].sql`          | **CREATE** — `creative_classifications` + `intelligence_logs` tables |
| `src/pages/dashboard/AdsIntelligence.tsx`      | **MODIFY** — Add classification badges + analysis button             |
| `src/pages/dashboard/DnaUpdates.tsx`           | **MODIFY** — Add "Generate Smart Version" button                     |
| `src/pages/dashboard/PerformanceOverview.tsx`  | **MODIFY** — Add classification summary                              |
| `src/pages/dashboard/MarketRadar.tsx`          | **MODIFY** — Add trend signals                                       |
| `src/i18n/config.ts`                           | **MODIFY** — ~40 new keys                                            |
| `supabase/config.toml`                         | **MODIFY** — Add dna-intelligence function                           |


### Ajustes Finais — Sprint 4 (DNA Intelligence Engine)

## 1. Ativar verificação automática de JWT

No `supabase/config.toml`:

**Alterar para:**

```
[functions.dna-intelligence]
verify_jwt = true
```

Motivo:  
  
Usar a verificação nativa do Supabase para reduzir risco de segurança e evitar validação manual desnecessária.

---

## 2. Implementar Rate Limit da Análise

Adicionar controle para evitar execução excessiva da Edge Function.

Regra recomendada:

- Permitir 1 análise por usuário a cada X minutos (ex: 15 ou 30 minutos)

Implementação possível:

- Salvar `last_analysis_at` no perfil do usuário  
  
ou
- Verificar timestamp da última execução em `intelligence_logs`

Se estiver dentro do intervalo mínimo:

- Bloquear execução
- Retornar mensagem informativa no frontend

---

## 3. Definir Volume Mínimo para Classificação

Evitar classificações com base em dados insuficientes.

Adicionar critérios mínimos antes de classificar:

Exemplo:

- Mínimo de impressões (ex: ≥ 1000)
- Mínimo de spend (ex: ≥ valor mínimo configurado)
- Mínimo de conversões para considerar High Performer (ex: ≥ 3)

Se não atingir volume mínimo:

- Classificar como “insufficient_data”
- Não gerar recomendações

---

## 4. Evitar Sugestões Duplicadas

Antes de salvar nova sugestão em `dna_update_suggestions`:

Verificar se já existe:

- Sugestão pendente para o mesmo `block_key`  
  
ou
- Sugestão com mesmo hash/conteúdo ainda não aplicada

Se existir:

- Não criar nova
- Apenas atualizar timestamp se necessário

Isso evita poluição da interface DnaUpdates.

---

## 5. Comparar com Classificação Anterior

Antes de salvar nova classificação:

- Buscar última classificação do mesmo criativo
- Comparar status anterior vs atual

Somente disparar notificações de “decline” se houver mudança real:

- stable → underperforming
- high_performer → underperforming

Evitar notificações repetidas sem mudança de estado.

---

# Resumo

Para finalizar corretamente a Sprint 4, é necessário:

1. Ativar `verify_jwt = true`
2. Implementar rate limit por usuário
3. Exigir volume mínimo para classificação
4. Bloquear sugestões duplicadas
5. Comparar classificação anterior antes de notificar

Com esses ajustes aplicados, a Sprint 4 estará pronta para produção de forma segura e [escalável.](http://escalável.Zero)   [Zero](http://escalável.Zero) changes to:

- Stripe, Auth, agents, meta-sync, existing routes, table schemas