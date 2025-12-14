// XP and Level Configuration - Agent list is now managed in the database

export interface XPLevel {
  level: number;
  name: string;
  minXP: number;
  icon: string;
  benefits: string[];
}

export interface XPAction {
  action: string;
  xp: number;
}

export const XP_LEVELS: XPLevel[] = [
  {
    level: 1,
    name: 'Novice',
    minXP: 0,
    icon: '🥚',
    benefits: ['Acesso aos 7 agentes básicos', '100 créditos iniciais']
  },
  {
    level: 2,
    name: 'Junior',
    minXP: 100,
    icon: '🐣',
    benefits: ['Histórico estendido de conversas', '+50 créditos bônus', 'Badge de Junior']
  },
  {
    level: 3,
    name: 'Pro',
    minXP: 500,
    icon: '👹',
    benefits: ['Acesso prioritário a novos agentes', '+100 créditos bônus', 'Análises avançadas', 'Badge de Pro']
  },
  {
    level: 4,
    name: 'Legend',
    minXP: 2000,
    icon: '👑',
    benefits: ['Treinamento personalizado de agentes', '+200 créditos bônus', 'Suporte VIP', 'Badge de Legend']
  }
];

export const XP_ACTIONS: XPAction[] = [
  { action: 'complete_diagnosis', xp: 50 },
  { action: 'create_campaign', xp: 30 },
  { action: 'generate_copy', xp: 10 },
  { action: 'save_headline', xp: 5 },
  { action: 'complete_chat_session', xp: 15 },
  { action: 'export_result', xp: 5 }
];

export function calculateLevel(xp: number): XPLevel {
  const level = [...XP_LEVELS].reverse().find(l => xp >= l.minXP) || XP_LEVELS[0];
  return level;
}

export function getXPProgress(xp: number): { current: number; next: number; percentage: number } {
  const currentLevel = calculateLevel(xp);
  const nextLevelIndex = XP_LEVELS.findIndex(l => l.level === currentLevel.level) + 1;
  
  if (nextLevelIndex >= XP_LEVELS.length) {
    return { current: xp, next: xp, percentage: 100 };
  }
  
  const nextLevel = XP_LEVELS[nextLevelIndex];
  const xpInCurrentLevel = xp - currentLevel.minXP;
  const xpNeededForNext = nextLevel.minXP - currentLevel.minXP;
  const percentage = Math.round((xpInCurrentLevel / xpNeededForNext) * 100);
  
  return { current: xpInCurrentLevel, next: xpNeededForNext, percentage };
}