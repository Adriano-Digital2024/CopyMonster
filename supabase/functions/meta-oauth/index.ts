import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

function buildCallbackHtml(siteUrl: string, result: 'success' | 'error'): Response {
  const redirectUrl = `${siteUrl}/dashboard/settings?meta=${result}`;
  const messageType = result === 'success' ? 'meta-oauth-success' : 'meta-oauth-error';
  const displayMsg = result === 'success' ? 'Conexão realizada! Fechando...' : 'Erro na conexão. Redirecionando...';

  const html = `<!DOCTYPE html><html><head><title>CopyMonster</title></head>
<body style="background:#1a1a2e;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">
<div style="text-align:center"><p>${displayMsg}</p></div>
<script>
try{if(window.opener)window.opener.postMessage({type:'${messageType}'},'*');}catch(e){}
setTimeout(function(){window.close();},500);
setTimeout(function(){window.location.href='${redirectUrl}';},2000);
</script></body></html>`;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
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
      const scopes = 'ads_management,ads_read,business_management,pages_show_list,pages_read_engagement,public_profile,instagram_basic,instagram_manage_insights';

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
        return buildCallbackHtml(siteUrl, 'error');
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
        return buildCallbackHtml(siteUrl, 'error');
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
        return buildCallbackHtml(siteUrl, 'error');
      }

      // Log successful connection
      await adminSupabase.from('integration_logs').insert({
        user_id: userId,
        provider: 'meta',
        event_type: 'connected',
        details: { meta_user_id: meData.id, ad_account_id: adAccountId, ig_account_id: igAccountId }
      });

      console.log(`[meta-oauth] Successfully connected for user ${userId}`);

      return buildCallbackHtml(siteUrl, 'success');
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[meta-oauth] Unexpected error:`, (error as Error).message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
