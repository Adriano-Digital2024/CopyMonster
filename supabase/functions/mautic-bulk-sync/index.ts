import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const planMap: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  legend: 'Legend',
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
    const mauticSyncUrl = `${supabaseUrl}/functions/v1/mautic-sync`;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const forbidden = await assertAdmin(req, adminSupabase);
    if (forbidden) {
      return new Response(JSON.stringify({ error: forbidden }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Optional filter: { emails?: string[] } — if empty/absent, sync ALL profiles
    let emails: string[] | null = null;
    try {
      const body = await req.json();
      if (Array.isArray(body?.emails) && body.emails.length > 0) {
        emails = body.emails.map((e: string) => e.toLowerCase().trim());
      }
    } catch { /* no body */ }

    let query = adminSupabase
      .from('profiles')
      .select('email, first_name, phone, subscription_status');
    if (emails) query = query.in('email', emails);

    const { data: profiles, error } = await query;
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: Array<{ email: string; status: string; detail?: string }> = [];

    for (const p of profiles ?? []) {
      try {
        const resp = await fetch(mauticSyncUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            type: 'plan_update', // mautic-sync creates the contact if it doesn't exist yet
            record: {
              email: p.email,
              first_name: p.first_name || '',
              phone: p.phone || '',
              subscription_status: p.subscription_status || 'free',
            },
          }),
        });
        const text = await resp.text();
        results.push({
          email: p.email,
          status: resp.ok ? 'ok' : `error_${resp.status}`,
          detail: resp.ok ? planMap[p.subscription_status] || 'Free' : text.substring(0, 200),
        });
      } catch (e) {
        results.push({ email: p.email, status: 'exception', detail: (e as Error).message });
      }
    }

    const okCount = results.filter((r) => r.status === 'ok').length;
    return new Response(JSON.stringify({
      total: results.length,
      success: okCount,
      failed: results.length - okCount,
      results,
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