import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import Stripe from "https://esm.sh/stripe@11.1.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2022-11-15',
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
      const { data: profile } = await supabase
        .from('affiliate.profiles')
        .select('id, kyc_status, active')
        .eq('id', affiliateIdFromMeta)
        .single()

      if (!profile || profile.kyc_status !== 'APPROVED' || !profile.active) {
        return new Response('Affiliate not authorized', { status: 200 })
      }

      // 3. Fetch Current Commission Rule
      const { data: rule } = await supabase
        .from('affiliate.commission_rules')
        .select('*')
        .eq('is_current', true)
        .single()

      const commissionAmount = (invoice.amount_paid / 100) * (rule.percentage / 100)

      // 4. Atomic Insert into Operational Layer
      const { error } = await supabase
        .from('affiliate.commissions')
        .insert({
          affiliate_id: profile.id,
          stripe_event_id: stripeEventId,
          amount_gross: invoice.amount_paid / 100,
          commission_amount: commissionAmount,
          status: 'HOLDING',
          eligible_at: new Date(Date.now() + rule.retention_days * 24 * 60 * 60 * 1000).toISOString()
        })

      if (error) throw error
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
