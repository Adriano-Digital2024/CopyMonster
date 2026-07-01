import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { encryptToken } from "../_shared/mautic-crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildCallbackHtml(result: 'success' | 'error', message?: string): Response {
  const displayMsg = result === 'success'
    ? 'Mautic connected successfully! You can close this window.'
    : `Mautic connection failed: ${message || 'Unknown error'}`;

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>CopyMonster - Mautic Connection</title></head>
<body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center;max-width:600px;padding:20px">
  <h1>${result === 'success' ? '✅ Connected' : '❌ Connection Failed'}</h1>
  <p>${displayMsg}</p>
</div>
</body></html>`;

  return new Response(html, {
    status: result === 'success' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mauticBaseUrl = Deno.env.get('MAUTIC_BASE_URL')!;
    const mauticClientId = Deno.env.get('MAUTIC_CLIENT_ID')!;
    const mauticClientSecret = Deno.env.get('MAUTIC_CLIENT_SECRET')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !mauticBaseUrl || !mauticClientId || !mauticClientSecret || !encryptionKey) {
      console.error('[mautic-callback] Missing required environment variables');
      return buildCallbackHtml('error', 'Server configuration error');
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (errorParam) {
      console.error(`[mautic-callback] OAuth error: ${errorParam} - ${errorDescription}`);
      return buildCallbackHtml('error', errorDescription || errorParam);
    }

    if (!code) {
      console.error('[mautic-callback] Missing authorization code');
      return buildCallbackHtml('error', 'Missing authorization code');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/mautic-callback`;

    console.log('[mautic-callback] Exchanging authorization code for tokens');

    const tokenResponse = await fetch(`${mauticBaseUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: mauticClientId,
        client_secret: mauticClientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[mautic-callback] Token exchange failed:', JSON.stringify(tokenData));
      return buildCallbackHtml('error', tokenData.error_description || tokenData.error || 'Token exchange failed');
    }

    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in;

    if (!accessToken || !refreshToken) {
      console.error('[mautic-callback] Missing access_token or refresh_token in response');
      return buildCallbackHtml('error', 'Invalid token response');
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Encrypt tokens before storing
    let encryptedAccess: string;
    let encryptedRefresh: string;
    try {
      encryptedAccess = await encryptToken(accessToken, encryptionKey);
      encryptedRefresh = await encryptToken(refreshToken, encryptionKey);
    } catch (encryptError) {
      console.error('[mautic-callback] Encryption failed:', (encryptError as Error).message);
      return buildCallbackHtml('error', `Failed to secure tokens: ${(encryptError as Error).message}`);
    }

    const { error: upsertError } = await adminSupabase
      .from('mautic_tokens')
      .upsert({
        id: 'primary',
        encrypted_access_token: encryptedAccess,
        encrypted_refresh_token: encryptedRefresh,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error('[mautic-callback] Failed to store tokens:', upsertError.message);
      return buildCallbackHtml('error', 'Failed to store tokens');
    }

    console.log('[mautic-callback] Mautic tokens stored successfully');

    return buildCallbackHtml('success');
  } catch (error) {
    console.error('[mautic-callback] Unexpected error:', (error as Error).message);
    return buildCallbackHtml('error', 'Internal server error');
  }
});
