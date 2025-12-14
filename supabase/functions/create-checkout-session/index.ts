import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request data
    const { priceId, planId, userEmail, userId } = await req.json();
    
    console.log('=== Checkout Session Request ===');
    console.log('priceId:', priceId);
    console.log('planId:', planId);
    console.log('userEmail:', userEmail);
    console.log('userId:', userId);
    
    // Validate required fields
    if (!priceId || !userEmail || !userId) {
      console.error('Missing required fields:', { priceId: !!priceId, userEmail: !!userEmail, userId: !!userId });
      return new Response(
        JSON.stringify({ error: 'Missing required fields: priceId, userEmail, or userId' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        }
      );
    }
    
    // Get Stripe key
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      console.error('STRIPE_SECRET_KEY is not configured');
      return new Response(
        JSON.stringify({ error: 'Stripe is not configured' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 500,
        }
      );
    }
    
    // Get site URL with fallback
    const siteUrl = Deno.env.get('SITE_URL') || 'https://app.copymonster.me';
    console.log('Using SITE_URL:', siteUrl);
    
    // Create Stripe checkout session using fetch API directly
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
        'metadata[plan_id]': planId,
        'metadata[user_id]': userId,
      }).toString(),
    });
    
    const session = await stripeResponse.json();
    
    if (!stripeResponse.ok) {
      console.error('Stripe API error:', session);
      return new Response(
        JSON.stringify({ error: session.error?.message || 'Failed to create checkout session' }),
        {
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
          status: 400,
        }
      );
    }
    
    console.log('Checkout session created successfully:', session.id);
    
    // Return session ID
    return new Response(
      JSON.stringify({ sessionId: session.id }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error creating checkout session:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
        status: 500,
      }
    );
  }
});
