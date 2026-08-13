// =============================================================================
// ETAPA 1: approve-commission — admin valida o crédito de uma comissão.
// =============================================================================
// Fluxo: PENDING_VALIDATION → ELIGIBLE  +  CREDIT no ledger (transação
// atômica guardada pelos policies admin FOR ALL + unique partial index
// idx_ledger_commission_unique).
//
// Auth: Bearer JWT. Verificação de admin via has_role RPC (mesmo estilo
// do payout-executor). Não aceita anônimos.
//
// Body:
//   { commissionId: string (uuid), action: 'approve' | 'reject' }
//
// Retorno:
//   200 { ok: true, status: 'ELIGIBLE' | 'CANCELLED' }
//   400/403/404/409 com { error }
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || 'https://copymonster.me'

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // 1. Auth: Bearer JWT obrigatório.
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
      console.error('[approve-commission] Missing SUPABASE_URL / keys')
      return new Response(
        JSON.stringify({ error: 'Server misconfiguration. Please contact support.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // user-scoped client só para getUser (verifica JWT server-side)
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    })

    // admin client (service role, bypasses RLS — apropriado, auth admin checado antes)
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // 2. Verifica JWT.
    const { data: { user }, error: userError } = await userClient.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // 3. Authorization: administração via has_role RPC (igual payout-executor).
    const { data: isAdmin, error: roleError } = await adminClient.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    })
    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 4. Parse body.
    const { commissionId, action } = await req.json()
    if (!commissionId || !UUID_RE.test(commissionId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid or missing commissionId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }
    if (action !== 'approve' && action !== 'reject') {
      return new Response(
        JSON.stringify({ error: "action must be 'approve' or 'reject'" }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 5. Carrega a comissão para validar o estado atual e idempotência.
    const { data: commission, error: fetchError } = await adminClient
      .from('affiliate.commissions')
      .select('id, affiliate_id, commission_amount, status, stripe_event_id')
      .eq('id', commissionId)
      .maybeSingle()

    if (fetchError) {
      console.error('[approve-commission] fetch error:', fetchError)
      return new Response(
        JSON.stringify({ error: 'Failed to load commission' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    if (!commission) {
      return new Response(
        JSON.stringify({ error: 'Commission not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Permite apenas a partir de PENDING_VALIDATION.
    // Idempotente: se já está em estado final, retorna OK sem refazer.
    if (action === 'approve') {
      if (commission.status === 'ELIGIBLE') {
        return new Response(
          JSON.stringify({ ok: true, status: 'ELIGIBLE', message: 'already approved' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
      }
      if (commission.status !== 'PENDING_VALIDATION') {
        return new Response(
          JSON.stringify({ error: `Commission is not PENDING_VALIDATION (current: ${commission.status})` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        )
      }

      // 5a. UPDATE commission → ELIGIBLE.
      const { error: updateError } = await adminClient
        .from('affiliate.commissions')
        .update({ status: 'ELIGIBLE', updated_at: new Date().toISOString() })
        .eq('id', commissionId)
        .eq('status', 'PENDING_VALIDATION') // guard atômico (optimistic locking)

      if (updateError) {
        console.error('[approve-commission] update error:', updateError)
        return new Response(
          JSON.stringify({ error: 'Failed to approve commission' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }

      // 5b. INSERT CREDIT no ledger (idempotente via idx_ledger_commission_unique).
      //     reference_id = commission.id. Duplicate-key (23505) = já creditado.
      const { error: ledgerError } = await adminClient
        .from('finance.ledger_entries')
        .insert({
          affiliate_id: commission.affiliate_id,
          amount: Number(commission.commission_amount),
          entry_type: 'CREDIT',
          reference_type: 'COMMISSION',
          reference_id: commission.id,
          description: `Crédito de comissão validado (${commission.stripe_event_id})`,
        })

      if (ledgerError) {
        // 23505 = violação do unique index = idempotente (já existia).
        // É um estado legítimo: o UPDATE para ELIGIBLE já aconteceu, o CREDIT
        // já estava lá de uma execução anterior parcial. Loga e segue.
        if (ledgerError.code !== '23505') {
          console.error('[approve-commission] ledger insert error:', ledgerError)
          // CRÍTICO: o afiliado ganhou status ELIGIBLE mas sem CREDIT no
          // ledger → saldo não refletirá este crédito. Avitamos o admin.
          return new Response(
            JSON.stringify({
              error: 'Commission approved but ledger CREDIT failed. Manual reconciliation required.',
              ledger_error: ledgerError.message,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }
        console.log('[approve-commission] CREDIT already exists (idempotent), skipping insert')
      }

      // 5c. Audit trail.
      await adminClient.from('affiliate.audit_logs').insert({
        action: 'COMMISSION_APPROVAL',
        reason: 'Crédito validado pelo administrador',
        metadata: { commission_id: commissionId, amount: Number(commission.commission_amount) },
      })

      console.log(`[approve-commission] Commission ${commissionId} approved + CREDIT inserted`)
      return new Response(
        JSON.stringify({ ok: true, status: 'ELIGIBLE' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // action === 'reject'
    if (commission.status === 'CANCELLED') {
      return new Response(
        JSON.stringify({ ok: true, status: 'CANCELLED', message: 'already rejected' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
    if (commission.status !== 'PENDING_VALIDATION') {
      return new Response(
        JSON.stringify({ error: `Commission is not PENDING_VALIDATION (current: ${commission.status})` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
      )
    }

    const { error: rejectError } = await adminClient
      .from('affiliate.commissions')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', commissionId)
      .eq('status', 'PENDING_VALIDATION')

    if (rejectError) {
      console.error('[approve-commission] reject error:', rejectError)
      return new Response(
        JSON.stringify({ error: 'Failed to reject commission' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    await adminClient.from('affiliate.audit_logs').insert({
      action: 'COMMISSION_REJECTION',
      reason: 'Crédito rejeitado pelo administrador',
      metadata: { commission_id: commissionId, amount: Number(commission.commission_amount) },
    })

    console.log(`[approve-commission] Commission ${commissionId} rejected`)
    return new Response(
      JSON.stringify({ ok: true, status: 'CANCELLED' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    console.error('[approve-commission] Error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})