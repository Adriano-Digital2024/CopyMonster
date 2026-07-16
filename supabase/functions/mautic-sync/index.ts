// Mautic Sync — ETAPA 5: Shared-secret auth + sanitized errors + reduced PII logs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { decryptToken, encryptToken } from "../_shared/mautic-crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ── Auth: timing-safe comparison (same pattern as meta-token-refresh) ─────
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

function isAuthorized(token: string): { internal: boolean; admin: boolean } {
  const internalSecret = Deno.env.get('INTERNAL_WEBHOOK_SECRET') ?? '';
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
  return {
    internal: internalSecret.length > 0 && timingSafeEqual(token, internalSecret),
    admin: serviceRoleKey.length > 0 && timingSafeEqual(token, serviceRoleKey),
  };
}

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}

const planMap: Record<string, string> = {
  free: 'Free',
  starter: 'Starter',
  pro: 'Pro',
  legend: 'Legend',
};

interface MauticTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: string | null;
}

async function logSync(
  adminSupabase: SupabaseClient,
  entry: {
    email?: string | null;
    event_type: string;
    status: string;
    http_status?: number | null;
    mautic_contact_id?: number | null;
    error?: string | null;
  }
) {
  try {
    await adminSupabase.from('mautic_sync_log').insert(entry);
  } catch (e) {
    console.error('[mautic-sync] Failed to write audit log:', (e as Error).message);
  }
}

async function getDecryptedToken(adminSupabase: SupabaseClient, encryptionKey: string): Promise<MauticTokenData | null> {
  const { data: tokenRow, error: tokenError } = await adminSupabase
    .from('mautic_tokens')
    .select('encrypted_access_token, encrypted_refresh_token, expires_at')
    .eq('id', 'primary')
    .single();

  if (tokenError || !tokenRow) {
    console.error('[mautic-sync] Failed to retrieve Mautic tokens');
    return null;
  }

  const accessToken = await decryptToken(tokenRow.encrypted_access_token, encryptionKey);
  const refreshToken = await decryptToken(tokenRow.encrypted_refresh_token, encryptionKey);

  if (!accessToken || !refreshToken) {
    console.error('[mautic-sync] Failed to decrypt tokens');
    return null;
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: tokenRow.expires_at,
  };
}

