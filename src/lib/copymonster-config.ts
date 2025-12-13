import { 
  Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard,
  type LucideIcon 
} from 'lucide-react';

export interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
  systemPrompt: string;
  category: string;
  tKey: string;
}

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

export const AGENTS: Agent[] = [
  {
    id: '1',
    slug: 'monster-positioner',
    tKey: 'positioner',
    name: 'Monster Positioner',
    description: 'Diagnóstico completo de Brand DNA e posicionamento estratégico de marca',
    icon: Target,
    color: '#6B46C1',
    systemPrompt: 'Você é o Monster Positioner, especialista em posicionamento de marca e Brand DNA. Ajude o usuário a definir seu público-alvo, proposta de valor e diferenciais competitivos.',
    category: 'positioning'
  },
  {
    id: '2',
    slug: 'vsl-monster',
    tKey: 'vsl',
    name: 'VSL Monster',
    description: 'Criação de roteiros de VSL (Video Sales Letter) de alta conversão',
    icon: Film,
    color: '#F56565',
    systemPrompt: 'Você é o VSL Monster, especialista em criar roteiros de VSL persuasivos. Foque em storytelling, ganchos emocionais e calls-to-action poderosos.',
    category: 'video'
  },
  {
    id: '3',
    slug: 'sales-page-monster',
    tKey: 'sales',
    name: 'Sales Page Monster',
    description: 'Desenvolvimento de páginas de vendas otimizadas para conversão',
    icon: FileText,
    color: '#38A169',
    systemPrompt: 'Você é o Sales Page Monster, mestre em criar páginas de vendas. Use frameworks como PAS, AIDA e FAB para maximizar conversões.',
    category: 'sales'
  },
  {
    id: '4',
    slug: 'launch-monster',
    tKey: 'launch',
    name: 'Launch Monster',
    description: 'Planejamento e execução de lançamentos estratégicos de produtos',
    icon: Rocket,
    color: '#4299E1',
    systemPrompt: 'Você é o Launch Monster, especialista em lançamentos de produtos. Crie sequências de lançamento, gatilhos mentais e estratégias de escassez.',
    category: 'launch'
  },
  {
    id: '5',
    slug: 'email-monster',
    tKey: 'email',
    name: 'Email Monster',
    description: 'Criação de sequências de email marketing de alta performance',
    icon: Mail,
    color: '#ED8936',
    systemPrompt: 'Você é o Email Monster, expert em email marketing. Crie subject lines irresistíveis e emails que convertem.',
    category: 'email'
  },
  {
    id: '6',
    slug: 'ads-monster',
    tKey: 'ads',
    name: 'Ads Monster',
    description: 'Otimização de anúncios para Meta Ads, Google Ads e outras plataformas',
    icon: Megaphone,
    color: '#9F7AEA',
    systemPrompt: 'Você é o Ads Monster, especialista em anúncios pagos. Crie copies de ads persuasivos e headlines que param o scroll.',
    category: 'ads'
  },
  {
    id: '7',
    slug: 'headline-monster',
    tKey: 'headline',
    name: 'Headline Monster',
    description: 'Geração de headlines magnéticas que capturam atenção instantaneamente',
    icon: Newspaper,
    color: '#ECC94B',
    systemPrompt: 'Você é o Headline Monster, mestre em criar headlines irresistíveis. Use técnicas de curiosidade, benefício e urgência.',
    category: 'headlines'
  },
  {
    id: '8',
    slug: 'short-monster',
    tKey: 'short',
    name: 'Short Monster',
    description: 'Roteiros para vídeos de 1 minuto que encantam, viralizam e convertem',
    icon: Clapperboard,
    color: '#2DD4BF',
    systemPrompt: 'Você é o Short Monster, especialista em criar roteiros para vídeos curtos e virais (Reels, TikTok, Shorts). Seu foco é capturar a atenção nos primeiros 3 segundos, entregar uma mensagem poderosa e finalizar com uma chamada para ação clara, tudo em menos de 60 segundos.',
    category: 'video'
  }
];

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

export function getAgentBySlug(slug: string): Agent | undefined {
  return AGENTS.find(agent => agent.slug === slug);
}