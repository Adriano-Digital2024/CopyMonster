import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Classification thresholds
const MIN_IMPRESSIONS = 1000;
const MIN_SPEND = 5;
const MIN_PURCHASES_HIGH = 3;
const RATE_LIMIT_MINUTES = 15;

interface ClassificationResult {
  ad_id: string;
  classification: "high_performer" | "stable" | "underperforming" | "insufficient_data";
  score: number;
  metrics: Record<string, number>;
  previous?: string;
}

function classifyCreative(ad: Record<string, unknown>): ClassificationResult {
  const roas = Number(ad.roas) || 0;
  const ctr = Number(ad.ctr) || 0;
  const purchases = Number(ad.purchases) || 0;
  const impressions = Number(ad.impressions) || 0;
  const spend = Number(ad.spend) || 0;

  const metrics = { roas, ctr, purchases, impressions, spend };

  // Insufficient data check
  if (impressions < MIN_IMPRESSIONS || spend < MIN_SPEND) {
    return { ad_id: String(ad.ad_id), classification: "insufficient_data", score: 0, metrics };
  }

  // High Performer: ROAS > 2x AND CTR > 1.5% AND purchases >= 3
  if (roas > 2 && ctr > 1.5 && purchases >= MIN_PURCHASES_HIGH) {
    const score = roas * 10 + ctr * 5 + purchases;
    return { ad_id: String(ad.ad_id), classification: "high_performer", score, metrics };
  }

  // Underperforming: ROAS < 1x OR CTR < 0.5% OR (zero conversions with spend > threshold)
  if (roas < 1 || ctr < 0.5 || (purchases === 0 && spend > 10)) {
    const score = Math.max(0, roas * 5 + ctr * 3);
    return { ad_id: String(ad.ad_id), classification: "underperforming", score, metrics };
  }

  // Stable: everything else
  const score = roas * 7 + ctr * 4 + purchases * 0.5;
  return { ad_id: String(ad.ad_id), classification: "stable", score, metrics };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth - manual JWT validation
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceKey);

    // Rate limit: check last analysis in intelligence_logs
    const { data: lastLog } = await adminClient
      .from("intelligence_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (lastLog) {
      const lastTime = new Date(lastLog.created_at).getTime();
      const now = Date.now();
      const diffMinutes = (now - lastTime) / 60000;
      if (diffMinutes < RATE_LIMIT_MINUTES) {
        const waitMinutes = Math.ceil(RATE_LIMIT_MINUTES - diffMinutes);
        return new Response(
          JSON.stringify({ error: "rate_limited", wait_minutes: waitMinutes }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Fetch ads_data (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const { data: adsData } = await adminClient
      .from("ads_data")
      .select("*")
      .eq("user_id", user.id)
      .gte("date_range_start", thirtyDaysAgo)
      .order("date_range_start", { ascending: false })
      .limit(500);

    if (!adsData || adsData.length === 0) {
      return new Response(
        JSON.stringify({ error: "no_data", message: "No ads data in the last 30 days." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch previous classifications for comparison
    const { data: prevClassifications } = await adminClient
      .from("creative_classifications")
      .select("ad_id, classification")
      .eq("user_id", user.id);

    const prevMap = new Map<string, string>();
    (prevClassifications || []).forEach((c: Record<string, unknown>) => {
      prevMap.set(String(c.ad_id), String(c.classification));
    });

    // Aggregate by ad_id
    const adMap = new Map<string, Record<string, number>>();
    for (const row of adsData) {
      const adId = row.ad_id || row.id;
      const existing = adMap.get(adId) || {
        roas: 0, ctr: 0, purchases: 0, impressions: 0, spend: 0, count: 0,
        ad_creative_body: "", ad_creative_title: "",
      };
      existing.roas += Number(row.roas) || 0;
      existing.ctr += Number(row.ctr) || 0;
      existing.purchases += Number(row.purchases) || 0;
      existing.impressions += Number(row.impressions) || 0;
      existing.spend += Number(row.spend) || 0;
      existing.count += 1;
      adMap.set(adId, existing);
    }

    // Average metrics per ad
    const classResults: ClassificationResult[] = [];
    for (const [adId, agg] of adMap) {
      const avgAd = {
        ad_id: adId,
        roas: agg.count > 0 ? agg.roas / agg.count : 0,
        ctr: agg.count > 0 ? agg.ctr / agg.count : 0,
        purchases: agg.purchases,
        impressions: agg.impressions,
        spend: agg.spend,
      };
      const result = classifyCreative(avgAd);
      result.previous = prevMap.get(adId);
      classResults.push(result);
    }

    // Save classifications (upsert by ad_id)
    const classRows = classResults.map((r) => ({
      user_id: user.id,
      ad_id: r.ad_id,
      classification: r.classification,
      score: r.score,
      metrics_snapshot: r.metrics,
    }));

    // Delete old classifications for this user, then insert fresh
    await adminClient
      .from("creative_classifications")
      .delete()
      .eq("user_id", user.id);

    if (classRows.length > 0) {
      await adminClient.from("creative_classifications").insert(classRows);
    }

    // Generate suggestions for adaptive blocks based on patterns
    const highPerformers = classResults.filter((r) => r.classification === "high_performer");
    const underperformers = classResults.filter((r) => r.classification === "underperforming");

    // Fetch active DNA
    const { data: mappings } = await adminClient
      .from("positioning_mappings")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .limit(1)
      .single();

    let suggestionsGenerated = 0;
    const notifications: Array<{ title_key: string; message_key: string; action_url: string; type: string }> = [];

    if (mappings) {
      const dnaLanguage = mappings.language || "pt-BR";
      const adaptiveBlocks = [
        "block_2_pain_points",
        "block_5_awareness_stage",
        "block_6_urgency",
        "block_7_social_proof",
        "block_8_objections",
        "block_12_promises",
      ];

      // Check for existing pending suggestions to avoid duplicates
      const { data: existingSuggestions } = await adminClient
        .from("dna_update_suggestions")
        .select("block_key")
        .eq("user_id", user.id)
        .eq("mapping_id", mappings.id)
        .eq("status", "pending");

      const existingBlockKeys = new Set((existingSuggestions || []).map((s: Record<string, unknown>) => String(s.block_key)));

      const newSuggestions: Array<Record<string, unknown>> = [];

      // High performers → reinforce promises, urgency, social_proof
      if (highPerformers.length > 0) {
        const reinforceBlocks = ["block_12_promises", "block_6_urgency", "block_7_social_proof"];
        for (const blockKey of reinforceBlocks) {
          if (existingBlockKeys.has(blockKey)) continue;
          const currentValue = (mappings as Record<string, unknown>)[blockKey] as string;
          if (!currentValue) continue;

          newSuggestions.push({
            user_id: user.id,
            mapping_id: mappings.id,
            block_key: blockKey,
            current_value: currentValue,
            suggested_value: `${currentValue}\n\n[Intelligence: ${highPerformers.length} high-performing creatives detected. Consider reinforcing this element based on winning patterns.]`,
            justification: `${highPerformers.length} creatives classified as high performers with avg ROAS > 2x. Reinforcing this adaptive block can amplify results.`,
            impact_estimate: "high",
            data_source: "meta_ads",
            language: dnaLanguage,
            status: "pending",
          });
        }
      }

      // Underperformers → suggest changes to pain_points, awareness_stage, objections
      if (underperformers.length > 0) {
        const improveBlocks = ["block_2_pain_points", "block_5_awareness_stage", "block_8_objections"];
        for (const blockKey of improveBlocks) {
          if (existingBlockKeys.has(blockKey)) continue;
          const currentValue = (mappings as Record<string, unknown>)[blockKey] as string;
          if (!currentValue) continue;

          newSuggestions.push({
            user_id: user.id,
            mapping_id: mappings.id,
            block_key: blockKey,
            current_value: currentValue,
            suggested_value: `${currentValue}\n\n[Intelligence: ${underperformers.length} underperforming creatives detected. Consider revising this element to improve hook effectiveness.]`,
            justification: `${underperformers.length} creatives classified as underperforming (ROAS < 1x or CTR < 0.5%). Revising this adaptive block may improve conversion.`,
            impact_estimate: "high",
            data_source: "meta_ads",
            language: dnaLanguage,
            status: "pending",
          });
        }
      }

      if (newSuggestions.length > 0) {
        await adminClient.from("dna_update_suggestions").insert(newSuggestions);
        suggestionsGenerated = newSuggestions.length;

        notifications.push({
          title_key: "notifications.intelligence.newSuggestion",
          message_key: "notifications.intelligence.newSuggestionDesc",
          action_url: "/dashboard/library/updates",
          type: "intelligence",
        });
      }
    }

    // Notifications for classification changes
    for (const result of classResults) {
      if (!result.previous) continue;

      // Decline notification
      if (
        (result.previous === "stable" || result.previous === "high_performer") &&
        result.classification === "underperforming"
      ) {
        notifications.push({
          title_key: "notifications.intelligence.decline",
          message_key: "notifications.intelligence.declineDesc",
          action_url: "/dashboard/ads-intelligence",
          type: "intelligence",
        });
        break; // One notification per analysis for declines
      }
    }

    // New high performers notification
    const newHighPerformers = classResults.filter(
      (r) => r.classification === "high_performer" && r.previous !== "high_performer"
    );
    if (newHighPerformers.length > 0) {
      notifications.push({
        title_key: "notifications.intelligence.highPerformer",
        message_key: "notifications.intelligence.highPerformerDesc",
        action_url: "/dashboard/ads-intelligence",
        type: "intelligence",
      });
    }

    // Insert notifications
    if (notifications.length > 0) {
      const notifRows = notifications.map((n) => ({
        user_id: user.id,
        title_key: n.title_key,
        message_key: n.message_key,
        action_url: n.action_url,
        type: n.type,
      }));
      await adminClient.from("user_notifications").insert(notifRows);
    }

    // Log the analysis
    const summary = {
      total_ads: classResults.length,
      high_performers: classResults.filter((r) => r.classification === "high_performer").length,
      stable: classResults.filter((r) => r.classification === "stable").length,
      underperforming: classResults.filter((r) => r.classification === "underperforming").length,
      insufficient_data: classResults.filter((r) => r.classification === "insufficient_data").length,
    };

    await adminClient.from("intelligence_logs").insert({
      user_id: user.id,
      analysis_type: "full_analysis",
      input_summary: { ads_count: adsData.length, period: thirtyDaysAgo },
      output_summary: summary,
      suggestions_generated: suggestionsGenerated,
    });

    // Also log to integration_logs for audit
    await adminClient.from("integration_logs").insert({
      user_id: user.id,
      provider: "intelligence_engine",
      event_type: "intelligence_analysis",
      details: { ...summary, suggestions_generated: suggestionsGenerated },
    });

    return new Response(
      JSON.stringify({
        success: true,
        classifications: summary,
        suggestions_generated: suggestionsGenerated,
        notifications_sent: notifications.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Intelligence engine error:", error);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(error) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
