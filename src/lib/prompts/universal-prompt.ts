/**
 * UNIVERSAL SYSTEM PROMPT - Base layer for all CopyMonster agents
 * Includes multi-language detection, quality standards, and structure rules
 */

export const UNIVERSAL_SYSTEM_PROMPT = `You are a world-class AI Copywriter Agent trained specifically for high-conversion persuasive communication.
Your task is to always write in the SAME LANGUAGE used by the user.
If the user writes in Portuguese, answer in Portuguese.
If the user writes in English, answer in English.
If the user writes in Spanish, answer in Spanish.

LANGUAGE DETECTION RULE:
- If user message contains >60% Portuguese → answer in PT-BR
- If user message contains >60% English → answer in EN
- If user message contains >60% Spanish → answer in ES
- If unclear → ask user which language they prefer (only once).

UNIVERSAL QUALITY STANDARDS:
- Copy must be psychologically persuasive.
- Use behavioral triggers and emotional resonance.
- Avoid generic or superficial writing.
- All outputs must sound like a premium top-tier copywriter.
- Always deliver CLARITY + EMOTION + STRUCTURE.

UNIVERSAL STRUCTURE RULES:
- Organize content with titles, bullets and sections.
- For long outputs (>400 words), always include:
  *Headline*
  *Big Idea*
  *Hook*
  *Body*
  *CTA final*
- Never exceed the maximum length defined in your specific limits.
- Never break formatting.

UNIVERSAL INPUT PROCESSING:
Before writing, always perform:
1. Identify target audience
2. Identify offer or product
3. Identify desired outcome
4. Select best persuasion frameworks (AIDA, PAS, 4P's, StorySelling etc.)
5. Confirm tone: direct, premium, specialized.

If any element is missing, ask ONLY what is missing, nothing else.`;

/**
 * Language detection utility
 */
export function detectLanguage(text: string): 'pt-BR' | 'en' | 'es' | 'unknown' {
  const ptPatterns = /\b(você|não|está|isso|como|para|com|uma|que|por|mais|seu|sua|ter|fazer|muito|também|ainda|aqui|onde|quando|porque|então|assim|além|através|sobre|entre|após|durante|desde|pelo|pela|aos|às|nos|nas|dos|das|uns|umas|meus|minha|nosso|nossa|nós|ele|ela|eles|elas|deles|delas|quem|qual|quais|todo|toda|todos|todas|algum|alguma|alguns|algumas|nenhum|nenhuma|outro|outra|outros|outras|mesmo|mesma|mesmos|mesmas|só|apenas|já|agora|sempre|nunca|talvez|porém|contudo|entretanto|portanto|assim|logo|pois|porque|como|enquanto|embora|apesar|caso|se|senão|seja|são|foi|foram|será|serão|seria|seriam|está|estão|estava|estavam|estará|estarão|estaria|estariam|tem|têm|tinha|tinham|terá|terão|teria|teriam|pode|podem|podia|podiam|poderá|poderão|poderia|poderiam|deve|devem|devia|deviam|deverá|deverão|deveria|deveriam|quer|querem|queria|queriam|quererá|quererão|quereria|quereriam|vai|vão|ia|iam|irá|irão|iria|iriam|faz|fazem|fazia|faziam|fará|farão|faria|fariam|diz|dizem|dizia|diziam|dirá|dirão|diria|diriam|vem|vêm|vinha|vinham|virá|virão|viria|viriam|dá|dão|dava|davam|dará|darão|daria|dariam|sabe|sabem|sabia|sabiam|saberá|saberão|saberia|saberiam|vê|veem|via|viam|verá|verão|veria|veriam)\b/gi;
  
  const esPatterns = /\b(usted|ustedes|nosotros|vosotros|ellos|ellas|está|están|estaba|estaban|estará|estarán|estaría|estarían|tiene|tienen|tenía|tenían|tendrá|tendrán|tendría|tendrían|puede|pueden|podía|podían|podrá|podrán|podría|podrían|debe|deben|debía|debían|deberá|deberán|debería|deberían|quiere|quieren|quería|querían|querrá|querrán|querría|querrían|hace|hacen|hacía|hacían|hará|harán|haría|harían|dice|dicen|decía|decían|dirá|dirán|diría|dirían|viene|vienen|venía|venían|vendrá|vendrán|vendría|vendrían|da|dan|daba|daban|dará|darán|daría|darían|sabe|saben|sabía|sabían|sabrá|sabrán|sabría|sabrían|ve|ven|veía|veían|verá|verán|vería|verían|muy|mucho|mucha|muchos|muchas|poco|poca|pocos|pocas|otro|otra|otros|otras|mismo|misma|mismos|mismas|todo|toda|todos|todas|algún|alguno|alguna|algunos|algunas|ningún|ninguno|ninguna|también|además|después|antes|durante|mientras|cuando|donde|como|porque|aunque|sin|con|para|por|entre|sobre|bajo|según|hacia|hasta|desde|contra|mediante|tras|ante|cabe|so)\b/gi;
  
  const enPatterns = /\b(the|is|are|was|were|will|would|could|should|have|has|had|do|does|did|can|may|might|must|shall|need|ought|used|this|that|these|those|here|there|where|when|why|how|what|which|who|whom|whose|all|each|every|both|few|many|much|some|any|no|not|only|just|also|very|too|more|most|less|least|other|another|such|same|different|own|else|even|still|already|yet|again|often|always|never|sometimes|usually|perhaps|maybe|probably|certainly|definitely|really|actually|basically|generally|especially|particularly|specifically|exactly|simply|merely|hardly|nearly|almost|about|around|through|between|among|within|without|during|before|after|until|since|while|although|though|unless|except|whether|because|therefore|however|moreover|furthermore|nevertheless|nonetheless|otherwise|instead|meanwhile|accordingly|consequently|hence|thus|indeed|certainly|surely|obviously|apparently|presumably|possibly|probably|perhaps|maybe|somehow|anyway|anywhere|everywhere|nowhere|somewhere|whoever|whatever|wherever|whenever|however|whichever|whatever)\b/gi;

  const ptCount = (text.match(ptPatterns) || []).length;
  const esCount = (text.match(esPatterns) || []).length;
  const enCount = (text.match(enPatterns) || []).length;
  
  const total = ptCount + esCount + enCount;
  if (total === 0) return 'unknown';
  
  const ptPercent = (ptCount / total) * 100;
  const esPercent = (esCount / total) * 100;
  const enPercent = (enCount / total) * 100;
  
  if (ptPercent >= 60) return 'pt-BR';
  if (esPercent >= 60) return 'es';
  if (enPercent >= 60) return 'en';
  
  // If no clear majority, return the highest
  if (ptPercent >= esPercent && ptPercent >= enPercent) return 'pt-BR';
  if (esPercent >= ptPercent && esPercent >= enPercent) return 'es';
  return 'en';
}

/**
 * Language-specific instructions to append
 */
export const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  'pt-BR': '\n\nIMPORTANTE: Responda SEMPRE em Português do Brasil (PT-BR).',
  'en': '\n\nIMPORTANT: Always respond in English.',
  'es': '\n\nIMPORTANTE: Responda SIEMPRE en Español.',
  'unknown': ''
};
