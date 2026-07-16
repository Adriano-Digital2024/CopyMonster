import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: updated, error } = await supabase
    .from('affiliate.commissions')
    .update({ status: 'ELIGIBLE', updated_at: new Date().toISOString() })
    .eq('status', 'HOLDING')
    .lte('eligible_at', new Date().toISOString())
    .select('id, affiliate_id, commission_amount')

  if (error) {
    console.error('[affiliate-eligibility-check] Error:', error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const affiliateTotals = new Map<string, number>()
  for (const c of updated || []) {
    affiliateTotals.set(c.affiliate_id, (affiliateTotals.get(c.affiliate_id) || 0) + Number(c.commission_amount))
  }

  for (const [affiliateId, total] of affiliateTotals) {
    await supabase
      .from('affiliate.notifications')
      .insert({
        affiliate_id: affiliateId,
        type: 'BALANCE_AVAILABLE',
        title: 'Saldo disponível',
        message: `$${total.toFixed(2)} em comissões foram liberadas. Solicite seu saque quando quiser.`,
        metadata: { released_amount: total, released_count: updated?.filter(c => c.affiliate_id === affiliateId).length },
      })
  }

  console.log(`[affiliate-eligibility-check] ${updated?.length || 0} commissions moved to ELIGIBLE, ${affiliateTotals.size} affiliates notified`)

  return new Response(JSON.stringify({ processed: updated?.length || 0, notified: affiliateTotals.size }), { status: 200 })
})
