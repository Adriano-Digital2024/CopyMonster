

## Diagnosis

The Meta integration is connected (status: `connected`, token valid until May 2026), sync executes successfully (HTTP 200), but Meta Insights API returns `{"data":[]}` for both `level=ad` and `level=campaign` over the last 90 days. The user confirms ads exist in `act_1900689210361394`.

Two problems to fix:

### Problem 1: Empty Insights response despite active ads

The current query uses a custom `time_range` with `level=ad`. If the account has campaigns that ran outside the 90-day window, or if the campaigns are draft/paused with no spend, Insights returns empty. We need better diagnostics:

- Query the `/campaigns` endpoint directly (not insights) to list campaigns and their statuses — this confirms whether campaigns exist at all
- Try `date_preset=maximum` instead of a fixed 90-day range to capture all historical data
- Try account-level insights (no `level` param) as a simpler fallback
- Log all results for diagnosis

### Problem 2: Instagram scopes missing from OAuth

The user wants Instagram sync, but the OAuth flow currently requests only ads scopes. Need to add `instagram_basic` and `instagram_manage_insights` back.

---

## Technical Changes

### 1. `supabase/functions/meta-oauth/index.ts`
- Add `instagram_basic,instagram_manage_insights` to the `scopes` string on line 65
- Add these to the `p_scopes` array on line 140

### 2. `supabase/functions/meta-sync/index.ts`
- Before running Insights, query `GET /{ad_account_id}/campaigns?fields=id,name,status,objective&limit=100` to list campaigns and log them — this tells us if the account has campaigns at all
- Change from `time_range` (90 days) to `date_preset=maximum` to capture ALL historical data, not just the last 90 days
- If `level=ad` returns empty, try account-level (no `level` param) with `date_preset=maximum` as a second fallback
- Log campaign list and account-level insights for debugging

### 3. Redeploy both edge functions

### 4. After deployment
User will need to:
1. Disconnect and reconnect Meta (to get new Instagram scopes)
2. Sync again
3. We check the logs for the campaign list diagnostic

