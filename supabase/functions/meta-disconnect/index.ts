import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = userData.user.id;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get decrypted token to revoke it
    const { data: tokenData } = await adminSupabase.rpc('get_decrypted_token' as any, {
      p_user_id: userId,
      p_provider: 'meta',
      p_encryption_key: encryptionKey,
    });

    // Try to revoke the Meta token
    if (tokenData) {
      try {
        await fetch(`https://graph.facebook.com/v21.0/me/permissions?access_token=${tokenData}`);
        console.log(`[meta-disconnect] Token revoked for user ${userId}`);
      } catch (revokeError) {
        console.log(`[meta-disconnect] Token revocation skipped for user ${userId}`);
      }
    }

    // Update integration status
    const { error: updateError } = await adminSupabase
      .from('user_integrations')
      .update({
        status: 'disconnected',
        encrypted_access_token: null,
        encrypted_refresh_token: null,
        token_expires_at: null,
        disconnected_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'meta');

    if (updateError) {
      console.error(`[meta-disconnect] Failed to update status for user ${userId}`);
      return new Response(JSON.stringify({ error: 'Failed to disconnect' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Log disconnection
    await adminSupabase.from('integration_logs').insert({
      user_id: userId,
      provider: 'meta',
      event_type: 'disconnected',
      details: {}
    });

    console.log(`[meta-disconnect] Successfully disconnected for user ${userId}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[meta-disconnect] Unexpected error:`, error.message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
