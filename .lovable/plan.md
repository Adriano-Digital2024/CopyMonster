## Sprint 4 — DNA Intelligence Engine: COMPLETED

### Implemented

1. **Edge Function `dna-intelligence`** — Core engine with:
   - JWT authentication
   - Rate limiting (15 min cooldown via `intelligence_logs`)
   - Minimum volume thresholds (1000 impressions, $5 spend, 3 purchases for high performer)
   - Rule-based classification (high_performer / stable / underperforming / insufficient_data)
   - Duplicate suggestion prevention (checks existing pending suggestions)
   - Previous classification comparison (only notifies on real state changes)
   - Suggestion generation for adaptive blocks only
   - Notification triggers for high performers, declines, new suggestions
   - Decision logging to `intelligence_logs` + `integration_logs`

2. **Database Tables** — `creative_classifications` + `intelligence_logs` with RLS and indexes

3. **Frontend Updates:**
   - Ads Intelligence: classification badges + "Run Analysis" button + last analysis timestamp
   - DnaUpdates: "Generate Smart Version" button (clones + applies all pending suggestions)
   - Performance Overview: classification distribution summary card
   - Market Radar: trend signals from classification data

4. **i18n** — ~40 new keys across PT/EN/ES

5. **Config** — `dna-intelligence` registered in `supabase/config.toml`

### Zero changes to:
- Stripe, Auth, agents, meta-sync, existing routes, table schemas
