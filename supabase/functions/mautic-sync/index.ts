import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { decryptToken, encryptToken } from "../_shared/mautic-crypto.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

async function getDecryptedToken(adminSupabase: SupabaseClient, encryptionKey: string): Promise<MauticTokenData | null> {
  const { data: tokenRow, error: tokenError } = await adminSupabase
    .from('mautic_tokens')
    .select('encrypted_access_token, encrypted_refresh_token, expires_at')
    .eq('id', 'primary')
    .single();

  if (tokenError || !tokenRow) {
    console.error('[mautic-sync] Failed to retrieve Mautic tokens:', tokenError?.message || 'No tokens found');
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
  console.log('[mautic-sync] Refreshing Mautic access token');

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
    console.error('[mautic-sync] Token refresh failed:', JSON.stringify(data));
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
    console.error('[mautic-sync] Failed to encrypt refreshed tokens:', (encryptError as Error).message);
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
    console.error('[mautic-sync] Failed to store refreshed tokens:', updateError.message);
    return null;
  }

  console.log('[mautic-sync] Access token refreshed successfully');
  return newAccessToken;
}

async function getMauticContactByEmail(mauticBaseUrl: string, accessToken: string, email: string): Promise<{ id: number } | null> {
  const response = await fetch(`${mauticBaseUrl}/api/contacts?search=${encodeURIComponent(`email:${email}`)}`, {
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[mautic-sync] Failed to create Mautic contact: ${response.status}`, errorText);
    return false;
  }

  console.log('[mautic-sync] Mautic contact created successfully');
  return true;
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

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`[mautic-sync] Failed to update Mautic contact: ${response.status}`, errorText);
    return false;
  }

  console.log('[mautic-sync] Mautic contact updated successfully');
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const mauticBaseUrl = Deno.env.get('MAUTIC_BASE_URL')!;
    const mauticClientId = Deno.env.get('MAUTIC_CLIENT_ID')!;
    const mauticClientSecret = Deno.env.get('MAUTIC_CLIENT_SECRET')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

    if (!supabaseUrl || !supabaseServiceKey || !mauticBaseUrl || !mauticClientId || !mauticClientSecret || !encryptionKey) {
      console.error('[mautic-sync] Missing required environment variables');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { type, record } = await req.json();
    console.log(`[mautic-sync] Event type: ${type}, email: ${record?.email}`);

    if (!record?.email) {
      console.error('[mautic-sync] Missing email in record');
      return new Response(JSON.stringify({ error: 'Missing email' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (type !== 'new_user' && type !== 'plan_update') {
      console.error(`[mautic-sync] Unknown event type: ${type}`);
      return new Response(JSON.stringify({ error: 'Unknown event type' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const tokenData = await getDecryptedToken(adminSupabase, encryptionKey);
    if (!tokenData) {
      return new Response(JSON.stringify({ error: 'Mautic not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let accessToken = tokenData.accessToken;

    // Refresh token if expired or about to expire (5 minute buffer)
    if (tokenData.expiresAt) {
      const expiresAt = new Date(tokenData.expiresAt).getTime();
      if (expiresAt - Date.now() < 5 * 60 * 1000) {
        const refreshedToken = await refreshAccessToken(
          adminSupabase,
          mauticBaseUrl,
          mauticClientId,
          mauticClientSecret,
          tokenData.refreshToken,
          encryptionKey
        );
        if (!refreshedToken) {
          return new Response(JSON.stringify({ error: 'Failed to refresh Mautic token' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        accessToken = refreshedToken;
      }
    }

    const plan = planMap[record.subscription_status] || 'Free';

    const contactPayload = {
      firstname: record.first_name || '',
      email: record.email,
      phone: record.phone || '',
      plan: plan,
    };

    let success = false;

    if (type === 'new_user') {
      success = await createMauticContact(mauticBaseUrl, accessToken, contactPayload);
    } else if (type === 'plan_update') {
      const existingContact = await getMauticContactByEmail(mauticBaseUrl, accessToken, record.email);
      if (existingContact) {
        success = await updateMauticContact(mauticBaseUrl, accessToken, existingContact.id, contactPayload);
      } else {
        console.log('[mautic-sync] Contact not found for plan_update, creating new contact');
        success = await createMauticContact(mauticBaseUrl, accessToken, contactPayload);
      }
    }

    if (!success) {
      return new Response(JSON.stringify({ error: 'Mautic API error' }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[mautic-sync] Successfully synced ${record.email} (type: ${type}, plan: ${plan})`);

    return new Response(JSON.stringify({ success: true, type, email: record.email, plan, provider: 'mautic' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[mautic-sync] Unexpected error:', (error as Error).message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