async function refreshAccessToken(
  adminSupabase: SupabaseClient,
  mauticBaseUrl: string,
  mauticClientId: string,
  mauticClientSecret: string,
  refreshToken: string,
  encryptionKey: string
): Promise<string | null> {
  const response = await fetch(`${mauticBaseUrl}/oauth/v2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      grant_type: 'refresh_token',
      client_id: mauticClientId,
      client_secret: mauticClientSecret,
      refresh_token: refreshToken,
    }),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    console.error('[mautic-sync] Token refresh failed');
    return null;
  }

  const newAccessToken = data.access_token;
  const newRefreshToken = data.refresh_token || refreshToken;
  const expiresIn = data.expires_in;
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  let encryptedAccess: string;
  let encryptedRefresh: string;
  try {
    encryptedAccess = await encryptToken(newAccessToken, encryptionKey);
    encryptedRefresh = await encryptToken(newRefreshToken, encryptionKey);
  } catch (encryptError) {
    console.error('[mautic-sync] Failed to encrypt refreshed tokens');
    return null;
  }

  const { error: updateError } = await adminSupabase
    .from('mautic_tokens')
    .update({
      encrypted_access_token: encryptedAccess,
      encrypted_refresh_token: encryptedRefresh,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 'primary');

  if (updateError) {
    console.error('[mautic-sync] Failed to store refreshed tokens');
    return null;
  }

  return newAccessToken;
}

async function getMauticContactByEmail(mauticBaseUrl: string, accessToken: string, email: string): Promise<{ id: number } | null> {
  const searchUrl = `${mauticBaseUrl}/api/contacts?search=${encodeURIComponent(`email:${email}`)}`;

  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    console.error(`[mautic-sync] Failed to search contact by email: ${response.status}`);
    return null;
  }

  const data = await response.json();
  const contacts = data.contacts || {};
  const contactIds = Object.keys(contacts);

  if (contactIds.length === 0) {
    return null;
  }

  const contact = contacts[contactIds[0]];
  return { id: contact.id };
}

async function createMauticContact(mauticBaseUrl: string, accessToken: string, payload: Record<string, unknown>): Promise<boolean> {
  const response = await fetch(`${mauticBaseUrl}/api/contacts/new`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

async function updateMauticContact(mauticBaseUrl: string, accessToken: string, contactId: number, payload: Record<string, unknown>): Promise<boolean> {
  const response = await fetch(`${mauticBaseUrl}/api/contacts/${contactId}/edit`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  return response.ok;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // ── Authentication ───────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResponse({ error: 'Authorization required' }, 401);
  }
  const token = authHeader.slice(7);
  const { internal, admin } = isAuthorized(token);

  if (!internal && !admin) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // ── Environment ─────────────────────────────────────────────────────────
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const mauticBaseUrl = Deno.env.get('MAUTIC_BASE_URL')!;
  const mauticClientId = Deno.env.get('MAUTIC_CLIENT_ID')!;
  const mauticClientSecret = Deno.env.get('MAUTIC_CLIENT_SECRET')!;
  const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

  if (!supabaseUrl || !supabaseServiceKey || !mauticBaseUrl || !mauticClientId || !mauticClientSecret || !encryptionKey) {
    console.error('[mautic-sync] Missing required environment variables');
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  const ensureAccessToken = async (forceRefresh = false): Promise<string | null> => {
    const tokenData = await getDecryptedToken(adminSupabase, encryptionKey);
    if (!tokenData) return null;
    let accessToken = tokenData.accessToken;
    const needsRefresh = forceRefresh
      || !tokenData.expiresAt
      || (new Date(tokenData.expiresAt).getTime() - Date.now() < 5 * 60 * 1000);
    if (needsRefresh) {
      const refreshed = await refreshAccessToken(
        adminSupabase, mauticBaseUrl, mauticClientId, mauticClientSecret,
        tokenData.refreshToken, encryptionKey,
      );
      if (!refreshed) return null;
      accessToken = refreshed;
    }
    return accessToken;
  };

  // ── Parse body ──────────────────────────────────────────────────────────
  let body: { type?: string; record?: { email?: string; first_name?: string; phone?: string; subscription_status?: string } };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const { type, record } = body ?? {};
  console.log(`[mautic-sync] Event type: ${type}`);

  try {
    // ---- Healthcheck ----
    if (type === 'ping') {
      const accessToken = await ensureAccessToken();
      if (!accessToken) {
        await logSync(adminSupabase, { event_type: 'ping', status: 'error', error: 'Mautic not connected or refresh failed' });
        return jsonResponse({ ok: false, error: 'Mautic not connected or refresh failed' }, 401);
      }
      const res = await fetch(`${mauticBaseUrl}/api/contacts?limit=1`, {
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Accept': 'application/json' },
      });
      await logSync(adminSupabase, {
        event_type: 'ping',
        status: res.ok ? 'success' : 'error',
        http_status: res.status,
      });
      return jsonResponse({ ok: res.ok, status: res.status }, res.ok ? 200 : 502);
    }

    // ---- Backfill (admin only) ----
    if (type === 'backfill') {
      if (!admin) {
        return jsonResponse({ error: 'Admin access required for backfill' }, 403);
      }
      const accessToken = await ensureAccessToken();
      if (!accessToken) {
        return jsonResponse({ error: 'Mautic not connected' }, 401);
      }
      const { data: profiles, error } = await adminSupabase
        .from('profiles')
        .select('email, first_name, phone, subscription_status');
      if (error || !profiles) {
        return jsonResponse({ error: 'Failed to load profiles' }, 500);
      }
      let ok = 0, fail = 0;
      for (const p of profiles) {
        if (!p.email) { fail++; continue; }
        const plan = planMap[p.subscription_status as string] || 'Free';
        const payload = { firstname: p.first_name || '', email: p.email, phone: p.phone || '', plan };
        const existing = await getMauticContactByEmail(mauticBaseUrl, accessToken, p.email);
        const success = existing
          ? await updateMauticContact(mauticBaseUrl, accessToken, existing.id, payload)
          : await createMauticContact(mauticBaseUrl, accessToken, payload);
        await logSync(adminSupabase, {
          email: p.email, event_type: 'backfill',
          status: success ? 'success' : 'error',
          mautic_contact_id: existing?.id ?? null,
        });
        success ? ok++ : fail++;
      }
      return jsonResponse({ ok: true, processed: profiles.length, success: ok, failed: fail }, 200);
    }

    // ---- Normal events ----
    if (!record?.email) {
      return jsonResponse({ error: 'Missing email' }, 400);
    }
    if (type !== 'new_user' && type !== 'plan_update') {
      return jsonResponse({ error: 'Unknown event type' }, 400);
    }

    let accessToken = await ensureAccessToken();
    if (!accessToken) {
      await logSync(adminSupabase, { email: record.email, event_type: type, status: 'error', error: 'Mautic not connected / refresh failed' });
      return jsonResponse({ error: 'Mautic not connected' }, 401);
    }

    const plan = planMap[record.subscription_status ?? ''] || 'Free';
    const contactPayload = {
      firstname: record.first_name || '',
      email: record.email,
      phone: record.phone || '',
      plan,
    };

    // Retry-on-401 wrapper
    const runWithRetry = async (op: (token: string) => Promise<Response>): Promise<Response> => {
      let res = await op(accessToken!);
      if (res.status === 401) {
        const refreshed = await ensureAccessToken(true);
        if (refreshed) {
          accessToken = refreshed;
          res = await op(accessToken);
        }
      }
      return res;
    };

    let success = false;
    let httpStatus: number | null = null;
    let contactId: number | null = null;
    let lastError: string | null = null;

    if (type === 'new_user') {
      const res = await runWithRetry((tok) =>
        fetch(`${mauticBaseUrl}/api/contacts/new`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(contactPayload),
        })
      );
      httpStatus = res.status;
      const txt = await res.text();
      success = res.ok;
      if (!success) lastError = txt.substring(0, 500);
      else {
        try { contactId = JSON.parse(txt)?.contact?.id ?? null; } catch { /* ignore */ }
      }
    } else {
      const existing = await getMauticContactByEmail(mauticBaseUrl, accessToken, record.email);
      if (existing) {
        contactId = existing.id;
        const res = await runWithRetry((tok) =>
          fetch(`${mauticBaseUrl}/api/contacts/${existing.id}/edit`, {
            method: 'PATCH',
            headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(contactPayload),
          })
        );
        httpStatus = res.status;
        const txt = await res.text();
        success = res.ok;
        if (!success) lastError = txt.substring(0, 500);
      } else {
        const res = await runWithRetry((tok) =>
          fetch(`${mauticBaseUrl}/api/contacts/new`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(contactPayload),
          })
        );
        httpStatus = res.status;
        const txt = await res.text();
        success = res.ok;
        if (!success) lastError = txt.substring(0, 500);
        else {
          try { contactId = JSON.parse(txt)?.contact?.id ?? null; } catch { /* ignore */ }
        }
      }
    }

    await logSync(adminSupabase, {
      email: record.email,
      event_type: type,
      status: success ? 'success' : 'error',
      http_status: httpStatus,
      mautic_contact_id: contactId,
      error: lastError,
    });

    if (!success) {
      return jsonResponse({ error: 'Mautic API error', http_status: httpStatus }, 502);
    }

    return jsonResponse({ success: true, type, plan, contact_id: contactId, provider: 'mautic' }, 200);
  } catch (error) {
    console.error('[mautic-sync] Unexpected error:', (error as Error).message);
    try {
      await logSync(adminSupabase, {
        email: record?.email ?? null,
        event_type: type ?? 'unknown',
        status: 'error',
        error: (error as Error).message.substring(0, 500),
      });
    } catch { /* ignore */ }
    return jsonResponse({ error: 'Internal server error' }, 500);
  }
});