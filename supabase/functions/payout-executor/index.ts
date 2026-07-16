// Payout Executor — ETAPA 3: Secure version
// Fixes: auth admin verification, state machine, idempotency, PayPal mock gating
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function isUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── 1. Authentication: verify caller's JWT ──────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authorization header required' }, 401);
  }
  const token = authHeader.slice(7);

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let payoutId: string;
  try {
    const body = await req.json();
    payoutId = body.payoutId;
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  if (!payoutId || typeof payoutId !== 'string' || !isUUID(payoutId)) {
    return jsonResponse({ error: 'Valid payoutId (UUID) is required' }, 400);
  }

  // ── 3. Create clients ────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[payout-executor] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  // User-scoped client (for JWT verification via getUser)
  const userClient = (anonKey ?? serviceRoleKey) && createClient(
    supabaseUrl,
    anonKey ?? serviceRoleKey,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  // Admin client (service_role bypasses RLS)
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  // ── 4. Verify JWT and get user ───────────────────────────────────────────
  const { data: { user }, error: userError } = await userClient.auth.getUser();
  if (userError || !user) {
    return jsonResponse({ error: 'Invalid or expired token' }, 401);
  }

  // ── 5. Authorization: check admin role ───────────────────────────────────
  const { data: isAdmin, error: roleError } = await adminClient.rpc('has_role', {
    _user_id: user.id,
    _role: 'admin',
  });

  if (roleError || !isAdmin) {
    console.warn(`[payout-executor] Non-admin user ${user.id} attempted payout execution`);
    return jsonResponse({ error: 'Admin access required' }, 403);
  }

  // ── 6. State machine: atomically lock payout for processing ─────────────
  //    Conditional UPDATE: only proceed if status is REQUESTED or APPROVED.
  //    Returns 0 rows if already processing/executed/not found.
  const { data: lockResult, error: lockError } = await adminClient
    .from('finance.payout_requests')
    .update({
      status: 'PROCESSING',
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId)
    .in('status', ['REQUESTED', 'APPROVED'])
    .select('id, amount, affiliate_id, paypal_email_snapshot, paypal_payout_batch_id');

  if (lockError) {
    console.error('[payout-executor] Lock query error:', lockError);
    return jsonResponse({ error: 'Failed to lock payout' }, 500);
  }

  // ── 7. Idempotency: check if already executed ────────────────────────────
  if (!lockResult || lockResult.length === 0) {
    const { data: existingPayout } = await adminClient
      .from('finance.payout_requests')
      .select('status')
      .eq('id', payoutId)
      .maybeSingle();

    if (existingPayout?.status === 'EXECUTED' || existingPayout?.status === 'PAID') {
      console.log(`[payout-executor] Payout ${payoutId} already executed, returning idempotent success`);
      return jsonResponse({ success: true, idempotent: true, payoutId, status: existingPayout.status }, 200);
    }

    if (existingPayout?.status === 'PROCESSING') {
      console.warn(`[payout-executor] Payout ${payoutId} is already being processed by another request`);
      return jsonResponse({ error: 'Payout is currently being processed' }, 409);
    }

    if (existingPayout?.status === 'FAILED') {
      console.warn(`[payout-executor] Payout ${payoutId} previously failed, cannot re-execute`);
      return jsonResponse({ error: 'Payout previously failed. Reset to REQUESTED before retrying.' }, 409);
    }

    console.warn(`[payout-executor] Payout ${payoutId} not found`);
    return jsonResponse({ error: 'Payout not found' }, 404);
  }

  const payout = lockResult[0];

  // ── 8. Execute PayPal payout ────────────────────────────────────────────
  const isMockMode = Deno.env.get('PAYPAL_MOCK') !== 'false';

  let batchId: string;

  if (isMockMode) {
    console.log(`[payout-executor] MOCK MODE: Simulating PayPal payout to ${payout.paypal_email_snapshot} for $${payout.amount} (affiliate: ${payout.affiliate_id})`);
    batchId = `MOCK_${Date.now()}_${payout.id.slice(0, 8)}`;
  } else {
    // Real PayPal integration is not yet implemented.
    // Roll back to FAILED so the payout can be retried later.
    console.error('[payout-executor] Real PayPal integration not implemented. Set PAYPAL_MOCK=true (default) to use mock mode, or implement the PayPal API call here.');

    await adminClient
      .from('finance.payout_requests')
      .update({ status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', payoutId);

    return jsonResponse({ error: 'PayPal integration not configured. Set PAYPAL_MOCK=true (default) or implement real PayPal API call.' }, 500);
  }

  // ── 9. Finalize payout: set status to EXECUTED ───────────────────────────
  const { error: finalizeError } = await adminClient
    .from('finance.payout_requests')
    .update({
      status: 'EXECUTED',
      paypal_payout_batch_id: batchId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', payoutId);

  if (finalizeError) {
    console.error('[payout-executor] Failed to set status to EXECUTED:', finalizeError);
    // Try to set FAILED so it can be retried
    await adminClient
      .from('finance.payout_requests')
      .update({ status: 'FAILED', updated_at: new Date().toISOString() })
      .eq('id', payoutId);
    return jsonResponse({ error: 'Failed to finalize payout' }, 500);
  }

  // ── 10. Record DEBIT in ledger (accounting loop closure) ────────────────
  //    The unique partial index idx_ledger_payout_unique on (reference_id)
  //    WHERE reference_type='PAYOUT' prevents duplicate DEBIT entries at the
  //    DB level. This is defense-in-depth — the lock in step 6 already
  //    prevents double execution.
  const { error: ledgerError } = await adminClient
    .from('finance.ledger_entries')
    .insert({
      affiliate_id: payout.affiliate_id,
      amount: payout.amount,
      entry_type: 'DEBIT',
      reference_type: 'PAYOUT',
      reference_id: payout.id,
      description: `PayPal Payout to ${payout.paypal_email_snapshot} (batch: ${batchId})`,
    });

  if (ledgerError) {
    // Check if it's a duplicate key violation (idempotency kicked in)
    if (ledgerError.code === '23505') {
      console.log(`[payout-executor] Ledger entry already exists for payout ${payoutId} (duplicate key — idempotent)`);
    } else {
      // Non-duplicate error — log it but don't fail the payout
      // The payout was already marked EXECUTED, so the ledger can be reconciled later
      console.error('[payout-executor] Ledger insert failed (non-blocking):', ledgerError);
    }
  }

  console.log(`[payout-executor] Payout ${payoutId} executed successfully. Batch: ${batchId}, Amount: $${payout.amount}`);

  return jsonResponse({
    success: true,
    idempotent: false,
    payoutId,
    batchId,
    amount: payout.amount,
    status: 'EXECUTED',
  }, 200);

});