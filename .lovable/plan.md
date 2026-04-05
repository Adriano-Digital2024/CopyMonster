

## Diagnosis: Meta Sync Returns 401

### Root Cause
The edge function analytics show the most recent `meta-sync` POST returned **HTTP 401**. This means the user's access token sent to the edge function was expired/invalid.

The Settings page uses `supabase.auth.getSession()` to get the token, then manually constructs a `fetch()` call. The problem: `getSession()` can return a **cached, stale token** without triggering a refresh. Supabase's JS client v2 has a known behavior where `getSession()` returns the locally stored session even if the access token JWT has expired, relying on lazy refresh.

The same issue affects `handleConnectMeta` (also returning 401) and `handleDisconnectMeta`.

### Fix

Replace all three manual `fetch()` calls in Settings.tsx with `supabase.functions.invoke()`, which automatically handles token refresh and auth headers.

**File:** `src/pages/dashboard/Settings.tsx`

#### Change 1: `handleConnectMeta` (lines 107-115)
```typescript
// Before
const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData?.session?.access_token;
if (!token) throw new Error('No session');
const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const res = await fetch(`https://${projectId}.supabase.co/functions/v1/meta-oauth?action=authorize`, {
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
});
const data = await res.json();

// After
const { data, error } = await supabase.functions.invoke('meta-oauth', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  body: null,
});
if (error) throw error;
// Note: meta-oauth uses query param ?action=authorize, so we need a slight adjustment
```

Actually, `supabase.functions.invoke` doesn't support query params natively. A better approach is to keep `fetch()` but fix the token freshness issue.

#### Revised approach: Force token refresh before fetch

Add a helper that ensures a fresh token:
```typescript
async function getFreshToken() {
  // Force refresh if needed
  const { data, error } = await supabase.auth.refreshSession();
  if (error || !data.session) {
    // Fallback to current session
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData?.session?.access_token ?? null;
  }
  return data.session.access_token;
}
```

Then replace all three occurrences of:
```typescript
const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData?.session?.access_token;
```
with:
```typescript
const token = await getFreshToken();
```

**Files to modify:**
- `src/pages/dashboard/Settings.tsx` — add `getFreshToken()` helper, update 3 callsites (`handleConnectMeta`, `handleDisconnectMeta`, `handleSyncMeta`)

### Technical Details

```text
Evidence from analytics:
  POST /functions/v1/meta-sync → 401  (timestamp: 1775362165053)
  GET  /functions/v1/meta-oauth → 401 (timestamp: 1775361984061)

Edge function code (line 101-103):
  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) → returns 401

DB status: connected, token valid until 2026-06-04
→ The Meta token is fine; the Supabase JWT (auth token) was stale
```

