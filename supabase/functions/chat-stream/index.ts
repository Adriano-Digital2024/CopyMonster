import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, system_prompt, model, agent_slug, auto_start } = await req.json();
    
    // Get API keys
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If agent_slug is provided, fetch agent config from database
    let agentConfig: any = null;
    let finalSystemPrompt = system_prompt;
    let selectedModel = model || 'google/gemini-2.5-flash';
    let temperature = 0.7;
    let maxTokens = 4096;
    let topP = 0.9;

    if (agent_slug) {
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('slug', agent_slug)
        .eq('is_active', true)
        .single();

      if (agentError) {
        console.error('[chat-stream] Agent fetch error:', agentError);
      } else if (agent) {
        agentConfig = agent;
        selectedModel = agent.model_id || selectedModel;
        temperature = agent.temperature ?? 0.7;
        maxTokens = agent.max_tokens ?? 4096;
        topP = agent.top_p ?? 0.9;

        // Build dynamic master prompt
        const parts = [];

        parts.push(`# IDENTIDADE\nVocê é o ${agent.name} do CopyMonster.`);

        if (agent.role_definition) {
          parts.push(`\n\n# PAPEL\n${agent.role_definition}`);
        }

        if (agent.persona_name && agent.persona_backstory) {
          parts.push(`\n\n# PERSONA\nNome: ${agent.persona_name}\n${agent.persona_backstory}`);
        }

        if (agent.core_function) {
          parts.push(`\n\n# FUNÇÃO CENTRAL\n${agent.core_function}`);
        }

        if (agent.quality_rules) {
          parts.push(`\n\n# REGRAS DE QUALIDADE\n${agent.quality_rules}`);
        }

        if (agent.expected_inputs) {
          parts.push(`\n\n# INPUTS ESPERADOS\n${agent.expected_inputs}`);
        }

        if (agent.output_structure) {
          parts.push(`\n\n# ESTRUTURA DE SAÍDA OBRIGATÓRIA\nVocê DEVE seguir esta estrutura:\n${agent.output_structure}`);
        }

        parts.push(`\n\n# CONFIGURAÇÕES\n- Tom: ${agent.tone || 'professional'}\n- Idioma: ${agent.language || 'pt-BR'}\n- Limites: ${agent.min_words || 100}-${agent.max_words || 2000} palavras`);

        // Add few-shot examples if available
        if (agent.few_shot_examples && Array.isArray(agent.few_shot_examples) && agent.few_shot_examples.length > 0) {
          parts.push(`\n\n# EXEMPLOS DE REFERÊNCIA`);
          agent.few_shot_examples.forEach((example: any, index: number) => {
            parts.push(`\n## Exemplo ${index + 1}\n**Input:** ${example.input}\n**Output:** ${example.output}`);
          });
        }

        if (agent.system_prompt) {
          parts.push(`\n\n# INSTRUÇÕES ADICIONAIS\n${agent.system_prompt}`);
        }

        finalSystemPrompt = parts.join('');
      }
    }

    // Determine which API to use
    const isMistral = selectedModel?.startsWith('mistralai/') || selectedModel?.startsWith('mistral/');
    
    let apiUrl: string;
    let apiKey: string | undefined;
    let modelName: string;
    let headers: Record<string, string>;

    if (isMistral) {
      apiKey = mistralApiKey;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'Mistral API not configured. Please contact support.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      apiUrl = 'https://api.mistral.ai/v1/chat/completions';
      modelName = selectedModel.replace('mistralai/', '').replace('mistral/', '');
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      };
    } else {
      apiKey = openRouterApiKey;
      if (!apiKey) {
        return new Response(
          JSON.stringify({ error: 'OpenRouter API not configured. Please contact support.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }
      apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
      modelName = selectedModel;
      headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://copymonster.app',
        'X-Title': 'CopyMonster',
      };
    }

    console.log(`[chat-stream] Using model: ${modelName} via ${isMistral ? 'Mistral' : 'OpenRouter'}`);

    // Handle auto-start: filter out the __auto_start__ message and add instruction
    let processedMessages = messages;
    if (auto_start || (messages.length === 1 && messages[0]?.content === '__auto_start__')) {
      // For auto-start, send empty messages array so agent initiates
      processedMessages = [];
      
      // Add auto-start instruction to system prompt
      finalSystemPrompt += '\n\n# INSTRUÇÃO ESPECIAL\nEsta é a primeira mensagem da conversa. Você DEVE iniciar com sua mensagem de boas-vindas e a primeira pergunta do fluxo guiado imediatamente.';
      
      console.log('[chat-stream] Auto-start mode activated for agent:', agent_slug);
    }

    const fullMessages = [
      { role: 'system', content: finalSystemPrompt },
      ...processedMessages,
    ];

    const requestBody: Record<string, any> = {
      model: modelName,
      messages: fullMessages,
      stream: true,
      max_tokens: maxTokens,
      temperature: temperature,
      top_p: topP,
    };

    const res = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.error('[chat-stream] API error:', res.status, errorBody);
      
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait a moment and try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      if (res.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Insufficient AI credits. Please contact support.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
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
    console.error('[chat-stream] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
