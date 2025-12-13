import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, system_prompt, model } = await req.json();
    
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');

    if (!openRouterApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenRouter API not configured. Please contact support.' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const fullMessages = [
      { role: 'system', content: system_prompt },
      ...messages,
    ];

    // Default model if not specified
    const selectedModel = model || 'google/gemini-2.5-flash';

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://copymonster.app',
        'X-Title': 'CopyMonster',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: fullMessages,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('OpenRouter API error:', res.status, errorBody);
      
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 429,
          }
        );
      }
      
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient AI credits. Please contact support.' }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 402,
          }
        );
      }
      
      throw new Error(`AI Gateway error: ${res.statusText}`);
    }

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
    console.error('Error in chat-stream function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
