

## Diagnosis

Three distinct issues are preventing the flow from working end-to-end:

### Issue 1: Authorization code used twice (popup bug)

The logs show:
- `00:02:29` — Successfully connected
- `00:07:59` — "This authorization code has expired"

The second failure happens because the user re-attempted the connection (possibly from the error page of the previous attempt or by clicking "Connect" again). The auth code is single-use and short-lived. This is not a code bug per se, but the UX should make it clearer when a connection already succeeded.

### Issue 2: Meta Ads sync returns 0 records every time

All three sync attempts logged `ads_records: 0`. The meta-sync function calls the Meta Insights API correctly, but the response likely contains an empty `data` array. Possible causes:
- The ad account `act_1900689210361394` may have no active or recent ads in the last 30 days
- The `ads_management` scope might require additional approval for Insights access

**Fix**: Add detailed logging to meta-sync so we can see the raw API response from Meta, making it possible to diagnose whether it's an empty account or an API error being silently swallowed.

### Issue 3: Instagram sync fails — permission revoked

The logs show: `(#10) Application does not have permission for this action` on the `instagram_media` endpoint. This is expected because the OAuth scopes were updated to remove `instagram_basic` and `instagram_manage_insights` per user request.

**Fix**: Update `meta-sync` to skip Instagram sync when the user's stored scopes don't include Instagram permissions. Currently it blindly tries IG sync whenever `instagram_account_id` exists.

### Issue 4: Dashboard pages show empty state

The pages check `meta.isConnected && meta.hasData`. Since the current status is `disconnected` (user disconnected after the failed second attempt) and `ads_data` has 0 records, the `MetaConnectionPrompt` is shown correctly. Once the user reconnects and syncs successfully, the dashboards will populate.

---

## Technical Changes

### 1. `supabase/functions/meta-sync/index.ts`
- Add console.log for the raw Meta API response (ads insights URL and response body) so we can diagnose empty results
- Skip Instagram sync when stored scopes don't include `instagram_basic` or `instagram_manage_insights`
- Read scopes from `user_integrations` record before deciding which endpoints to call

### 2. `supabase/functions/meta-oauth/index.ts`
- No changes needed — the function itself works correctly

### 3. Redeploy both edge functions

### 4. No frontend changes needed
The dashboard pages are correctly showing the empty state because there truly is no data and the integration is disconnected.

---

## After Implementation

The user needs to:
1. Reconnect Meta in Settings → Integrations
2. Click "Sincronizar" to trigger the sync
3. Check edge function logs to see the raw Meta API response — if the ad account has no recent ads, the result will legitimately be 0 records

