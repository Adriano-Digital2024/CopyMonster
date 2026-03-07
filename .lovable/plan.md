

## Diagnosis

From the database analysis, here's exactly what's happening:

### Root Cause: Instagram error corrupts the entire integration status

1. **Integration status is `permission_revoked`** — not `connected`
2. This happened because during the last sync, Instagram returned error code 10: *"Application does not have permission for this action"*
3. The `meta-sync` function classified this IG error and called `updateIntegrationStatus(adminSupabase, userId, 'permission_revoked')` — overwriting the status for the **entire** integration
4. Ads synced successfully (1 record exists in `ads_data`), but the status was already corrupted by the IG error
5. `useMetaIntegration` checks `status === 'connected'` → `isConnected` is `false` → all 3 dashboard pages show MetaConnectionPrompt instead of data

### Secondary issue: Instagram permissions not approved
The Meta App likely hasn't had `instagram_basic` / `instagram_manage_insights` approved in Meta App Review, or the Instagram account isn't properly linked as a Business account. This is an external configuration issue, not a code bug.

### Data state
- `ads_data`: 1 record (the sync worked for ads)
- `instagram_data`: 0 records (IG permission denied)
- `user_integrations.status`: `permission_revoked` (should be `connected` since ads work fine)

---

## Technical Changes

### 1. `supabase/functions/meta-sync/index.ts` — Don't let IG errors corrupt integration status

**Current behavior** (line ~329-335): When Instagram returns an error with a classified code, it calls `updateIntegrationStatus` to set the whole integration to `permission_revoked`.

**Fix**: For Instagram errors, only log the error — do NOT update the main integration status. The integration status should reflect the primary (Ads) connection health. Add a separate field or just log it.

Specifically:
- Remove the `updateIntegrationStatus` call inside the Instagram error handler (lines 331-332)
- Keep the `integration_logs` insert so the error is recorded
- Add a console.log noting the IG permission issue was non-fatal

### 2. `src/hooks/useMetaIntegration.ts` — Treat `permission_revoked` more gracefully

**Current behavior**: Only `status === 'connected'` sets `isConnected = true`.

**Fix**: Consider the integration "functional" if status is `connected` OR if `hasData` is true (meaning a successful sync happened at some point). This prevents a single IG error from hiding all existing ads data.

Change the hook:
- `isConnected`: true if status is `connected` OR `permission_revoked` (since ads may still work)
- Add `status` to the returned object so pages can show a warning about partial permissions if needed

### 3. Fix the current broken status in the database

Run a data update to set the integration status back to `connected` so the user's dashboard works immediately after deployment.

### 4. Redeploy `meta-sync` edge function

---

## Summary

The fix is small but critical: **Instagram errors should not override the integration status for the entire Meta connection.** Ads and Instagram are independent data sources, and a permission issue on one should not block the other.

