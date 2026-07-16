import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('affiliate.profiles')
    .select('id, kyc_status, active, paypal_email')
    .eq('user_id', user.id)
    .single()

  if (profileError || !profile) {
    return new Response(JSON.stringify({ error: 'Affiliate profile not found' }), { status: 404 })
  }

  if (profile.kyc_status !== 'APPROVED') {
    return new Response(JSON.stringify({ error: 'KYC not approved' }), { status: 403 })
  }

  if (!profile.active) {
    return new Response(JSON.stringify({ error: 'Account inactive' }), { status: 403 })
  }

  if (!profile.paypal_email) {
    return new Response(JSON.stringify({ error: 'PayPal email not registered' }), { status: 400 })
  }

  const { data: rule, error: ruleError } = await supabase
    .from('affiliate.commission_rules')
    .select('min_payout_amount')
    .eq('is_current', true)
    .single()

  if (ruleError || !rule) {
    return new Response(JSON.stringify({ error: 'No active commission rule' }), { status: 500 })
  }

  const minAmount = Number(rule.min_payout_amount || 100)

  const { data: ledgerData } = await supabase
    .from('finance.ledger_entries')
    .select('amount, entry_type')
    .eq('affiliate_id', profile.id)

  const available = (ledgerData || [])
    .reduce((acc, e) => e.entry_type === 'CREDIT' ? acc + Number(e.amount) : acc - Number(e.amount), 0)

  if (available < minAmount) {
    return new Response(JSON.stringify({
      error: `Minimum payout is $${minAmount}. Available: $${available.toFixed(2)}`
    }), { status: 400 })
  }

  const { data: existingRequest } = await supabase
    .from('finance.payout_requests')
    .select('id')
    .eq('affiliate_id', profile.id)
    .in('status', ['REQUESTED', 'APPROVED', 'PROCESSING'])
    .maybeSingle()

  if (existingRequest) {
    return new Response(JSON.stringify({ error: 'You already have a pending payout request' }), { status: 409 })
  }

  const { error: insertError } = await supabase
    .from('finance.payout_requests')
    .insert({
      affiliate_id: profile.id,
      amount: available,
      paypal_email_snapshot: profile.paypal_email,
      status: 'REQUESTED',
    })

  if (insertError) {
    console.error('[request-affiliate-payout] Insert error:', insertError)
    return new Response(JSON.stringify({ error: 'Failed to create payout request' }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true, amount: available }), { status: 200 })
})
