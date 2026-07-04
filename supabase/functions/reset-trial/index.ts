import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function assertAdmin(req: Request, adminSupabase: ReturnType<typeof createClient>): Promise<string | null> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return 'Missing Authorization header';
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await adminSupabase.auth.getUser(token);
  if (error || !user) return 'Invalid token';
  const { data: isAdmin } = await adminSupabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
  if (!isAdmin) return 'Admin only';
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const mauticSyncUrl = `${supabaseUrl}/functions/v1/mautic-sync`;

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const forbidden = await assertAdmin(req, adminSupabase);
    if (forbidden) {
      return new Response(JSON.stringify({ error: forbidden }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const emails: string[] = Array.isArray(body?.emails)
      ? body.emails.map((e: string) => e.toLowerCase().trim()).filter(Boolean)
      : [];

    if (emails.length === 0) {
      return new Response(JSON.stringify({ error: 'emails[] required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const newTrialExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const { data: updated, error: updateError } = await adminSupabase
      .from('profiles')
      .update({
        subscription_status: 'free',
        trial_expires_at: newTrialExpiresAt,
        credits: 20,
      })
      .in('email', emails)
      .select('email, first_name, phone, subscription_status');

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const syncResults: Array<{ email: string; status: string; detail?: string }> = [];

    for (const p of updated ?? []) {
      try {
        const resp = await fetch(mauticSyncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            type: 'plan_update',
            record: {
              email: p.email,
              first_name: p.first_name || '',
              phone: p.phone || '',
              subscription_status: 'free',
            },
          }),
        });
        const text = await resp.text();
        syncResults.push({
          email: p.email,
          status: resp.ok ? 'ok' : `error_${resp.status}`,
          detail: resp.ok ? undefined : text.substring(0, 200),
        });
      } catch (e) {
        syncResults.push({ email: p.email, status: 'exception', detail: (e as Error).message });
      }
    }

    const notFound = emails.filter((e) => !(updated ?? []).some((u) => u.email?.toLowerCase() === e));

    return new Response(JSON.stringify({
      requested: emails.length,
      updated: updated?.length ?? 0,
      not_found: notFound,
      trial_expires_at: newTrialExpiresAt,
      mautic: syncResults,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});