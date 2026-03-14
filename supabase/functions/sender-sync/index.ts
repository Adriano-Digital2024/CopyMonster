import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SENDER_API_URL = "https://api.sender.net/v2/subscribers";
const GROUP_ID = "bqp09r";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SENDER_API_KEY = Deno.env.get("SENDER_API_KEY");
    if (!SENDER_API_KEY) {
      console.error("SENDER_API_KEY not configured");
      return new Response(JSON.stringify({ error: "SENDER_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { type, record } = await req.json();
    console.log(`[sender-sync] Event type: ${type}, email: ${record?.email}`);

    if (!record?.email) {
      console.error("[sender-sync] Missing email in record");
      return new Response(JSON.stringify({ error: "Missing email" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
    let method: string;

    if (type === "new_user") {
      // Create/upsert subscriber with all fields and group
      payload = {
        email: record.email,
        firstname: record.first_name || "",
        groups: [GROUP_ID],
        fields: {
          phone: record.phone || "",
          plan: plan,
        },
      };
      method = "POST";
    } else if (type === "plan_update") {
      // Update subscriber plan field (Sender upserts by email)
      payload = {
        email: record.email,
        firstname: record.first_name || "",
        groups: [GROUP_ID],
        fields: {
          phone: record.phone || "",
          plan: plan,
        },
      };
      method = "POST"; // Sender upserts on POST by email
    } else {
      console.error(`[sender-sync] Unknown event type: ${type}`);
      return new Response(JSON.stringify({ error: "Unknown event type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[sender-sync] Sending ${method} to Sender:`, JSON.stringify(payload));

    const senderResponse = await fetch(SENDER_API_URL, {
      method,
      headers: {
        "Authorization": `Bearer ${SENDER_API_KEY}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const responseData = await senderResponse.text();
    console.log(`[sender-sync] Sender response (${senderResponse.status}):`, responseData);

    if (!senderResponse.ok) {
      console.error(`[sender-sync] Sender API error: ${senderResponse.status}`, responseData);
      return new Response(JSON.stringify({ 
        error: "Sender API error", 
        status: senderResponse.status,
        details: responseData 
      }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[sender-sync] Successfully synced ${record.email} (type: ${type}, plan: ${plan})`);

    return new Response(JSON.stringify({ success: true, type, email: record.email, plan }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("[sender-sync] Unexpected error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
