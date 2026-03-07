

## Diagnosis

The Meta integration **is connected** (status: `connected`, token valid until May 2026), and sync executes successfully (HTTP 200, no API errors). However, the Meta Insights API returns **0 ad records** every time. This causes all three dashboard pages to show the "connect/sync" prompt because `hasData` is false.

There are two distinct problems:

### Problem 1: Ads API returns empty data

The current query fetches insights for only the **last 30 days** at `level=ad`. If the ad account has no ads running in that window, it returns an empty array. The sync also lacks logging of the raw response body, making it impossible to confirm whether the account truly has no ads or if there's a subtle API issue (e.g., wrong account ID, permissions).

### Problem 2: Dashboard UX is misleading

When Meta is connected and synced but has 0 records, the pages show `MetaConnectionPrompt` saying "connect" or "sync" -- but the user already did that. The UI should distinguish between:
- Not connected at all
- Connected but never synced
- Connected, synced, but account has no data

---

## Technical Changes

### 1. `supabase/functions/meta-sync/index.ts`
- Expand date range from **30 days to 90 days** to catch more historical data
- Log the **raw JSON response body** (first 2000 chars) from the Insights API so we can diagnose empty results
- If `level=ad` returns 0 results, try a **fallback query at `level=campaign`** to verify the account has campaigns at all, and log the result
- Redeploy the function

### 2. `src/hooks/useMetaIntegration.ts`
- Add `lastSyncedAt` already exists but also expose `isSynced` (boolean: `lastSyncedAt !== null`) for clearer state distinction in the UI

### 3. `src/components/intelligence/MetaConnectionPrompt.tsx`
- Add a third state: **connected + synced but no data**
- Show a message like "Your Meta account is connected and synced, but no ad data was found in the last 90 days. Make sure your ad account has active or recent campaigns."
- Accept new prop `isSynced` to distinguish this state

### 4. Dashboard pages (`AdsIntelligence.tsx`, `PerformanceOverview.tsx`, `MarketRadar.tsx`)
- Pass `meta.lastSyncedAt` to `MetaConnectionPrompt` so it can show the correct state
- When `meta.isConnected && !meta.hasData && meta.lastSyncedAt`, show the "no data found" message instead of the "sync" prompt

