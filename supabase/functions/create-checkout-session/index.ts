// Create Checkout Session — ETAPA 6: Server-side price allowlist + rate limiting
// Fixes:
//   1. priceId is validated against allowed_prices table (rejects unknown prices)
//   2. planId is derived from the price, NOT trusted from client
//   3. Rate limiting via check_checkout_rate_limit RPC (5 per hour)
//   4. PII logging removed
//   5. Error messages sanitized
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://copymonster.me';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

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
    // ── 1. AUTHENTICATE USER VIA JWT ──────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Authentication required' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('[create-checkout-session] Missing SUPABASE_URL or SUPABASE_ANON_KEY');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: 'Invalid or expired token' }, 401);
    }

    const userId = user.id;
    const userEmail = user.email;

    if (!userEmail) {
      return jsonResponse({ error: 'User email not found' }, 400);
    }

    // ── 2. PARSE BODY — only priceId is accepted, planId is IGNORED ──────
    const { priceId, affiliateId } = await req.json();

    if (!priceId || typeof priceId !== 'string') {
      return jsonResponse({ error: 'Missing required field: priceId' }, 400);
    }

    // ── 3. VALIDATE priceId AGAINST SERVER-SIDE ALLOWLIST ────────────────
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!serviceRoleKey) {
      console.error('[create-checkout-session] Missing SUPABASE_SERVICE_ROLE_KEY');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: priceValidation, error: validationError } = await adminClient.rpc('validate_price_id', {
      p_price_id: priceId,
    });

    if (validationError || !priceValidation || !priceValidation.valid) {
      console.warn(`[create-checkout-session] Rejected invalid priceId from user ${userId}`);
      return jsonResponse({ error: 'Invalid price ID' }, 400);
    }

    // ── 4. DERIVE planId FROM THE PRICE (never trust client) ────────────
    const serverPlanId: string = priceValidation.plan_id;
    const serverCredits: number = priceValidation.credits;

    console.log(`[create-checkout-session] User ${userId} checkout for plan ${serverPlanId} (${serverCredits} credits)`);

    // ── 5. RATE LIMITING (5 checkout sessions per hour) ─────────────────
    const { data: rateLimitOk, error: rateLimitError } = await adminClient.rpc('check_checkout_rate_limit', {
      p_user_id: userId,
      p_max_per_hour: 5,
    });

    if (rateLimitError || !rateLimitOk) {
      console.warn(`[create-checkout-session] Rate limit exceeded for user ${userId}`);
      return jsonResponse({ error: 'Too many checkout attempts. Please try again later.' }, 429);
    }

    // ── 6. CREATE STRIPE CHECKOUT SESSION ───────────────────────────────
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('[create-checkout-session] STRIPE_SECRET_KEY not configured');
      return jsonResponse({ error: 'Payment system not configured' }, 500);
    }

    const siteUrl = Deno.env.get('SITE_URL') || 'https://copymonster.me';

    const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        'mode': 'subscription',
        'payment_method_types[0]': 'card',
        'line_items[0][price]': priceId,
        'line_items[0][quantity]': '1',
        'success_url': `${siteUrl}/dashboard?payment=success`,
        'cancel_url': `${siteUrl}/dashboard/billing`,
        'customer_email': userEmail,
        'client_reference_id': userId,
        // metadata plan_id comes from the SERVER, not the client
        'metadata[plan_id]': serverPlanId,
        'metadata[user_id]': userId,
        ...(affiliateId ? { 'metadata[affiliate_id]': affiliateId } : {}),
      }).toString(),
    });

    const session = await stripeResponse.json();

    if (!stripeResponse.ok) {
      console.error('[create-checkout-session] Stripe API error:', session.error?.type);
      return jsonResponse({ error: 'Failed to create checkout session' }, 400);
    }

    console.log(`[create-checkout-session] Session created: ${session.id} for plan ${serverPlanId}`);

    return jsonResponse({ sessionId: session.id, url: session.url }, 200);
  } catch (error) {
    console.error('[create-checkout-session] Unexpected error:', (error as Error).message);
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});