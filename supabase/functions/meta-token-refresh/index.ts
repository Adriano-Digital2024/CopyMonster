import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const META_APP_ID = Deno.env.get('META_APP_ID')!
const META_APP_SECRET = Deno.env.get('META_APP_SECRET')!
const ENCRYPTION_KEY = Deno.env.get('ENCRYPTION_KEY')!

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)) }

async function logEvent(admin: any, user_id: string, event_type: string, details: any) {
  try {
    await admin.from('integration_logs').insert({ user_id, provider: 'meta', event_type, details })
  } catch (e) {
    console.error('[meta-token-refresh] log insert failed', (e as Error).message)
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token || !timingSafeEqual(token, SERVICE_ROLE)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

  // Select integrations expiring within 7 days
  const cutoff = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const { data: rows, error: selErr } = await admin
    .from('user_integrations')
    .select('user_id, meta_user_id, meta_ad_account_id, instagram_account_id, scopes, token_expires_at, status')
    .eq('provider', 'meta')
    .in('status', ['connected', 'token_expired'])
    .lt('token_expires_at', cutoff)

  if (selErr) {
    console.error('[meta-token-refresh] select error', selErr.message)
    return new Response(JSON.stringify({ error: selErr.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const total = rows?.length ?? 0
  let renewed = 0, failed = 0, skipped = 0

  const batches: any[][] = []
  for (let i = 0; i < (rows ?? []).length; i += 10) batches.push(rows!.slice(i, i + 10))

  for (const batch of batches) {
    await Promise.all(batch.map(async (row) => {
      try {
        const { data: tokenStr, error: tErr } = await admin.rpc('get_decrypted_token', {
          p_user_id: row.user_id, p_provider: 'meta', p_encryption_key: ENCRYPTION_KEY,
        })
        if (tErr || !tokenStr) { skipped++; return }

        const url = new URL('https://graph.facebook.com/v21.0/oauth/access_token')
        url.searchParams.set('grant_type', 'fb_exchange_token')
        url.searchParams.set('client_id', META_APP_ID)
        url.searchParams.set('client_secret', META_APP_SECRET)
        url.searchParams.set('fb_exchange_token', tokenStr as string)

        const res = await fetch(url.toString())
        const json = await res.json()

        if (!res.ok || !json.access_token) {
          failed++
          await admin.from('user_integrations')
            .update({ status: 'token_expired', disconnected_at: new Date().toISOString() })
            .eq('user_id', row.user_id).eq('provider', 'meta')
          await logEvent(admin, row.user_id, 'token_refresh_failed', { error_code: json?.error?.code, error_message: json?.error?.message })
          return
        }

        const expiresAt = json.expires_in
          ? new Date(Date.now() + Number(json.expires_in) * 1000).toISOString()
          : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

        const { error: upErr } = await admin.rpc('upsert_user_integration', {
          p_user_id: row.user_id,
          p_provider: 'meta',
          p_access_token: json.access_token,
          p_encryption_key: ENCRYPTION_KEY,
          p_token_expires_at: expiresAt,
          p_meta_user_id: row.meta_user_id,
          p_meta_ad_account_id: row.meta_ad_account_id,
          p_instagram_account_id: row.instagram_account_id,
          p_scopes: row.scopes,
        })
        if (upErr) {
          failed++
          await logEvent(admin, row.user_id, 'token_refresh_failed', { error: upErr.message })
          return
        }
        renewed++
        await logEvent(admin, row.user_id, 'token_refreshed', { new_expires_at: expiresAt })
      } catch (e) {
        failed++
        console.error('[meta-token-refresh] item error', (e as Error).message)
      }
    }))
    await sleep(500)
  }

  return new Response(JSON.stringify({ renewed, failed, skipped, total }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})