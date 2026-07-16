// Sender Sync — ETAPA 5: Shared-secret auth + sanitized errors + reduced PII logs
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

const SENDER_API_URL = "https://api.sender.net/v2/subscribers";
const GROUP_ID = "bqp09r";

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
    const SENDER_API_KEY = Deno.env.get("SENDER_API_KEY");
    if (!SENDER_API_KEY) {
      console.error("[sender-sync] SENDER_API_KEY not configured");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const { type, record } = await req.json();

    if (!record?.email) {
      return jsonResponse({ error: "Missing email" }, 400);
    }

    // Map subscription_status to Sender plan values
    const planMap: Record<string, string> = {
      free: "free",
      starter: "starter",
      pro: "pro",
      legend: "legend",
    };

    const plan = planMap[record.subscription_status] || "free";

    let payload: Record<string, unknown>;

    if (type === "new_user" || type === "plan_update") {
      payload = {
        email: record.email,
        firstname: record.first_name || "",
        groups: [GROUP_ID],
        fields: {
          phone: record.phone || "",
          plan: plan,
        },
      };
    } else {
      return jsonResponse({ error: "Unknown event type" }, 400);
    }

    const senderResponse = await fetch(SENDER_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${SENDER_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!senderResponse.ok) {
      console.error(`[sender-sync] Sender API error: ${senderResponse.status}`);
      return jsonResponse({ error: "Sender API error", status: senderResponse.status }, 502);
    }

    console.log(`[sender-sync] Successfully synced (type: ${type}, plan: ${plan})`);

    return jsonResponse({ success: true, type, plan }, 200);
  } catch (error) {
    console.error("[sender-sync] Unexpected error:", (error as Error).message);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});