/**
 * DNA Block Classification
 * 
 * STRUCTURAL blocks: Immutable foundation — cannot be modified via suggestions or automatic systems.
 * ADAPTIVE blocks: Evolutive layer — can receive strategic suggestions from the Intelligence Engine.
 * 
 * This classification is the single source of truth for the entire system.
 */

export interface DnaBlockMeta {
  key: string;
  category: 'structural' | 'adaptive';
  labelKey: string; // i18n key
}

export const DNA_BLOCKS: DnaBlockMeta[] = [
  // STRUCTURAL — immutable by system
  { key: 'block_1_audience', category: 'structural', labelKey: 'dna.blocks.audience' },
  { key: 'block_3_solution', category: 'structural', labelKey: 'dna.blocks.solution' },
  { key: 'block_4_differentiators', category: 'structural', labelKey: 'dna.blocks.differentiators' },
  { key: 'block_9_emotional_connection', category: 'structural', labelKey: 'dna.blocks.emotionalConnection' },
  { key: 'block_10_transformation', category: 'structural', labelKey: 'dna.blocks.transformation' },
  { key: 'block_11_voice', category: 'structural', labelKey: 'dna.blocks.voice' },

  // ADAPTIVE — evolutive, can receive suggestions
  { key: 'block_2_pain_points', category: 'adaptive', labelKey: 'dna.blocks.painPoints' },
  { key: 'block_5_awareness_stage', category: 'adaptive', labelKey: 'dna.blocks.awarenessStage' },
  { key: 'block_6_urgency', category: 'adaptive', labelKey: 'dna.blocks.urgency' },
  { key: 'block_7_social_proof', category: 'adaptive', labelKey: 'dna.blocks.socialProof' },
  { key: 'block_8_objections', category: 'adaptive', labelKey: 'dna.blocks.objections' },
  { key: 'block_12_promises', category: 'adaptive', labelKey: 'dna.blocks.promises' },
];

export const STRUCTURAL_BLOCKS = DNA_BLOCKS.filter(b => b.category === 'structural').map(b => b.key);
export const ADAPTIVE_BLOCKS = DNA_BLOCKS.filter(b => b.category === 'adaptive').map(b => b.key);

export function isStructuralBlock(blockKey: string): boolean {
  return STRUCTURAL_BLOCKS.includes(blockKey);
}

export function isAdaptiveBlock(blockKey: string): boolean {
  return ADAPTIVE_BLOCKS.includes(blockKey);
}

export function getBlockMeta(blockKey: string): DnaBlockMeta | undefined {
  return DNA_BLOCKS.find(b => b.key === blockKey);
}

/**
 * Version limits per plan — enforced both on frontend and backend (DB trigger).
 * These must stay in sync with the check_version_limit() DB function.
 */
export const VERSION_LIMITS: Record<string, number> = {
  free: 50,
  starter: 50,
  pro: 500,
  legend: 1000,
};

/**
 * DNA project limits per plan (re-exported for convenience alongside version limits).
 */
export const DNA_LIMITS: Record<string, number> = {
  free: 1,
  starter: 1,
  pro: 10,
  legend: 50,
};
