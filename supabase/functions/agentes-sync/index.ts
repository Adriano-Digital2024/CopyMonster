import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AGENTES_SYNC_LEAD_URL = "https://alfedcsoicoheqargisr.supabase.co/functions/v1/sync-lead";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const AGENTES_SERVICE_ROLE_KEY = Deno.env.get("AGENTES_SERVICE_ROLE_KEY");
    if (!AGENTES_SERVICE_ROLE_KEY) {
      console.error("[agentes-sync] AGENTES_SERVICE_ROLE_KEY not configured");
      return new Response(JSON.stringify({ error: "AGENTES_SERVICE_ROLE_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { type, record } = body;
    console.log(`[agentes-sync] Event type: ${type}, lead_id: ${record?.id}, email: ${record?.email}`);

    if (!record?.id || !record?.email) {
      console.error("[agentes-sync] Missing required fields (id/email)");
      return new Response(JSON.stringify({ error: "Missing id or email in record" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    console.log(`[agentes-sync] Sending POST to sync-lead:`, JSON.stringify(payload));

    const response = await fetch(AGENTES_SYNC_LEAD_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${AGENTES_SERVICE_ROLE_KEY}`,
        "apikey": AGENTES_SERVICE_ROLE_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    console.log(`[agentes-sync] sync-lead response (${response.status}):`, responseText);

    if (!response.ok) {
      console.error(`[agentes-sync] sync-lead error: ${response.status}`, responseText);
      return new Response(JSON.stringify({
        error: "sync-lead API error",
        status: response.status,
        details: responseText,
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[agentes-sync] Successfully synced ${record.email} (type: ${type}, status_lead: ${status_lead})`);

    return new Response(JSON.stringify({ success: true, type, email: record.email, status_lead, nome_plano }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[agentes-sync] Unexpected error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
