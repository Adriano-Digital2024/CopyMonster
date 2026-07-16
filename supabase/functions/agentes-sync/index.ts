// Agentes Sync — ETAPA 5: Shared-secret auth + sanitized errors + reduced PII logs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Auth: timing-safe comparison ────────────────────────────────────────────
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function isAuthorized(token: string): boolean {
  const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return (internalSecret.length > 0 && timingSafeEqual(token, internalSecret))
    || (serviceRoleKey.length > 0 && timingSafeEqual(token, serviceRoleKey));
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

const AGENTES_SYNC_LEAD_URL = "https://alfedcsoicoheqargisr.supabase.co/functions/v1/sync-lead";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Authentication ───────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authorization required' }, 401);
  }
  const token = authHeader.slice(7);
  if (!isAuthorized(token)) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const AGENTES_SERVICE_ROLE_KEY = Deno.env.get("AGENTES_SERVICE_ROLE_KEY");
    if (!AGENTES_SERVICE_ROLE_KEY) {
      console.error("[agentes-sync] AGENTES_SERVICE_ROLE_KEY not configured");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const body = await req.json();
    const { type, record } = body;

    if (!record?.id || !record?.email) {
      return jsonResponse({ error: "Missing id or email in record" }, 400);
    }

    // Map subscription_status -> status_lead / nome_plano
    const subStatus: string = record.subscription_status || "free";
    const status_lead = subStatus === "free" ? "free_trial" : "plano_pago";
    const nome_plano = subStatus;

    const payload = {
      lead_id: String(record.id),
      nome: record.first_name || "",
      email: record.email,
      whatsapp: record.phone || "",
      status_lead,
      nome_plano,
      data_inicio_trial: record.created_at || null,
      data_fim_trial: record.trial_expires_at || null,
    };

    const response = await fetch(AGENTES_SYNC_LEAD_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AGENTES_SERVICE_ROLE_KEY}`,
        "apikey": AGENTES_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.error(`[agentes-sync] sync-lead error: ${response.status}`);
      return jsonResponse({ error: "sync-lead API error", status: response.status }, 502);
    }

    console.log(`[agentes-sync] Successfully synced lead (type: ${type}, status_lead: ${status_lead})`);

    return jsonResponse({ success: true, type, status_lead, nome_plano }, 200);
  } catch (error) {
    console.error("[agentes-sync] Unexpected error:", (error as Error).message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});