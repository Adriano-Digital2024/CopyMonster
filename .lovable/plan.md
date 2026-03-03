

## Analysis: DNA Intelligence + Meta Ads Integration — Strategic Implementation Plan

This is an extremely large and complex feature set. To maintain stability and avoid breaking anything in production, this must be implemented in carefully sequenced phases. Below is the full plan.

---

### Phase 1: DNA Versioning System (Database + Backend)

**New tables:**

1. **`dna_versions`** — Stores versioned snapshots of DNA projects
   - `id` (uuid, PK)
   - `mapping_id` (uuid, FK → positioning_mappings.id)
   - `user_id` (uuid, NOT NULL)
   - `version_label` (text, e.g., "1.0", "1.1")
   - `version_type` (text: "original", "market_update", "experimental")
   - `source` (text: "manual", "intelligence_suggestion")
   - `blocks` (jsonb — snapshot of all 12 block values)
   - `is_active` (boolean, default false)
   - `notes` (text, nullable)
   - `created_at`, `updated_at`
   - RLS: users own rows, admins see all

2. **`dna_update_suggestions`** — Intelligence-generated suggestions
   - `id` (uuid, PK)
   - `mapping_id` (uuid, FK → positioning_mappings.id)
   - `user_id` (uuid)
   - `block_key` (text, e.g., "block_8_objections")
   - `current_value` (text)
   - `suggested_value` (text)
   - `justification` (text)
   - `impact_estimate` (text: "low", "medium", "high")
   - `data_source` (text: "meta_ads", "instagram", "market_analysis")
   - `status` (text: "pending", "applied", "dismissed")
   - `created_at`
   - RLS: users own rows, admins see all

3. **Add `language` column** to `positioning_mappings` — Stores the language the DNA was created in (pt-BR, en, es), detected from conversation.

**Block classification** (no schema change needed — handled in code):
- Structural (immutable by system): blocks 1 (audience), 3 (solution), 4 (differentiators), 9 (emotional_connection), 10 (transformation), 11 (voice)
- Adaptive (can receive suggestions): blocks 2 (pain_points), 5 (awareness_stage), 6 (urgency), 7 (social_proof), 8 (objections), 12 (promises)

**Agent chat modification:** When selecting a DNA for copy generation, user can choose which version to use. The `chat-stream` edge function will accept an optional `dna_version_id` parameter and load blocks from `dna_versions` instead of `positioning_mappings` when provided.

---

### Phase 2: Meta Ads Integration (OAuth + Backend)

**New tables:**

4. **`user_integrations`** — Stores OAuth connections
   - `id` (uuid, PK)
   - `user_id` (uuid)
   - `provider` (text: "meta_ads", "instagram")
   - `access_token_encrypted` (text) — encrypted via `pgcrypto`
   - `refresh_token_encrypted` (text, nullable)
   - `token_expires_at` (timestamptz)
   - `scopes` (text[])
   - `provider_user_id` (text)
   - `provider_account_name` (text, nullable)
   - `status` (text: "active", "expired", "revoked")
   - `created_at`, `updated_at`
   - RLS: users own rows, admins see all

5. **`integration_logs`** — Audit trail
   - `id` (uuid, PK)
   - `user_id` (uuid)
   - `provider` (text)
   - `event_type` (text: "connected", "disconnected", "token_refreshed", "api_error", "data_synced")
   - `details` (jsonb, nullable)
   - `created_at`
   - RLS: users own rows, admins see all

6. **`ads_data`** — Cached Meta Ads metrics
   - `id` (uuid, PK)
   - `user_id` (uuid)
   - `integration_id` (uuid, FK → user_integrations.id)
   - `campaign_name` (text)
   - `ad_name` (text, nullable)
   - `ctr` (numeric, nullable)
   - `roas` (numeric, nullable)
   - `spend` (numeric, nullable)
   - `impressions` (integer, nullable)
   - `clicks` (integer, nullable)
   - `conversions` (integer, nullable)
   - `ad_copy` (text, nullable)
   - `creative_type` (text, nullable)
   - `date_range_start` (date)
   - `date_range_end` (date)
   - `raw_data` (jsonb)
   - `synced_at` (timestamptz)
   - `created_at`
   - RLS: users own rows, admins see all

7. **`instagram_data`** — Cached Instagram metrics
   - `id` (uuid, PK)
   - `user_id` (uuid)
   - `integration_id` (uuid, FK → user_integrations.id)
   - `post_id` (text)
   - `post_type` (text: "image", "video", "carousel", "reel", "story")
   - `caption` (text, nullable)
   - `engagement_rate` (numeric, nullable)
   - `likes` (integer, nullable)
   - `comments` (integer, nullable)
   - `saves` (integer, nullable)
   - `shares` (integer, nullable)
   - `reach` (integer, nullable)
   - `raw_data` (jsonb)
   - `synced_at` (timestamptz)
   - `created_at`
   - RLS: users own rows, admins see all

