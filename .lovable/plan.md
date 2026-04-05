

## Diagnosis: Meta Data Display Issues

### Finding 1: Ads Data is Real (NOT Mocked)
The database has exactly 1 record from your Meta account with $9.68 spend, 308 impressions, 10 clicks. This matches the screenshot. The data comes directly from the Meta Ads Insights API with `date_preset=maximum`.

The reason it looks sparse is that your ad account only has 1 ad with lifetime data (2023-07-21 to 2026-03-06).

### Finding 2: Instagram — Missing OAuth Scopes
The `meta-sync` function checks for `instagram_basic` or `instagram_manage_insights` scopes before attempting IG sync. Your integration only has: `ads_management, ads_read, business_management, pages_show_list, pages_read_engagement, public_profile`.

**Root cause:** Per Meta's App Review policy (and your existing configuration notes), `instagram_basic` and `instagram_manage_insights` must be approved through the **Meta App Review process** before they can be requested during OAuth. They cannot be passed as URL parameters in API v21.0+.

### Finding 3: Last Sync Returned Zero Records
The latest sync at 03:18 UTC returned 0 ads and 0 IG posts. This could mean the Meta API returned empty results for that particular call. The existing ads record was preserved because the delete-before-insert logic only deletes when new data is found.

---

### Proposed Actions

#### 1. Improve Instagram Section UX (code change)
Instead of showing a generic "No Instagram data available", show a clear message explaining that Instagram insights require Meta App Review approval, with a link or guidance.

**File:** `src/pages/dashboard/PerformanceOverview.tsx`
- Check whether the user's integration has IG scopes
- If no IG scopes: show "Instagram insights require additional permissions (instagram_basic, instagram_manage_insights) which are pending Meta App Review."
- If IG scopes exist but no data: show current "No data" message

#### 2. Add Sync Resilience for Ads (code change)
The `meta-sync` function should NOT silently return 0 records when the API might have returned data on a previous run. Add logging to distinguish "API returned empty" from "API error".

**File:** `supabase/functions/meta-sync/index.ts`
- Add a log when insights API returns an empty `data` array vs no `data` field
- Already has fallback check at account-level — ensure this is logged clearly

#### 3. Meta App Review (manual action — not a code change)
Submit your Meta App for review requesting `instagram_basic` and `instagram_manage_insights` permissions. Until approved, Instagram data will remain unavailable for all users.

---

### Technical Details

```text
Current user scopes (from DB):
  ✓ ads_management
  ✓ ads_read
  ✓ business_management
  ✓ pages_show_list
  ✓ pages_read_engagement
  ✓ public_profile
  ✗ instagram_basic          ← requires App Review
  ✗ instagram_manage_insights ← requires App Review

meta-sync gate (line 125):
  hasIgScopes = scopes.some(s => ['instagram_basic','instagram_manage_insights'].includes(s))
  → evaluates to FALSE → IG sync skipped entirely
```

Files to modify:
- `src/pages/dashboard/PerformanceOverview.tsx` — contextual IG message
- `src/hooks/useMetaIntegration.ts` — expose `hasIgScopes` flag
- `supabase/functions/meta-sync/index.ts` — minor logging improvement

