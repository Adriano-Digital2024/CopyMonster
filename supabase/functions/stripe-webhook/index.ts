// Stripe Webhook Handler — Atomic idempotency via process_stripe_webhook_event RPC
// ETAPA 2: TOCTOU fix — idempotency INSERT + mutation in a single DB transaction
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.4.0?target=deno&no-check';

// CORS headers — restrictive in ETAPA 7, temporarily kept as-is for compatibility
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// SHA-256 hash helper for Meta CAPI
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim().toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Send Purchase event to Meta Conversions API (non-blocking)
async function sendMetaPurchaseEvent(email: string, value: number, currency: string, planId: string) {
  const accessToken = Deno.env.get('META_CONVERSIONS_API_TOKEN');
  if (!accessToken) {
    console.warn('[stripe-webhook] META_CONVERSIONS_API_TOKEN not configured, skipping Meta event');
    return;
  }

  try {
    const hashedEmail = await sha256(email);
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [{
        event_name: 'Purchase',
        event_time: eventTime,
        action_source: 'website',
        user_data: {
          em: [hashedEmail],
        },
        custom_data: {
          value: value,
          currency: currency,
          content_ids: [planId],
          content_type: 'product',
        },
      }],
    };

    const response = await fetch(
      `https://graph.facebook.com/v21.0/848000381146545/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    console.log(`[stripe-webhook] Meta Purchase event sent:`, result);
  } catch (metaError) {
    console.error('[stripe-webhook] Failed to send Meta Purchase event (non-blocking):', metaError);
  }
}

// Credit allocation per plan (must match the RPC's v_plan_credits map)
const PLAN_CREDITS: Record<string, number> = {
  'starter': 1000,
  'pro': 5000,
  'legend': 15000,
};

// Main function
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Stripe signature
    const signature = req.headers.get('Stripe-Signature');
    const body = await req.text();

    // Create Supabase client (service_role — bypasses RLS, can call RPCs)
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create Stripe client
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }
    if (!signature) {
      throw new Error('No Stripe signature found');
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: '2023-10-16',
      httpClient: Stripe.createFetchHttpClient(),
    }) as any;

    // Verify webhook signature (defense against spoofing)
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );

    console.log(`[stripe-webhook] Processing event: ${event.type} (id: ${event.id})`);

    // Map event data to RPC parameters
    let rpcParams: {
      p_event_id: string;
      p_event_type: string;
      p_user_id?: string;
      p_plan_id?: string;
      p_credits_to_set?: number;
      p_stripe_customer_id?: string;
      p_attempt_count?: number;
    };

    let isCheckoutCompleted = false;
    let checkoutUserId: string | null = null;
    let checkoutPlanId: string | null = null;
    let checkoutAmountTotal: number = 0;
    let checkoutCurrency: string = 'brl';
    let checkoutSubscriptionId: string | null = null;

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer;

        if (!userId || !planId) {
          console.warn(`[stripe-webhook] checkout.session.completed missing userId or planId, skipping`);
          // Still record event as processed to prevent infinite retries
          rpcParams = {
            p_event_id: event.id,
            p_event_type: 'ignored',
          };
          break;
        }

        isCheckoutCompleted = true;
        checkoutUserId = userId;
        checkoutPlanId = planId;
        checkoutAmountTotal = session.amount_total || 0;
        checkoutCurrency = session.currency || 'brl';
        checkoutSubscriptionId = session.subscription?.toString() ?? null;

        rpcParams = {
          p_event_id: event.id,
          p_event_type: 'checkout.session.completed',
          p_user_id: userId,
          p_plan_id: planId,
          p_credits_to_set: PLAN_CREDITS[planId] ?? 150,
          p_stripe_customer_id: customerId?.toString() ?? null,
        };
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        rpcParams = {
          p_event_id: event.id,
          p_event_type: 'customer.subscription.deleted',
          p_stripe_customer_id: subscription.customer?.toString() ?? null,
        };
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        // Only process recurring renewals, not initial payment
        if (invoice.billing_reason === 'subscription_cycle') {
          rpcParams = {
            p_event_id: event.id,
            p_event_type: 'invoice.payment_succeeded',
            p_stripe_customer_id: invoice.customer?.toString() ?? null,
          };
        } else {
          rpcParams = {
            p_event_id: event.id,
            p_event_type: 'ignored',
          };
        }
        break;
      }

      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        rpcParams = {
          p_event_id: event.id,
          p_event_type: 'invoice.payment_failed',
          p_stripe_customer_id: failedInvoice.customer?.toString() ?? null,
          p_attempt_count: failedInvoice.attempt_count || 1,
        };
        break;
      }

      default:
        // Unhandled event type — record as processed to prevent retries
        rpcParams = {
          p_event_id: event.id,
          p_event_type: 'ignored',
        };
        break;
    }

    // Call the atomic RPC — idempotency INSERT + mutation in ONE transaction
    const { data: rpcResult, error: rpcError } = await supabaseClient
      .rpc('process_stripe_webhook_event', rpcParams);

    if (rpcError) {
      // RPC threw — the event was NOT recorded as processed (transaction rolled back)
      // Stripe will retry. This is the desired behavior for transient failures.
      console.error(`[stripe-webhook] RPC error for event ${event.id}:`, rpcError);
      return new Response(
        JSON.stringify({ error: 'Webhook processing failed' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        }
      );
    }

    const result = rpcResult as { already_processed?: boolean; action?: string; user_id?: string; warning?: string };

    console.log(`[stripe-webhook] RPC result for ${event.id}:`, result);

    // Post-processing: Meta CAPI event (only for newly-processed checkout completions)
    if (
      isCheckoutCompleted &&
      !result.already_processed &&
      result.action === 'checkout_completed' &&
      result.user_id
    ) {
      // Fetch user email for the Meta event (non-blocking)
      try {
        const { data: userProfile } = await supabaseClient
          .from('profiles')
          .select('email')
          .eq('id', checkoutUserId!)
          .single();

        if (userProfile?.email) {
          const purchaseValue = checkoutAmountTotal / 100;
          const purchaseCurrency = checkoutCurrency.toUpperCase();
          await sendMetaPurchaseEvent(userProfile.email, purchaseValue, purchaseCurrency, checkoutPlanId!);
        }
      } catch (metaErr) {
        // Meta event failure must NOT cause webhook to return 500
        console.error('[stripe-webhook] Meta CAPI post-processing failed (non-blocking):', metaErr);
      }

      // Enrich profile with subscription details (billing_interval, stripe_subscription_id, current_period_end)
      if (checkoutSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(checkoutSubscriptionId);
          const interval = subscription.items?.data?.[0]?.plan?.interval;
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;

          await supabaseClient
            .from('profiles')
            .update({
              billing_interval: interval || 'month',
              stripe_subscription_id: checkoutSubscriptionId,
              current_period_end: currentPeriodEnd,
            })
            .eq('id', result.user_id);
        } catch (subErr) {
          console.error('[stripe-webhook] Failed to enrich subscription details (non-blocking):', subErr);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 200,
      }
    );
  } catch (error) {
    console.error('[stripe-webhook] Error processing webhook:', error);

    return new Response(
      JSON.stringify({ error: 'Webhook signature verification failed' }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500,
      }
    );
  }
});