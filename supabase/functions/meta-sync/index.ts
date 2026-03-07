import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const COOLDOWN_MINUTES = 15;
const TOKEN_EXPIRY_WARNING_DAYS = 7;

// Meta API error codes
const META_ERROR_CODES = {
  INVALID_TOKEN: 190,
  PERMISSION_REMOVED: 10,
  RATE_LIMIT: 4,
  APP_NOT_INSTALLED: 102,
};

function classifyMetaError(error: any): { status: string; eventType: string } | null {
  const code = error?.code;
  const subcode = error?.error_subcode;

  if (code === META_ERROR_CODES.INVALID_TOKEN || subcode === 463 || subcode === 467) {
    return { status: 'token_expired', eventType: 'token_expired' };
  }
  if (code === META_ERROR_CODES.PERMISSION_REMOVED) {
    return { status: 'permission_revoked', eventType: 'permission_revoked' };
  }
  if (code === META_ERROR_CODES.RATE_LIMIT) {
    return { status: 'rate_limited', eventType: 'rate_limited' };
  }
  if (code === META_ERROR_CODES.APP_NOT_INSTALLED) {
    return { status: 'permission_revoked', eventType: 'permission_revoked' };
  }
  return null;
}

async function updateIntegrationStatus(adminSupabase: any, userId: string, status: string) {
  await adminSupabase
    .from('user_integrations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('provider', 'meta');
}

async function fetchCreativeData(adIds: string[], accessToken: string): Promise<Map<string, { body: string | null; title: string | null }>> {
  const creativeMap = new Map();
  // Batch in groups of 50 to avoid URL length issues
  const batches = [];
  for (let i = 0; i < adIds.length; i += 50) {
    batches.push(adIds.slice(i, i + 50));
  }

  for (const batch of batches) {
    try {
      const ids = batch.join(',');
      const url = `https://graph.facebook.com/v21.0/?ids=${ids}&fields=creative{body,title,link_url}&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!data.error) {
        for (const [adId, adData] of Object.entries(data)) {
          const creative = (adData as any)?.creative;
          if (creative) {
            creativeMap.set(adId, {
              body: creative.body || null,
              title: creative.title || null,
            });
          }
        }
      }
    } catch (e) {
      console.error(`[meta-sync] Creative fetch error for batch`);
    }
  }

  return creativeMap;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const encryptionKey = Deno.env.get('ENCRYPTION_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const userId = userData.user.id;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check integration exists and is connected
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('provider', 'meta')
      .in('status', ['connected'])
      .single();

    if (!integration) {
      return new Response(JSON.stringify({ error: 'not_connected' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Determine which syncs to run based on stored scopes
    const scopes: string[] = integration.scopes || [];
    const hasAdScopes = scopes.some(s => ['ads_management', 'ads_read'].includes(s));
    const hasIgScopes = scopes.some(s => ['instagram_basic', 'instagram_manage_insights'].includes(s));
    console.log(`[meta-sync] User ${userId} scopes: ${scopes.join(', ')} | hasAdScopes=${hasAdScopes} hasIgScopes=${hasIgScopes}`);

    // Check token expiration BEFORE calling Meta API
    if (integration.token_expires_at) {
      const expiresAt = new Date(integration.token_expires_at).getTime();
      const now = Date.now();
      const daysUntilExpiry = (expiresAt - now) / (1000 * 60 * 60 * 24);

      if (daysUntilExpiry <= 0) {
        // Token is expired
        await updateIntegrationStatus(adminSupabase, userId, 'token_expired');
        await adminSupabase.from('integration_logs').insert({
          user_id: userId, provider: 'meta', event_type: 'token_expired',
          details: { reason: 'token_expired', expired_at: integration.token_expires_at }
        });
        return new Response(JSON.stringify({ error: 'token_expired' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      if (daysUntilExpiry <= TOKEN_EXPIRY_WARNING_DAYS) {
        // Token expiring soon — log warning but continue sync
        await adminSupabase.from('integration_logs').insert({
          user_id: userId, provider: 'meta', event_type: 'token_expiring_soon',
          details: { days_remaining: Math.ceil(daysUntilExpiry), expires_at: integration.token_expires_at }
        });
      }
    }

    // Check cooldown
    if (integration.last_synced_at) {
      const lastSync = new Date(integration.last_synced_at).getTime();
      const now = Date.now();
      const minutesSinceSync = (now - lastSync) / (1000 * 60);
      if (minutesSinceSync < COOLDOWN_MINUTES) {
        const remainingMinutes = Math.ceil(COOLDOWN_MINUTES - minutesSinceSync);
        await adminSupabase.from('integration_logs').insert({
          user_id: userId, provider: 'meta', event_type: 'sync_rejected',
          details: { reason: 'cooldown', remaining_minutes: remainingMinutes }
        });
        return new Response(JSON.stringify({ error: 'cooldown', remaining_minutes: remainingMinutes }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get decrypted token
    const { data: accessToken } = await adminSupabase.rpc('get_decrypted_token' as any, {
      p_user_id: userId, p_provider: 'meta', p_encryption_key: encryptionKey,
    });

    if (!accessToken) {
      return new Response(JSON.stringify({ error: 'token_not_found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let adsCount = 0;
    let igCount = 0;
    let hasFatalError = false;

    // Sync Ads Data
    if (integration.meta_ad_account_id && hasAdScopes && !hasFatalError) {
      try {
        // Step 1: List campaigns directly (not insights) to confirm account has campaigns
        const campaignsListUrl = `https://graph.facebook.com/v21.0/${integration.meta_ad_account_id}/campaigns?fields=id,name,status,objective&limit=100&access_token=${accessToken}`;
        const campaignsListRes = await fetch(campaignsListUrl);
        const campaignsListRaw = await campaignsListRes.text();
        console.log(`[meta-sync] Campaigns list response (first 2000 chars): ${campaignsListRaw.substring(0, 2000)}`);
        const campaignsListData = JSON.parse(campaignsListRaw);
        const campaignCount = campaignsListData.data?.length ?? 0;
        console.log(`[meta-sync] Found ${campaignCount} campaigns in account ${integration.meta_ad_account_id}`);
        if (campaignsListData.data) {
          campaignsListData.data.slice(0, 10).forEach((c: any) => {
            console.log(`[meta-sync]   Campaign: ${c.name} | status: ${c.status} | id: ${c.id}`);
          });
        }

        // Step 2: Fetch insights with date_preset=maximum (all historical data)
        const insightsUrl = `https://graph.facebook.com/v21.0/${integration.meta_ad_account_id}/insights?fields=campaign_name,campaign_id,adset_name,adset_id,ad_name,ad_id,impressions,clicks,spend,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,action_values&level=ad&date_preset=maximum&limit=500&access_token=${accessToken}`;

        console.log(`[meta-sync] Fetching ads insights for account ${integration.meta_ad_account_id} with date_preset=maximum`);
        const adsResponse = await fetch(insightsUrl);
        const adsRawText = await adsResponse.text();
        console.log(`[meta-sync] Ads API raw response (first 2000 chars): ${adsRawText.substring(0, 2000)}`);
        const adsData = JSON.parse(adsRawText);
        console.log(`[meta-sync] Ads API response status: ${adsResponse.status}, has error: ${!!adsData.error}, data count: ${adsData.data?.length ?? 'N/A'}`);

        // If level=ad returns 0 results, try account-level (no level param) as fallback
        if (!adsData.error && (!adsData.data || adsData.data.length === 0)) {
          console.log(`[meta-sync] No ad-level data found. Trying account-level fallback (no level param)...`);
          const accountUrl = `https://graph.facebook.com/v21.0/${integration.meta_ad_account_id}/insights?fields=impressions,spend,clicks&date_preset=maximum&limit=10&access_token=${accessToken}`;
          const accountRes = await fetch(accountUrl);
          const accountRaw = await accountRes.text();
          console.log(`[meta-sync] Account-level fallback response (first 2000 chars): ${accountRaw.substring(0, 2000)}`);
        }

        if (adsData.error) {
          console.log(`[meta-sync] Ads API error detail: ${JSON.stringify(adsData.error)}`);
        }

        if (adsData.error) {
          const classification = classifyMetaError(adsData.error);
          if (classification) {
            await updateIntegrationStatus(adminSupabase, userId, classification.status);
            await adminSupabase.from('integration_logs').insert({
              user_id: userId, provider: 'meta', event_type: classification.eventType,
              details: { error: adsData.error.message, code: adsData.error.code, endpoint: 'ads_insights' }
            });
            hasFatalError = true;
            return new Response(JSON.stringify({ error: classification.status }), {
              status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          console.error(`[meta-sync] Ads API error for user ${userId}: ${adsData.error.message}`);
          await adminSupabase.from('integration_logs').insert({
            user_id: userId, provider: 'meta', event_type: 'api_error',
            details: { error: adsData.error.message, code: adsData.error.code, endpoint: 'ads_insights' }
          });
        } else if (adsData.data) {
          // Fetch creative data for all ad IDs
          const adIds = [...new Set(adsData.data.map((row: any) => row.ad_id).filter(Boolean))];
          const creativeMap = adIds.length > 0 ? await fetchCreativeData(adIds as string[], accessToken) : new Map();

          const adsRows = adsData.data.map((row: any) => {
            const actions = row.actions || [];
            const costPerAction = row.cost_per_action_type || [];
            const actionValues = row.action_values || [];

            const getAction = (type: string) => {
              const a = actions.find((a: any) => a.action_type === type);
              return a ? parseInt(a.value) : 0;
            };
            const getActionValue = (type: string) => {
              const v = actionValues.find((v: any) => v.action_type === type);
              return v ? parseFloat(v.value) : 0;
            };

            const spend = parseFloat(row.spend || '0');
            const viewContent = getAction('offsite_conversion.fb_pixel_view_content');
            const initiateCheckout = getAction('offsite_conversion.fb_pixel_initiate_checkout');
            const purchases = getAction('offsite_conversion.fb_pixel_purchase');
            const purchaseValue = getActionValue('offsite_conversion.fb_pixel_purchase');

            const creative = creativeMap.get(row.ad_id);

            return {
              user_id: userId,
              campaign_name: row.campaign_name,
              campaign_id: row.campaign_id,
              adset_name: row.adset_name,
              adset_id: row.adset_id,
              ad_name: row.ad_name,
              ad_id: row.ad_id,
              impressions: parseInt(row.impressions || '0'),
              clicks: parseInt(row.clicks || '0'),
              spend,
              ctr: parseFloat(row.ctr || '0'),
              cpc: parseFloat(row.cpc || '0'),
              cpm: parseFloat(row.cpm || '0'),
              reach: parseInt(row.reach || '0'),
              frequency: parseFloat(row.frequency || '0'),
              roas: spend > 0 ? purchaseValue / spend : 0,
              view_content: viewContent,
              initiate_checkout: initiateCheckout,
              purchases,
              purchase_value: purchaseValue,
              cost_per_view_content: viewContent > 0 ? spend / viewContent : 0,
              cost_per_initiate_checkout: initiateCheckout > 0 ? spend / initiateCheckout : 0,
              cost_per_purchase: purchases > 0 ? spend / purchases : 0,
              ad_creative_body: creative?.body || null,
              ad_creative_title: creative?.title || null,
              date_range_start: row.date_start || new Date().toISOString().split('T')[0],
              date_range_end: row.date_stop || new Date().toISOString().split('T')[0],
            };
          });

          if (adsRows.length > 0) {
            // Dedup: delete old ads_data before inserting fresh results
            await adminSupabase.from('ads_data').delete().eq('user_id', userId);

            // Follow pagination to collect all pages
            let nextUrl = adsData.paging?.next;
            while (nextUrl) {
              try {
                const nextRes = await fetch(nextUrl);
                const nextData = await nextRes.json();
                if (nextData.data && nextData.data.length > 0) {
                  for (const row of nextData.data) {
                    const actions = row.actions || [];
                    const actionValues = row.action_values || [];
                    const getAction = (type: string) => { const a = actions.find((a: any) => a.action_type === type); return a ? parseInt(a.value) : 0; };
                    const getActionValue = (type: string) => { const v = actionValues.find((v: any) => v.action_type === type); return v ? parseFloat(v.value) : 0; };
                    const spend = parseFloat(row.spend || '0');
                    const viewContent = getAction('offsite_conversion.fb_pixel_view_content');
                    const initiateCheckout = getAction('offsite_conversion.fb_pixel_initiate_checkout');
                    const purchases = getAction('offsite_conversion.fb_pixel_purchase');
                    const purchaseValue = getActionValue('offsite_conversion.fb_pixel_purchase');
                    const creative = creativeMap.get(row.ad_id);
                    adsRows.push({
                      user_id: userId, campaign_name: row.campaign_name, campaign_id: row.campaign_id,
                      adset_name: row.adset_name, adset_id: row.adset_id, ad_name: row.ad_name, ad_id: row.ad_id,
                      impressions: parseInt(row.impressions || '0'), clicks: parseInt(row.clicks || '0'), spend,
                      ctr: parseFloat(row.ctr || '0'), cpc: parseFloat(row.cpc || '0'), cpm: parseFloat(row.cpm || '0'),
                      reach: parseInt(row.reach || '0'), frequency: parseFloat(row.frequency || '0'),
                      roas: spend > 0 ? purchaseValue / spend : 0, view_content: viewContent,
                      initiate_checkout: initiateCheckout, purchases, purchase_value: purchaseValue,
                      cost_per_view_content: viewContent > 0 ? spend / viewContent : 0,
                      cost_per_initiate_checkout: initiateCheckout > 0 ? spend / initiateCheckout : 0,
                      cost_per_purchase: purchases > 0 ? spend / purchases : 0,
                      ad_creative_body: creative?.body || null, ad_creative_title: creative?.title || null,
                      date_range_start: row.date_start || new Date().toISOString().split('T')[0],
                      date_range_end: row.date_stop || new Date().toISOString().split('T')[0],
                    });
                  }
                }
                nextUrl = nextData.paging?.next;
              } catch (pageErr) {
                console.error(`[meta-sync] Pagination error: ${(pageErr as Error).message}`);
                break;
              }
            }

            console.log(`[meta-sync] Total ads rows after pagination: ${adsRows.length}`);
            const { error: insertError } = await adminSupabase.from('ads_data').insert(adsRows);
            if (insertError) {
              console.error(`[meta-sync] Failed to insert ads data for user ${userId}: ${insertError.message}`);
            } else {
              adsCount = adsRows.length;
            }
          }
        }
      } catch (adsError) {
        console.error(`[meta-sync] Ads sync error for user ${userId}`);
        await adminSupabase.from('integration_logs').insert({
          user_id: userId, provider: 'meta', event_type: 'api_error',
          details: { error: (adsError as Error).message, endpoint: 'ads_sync' }
        });
      }
    }

    // Sync Instagram Data (only if scopes allow)
    if (integration.instagram_account_id && hasIgScopes && !hasFatalError) {
      console.log(`[meta-sync] Starting Instagram sync for account ${integration.instagram_account_id}`);
      try {
        const mediaUrl = `https://graph.facebook.com/v21.0/${integration.instagram_account_id}/media?fields=id,caption,media_type,permalink,timestamp,insights.metric(impressions,reach,engagement,saved,shares,plays)&limit=50&access_token=${accessToken}`;
        const igResponse = await fetch(mediaUrl);
        const igData = await igResponse.json();

        if (igData.error) {
          const classification = classifyMetaError(igData.error);
          if (classification) {
            // Do NOT update integration status for IG errors — ads may still work fine
            console.log(`[meta-sync] Instagram permission issue (non-fatal): ${igData.error.message}`);
            await adminSupabase.from('integration_logs').insert({
              user_id: userId, provider: 'meta', event_type: classification.eventType,
              details: { error: igData.error.message, code: igData.error.code, endpoint: 'instagram_media', non_fatal: true }
            });
            // Don't return here — ads may have succeeded, just stop IG sync
          } else {
            console.error(`[meta-sync] Instagram API error for user ${userId}: ${igData.error.message}`);
            await adminSupabase.from('integration_logs').insert({
              user_id: userId, provider: 'meta', event_type: 'api_error',
              details: { error: igData.error.message, code: igData.error.code, endpoint: 'instagram_media' }
            });
          }
        } else if (igData.data) {
          const igRows = igData.data.map((post: any) => {
            const insights = post.insights?.data || [];
            const getMetric = (name: string) => {
              const m = insights.find((i: any) => i.name === name);
              return m ? m.values?.[0]?.value || 0 : 0;
            };

            return {
              user_id: userId,
              post_id: post.id,
              post_type: post.media_type?.toLowerCase() || 'unknown',
              caption: post.caption || null,
              permalink: post.permalink || null,
              timestamp: post.timestamp || null,
              impressions: getMetric('impressions'),
              reach: getMetric('reach'),
              engagement: getMetric('engagement'),
              saves: getMetric('saved'),
              shares: getMetric('shares'),
              plays: getMetric('plays'),
              likes: 0,
              comments: 0,
            };
          });

          if (igRows.length > 0) {
            // Dedup: delete old instagram_data before inserting fresh results
            await adminSupabase.from('instagram_data').delete().eq('user_id', userId);
            const { error: insertError } = await adminSupabase.from('instagram_data').insert(igRows);
            if (insertError) {
              console.error(`[meta-sync] Failed to insert IG data for user ${userId}`);
            } else {
              igCount = igRows.length;
            }
          }
        }
      } catch (igError) {
        console.error(`[meta-sync] Instagram sync error for user ${userId}`);
        await adminSupabase.from('integration_logs').insert({
          user_id: userId, provider: 'meta', event_type: 'api_error',
          details: { error: (igError as Error).message, endpoint: 'instagram_sync' }
        });
      }
    }

    // Update last_synced_at
    await adminSupabase
      .from('user_integrations')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', 'meta');

    // Log sync
    await adminSupabase.from('integration_logs').insert({
      user_id: userId, provider: 'meta', event_type: 'data_synced',
      details: { ads_records: adsCount, ig_records: igCount }
    });

    console.log(`[meta-sync] Sync complete for user ${userId}: ${adsCount} ads, ${igCount} IG posts`);

    return new Response(JSON.stringify({ success: true, ads_records: adsCount, ig_records: igCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error(`[meta-sync] Unexpected error:`, (error as Error).message);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
