import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildCallbackHtml(result: 'success' | 'error', siteUrl: string): string {
  const isSuccess = result === 'success';
  const messageType = isSuccess ? 'meta-oauth-success' : 'meta-oauth-error';
  const redirectUrl = `${siteUrl}/dashboard/settings?meta=${result}`;
  const title = isSuccess ? 'Conexão realizada!' : 'Erro na conexão';
  const subtitle = isSuccess
    ? 'Você será redirecionado automaticamente...'
    : 'Ocorreu um erro. Redirecionando...';
  const emoji = isSuccess ? '✅' : '❌';

  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="refresh" content="3;url=${redirectUrl}">
<title>${title}</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0a0a0a;color:#fff}
  .card{text-align:center;padding:2rem;border-radius:12px;background:#1a1a1a;border:1px solid #333;max-width:360px}
  .emoji{font-size:3rem;margin-bottom:1rem}
  h1{font-size:1.25rem;margin:0 0 .5rem}
  p{color:#888;font-size:.875rem;margin:0}
</style>
</head><body>
<div class="card">
  <div class="emoji">${emoji}</div>
  <h1>${title}</h1>
  <p>${subtitle}</p>
</div>
<script>
try {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({type:'${messageType}'},'*');
    setTimeout(function(){ window.close(); }, 1500);
  } else {
    setTimeout(function(){ window.location.href='${redirectUrl}'; }, 1500);
  }
} catch(e) {
  setTimeout(function(){ window.location.href='${redirectUrl}'; }, 1500);
}
</script>
</body></html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const metaAppId = Deno.env.get('META_APP_ID')!;
    const metaAppSecret = Deno.env.get('META_APP_SECRET')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;
    const businessConfigId = Deno.env.get('META_BUSINESS_CONFIG_ID')!;
    const siteUrl = Deno.env.get('SITE_URL') || 'http://localhost:5173';

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // ACTION: Generate OAuth URL (called by frontend)
    if (action === 'authorize') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
      });
      const token = authHeader.replace('Bearer ', '');
      const { data: userData, error: userError } = await supabase.auth.getUser(token);
      if (userError || !userData?.user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth?action=callback`;
      const state = userData.user.id; // user_id as state for callback
      const scopes = 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,public_profile';

      const oauthUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes}&state=${state}&response_type=code&config_id=${businessConfigId}`;

      return new Response(JSON.stringify({ url: oauthUrl }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ACTION: OAuth Callback (called by Meta redirect)
    if (action === 'callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state'); // user_id
      const errorParam = url.searchParams.get('error');

      if (errorParam || !code || !state) {
        console.error(`[meta-oauth] Callback error: ${errorParam || 'missing code/state'}`);
      return new Response(buildCallbackHtml('error', siteUrl), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      const userId = state;
      const redirectUri = `${supabaseUrl}/functions/v1/meta-oauth?action=callback`;

      // Exchange code for token
      const tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${metaAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${metaAppSecret}&code=${code}`
      );
      const tokenData = await tokenResponse.json();

      if (tokenData.error) {
        console.error(`[meta-oauth] Token exchange failed for user ${userId}`);
        const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);
        await adminSupabase.from('integration_logs').insert({
          user_id: userId,
          provider: 'meta',
          event_type: 'api_error',
          details: { error: tokenData.error.message, step: 'token_exchange' }
        });
        return new Response(buildCallbackHtml('error', siteUrl), {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // Exchange short-lived token for long-lived token
      const longLivedResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${metaAppId}&client_secret=${metaAppSecret}&fb_exchange_token=${tokenData.access_token}`
      );
      const longLivedData = await longLivedResponse.json();
      const accessToken = longLivedData.access_token || tokenData.access_token;
      const expiresIn = longLivedData.expires_in || tokenData.expires_in || 5184000;

      // Get Meta user info
      const meResponse = await fetch(`https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${accessToken}`);
      const meData = await meResponse.json();

      // Get ad accounts
      const adAccountsResponse = await fetch(`https://graph.facebook.com/v21.0/me/adaccounts?fields=id,name&access_token=${accessToken}`);
      const adAccountsData = await adAccountsResponse.json();
      const adAccountId = adAccountsData.data?.[0]?.id || null;

      // Get Instagram business account
      const pagesResponse = await fetch(`https://graph.facebook.com/v21.0/me/accounts?fields=id,instagram_business_account&access_token=${accessToken}`);
      const pagesData = await pagesResponse.json();
      const igAccountId = pagesData.data?.[0]?.instagram_business_account?.id || null;

      // Encrypt and store token using service role (bypasses RLS for upsert)
      const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

      // Encrypt token in SQL using pgcrypto
      const { error: upsertError } = await adminSupabase.rpc('upsert_user_integration' as any, {
        p_user_id: userId,
        p_provider: 'meta',
        p_access_token: accessToken,
        p_encryption_key: encryptionKey,
        p_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
        p_meta_user_id: meData.id || null,
        p_meta_ad_account_id: adAccountId,
        p_instagram_account_id: igAccountId,
        p_scopes: ['ads_management', 'ads_read', 'business_management', 'pages_show_list', 'pages_read_engagement', 'public_profile'],
      });

      if (upsertError) {
        console.error(`[meta-oauth] Failed to store integration for user ${userId}`);
        await adminSupabase.from('integration_logs').insert({
          user_id: userId,
          provider: 'meta',
          event_type: 'api_error',
          details: { error: upsertError.message, step: 'store_token' }
        });
        return new Response(buildCallbackHtml('error', siteUrl), {
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }

      // Log successful connection
      await adminSupabase.from('integration_logs').insert({
        user_id: userId,
        provider: 'meta',
        event_type: 'connected',
        details: { meta_user_id: meData.id, ad_account_id: adAccountId, ig_account_id: igAccountId }
      });

      console.log(`[meta-oauth] Successfully connected for user ${userId}`);

      return new Response(buildCallbackHtml('success', siteUrl), {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[meta-oauth] Unexpected error:`, error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
