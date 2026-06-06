import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const META_APP_SECRET = Deno.env.get('META_APP_SECRET')!
const META_WEBHOOK_VERIFY_TOKEN = Deno.env.get('META_WEBHOOK_VERIFY_TOKEN') ?? ''

function b64urlDecode(input: string): Uint8Array {
  const pad = input.length % 4 === 0 ? '' : '='.repeat(4 - (input.length % 4))
  const b64 = (input + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a[i] ^ b[i]
  return r === 0
}

async function hmacSha256(secret: string, data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data))
  return new Uint8Array(sig)
}

async function parseSignedRequest(signedRequest: string): Promise<any | null> {
  const parts = signedRequest.split('.')
  if (parts.length !== 2) return null
  const [encodedSig, encodedPayload] = parts
  const expected = await hmacSha256(META_APP_SECRET, encodedPayload)
  const got = b64urlDecode(encodedSig)
  if (!constantTimeEqual(expected, got)) return null
  try {
    const json = new TextDecoder().decode(b64urlDecode(encodedPayload))
    return JSON.parse(json)
  } catch { return null }
}

async function logEvent(admin: any, user_id: string | null, event_type: string, details: any) {
  if (!user_id) { console.log('[meta-webhook]', event_type, details); return }
  try { await admin.from('integration_logs').insert({ user_id, provider: 'meta', event_type, details }) }
  catch (e) { console.error('[meta-webhook] log insert failed', (e as Error).message) }
}

async function resolveUserId(admin: any, metaUserId: string): Promise<string | null> {
  const { data } = await admin.from('user_integrations')
    .select('user_id').eq('provider', 'meta').eq('meta_user_id', metaUserId).maybeSingle()
  return data?.user_id ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const url = new URL(req.url)
  const action = url.searchParams.get('action') ?? ''

  // GET — verification handshake (optional, for Graph API webhook subscriptions if ever used)
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const verifyToken = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    if (mode && verifyToken && META_WEBHOOK_VERIFY_TOKEN && verifyToken === META_WEBHOOK_VERIFY_TOKEN) {
      return new Response(challenge ?? '', { status: 200, headers: { ...corsHeaders, 'Content-Type': 'text/plain' } })
    }
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders })
  }

  // POST — Platform Webhook (signed_request, form-urlencoded)
  let signedRequest = ''
  try {
    const form = await req.formData()
    signedRequest = String(form.get('signed_request') ?? '')
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid form body' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!signedRequest) {
    return new Response(JSON.stringify({ error: 'Missing signed_request' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const payload = await parseSignedRequest(signedRequest)
  if (!payload) {
    console.warn('[meta-webhook] invalid signed_request')
    return new Response(JSON.stringify({ error: 'Invalid signature' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE)
  const metaUserId = String(payload.user_id ?? '')
  if (!metaUserId) {
    return new Response(JSON.stringify({ error: 'Missing user_id' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const userId = await resolveUserId(admin, metaUserId)

  // DEAUTHORIZE
  if (action === 'deauthorize') {
    if (userId) {
      await admin.from('user_integrations')
        .update({ status: 'permission_revoked', disconnected_at: new Date().toISOString() })
        .eq('provider', 'meta').eq('meta_user_id', metaUserId)
      await logEvent(admin, userId, 'deauthorized', { meta_user_id: metaUserId })
    } else {
      console.log('[meta-webhook] deauthorize for unknown meta_user_id', metaUserId)
    }
    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // DATA DELETION REQUEST
  if (action === 'data-deletion') {
    const confirmationCode = String(payload.confirmation_code ?? crypto.randomUUID())

    if (userId) {
      await admin.from('ads_data').delete().eq('user_id', userId)
      await admin.from('instagram_data').delete().eq('user_id', userId)
      await admin.from('creative_classifications').delete().eq('user_id', userId)
      await admin.from('integration_logs').delete().eq('user_id', userId).eq('provider', 'meta')
      await admin.from('user_integrations').delete().eq('user_id', userId).eq('provider', 'meta')
      console.log('[meta-webhook] data deletion completed', { userId, confirmationCode })
    } else {
      console.log('[meta-webhook] data deletion for unknown meta_user_id', metaUserId)
    }

    const statusUrl = `https://copymonster.me/legal/data-deletion-status?code=${encodeURIComponent(confirmationCode)}`
    return new Response(JSON.stringify({ url: statusUrl, confirmation_code: confirmationCode }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ error: 'Unknown action' }), {
    status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})