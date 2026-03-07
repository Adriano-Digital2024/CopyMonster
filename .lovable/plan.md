

## Problem

The 302 redirect approach works but causes the full app to load inside the popup window. The popup should close itself after the OAuth completes, not navigate to the dashboard.

## Solution

Replace the 302 redirect with an HTML page that:
1. Sends `postMessage` to the opener (primary — works when `window.opener` is available)
2. Closes itself via `window.close()`
3. If neither works (opener is null due to cross-origin), redirects to the settings page as final fallback

The key insight: `window.close()` works on popups opened via `window.open()` even cross-origin. The previous attempt failed because it tried `window.opener.postMessage` first (which is null cross-origin) and fell through to redirect. We should try `window.close()` regardless.

## Technical Changes

### `supabase/functions/meta-oauth/index.ts`

Replace the `redirectTo` function with a `buildCallbackHtml` function that returns an HTML page:

```html
<html><head><title>CopyMonster</title></head>
<body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
  <div style="text-align:center">
    <p>Conexão realizada! Fechando...</p>
  </div>
  <script>
    // Try postMessage to parent
    try { if(window.opener) window.opener.postMessage({type:'meta-oauth-success'},'*'); } catch(e){}
    // Always try to close the popup
    setTimeout(function(){ window.close(); }, 500);
    // Fallback: if close didn't work (not a popup), redirect after 2s
    setTimeout(function(){ window.location.href = 'REDIRECT_URL'; }, 2000);
  </script>
</body></html>
```

For errors, same structure but with error message and `meta-oauth-error` type.

Return with `Content-Type: text/html; charset=utf-8` and status 200 (not 302).

### No frontend changes needed
The existing `postMessage` listener and `?meta=success` query param handling already cover both scenarios.

