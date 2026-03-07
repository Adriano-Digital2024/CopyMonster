

## Analysis: What's Missing for Full Functionality

### Current Data State
- **Integration**: `connected`, last synced successfully
- **ads_data**: 1 record (lifetime: 2023-07-21 to 2026-03-06, $9.68 spend, 308 impressions, 0 purchases)
- **creative_classifications**: 0 records (analysis never ran successfully)
- **instagram_data**: 0 records (no IG scopes — requires Meta App Review, external action)
- **intelligence_logs**: 0 records
- **dna_update_suggestions**: 0 records

### Issues Found

#### 1. CRITICAL: `dna-intelligence` date filter breaks with lifetime data
The analysis function filters `date_range_start >= thirtyDaysAgo` (line 154). But Meta returns lifetime data with `date_range_start: 2023-07-21` — this is before the 30-day cutoff so the analysis returns `"no_data"` even though valid data exists. The "Run Analysis" button on Ads Intelligence will always fail.

**Fix**: Filter by `date_range_end` instead (the most recent date of the range), or remove the date filter entirely since we already fetch with `date_preset=maximum`.

#### 2. CRITICAL: `meta-sync` has no deduplication
Every sync inserts new rows without checking for existing data. Clicking "Sync" multiple times creates duplicate rows, inflating all metrics on all 3 pages.

**Fix**: Delete existing `ads_data` for the user before inserting fresh results (same pattern used in `dna-intelligence` for classifications).

#### 3. `meta-sync` doesn't paginate
Meta API returns paginated results (`paging.next`). Currently only the first page (up to 500 rows) is fetched. Accounts with many ads will have incomplete data.

**Fix**: Follow `paging.next` URLs until no more pages exist.

#### 4. Market Radar is a placeholder
It shows classification counts and a "Coming Soon" card. Per the document, it should show trend analysis (comparing current vs previous classifications to detect declines/rises over time). The `dna-intelligence` function already tracks `previous` classification changes but Market Radar doesn't use time-series data.

**Fix**: Store classification history with timestamps instead of replacing all records. Market Radar can then show trends over multiple analysis runs.

#### 5. Instagram data is blocked (external action, not a code fix)
The Meta App doesn't have `instagram_basic` / `instagram_manage_insights` approved. This must be done in Meta App Review dashboard. Performance Overview's Instagram section will remain empty until this is resolved.

---

### Technical Changes

#### A. `supabase/functions/dna-intelligence/index.ts` (line 149-156)
Change date filter from `date_range_start` to `date_range_end`:
```typescript
const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
// Change .gte("date_range_start", ...) to .gte("date_range_end", ...)
```

#### B. `supabase/functions/meta-sync/index.ts` (before insert, ~line 302)
Add deduplication — delete existing ads_data for user before inserting:
```typescript
await adminSupabase.from('ads_data').delete().eq('user_id', userId);
```

#### C. `supabase/functions/meta-sync/index.ts` — Add pagination
After fetching first page, follow `adsData.paging?.next` in a loop to collect all pages before inserting.

#### D. `supabase/functions/meta-sync/index.ts` — Also delete old IG data before insert
Same deduplication pattern for `instagram_data`.

#### E. Redeploy both edge functions (`meta-sync` and `dna-intelligence`)

### What Will Work After These Fixes

| Page | Current State | After Fix |
|------|--------------|-----------|
| **Ads Intelligence** | Shows 1 ad record, "Run Analysis" returns "no_data" | Analysis classifies ads correctly, badges appear, funnel/campaign charts populate |
| **Performance Overview** | Shows ads metrics (1 record), IG section empty | Accurate ads metrics (deduplicated), IG still empty until Meta App Review |
| **Market Radar** | Shows 0 classifications, "Coming Soon" card | Shows classification counts after running analysis; trend detection remains basic until multi-run history is built |

### Not Fixable via Code (External Actions)
- **Instagram data**: Requires adding `instagram_basic` + `instagram_manage_insights` in Meta App Review
- **More ads data**: The account genuinely has only 1 ad with data. More ads = more data on dashboards

