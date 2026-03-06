

## Diagnosis

The Meta OAuth connection is **working correctly**. Evidence:

- Edge function logs: `Successfully connected for user 863b030e...`
- Database: `status = 'connected'`, `meta_ad_account_id = act_1900689210361394`, all 6 scopes stored
- No errors in edge function logs

The "Permissão Revogada" badge in the screenshot is the **old state** before this connection attempt.

### What the user sees as "error"

The popup shows the raw HTML response from the callback. This happens because:

1. `window.opener` is `null` due to cross-origin navigation (parent on `app.copymonster.me` → popup navigated through `facebook.com` → `supabase.co`)
2. The fallback `window.location.href` tries to redirect to `SITE_URL/dashboard/settings?meta=success`
3. But the user sees the raw HTML momentarily before the redirect

### Fixes

**1. Improve popup HTML response** - Add visible loading text and a `meta` refresh fallback so the user sees "Conectando..." instead of raw script tags, and ensure the redirect always works even if JS fails.

**2. Use `document.referrer` or `localStorage` as fallback** - Store a flag in `localStorage` before opening the popup, then check it on the Settings page load to detect successful connections even if `postMessage` fails.

### Technical Changes

**File: `supabase/functions/meta-oauth/index.ts`**
- Replace all 4 HTML response templates (3 error + 1 success) with proper HTML that shows a visual message ("Conectando..." or "Erro") and includes multiple fallback mechanisms:
  - `window.opener.postMessage` (primary)
  - `window.close()` (for popup mode)
  - `window.location.href` redirect (fallback)
  - `<meta http-equiv="refresh">` (ultimate fallback)

**File: `src/pages/dashboard/Settings.tsx`**
- After `fetchMetaIntegration()` completes on mount, ensure the UI reflects the current DB status (which is already `connected`)
- No logic change needed - the existing code already handles `?meta=success` param and `postMessage` events

The edge function will be redeployed after the changes.

