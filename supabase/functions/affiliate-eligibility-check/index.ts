// =============================================================================
// ETAPA 1: a promoçãoHora não credita saldo direto. Vai para PENDING_VALIDATION,
// onde o aguarda validação manual do admin financeiro (alinhado à política:
// reembolso em 7d + retenção de 35d garante margem; só conferir manualmente
// antes de dinheiro virar saldo).
// =============================================================================

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

  // Promo: HOLDING → PENDING_VALIDATION (depois do prazo; Refunds afetam
  // marca a comissão como REFUNDED via webhook separado, então sumirá do
  // HOLDING naturalmente — este cron só pega as que sobreviveram).
  //
  // Race safety: se um charge.refunded webhook disparar entre o momento
  // em que este update atômico rodar e o commit interno, o status final
  // dependerá de quem commitar por último. Para não correr risco de uma
  // comissão reembolsada virar PENDING_VALIDATION (e o admin precisar
  // rejeitar manualmente), o `approve-commission` e o handler de reembolso
  // aceitam ambos writers; se um reembolso tardio chegar, o status
  // REFUNDED sobrescreve PENDING_VALIDATION, e `approve-commission`
  // recusa operar em algo que não seja PENDING_VALIDATION.
  const { data: updated, error } = await supabase
    .from('affiliate.commissions')
    .update({ status: 'PENDING_VALIDATION', updated_at: new Date().toISOString() })
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
        type: 'AWAITING_VALIDATION',
        title: 'Comissões em validação',
        message: `$${total.toFixed(2)} em comissões completaram o período de retenção e estão aguardando validação do administrador.`,
        metadata: { released_amount: total, released_count: updated?.filter(c => c.affiliate_id === affiliateId).length },
      })
  }

  console.log(`[affiliate-eligibility-check] ${updated?.length || 0} commissions moved to PENDING_VALIDATION, ${affiliateTotals.size} affiliates notified`)

  return new Response(JSON.stringify({ processed: updated?.length || 0, notified: affiliateTotals.size }), { status: 200 })
})
