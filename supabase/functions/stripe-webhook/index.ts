// Import Supabase
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import Stripe from 'https://esm.sh/stripe@14.4.0?target=deno&no-check';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    
    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer;
        
        if (userId && planId) {
          // Update user subscription in database
          const { error } = await supabaseClient
            .from('profiles')
            .update({ 
              subscription_status: planId,
              stripe_customer_id: customerId,
              // Add credits based on plan
              credits: planId === 'starter' ? 1000 : 
                      planId === 'pro' ? 5000 : 15000
            })
            .eq('id', userId);
          
          if (error) {
            console.error('Error updating user subscription:', error);
          }
        }
        break;
        
      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        const deletedCustomerId = subscription.customer;
        
        // Find user by customer ID and downgrade to free plan
        const { data: profile, error } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', deletedCustomerId)
          .single();
        
        if (profile && !error) {
          await supabaseClient
            .from('profiles')
            .update({ subscription_status: 'free' })
            .eq('id', profile.id);
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
    console.error('Error processing webhook:', error);
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