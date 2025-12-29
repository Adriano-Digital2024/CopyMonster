import { Message } from '@/components/chat/ChatInterface';

interface ExtractedBlocks {
  block_1_audience: string | null;
  block_2_pain_points: string | null;
  block_3_solution: string | null;
  block_4_differentiators: string | null;
  block_5_awareness_stage: string | null;
  block_6_urgency: string | null;
  block_7_social_proof: string | null;
  block_8_objections: string | null;
  block_9_emotional_connection: string | null;
  block_10_transformation: string | null;
  block_11_voice: string | null;
  block_12_promises: string | null;
}

// Block markers in multiple languages (PT, EN, ES)
const BLOCK_PATTERNS: Record<keyof ExtractedBlocks, RegExp[]> = {
  block_1_audience: [
    /bloco\s*1[:\s-]+.*?(público|audiência|cliente)/i,
    /block\s*1[:\s-]+.*?(audience|target|customer)/i,
    /bloque\s*1[:\s-]+.*?(audiencia|público|cliente)/i,
    /✅\s*bloco\s*1/i,
    /✅\s*block\s*1/i,
    /✅\s*bloque\s*1/i,
    /público-?alvo/i,
    /target\s*audience/i,
  ],
  block_2_pain_points: [
    /bloco\s*2[:\s-]+.*?(dor|problema)/i,
    /block\s*2[:\s-]+.*?(pain|problem)/i,
    /bloque\s*2[:\s-]+.*?(dolor|problema)/i,
    /✅\s*bloco\s*2/i,
    /✅\s*block\s*2/i,
    /✅\s*bloque\s*2/i,
    /pontos?\s*de\s*dor/i,
    /pain\s*points/i,
  ],
  block_3_solution: [
    /bloco\s*3[:\s-]+.*?(solução|oferta)/i,
    /block\s*3[:\s-]+.*?(solution|offer)/i,
    /bloque\s*3[:\s-]+.*?(solución|oferta)/i,
    /✅\s*bloco\s*3/i,
    /✅\s*block\s*3/i,
    /✅\s*bloque\s*3/i,
    /sua\s*solução/i,
    /your\s*solution/i,
  ],
  block_4_differentiators: [
    /bloco\s*4[:\s-]+.*?(diferencia|único)/i,
    /block\s*4[:\s-]+.*?(differentiator|unique)/i,
    /bloque\s*4[:\s-]+.*?(diferenciador|único)/i,
    /✅\s*bloco\s*4/i,
    /✅\s*block\s*4/i,
    /✅\s*bloque\s*4/i,
    /diferencia(is|dores)/i,
    /differentiators/i,
  ],
  block_5_awareness_stage: [
    /bloco\s*5[:\s-]+.*?(consciência|awareness)/i,
    /block\s*5[:\s-]+.*?(awareness)/i,
    /bloque\s*5[:\s-]+.*?(consciencia|conciencia)/i,
    /✅\s*bloco\s*5/i,
    /✅\s*block\s*5/i,
    /✅\s*bloque\s*5/i,
    /nível\s*de\s*consciência/i,
    /awareness\s*stage/i,
  ],
  block_6_urgency: [
    /bloco\s*6[:\s-]+.*?(urgência|escassez)/i,
    /block\s*6[:\s-]+.*?(urgency|scarcity)/i,
    /bloque\s*6[:\s-]+.*?(urgencia|escasez)/i,
    /✅\s*bloco\s*6/i,
    /✅\s*block\s*6/i,
    /✅\s*bloque\s*6/i,
    /urgência/i,
    /urgency/i,
  ],
  block_7_social_proof: [
    /bloco\s*7[:\s-]+.*?(prova\s*social|credibilidade)/i,
    /block\s*7[:\s-]+.*?(social\s*proof|credibility)/i,
    /bloque\s*7[:\s-]+.*?(prueba\s*social|credibilidad)/i,
    /✅\s*bloco\s*7/i,
    /✅\s*block\s*7/i,
    /✅\s*bloque\s*7/i,
    /prova\s*social/i,
    /social\s*proof/i,
  ],
  block_8_objections: [
    /bloco\s*8[:\s-]+.*?(objeç|objecion)/i,
    /block\s*8[:\s-]+.*?(objection)/i,
    /bloque\s*8[:\s-]+.*?(objeción)/i,
    /✅\s*bloco\s*8/i,
    /✅\s*block\s*8/i,
    /✅\s*bloque\s*8/i,
    /objeções/i,
    /objections/i,
  ],
  block_9_emotional_connection: [
    /bloco\s*9[:\s-]+.*?(emocion|conexão)/i,
    /block\s*9[:\s-]+.*?(emotion|connection)/i,
    /bloque\s*9[:\s-]+.*?(emocional|conexión)/i,
    /✅\s*bloco\s*9/i,
    /✅\s*block\s*9/i,
    /✅\s*bloque\s*9/i,
    /conexão\s*emocional/i,
    /emotional\s*connection/i,
  ],
  block_10_transformation: [
    /bloco\s*10[:\s-]+.*?(transforma)/i,
    /block\s*10[:\s-]+.*?(transforma)/i,
    /bloque\s*10[:\s-]+.*?(transforma)/i,
    /✅\s*bloco\s*10/i,
    /✅\s*block\s*10/i,
    /✅\s*bloque\s*10/i,
    /transformação/i,
    /transformation/i,
  ],
  block_11_voice: [
    /bloco\s*11[:\s-]+.*?(voz|tom|linguagem)/i,
    /block\s*11[:\s-]+.*?(voice|tone|language)/i,
    /bloque\s*11[:\s-]+.*?(voz|tono|lenguaje)/i,
    /✅\s*bloco\s*11/i,
    /✅\s*block\s*11/i,
    /✅\s*bloque\s*11/i,
    /voz\s*da\s*marca/i,
    /brand\s*voice/i,
  ],
  block_12_promises: [
    /bloco\s*12[:\s-]+.*?(promessa|cta|chamada)/i,
    /block\s*12[:\s-]+.*?(promise|cta|call)/i,
    /bloque\s*12[:\s-]+.*?(promesa|cta|llamada)/i,
    /✅\s*bloco\s*12/i,
    /✅\s*block\s*12/i,
    /✅\s*bloque\s*12/i,
    /promessas/i,
    /promises/i,
    /cta/i,
  ],
};

