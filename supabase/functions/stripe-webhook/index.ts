// Import Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.4.0?target=deno&no-check';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Credit allocation per plan (sustainable with 300%+ margin)
const PLAN_CREDITS: Record<string, number> = {
  'starter': 150,   // ~R$0.32/credit
  'pro': 400,       // ~R$0.24/credit
  'legend': 1000,   // ~R$0.20/credit
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
    
    // Create Supabase client
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
    
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
    
    console.log(`[stripe-webhook] Processing event: ${event.type}`);
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer;
        
        if (userId && planId) {
          const credits = PLAN_CREDITS[planId] || 150;
          
          console.log(`[stripe-webhook] Upgrading user ${userId} to ${planId} with ${credits} credits`);
          
          // Update user subscription in database
          const { error } = await supabaseClient
            .from('profiles')
            .update({ 
              subscription_status: planId,
              stripe_customer_id: customerId,
              credits: credits,
              // Clear trial_expires_at for paid users
              trial_expires_at: null
            })
            .eq('id', userId);
          
          if (error) {
            console.error('[stripe-webhook] Error updating user subscription:', error);
          } else {
            console.log(`[stripe-webhook] User ${userId} upgraded successfully`);
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const deletedCustomerId = subscription.customer;
        
        console.log(`[stripe-webhook] Subscription deleted for customer: ${deletedCustomerId}`);
        
        // Find user by customer ID and downgrade to free plan
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', deletedCustomerId)
          .single();
        
        if (profile && !error) {
          // Reset to free with 20 credits and 7-day trial from now
          await supabaseClient
            .from('profiles')
            .update({ 
              subscription_status: 'free',
              credits: 20,
              trial_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            })
            .eq('id', profile.id);
          
          console.log(`[stripe-webhook] User ${profile.id} downgraded to free`);
        }
        break;
        
      case 'invoice.payment_succeeded':
        // Monthly renewal - add credits
        const invoice = event.data.object;
        const invoiceCustomerId = invoice.customer;
        const subscriptionId = invoice.subscription;
        
        // Only process recurring payments (not initial)
        if (invoice.billing_reason === 'subscription_cycle') {
          const { data: renewProfile } = await supabaseClient
            .from('profiles')
            .select('id, subscription_status')
            .eq('stripe_customer_id', invoiceCustomerId)
            .single();
          
          if (renewProfile) {
            const renewCredits = PLAN_CREDITS[renewProfile.subscription_status] || 150;
            
            await supabaseClient
              .from('profiles')
              .update({ credits: renewCredits })
              .eq('id', renewProfile.id);
            
            console.log(`[stripe-webhook] Monthly renewal: ${renewCredits} credits added for user ${renewProfile.id}`);
          }
        }
        break;

      case 'invoice.payment_failed':
        // Payment failed - downgrade user and notify
        const failedInvoice = event.data.object;
        const failedCustomerId = failedInvoice.customer;
        const attemptCount = failedInvoice.attempt_count || 1;
        
        console.log(`[stripe-webhook] Payment failed for customer: ${failedCustomerId}, attempt: ${attemptCount}`);
        
        // Find user by customer ID
        const { data: failedProfile, error: failedError } = await supabaseClient
          .from('profiles')
          .select('id, email, subscription_status')
          .eq('stripe_customer_id', failedCustomerId)
          .single();
        
        if (failedProfile && !failedError) {
          // After 3 failed attempts, downgrade to free
          if (attemptCount >= 3) {
            await supabaseClient
              .from('profiles')
              .update({ 
                subscription_status: 'free',
                credits: 0, // No credits - payment failed
                trial_expires_at: null // No trial after failed payment
              })
              .eq('id', failedProfile.id);
            
            console.log(`[stripe-webhook] User ${failedProfile.id} downgraded due to payment failure after ${attemptCount} attempts`);
          } else {
            // Log warning for first attempts
            console.warn(`[stripe-webhook] Payment attempt ${attemptCount} failed for user ${failedProfile.id}. Stripe will retry.`);
          }
        }
        break;
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
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
