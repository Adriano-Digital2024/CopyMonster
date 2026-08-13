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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // ============================================================
    // Handler 1: invoice.paid  →  criar comissão HOLDING
    // ============================================================
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object
      const stripeEventId = event.id
      const affiliateIdFromMeta = invoice.metadata?.affiliate_id

      if (!affiliateIdFromMeta) return new Response('No affiliate linked', { status: 200 })

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
      // Grava tambem stripe_invoice_id — liga a comissão a esta invoice
      // Stripe para que o handler de charge.refunded localize esta comissão
      // (event.id é diferente entre os dois webhooks, mas invoice.id é
      // compartilhado).
      const { error: insertError } = await supabase
        .from('affiliate.commissions')
        .insert({
          affiliate_id: profile.id,
          stripe_event_id: stripeEventId,
          stripe_invoice_id: invoice.id || null,
          amount_gross: invoice.amount_paid / 100,
          commission_amount: commissionAmount,
          status: 'HOLDING',
          eligible_at: new Date(Date.now() + rule.retention_days * 24 * 60 * 60 * 1000).toISOString()
        })

      if (insertError) {
        console.error(`[stripe-to-affiliate] Insert error:`, insertError)
        throw insertError
      }

      console.log(`[stripe-to-affiliate] Commission created: ${stripeEventId} for affiliate ${profile.id}, amount ${commissionAmount}, invoice ${invoice.id}`)
    }

    // ============================================================
    // Handler 2: charge.refunded  →  marcar comissão REFUNDED
    // ============================================================
    // Política comercial: reembolso só em 7 dias. Com retenção de 35 dias,
    // reembolso chega SEMPRE enquanto a comissão ainda está em HOLDING (ou
    // raramente em PENDING_VALIDATION — nunca em ELIGIBLE). Mesmo assim,
    // defesa-in-depth: se já passou por ELIGIBLE com CREDIT no ledger,
    // inserimos DEBIT REFUND para reverter saldo.
    if (event.type === 'charge.refunded') {
      const charge = event.data.object as Stripe.Charge
      const invoiceId = charge.invoice?.toString?.() ?? null
      const refundAmount = charge.amount_refunded ? charge.amount_refunded / 100 : 0

      if (!invoiceId) {
        // Sem invoice associado (ex.: charge standalone). Tenta ler do
        // metadata da charge, fallback final.
        const affiliateIdFromMeta = (charge.metadata as any)?.affiliate_id
        if (!affiliateIdFromMeta) {
          return new Response('No invoice / no affiliate metadata', { status: 200 })
        }
      }

      // Busca a comissão pela stripe_invoice_id (chave robusta).
      const { data: commission, error: commissionError } = await supabase
        .from('affiliate.commissions')
        .select('id, affiliate_id, commission_amount, status')
        .eq('stripe_invoice_id', invoiceId)
        .maybeSingle()

      if (commissionError) {
        console.error(`[stripe-to-affiliate] Refund lookup error:`, commissionError)
        throw commissionError
      }

      if (!commission) {
        // Não há comissão ligada a esta invoice (ou não tinha affiliate_id
        // na checkout, ou já foi apagada). Silenciosamente ignore — não
        // há nada para reembolsar.
        console.log(`[stripe-to-affiliate] Refund for invoice ${invoiceId}: no commission found, ignoring`)
        return new Response('No commission to refund', { status: 200 })
      }

      // Idempotência: já marcada REFUNDED
      if (commission.status === 'REFUNDED') {
        return new Response('Already refunded', { status: 200 })
      }

      const previousStatus = commission.status

      // 2a. Marcar comissão como REFUNDED.
      const { error: updateError } = await supabase
        .from('affiliate.commissions')
        .update({ status: 'REFUNDED', updated_at: new Date().toISOString() })
        .eq('id', commission.id)
        .in('status', ['HOLDING', 'PENDING_VALIDATION', 'ELIGIBLE'])

      if (updateError) {
        console.error(`[stripe-to-affiliate] Refund status update error:`, updateError)
        throw updateError
      }

      // 2b. Se a comissão já estava ELIGIBLE (admin já approve), significa
      // que já há um CREDIT no ledger. Inserir DEBIT REFUND para reverter
      // o saldo do afiliado (idempotente via idx_ledger_commission_unique
      // não se aplica aqui porque reference_type é REFUND, não COMMISSION
      // — precisa de index próprio; por ora confiamos no status REFUNDED
      // já gravado acima + verificação pré-insert para evitar duplicatas).
      if (previousStatus === 'ELIGIBLE') {
        // Idempotência garantida pelo idx_ledger_refund_unique (reference_id
        // WHERE reference_type='REFUND'). Duplicate-key (23505) é esperado em
        // retriggers do Stripe e tratado como sucesso silencioso.
        const { error: ledgerError } = await supabase
          .from('finance.ledger_entries')
          .insert({
            affiliate_id: commission.affiliate_id,
            amount: Number(commission.commission_amount),
            entry_type: 'DEBIT',
            reference_type: 'REFUND',
            reference_id: commission.id,
            description: `Reversão de crédito por reembolso Stripe (invoice ${invoiceId})`,
          })
        if (ledgerError) {
          if (ledgerError.code === '23505') {
            console.log(`[stripe-to-affiliate] Ledger DEBIT REFUND already exists (idempotent), skipping`)
          } else {
            console.error(`[stripe-to-affiliate] Ledger DEBIT REFUND insert error:`, ledgerError)
            // Não abortar — o status já está REFUNDED. Logar p/ reconciliação.
          }
        } else {
          console.log(`[stripe-to-affiliate] Ledger DEBIT REFUND inserted for commission ${commission.id}`)
        }
      }

      // 2c. Notificação ao afiliado sobre o reembolso.
      await supabase
        .from('affiliate.notifications')
        .insert({
          affiliate_id: commission.affiliate_id,
          type: 'COMMISSION_REFUNDED',
          title: 'Comissão reembolsada',
          message: `Uma comissão de $${Number(commission.commission_amount).toFixed(2)} foi reembolsada ao cliente e cancelada do seu saldo.`,
          metadata: { commission_id: commission.id, invoice_id: invoiceId, refund_amount: refundAmount },
        })

      // 2d. Auditoria.
      await supabase
        .from('affiliate.audit_logs')
        .insert({
          action: 'COMMISSION_REFUNDED',
          reason: 'Reembolso Stripe processado via webhook',
          metadata: { commission_id: commission.id, invoice_id: invoiceId, previous_status: previousStatus, refund_amount: refundAmount },
        })

      console.log(`[stripe-to-affiliate] Commission ${commission.id} marked REFUNDED (was ${previousStatus}), invoice ${invoiceId}`)
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (err) {
    console.error('[stripe-to-affiliate] Error:', err.message)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
})
