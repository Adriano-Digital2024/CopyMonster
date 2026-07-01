import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { resolveProvider, isProviderError } from "../_shared/llm-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify admin access
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Check if user is admin
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      );
    }

    const {
      input,
      system_prompt,
      model_id,
      temperature,
      max_tokens,
      top_p,
      frequency_penalty,
      presence_penalty,
    } = await req.json();

    const route = resolveProvider(model_id || 'google/gemini-2.5-flash', {
      title: 'CopyMonster Admin Test',
    });
    if (isProviderError(route)) {
      return new Response(
        JSON.stringify({ error: route.error }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: route.status }
      );
    }
    const { apiUrl, modelName, headers, provider, supportsPenalties } = route;
    console.log(`[agent-test] Testing with model: ${modelName} via ${provider}`);

    const messages = [
      { role: 'system', content: system_prompt },
      { role: 'user', content: input },
    ];

    const requestBody: Record<string, any> = {
      model: modelName,
      messages,
      stream: true,
      max_tokens: max_tokens || 4096,
    };

    // Add optional parameters based on provider
    if (temperature !== undefined) requestBody.temperature = temperature;
    if (top_p !== undefined) requestBody.top_p = top_p;
    if (supportsPenalties) {
      if (frequency_penalty !== undefined) requestBody.frequency_penalty = frequency_penalty;
      if (presence_penalty !== undefined) requestBody.presence_penalty = presence_penalty;
    }

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error(`[agent-test] API error:`, res.status, errorBody);
      
      return new Response(
        JSON.stringify({ error: `API error: ${res.statusText}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: res.status }
      );
    }

    console.log(`[agent-test] Streaming response started`);

    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
      status: 200,
    });

  } catch (error) {
    console.error('[agent-test] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
