import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@14.4.0?target=deno&no-check"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')
  const body = await req.text()

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SECRET')!
    )

    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      const stripeEventId = event.id
      const affiliateIdFromMeta = invoice.metadata?.affiliate_id

      if (!affiliateIdFromMeta) return new Response('No affiliate linked', { status: 200 })

      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )

      // 1. Idempotency Check
      const { data: existing } = await supabase
        .from('affiliate.commissions')
        .select('id')
        .eq('stripe_event_id', stripeEventId)
        .maybeSingle()

      if (existing) return new Response('Duplicate event', { status: 200 })

      // 2. KYC & Profile Validation
      const { data: profile, error: profileError } = await supabase
        .from('affiliate.profiles')
        .select('id, kyc_status, active')
        .eq('id', affiliateIdFromMeta)
        .maybeSingle()

      if (profileError) {
        console.error(`[stripe-to-affiliate] Profile lookup error:`, profileError)
        throw profileError
      }

      if (!profile || profile.kyc_status !== 'APPROVED' || !profile.active) {
        console.warn(`[stripe-to-affiliate] Affiliate ${affiliateIdFromMeta} not authorized:`, { profile })
        return new Response('Affiliate not authorized', { status: 200 })
      }

      // 3. Fetch Current Commission Rule
      const { data: rule, error: ruleError } = await supabase
        .from('affiliate.commission_rules')
        .select('*')
        .eq('is_current', true)
        .maybeSingle()

      if (ruleError) {
        console.error(`[stripe-to-affiliate] Rule lookup error:`, ruleError)
        throw ruleError
      }

      if (!rule) {
        console.warn(`[stripe-to-affiliate] No active commission rule found, skipping`)
        return new Response('No active commission rule', { status: 200 })
      }

      const commissionAmount = (invoice.amount_paid / 100) * (rule.percentage / 100)

      // 4. Atomic Insert into Operational Layer
      const { error: insertError } = await supabase
        .from('affiliate.commissions')
        .insert({
          affiliate_id: profile.id,
          stripe_event_id: stripeEventId,
          amount_gross: invoice.amount_paid / 100,
          commission_amount: commissionAmount,
          status: 'HOLDING',
          eligible_at: new Date(Date.now() + rule.retention_days * 24 * 60 * 60 * 1000).toISOString()
        })

      if (insertError) {
        console.error(`[stripe-to-affiliate] Insert error:`, insertError)
        throw insertError
      }

      console.log(`[stripe-to-affiliate] Commission created: ${stripeEventId} for affiliate ${profile.id}, amount ${commissionAmount}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('[stripe-to-affiliate] Error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