**New edge functions:**

- **`meta-oauth`** — Handles OAuth flow (initiate + callback), stores encrypted tokens
- **`meta-sync`** — Fetches ads/Instagram data from Meta Graph API, stores in `ads_data`/`instagram_data`
- **`meta-disconnect`** — Revokes token, updates integration status
- **`dna-intelligence`** — Analyzes cached data, generates suggestions in `dna_update_suggestions`

**Security requirements:**
- All tokens encrypted at rest using `pgcrypto` extension
- OAuth flow entirely backend (edge functions), no tokens in frontend
- Token refresh handled automatically by `meta-sync`
- Minimum permissions: `ads_read`, `read_insights`, `instagram_basic`, `instagram_manage_insights`
- User can disconnect at any time

**New secrets needed:**
- `META_APP_ID` — Meta App ID
- `META_APP_SECRET` — Meta App Secret
- `ENCRYPTION_KEY` — For token encryption

---

### Phase 3: Notification System

8. **`user_notifications`** table
   - `id` (uuid, PK)
   - `user_id` (uuid)
   - `type` (text: "dna_update", "integration_status", "system")
   - `title_key` (text — i18n key)
   - `message_key` (text — i18n key)
   - `message_params` (jsonb, nullable — for i18n interpolation)
   - `action_url` (text, nullable)
   - `is_read` (boolean, default false)
   - `created_at`
   - RLS: users own rows

Frontend: Notification bell icon in dashboard header, dropdown with unread count.

---

### Phase 4: New Dashboard Pages (Frontend)

All pages use `DashboardLayout`, follow existing i18n patterns, and are protected routes.

1. **DNA Updates & Evolution** (`/dashboard/positioning/updates`)
   - Shows pending suggestions from `dna_update_suggestions`
   - Side-by-side comparison: current vs suggested
   - Apply (creates new version) or Dismiss buttons
   - Version history timeline

2. **DNA Version Selector** (component within agent chat flow)
   - When user launches an agent, if their selected DNA has multiple versions, show version picker
   - Default: active version

3. **Performance Overview** (`/dashboard/performance-overview`)
   - Consolidated metrics from Meta Ads + Instagram
   - Charts using Recharts (already installed)

4. **Ads Intelligence** (`/dashboard/ads-intelligence`)
   - Meta Ads data visualization
   - Top performing ads, CTR trends, ROAS analysis

5. **Market Radar** (`/dashboard/market-radar`)
   - Trend detection from collected data
   - Language/hook analysis from Instagram captions

6. **Integration Settings** (new tab in `/dashboard/settings`)
   - Connect/Disconnect Meta Ads
   - Connection status indicator
   - Last sync timestamp

**New menu items** added to `DashboardLayout` sidebar.

**i18n:** All new strings added to `src/i18n/config.ts` under all 3 languages (en, pt, es).

---

### Phase 5: Plan-Based Limits

- Version creation follows DNA limits (versions are unlimited within a DNA project — they don't count as new DNAs)
- Integration access gated by plan: Free/Starter cannot connect Meta (Pro+ only)
- Market Radar page gated by plan (Legend only, or Pro+ depending on strategy)

---

### Implementation Order

This is too large for a single implementation cycle. Recommended phased approach:

**Sprint 1:** Database schema (all new tables) + DNA versioning backend + version selector UI
**Sprint 2:** Meta OAuth edge functions + Integration settings UI + token management
**Sprint 3:** Data sync edge functions + Ads Intelligence + Performance Overview pages
**Sprint 4:** DNA Intelligence Engine + Suggestions UI + Notification system
**Sprint 5:** Market Radar + Instagram analysis + Polish

---

### What Will NOT Change

- Existing routes, pages, and components remain untouched
- Current `positioning_mappings` table structure preserved
- `chat-stream` edge function extended (not rewritten)
- Authentication, Stripe, admin panel unchanged
- Current i18n structure extended (not modified)
- UI theme, colors, typography unchanged
- All 29 agents continue working identically
- DNA enforcement logic preserved

---

### Technical Details

```text
New database tables: 8
New edge functions: 4
New dashboard pages: 4-5
New dashboard components: ~10
i18n keys added: ~150 (across 3 languages)
New secrets required: 3 (META_APP_ID, META_APP_SECRET, ENCRYPTION_KEY)
```

### Recommendation

Due to the scope, I recommend starting with **Sprint 1 (DNA Versioning)** as it delivers immediate value with zero external dependencies, and builds the foundation for everything else. Shall I proceed with Sprint 1?

