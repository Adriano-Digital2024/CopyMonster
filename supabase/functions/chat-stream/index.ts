import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Rate limiting: Map of user_id -> { count, resetTime }
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // Max requests per window
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in ms

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(userId, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (userLimit.count >= RATE_LIMIT_MAX) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Language detection function
function detectLanguage(text: string): 'pt-BR' | 'en' | 'es' | 'unknown' {
  const ptPatterns = /\b(você|não|está|isso|como|para|com|uma|que|por|mais|seu|sua|ter|fazer|muito|também|ainda|aqui|onde|quando|porque|então|assim|além|através|sobre|entre|após|durante|desde|pelo|pela|aos|às|nos|nas|dos|das|uns|umas|meus|minha|nosso|nossa|nós|ele|ela|eles|elas|deles|delas|quem|qual|quais|todo|toda|todos|todas|algum|alguma|alguns|algumas|nenhum|nenhuma|outro|outra|outros|outras|mesmo|mesma|mesmos|mesmas|só|apenas|já|agora|sempre|nunca|talvez|porém|contudo|entretanto|portanto|assim|logo|pois|porque|como|enquanto|embora|apesar|caso|se|senão|seja|são|foi|foram|será|serão|seria|seriam|está|estão|estava|estavam|estará|estarão|estaria|estariam|tem|têm|tinha|tinham|terá|terão|teria|teriam|pode|podem|podia|podiam|poderá|poderão|poderia|poderiam|deve|devem|devia|deviam|deverá|deverão|deveria|deveriam|quer|querem|queria|queriam|quererá|quererão|quereria|quereriam|vai|vão|ia|iam|irá|irão|iria|iriam|faz|fazem|fazia|faziam|fará|farão|faria|fariam|diz|dizem|dizia|diziam|dirá|dirão|diria|diriam|vem|vêm|vinha|vinham|virá|virão|viria|viriam|dá|dão|dava|davam|dará|darão|daria|dariam|sabe|sabem|sabia|sabiam|saberá|saberão|saberia|saberiam|vê|veem|via|viam|verá|verão|veria|veriam)\b/gi;
  
  const esPatterns = /\b(usted|ustedes|nosotros|vosotros|ellos|ellas|está|están|estaba|estaban|estará|estarán|estaría|estarían|tiene|tienen|tenía|tenían|tendrá|tendrán|tendría|tendrían|puede|pueden|podía|podían|podrá|podrán|podría|podrían|debe|deben|debía|debían|deberá|deberán|debería|deberían|quiere|quieren|quería|querían|querrá|querrán|querría|querrían|hace|hacen|hacía|hacían|hará|harán|haría|harían|dice|dicen|decía|decían|dirá|dirán|diría|dirían|viene|vienen|venía|venían|vendrá|vendrán|vendría|vendrían|da|dan|daba|daban|dará|darán|daría|darían|sabe|saben|sabía|sabían|sabrá|sabrán|sabría|sabrían|ve|ven|veía|veían|verá|verán|vería|verían|muy|mucho|mucha|muchos|muchas|poco|poca|pocos|pocas|otro|otra|otros|otras|mismo|misma|mismos|mismas|todo|toda|todos|todas|algún|alguno|alguna|algunos|algunas|ningún|ninguno|ninguna|también|además|después|antes|durante|mientras|cuando|donde|como|porque|aunque|sin|con|para|por|entre|sobre|bajo|según|hacia|hasta|desde|contra|mediante|tras|ante|cabe|so)\b/gi;
  
  const enPatterns = /\b(the|is|are|was|were|will|would|could|should|have|has|had|do|does|did|can|may|might|must|shall|need|ought|used|this|that|these|those|here|there|where|when|why|how|what|which|who|whom|whose|all|each|every|both|few|many|much|some|any|no|not|only|just|also|very|too|more|most|less|least|other|another|such|same|different|own|else|even|still|already|yet|again|often|always|never|sometimes|usually|perhaps|maybe|probably|certainly|definitely|really|actually|basically|generally|especially|particularly|specifically|exactly|simply|merely|hardly|nearly|almost|about|around|through|between|among|within|without|during|before|after|until|since|while|although|though|unless|except|whether|because|therefore|however|moreover|furthermore|nevertheless|nonetheless|otherwise|instead|meanwhile|accordingly|consequently|hence|thus|indeed|certainly|surely|obviously|apparently|presumably|possibly|probably|perhaps|maybe|somehow|anyway|anywhere|everywhere|nowhere|somewhere|whoever|whatever|wherever|whenever|however|whichever|whatever|my|your|his|her|its|our|their|product|course|video|influencers|monetize|social|media|using|persuasive|structures)\b/gi;

  const ptCount = (text.match(ptPatterns) || []).length;
  const esCount = (text.match(esPatterns) || []).length;
  const enCount = (text.match(enPatterns) || []).length;
  
  const total = ptCount + esCount + enCount;
  if (total === 0) return 'unknown';
  
  const ptPercent = (ptCount / total) * 100;
  const esPercent = (esCount / total) * 100;
  const enPercent = (enCount / total) * 100;
  
  console.log(`[chat-stream] Language detection: PT=${ptPercent.toFixed(1)}%, ES=${esPercent.toFixed(1)}%, EN=${enPercent.toFixed(1)}%`);
  
  if (ptPercent >= 50) return 'pt-BR';
  if (esPercent >= 50) return 'es';
  if (enPercent >= 50) return 'en';
  
  if (ptPercent >= esPercent && ptPercent >= enPercent) return 'pt-BR';
  if (esPercent >= ptPercent && esPercent >= enPercent) return 'es';
  return 'en';
}

// Language-aware system prompt rules
function getUniversalLanguageRules(language: string): string {
  const rules: Record<string, string> = {
    'pt-BR': `# REGRA DE IDIOMA OBRIGATÓRIA
Você DEVE responder INTEIRAMENTE em Português do Brasil.
- NUNCA misture idiomas na sua resposta
- Todos os títulos, seções, cabeçalhos e conteúdo devem estar em Português
- Esta regra substitui qualquer outra configuração de idioma

# PADRÕES UNIVERSAIS DE QUALIDADE
- O copy deve ser psicologicamente persuasivo
- Use gatilhos comportamentais e ressonância emocional
- Evite escrita genérica ou superficial
- Todas as saídas devem soar como um copywriter premium de alto nível
- Sempre entregue CLAREZA + EMOÇÃO + ESTRUTURA`,

    'es': `# REGLA DE IDIOMA OBLIGATORIA
DEBE responder COMPLETAMENTE en Español.
- NUNCA mezcle idiomas en su respuesta
- Todos los títulos, secciones, encabezados y contenido deben estar en Español
- Esta regla anula cualquier otra configuración de idioma

# ESTÁNDARES UNIVERSALES DE CALIDAD
- El copy debe ser psicológicamente persuasivo
- Use disparadores conductuales y resonancia emocional
- Evite escritura genérica o superficial
- Todos los outputs deben sonar como un copywriter premium de primer nivel
- Siempre entregue CLARIDAD + EMOCIÓN + ESTRUCTURA`,

    'en': `# MANDATORY LANGUAGE RULE
You MUST respond ENTIRELY in English.
- NEVER mix languages in your response
- ALL titles, sections, headers, and content must be in English
- This rule overrides any other language configuration

# UNIVERSAL QUALITY STANDARDS
- Copy must be psychologically persuasive
- Use behavioral triggers and emotional resonance
- Avoid generic or superficial writing
- All outputs must sound like a premium top-tier copywriter
- Always deliver CLARITY + EMOTION + STRUCTURE`
  };
  
  return rules[language] || rules['en'];
}

// Auto-start instructions by language
function getAutoStartInstruction(language: string): string {
  const instructions: Record<string, string> = {
    'pt-BR': '\n\n# INSTRUÇÃO ESPECIAL\nEsta é a primeira mensagem da conversa. Você DEVE iniciar com sua mensagem de boas-vindas e a primeira pergunta do fluxo guiado imediatamente.',
    'es': '\n\n# INSTRUCCIÓN ESPECIAL\nEste es el primer mensaje de la conversación. DEBE comenzar con su mensaje de bienvenida y la primera pregunta del flujo guiado inmediatamente.',
    'en': '\n\n# SPECIAL INSTRUCTION\nThis is the first message of the conversation. You MUST start with your welcome message and the first question of the guided flow immediately.'
  };
  return instructions[language] || instructions['en'];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. AUTHENTICATE USER
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[chat-stream] No authorization header');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    // Verify JWT and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !authUser) {
      console.error('[chat-stream] Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = authUser.id;
    console.log(`[chat-stream] User authenticated: ${userId}`);

    // 2. CHECK IF USER IS ADMIN (BYPASS ALL LIMITS)
    const { data: adminRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .maybeSingle();

    const isAdmin = !!adminRole;
    
    if (isAdmin) {
      console.log(`[chat-stream] ADMIN USER DETECTED: ${userId} - bypassing all limits`);
    }

    // 3. RATE LIMITING (skip for admins)
    if (!isAdmin && !checkRateLimit(userId)) {
      console.warn(`[chat-stream] Rate limit exceeded for user: ${userId}`);
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please wait a moment and try again.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
      );
    }

    // 4. GET USER PROFILE AND VALIDATE CREDITS/TRIAL (skip validation for admins)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('credits, subscription_status, trial_expires_at')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('[chat-stream] Profile fetch error:', profileError);
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    let newCredits = profile.credits;

    // ADMINS: Skip all credit/trial checks and credit deduction
    if (!isAdmin) {
      // Check if user can use the service
      const now = new Date();
      const trialExpired = profile.trial_expires_at && new Date(profile.trial_expires_at) < now;
      const isFreeUser = profile.subscription_status === 'free';
      const hasCredits = profile.credits > 0;

      // Free users with expired trial cannot use the service
      if (isFreeUser && trialExpired) {
        console.warn(`[chat-stream] Trial expired for user: ${userId}`);
        return new Response(
          JSON.stringify({ 
            error: 'Trial expired',
            code: 'TRIAL_EXPIRED',
            message: 'Your free trial has expired. Please upgrade to continue.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }

      // No credits available
      if (!hasCredits) {
        console.warn(`[chat-stream] No credits for user: ${userId}`);
        return new Response(
          JSON.stringify({ 
            error: 'Insufficient credits',
            code: 'NO_CREDITS',
            message: 'You have no credits remaining. Please upgrade your plan.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 402 }
        );
      }

      // 5. DEBIT CREDIT ATOMICALLY BEFORE PROCESSING (only for non-admins)
      const { data: updatedProfile, error: debitError } = await supabase
        .from('profiles')
        .update({ credits: profile.credits - 1, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .eq('credits', profile.credits) // Optimistic locking
        .select('credits')
        .single();

      if (debitError || !updatedProfile) {
        console.error('[chat-stream] Credit debit failed:', debitError);
        return new Response(
          JSON.stringify({ error: 'Failed to process credit. Please try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 409 }
        );
      }

      newCredits = updatedProfile.credits;
      console.log(`[chat-stream] Credit debited. User ${userId} now has ${newCredits} credits`);
    } else {
      console.log(`[chat-stream] Admin user - no credit deduction`);
    }

    // 5. PARSE REQUEST BODY
    const { messages, system_prompt, model, agent_slug, auto_start, positioning_mapping_id } = await req.json();

    // INPUT VALIDATION - Prevent abuse and control costs
    const MAX_MESSAGES = 50;
    const MAX_CONTENT_LENGTH = 10000; // 10k chars per message

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    if (messages.length > MAX_MESSAGES) {
      console.warn(`[chat-stream] Message limit exceeded: ${messages.length} messages from user ${userId}`);
      return new Response(
        JSON.stringify({ error: `Too many messages. Maximum ${MAX_MESSAGES} allowed.` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    for (const msg of messages) {
      if (msg.content && typeof msg.content === 'string' && msg.content.length > MAX_CONTENT_LENGTH) {
        console.warn(`[chat-stream] Content too long: ${msg.content.length} chars from user ${userId}`);
        return new Response(
          JSON.stringify({ error: `Message content too long. Maximum ${MAX_CONTENT_LENGTH} characters per message.` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }
    }
    
    // Get API keys
    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    const mistralApiKey = Deno.env.get('MISTRAL_API_KEY');

    // Language detection strategy:
    // 1. Priority: agent's configured language (most reliable)
    // 2. Fallback: detect from first user message in conversation (session consistency)
    // 3. Final fallback: detect from last message or default to 'pt-BR'
    
    let effectiveLanguage: 'pt-BR' | 'en' | 'es' = 'pt-BR'; // Default
    let languageSource = 'default';
    
    // Will be set after fetching agent config
    const firstUserMessage = messages.find((m: any) => m.role === 'user' && m.content !== '__auto_start__');
    const detectedFromFirst = firstUserMessage ? detectLanguage(firstUserMessage.content) : 'unknown';
    
    console.log(`[chat-stream] Initial language detection from first message: ${detectedFromFirst}`);

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

        // LANGUAGE PRIORITY: 
        // 1. Agent's configured language (most reliable, prevents language switching)
        // 2. Detected from first user message (session consistency)
        // 3. Default to pt-BR
        const validLanguages = ['pt-BR', 'en', 'es'];
        if (agent.language && validLanguages.includes(agent.language)) {
          effectiveLanguage = agent.language as 'pt-BR' | 'en' | 'es';
          languageSource = 'agent_config';
        } else if (detectedFromFirst && detectedFromFirst !== 'unknown') {
          effectiveLanguage = detectedFromFirst as 'pt-BR' | 'en' | 'es';
          languageSource = 'first_message_detection';
        }
        
        console.log(`[chat-stream] Final language: ${effectiveLanguage} (source: ${languageSource})`);

        // Get language rules AFTER determining effective language
        const universalRules = getUniversalLanguageRules(effectiveLanguage);

        // Build dynamic master prompt with language-aware structure
        const parts = [];

        // Start with universal language rules for the detected language
        parts.push(universalRules);

        parts.push(`\n\n# IDENTITY\nYou are ${agent.name} from CopyMonster.`);

        if (agent.role_definition) {
          parts.push(`\n\n# ROLE\n${agent.role_definition}`);
        }

        if (agent.persona_name && agent.persona_backstory) {
          parts.push(`\n\n# PERSONA\nName: ${agent.persona_name}\n${agent.persona_backstory}`);
        }

        if (agent.core_function) {
          parts.push(`\n\n# CORE FUNCTION\n${agent.core_function}`);
        }

        if (agent.quality_rules) {
          parts.push(`\n\n# QUALITY RULES\n${agent.quality_rules}`);
        }

        if (agent.expected_inputs) {
          parts.push(`\n\n# EXPECTED INPUTS\n${agent.expected_inputs}`);
        }

        if (agent.output_structure) {
          parts.push(`\n\n# MANDATORY OUTPUT STRUCTURE\nYou MUST follow this structure:\n${agent.output_structure}`);
        }

        parts.push(`\n\n# SETTINGS\n- Tone: ${agent.tone || 'professional'}\n- Word limits: ${agent.min_words || 100}-${agent.max_words || 2000} words`);

        // Add few-shot examples if available
        if (agent.few_shot_examples && Array.isArray(agent.few_shot_examples) && agent.few_shot_examples.length > 0) {
          parts.push(`\n\n# REFERENCE EXAMPLES`);
          agent.few_shot_examples.forEach((example: any, index: number) => {
            parts.push(`\n## Example ${index + 1}\n**Input:** ${example.input}\n**Output:** ${example.output}`);
          });
        }

        if (agent.system_prompt) {
          parts.push(`\n\n# ADDITIONAL INSTRUCTIONS\n${agent.system_prompt}`);
        }

        finalSystemPrompt = parts.join('');
      }
    } else if (system_prompt) {
      // No agent, use detection from first message
      if (detectedFromFirst && detectedFromFirst !== 'unknown') {
        effectiveLanguage = detectedFromFirst as 'pt-BR' | 'en' | 'es';
        languageSource = 'first_message_detection';
      }
      console.log(`[chat-stream] Final language (no agent): ${effectiveLanguage} (source: ${languageSource})`);
      const universalRules = getUniversalLanguageRules(effectiveLanguage);
      finalSystemPrompt = universalRules + '\n\n' + system_prompt;
    }

    // If positioning_mapping_id is provided, fetch and inject context
    if (positioning_mapping_id) {
      const { data: mapping, error: mappingError } = await supabase
        .from('positioning_mappings')
        .select('*')
        .eq('id', positioning_mapping_id)
        .eq('user_id', userId) // Security: only own mappings
        .single();

      if (!mappingError && mapping) {
        const contextParts = [];
        contextParts.push('\n\n# POSITIONING CONTEXT (User\'s Brand DNA)');
        if (mapping.block_1_audience) contextParts.push(`\n## Target Audience\n${mapping.block_1_audience}`);
        if (mapping.block_2_pain_points) contextParts.push(`\n## Pain Points\n${mapping.block_2_pain_points}`);
        if (mapping.block_3_solution) contextParts.push(`\n## Solution\n${mapping.block_3_solution}`);
        if (mapping.block_4_differentiators) contextParts.push(`\n## Differentiators\n${mapping.block_4_differentiators}`);
        if (mapping.block_5_awareness_stage) contextParts.push(`\n## Awareness Stage\n${mapping.block_5_awareness_stage}`);
        if (mapping.block_6_urgency) contextParts.push(`\n## Urgency\n${mapping.block_6_urgency}`);
        if (mapping.block_7_social_proof) contextParts.push(`\n## Social Proof\n${mapping.block_7_social_proof}`);
        if (mapping.block_8_objections) contextParts.push(`\n## Objections\n${mapping.block_8_objections}`);
        if (mapping.block_9_emotional_connection) contextParts.push(`\n## Emotional Connection\n${mapping.block_9_emotional_connection}`);
        if (mapping.block_10_transformation) contextParts.push(`\n## Transformation\n${mapping.block_10_transformation}`);
        if (mapping.block_11_voice) contextParts.push(`\n## Brand Voice\n${mapping.block_11_voice}`);
        if (mapping.block_12_promises) contextParts.push(`\n## Promises\n${mapping.block_12_promises}`);
        
        finalSystemPrompt += contextParts.join('');
        console.log(`[chat-stream] Positioning context injected from mapping: ${positioning_mapping_id}`);
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

    // Handle auto-start
    let processedMessages = messages;
    if (auto_start || (messages.length === 1 && messages[0]?.content === '__auto_start__')) {
      finalSystemPrompt += getAutoStartInstruction(effectiveLanguage);
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
      
      // Refund credit on API error
      await supabase
        .from('profiles')
        .update({ credits: newCredits + 1 })
        .eq('id', userId);
      console.log(`[chat-stream] Credit refunded due to API error`);
      
      if (res.status === 429) {
        return new Response(
          JSON.stringify({ error: 'AI service rate limit exceeded. Please wait a moment and try again.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 429 }
        );
      }
      
      throw new Error(`AI Gateway error: ${res.statusText}`);
    }

    // 6. LOG USAGE FOR AUDITING (async, don't block response)
    const logUsage = async () => {
      try {
        await supabase.from('usage_logs').insert({
          user_id: userId,
          agent_slug: agent_slug || null,
          model_used: modelName,
          input_tokens: 0, // Could estimate from message length
          output_tokens: 0, // Could estimate from response length
          credits_consumed: isAdmin ? 0 : 1, // Admins don't consume credits
        });
      } catch (e) {
        console.error('[chat-stream] Failed to log usage:', e);
      }
    };
    logUsage(); // Fire and forget

    // 7. RETURN STREAMING RESPONSE WITH CREDITS HEADER
    return new Response(res.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Credits-Remaining': newCredits.toString(),
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
