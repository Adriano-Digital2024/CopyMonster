// Mautic OAuth Callback — ETAPA 4: Secure state token + remove token logging
// Fixes:
//   1. Added action=authorize to generate OAuth state and return authorize URL
//   2. Callback now validates state against oauth_states table (CSRF protection)
//   3. Removed console.log of full token response (was leaking access_token + refresh_token)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { encryptToken } from "../_shared/mautic-crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function buildCallbackHtml(result: 'success' | 'error', message?: string): Response {
  const title = result === 'success' ? 'Mautic Connected' : 'Mautic Connection Failed';
  const displayMsg = result === 'success'
    ? 'Mautic connected successfully! You can close this window.'
    : `Mautic connection failed: ${message || 'Unknown error'}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { background: #1a1a2e; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .container { text-align: center; max-width: 600px; padding: 20px; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { font-size: 1.1rem; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${result === 'success' ? 'Connected' : 'Connection Failed'}</h1>
    <p>${displayMsg}</p>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: result === 'success' ? 200 : 400,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const mauticBaseUrl = Deno.env.get('MAUTIC_BASE_URL')!;
    const mauticClientId = Deno.env.get('MAUTIC_CLIENT_ID')!;
    const mauticClientSecret = Deno.env.get('MAUTIC_CLIENT_SECRET')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !mauticBaseUrl || !mauticClientId || !mauticClientSecret || !encryptionKey) {
      console.error('[mautic-callback] Missing required environment variables');
      return buildCallbackHtml('error', 'Server configuration error');
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ── ACTION: authorize — Generate Mautic OAuth URL with secure state ──
    // Admin-only: Mautic is a system-level integration (singleton token)
    if (action === 'authorize') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return jsonResponse({ error: 'Authorization header required' }, 401);
      }

      // Verify user JWT
      const userClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await userClient.auth.getUser(token);
      if (userError || !userData?.user) {
        return jsonResponse({ error: 'Invalid or expired token' }, 401);
      }

      // Verify admin role
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: isAdmin, error: roleError } = await adminClient.rpc('has_role', {
        _user_id: userData.user.id,
        _role: 'admin',
      });

      if (roleError || !isAdmin) {
        console.warn(`[mautic-callback] Non-admin user ${userData.user.id} attempted Mautic OAuth`);
        return jsonResponse({ error: 'Admin access required' }, 403);
      }

      // Generate cryptographically random state
      const { data: stateToken, error: stateError } = await adminClient.rpc('create_oauth_state', {
        p_user_id: userData.user.id,
        p_provider: 'mautic',
        p_ttl_seconds: 600, // 10 minutes
      });

      if (stateError || !stateToken) {
        console.error('[mautic-callback] Failed to create OAuth state:', stateError);
        return jsonResponse({ error: 'Failed to initiate OAuth' }, 500);
      }

      const redirectUri = `${supabaseUrl}/functions/v1/mautic-callback`;
      const authorizeUrl = `${mauticBaseUrl}/oauth/v2/authorize?client_id=${mauticClientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${stateToken}`;

      return jsonResponse({ url: authorizeUrl }, 200);
    }

    // ── ACTION: callback (default) — Validate state, exchange code ────────
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    if (errorParam) {
      console.error(`[mautic-callback] OAuth error: ${errorParam}`);
      return buildCallbackHtml('error', errorParam);
    }

    if (!code || !state) {
      console.error('[mautic-callback] Missing authorization code or state');
      return buildCallbackHtml('error', 'Missing authorization code or state');
    }

    // Consume (validate + delete) the state token — single-use
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: stateUserId, error: consumeError } = await adminClient.rpc('consume_oauth_state', {
      p_state: state,
      p_provider: 'mautic',
    });

    if (consumeError || !stateUserId) {
      console.error('[mautic-callback] Invalid or expired OAuth state — possible CSRF attack');
      return buildCallbackHtml('error', 'Invalid or expired OAuth session. Please try again.');
    }

    const redirectUri = `${supabaseUrl}/functions/v1/mautic-callback`;

    // Exchange code for tokens
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

    const responseText = await tokenResponse.text();
    console.log(`[mautic-callback] Token response status: ${tokenResponse.status}`);

    let tokenData: Record<string, unknown>;
    try {
      tokenData = JSON.parse(responseText);
    } catch {
      tokenData = {};
    }

    if (!tokenResponse.ok || tokenData.error) {
      console.error('[mautic-callback] Token exchange failed:', tokenData.error || `HTTP ${tokenResponse.status}`);
      return buildCallbackHtml('error', 'Token exchange failed. Please try again.');
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = tokenData.refresh_token as string;
    const expiresIn = tokenData.expires_in as number;

    if (!accessToken || !refreshToken) {
      console.error('[mautic-callback] Missing access_token or refresh_token in response');
      return buildCallbackHtml('error', 'Invalid token response');
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Encrypt tokens before storing
    let encryptedAccess: string;
    let encryptedRefresh: string;
    try {
      encryptedAccess = await encryptToken(accessToken, encryptionKey);
      encryptedRefresh = await encryptToken(refreshToken, encryptionKey);
    } catch (encryptError) {
      console.error('[mautic-callback] Encryption failed:', (encryptError as Error).message);
      return buildCallbackHtml('error', 'Failed to secure tokens');
    }

    const { error: upsertError } = await adminClient
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