/**
 * Extract the 12 positioning blocks from a chat conversation.
 * Analyzes assistant messages to identify and extract each strategic block.
 */
export function extractBlocksFromConversation(messages: Message[]): ExtractedBlocks {
  const blocks: ExtractedBlocks = {
    block_1_audience: null,
    block_2_pain_points: null,
    block_3_solution: null,
    block_4_differentiators: null,
    block_5_awareness_stage: null,
    block_6_urgency: null,
    block_7_social_proof: null,
    block_8_objections: null,
    block_9_emotional_connection: null,
    block_10_transformation: null,
    block_11_voice: null,
    block_12_promises: null,
  };

  // Get all assistant messages with their corresponding user responses
  const conversationPairs: { assistant: string; userResponse: string }[] = [];
  
  for (let i = 0; i < messages.length; i++) {
    if (messages[i].role === 'assistant') {
      const userResponse = messages[i + 1]?.role === 'user' ? messages[i + 1].content : '';
      conversationPairs.push({
        assistant: messages[i].content,
        userResponse,
      });
    }
  }

  // Iterate through conversation pairs to extract blocks
  for (const pair of conversationPairs) {
    const combinedContent = pair.assistant + '\n\n' + pair.userResponse;

    // Check each block pattern
    for (const [blockKey, patterns] of Object.entries(BLOCK_PATTERNS)) {
      // Only fill if not already filled
      if (blocks[blockKey as keyof ExtractedBlocks]) continue;

      // Check if any pattern matches
      for (const pattern of patterns) {
        if (pattern.test(pair.assistant)) {
          // This assistant message is about this block
          // The user's response is the block content
          if (pair.userResponse && pair.userResponse.length > 10) {
            blocks[blockKey as keyof ExtractedBlocks] = pair.userResponse;
            break;
          }
        }
      }
    }
  }

  // Also try to extract from the final summary message if blocks are still empty
  const lastAssistantMessage = messages
    .filter(m => m.role === 'assistant')
    .pop();

  if (lastAssistantMessage?.content) {
    const content = lastAssistantMessage.content;
    
    // Look for structured summary sections
    const summaryPatterns: Record<keyof ExtractedBlocks, RegExp> = {
      block_1_audience: /(?:público-?alvo|target\s*audience|audiencia)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_2_pain_points: /(?:dores?|pain\s*points?|dolor)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_3_solution: /(?:solução|solution|solución)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_4_differentiators: /(?:diferencia\w*|differentiators?|único)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_5_awareness_stage: /(?:consciência|awareness|conciencia)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_6_urgency: /(?:urgência|urgency|escassez|scarcity)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_7_social_proof: /(?:prova\s*social|social\s*proof|credibilidade)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_8_objections: /(?:objeç\w*|objections?|objecion\w*)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_9_emotional_connection: /(?:conexão\s*emocional|emotional\s*connection|emoci\w+)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_10_transformation: /(?:transformação|transformation)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_11_voice: /(?:voz\s*da\s*marca|brand\s*voice|tom)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
      block_12_promises: /(?:promessa\w*|promise\w*|cta)[:\s]+([^\n]+(?:\n(?![A-Z#✅•\-\d])[^\n]+)*)/gi,
    };

    for (const [blockKey, pattern] of Object.entries(summaryPatterns)) {
      if (!blocks[blockKey as keyof ExtractedBlocks]) {
        const match = content.match(pattern);
        if (match && match[1]) {
          blocks[blockKey as keyof ExtractedBlocks] = match[1].trim();
        }
      }
    }
  }

  return blocks;
}

/**
 * Count how many blocks have been extracted
 */
export function countExtractedBlocks(blocks: ExtractedBlocks): number {
  return Object.values(blocks).filter(v => v !== null && v.length > 0).length;
}
