import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { payoutId } = await req.json()

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 1. Fetch Payout Request
    const { data: payout, error: fetchError } = await supabase
      .from('finance.payout_requests')
      .select('*, affiliate:affiliate_id(*)')
      .eq('id', payoutId)
      .single()

    if (fetchError || !payout) throw new Error('Payout request not found')

    // 2. PayPal API Call (Mocked for boilerplate)
    console.log(`Executing PayPal payout to ${payout.paypal_email_snapshot} for $${payout.amount}`)
    
    // 3. Update Payout Status
    await supabase
      .from('finance.payout_requests')
      .update({ status: 'PAID', paypal_payout_batch_id: 'MOCKED_PAYPAL_ID' })
      .eq('id', payoutId)

    // 4. Record Debit in Ledger (Accounting loop closure)
    await supabase
      .from('finance.ledger_entries')
      .insert({
        affiliate_id: payout.affiliate_id,
        amount: payout.amount,
        entry_type: 'DEBIT',
        reference_type: 'PAYOUT',
        reference_id: payout.id,
        description: `PayPal Payout to ${payout.paypal_email_snapshot}`
      })

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 })
  }
})
