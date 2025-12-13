// Mock data service for development

export interface MockUser {
  id: string;
  firstName: string;
  email: string;
  phone: string;
  credits: number;
  subscriptionStatus: 'free' | 'pro' | 'legend';
  xp: number;
  level: number;
  isAdmin: boolean;
  createdAt: string;
  lastActive: string;
}

export interface MockCampaign {
  id: string;
  name: string;
  agentUsed: string;
  status: 'in_progress' | 'completed' | 'draft';
  createdAt: string;
  copyScore?: number;
}

export interface MockHeadline {
  id: string;
  text: string;
  category: 'vsl' | 'sales_page' | 'email' | 'ads';
  copyScore: number;
  isFavorite: boolean;
  createdAt: string;
}

export interface MockDiscount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MockTransaction {
  id: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
}

export const generateMockUsers = (): MockUser[] => {
  const firstNames = ['Ana', 'Bruno', 'Carlos', 'Diana', 'Eduardo', 'Fernanda', 'Gabriel', 'Helena', 'Igor', 'Julia', 'Lucas', 'Maria', 'Nicolas', 'Olivia', 'Pedro', 'Rafaela', 'Sergio', 'Tatiana', 'Victor', 'Yasmin'];
  const lastNames = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima'];
  const plans: Array<'free' | 'pro' | 'legend'> = ['free', 'free', 'free', 'pro', 'pro', 'legend'];
  
  return Array.from({ length: 25 }, (_, i) => {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const plan = plans[Math.floor(Math.random() * plans.length)];
    const xp = Math.floor(Math.random() * 3000);
    
    return {
      id: `user-${i + 1}`,
      firstName,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.com`,
      phone: `+55 11 9${Math.floor(Math.random() * 10000)}-${Math.floor(Math.random() * 10000)}`,
      credits: Math.floor(Math.random() * 500) + 50,
      subscriptionStatus: plan,
      xp,
      level: xp < 100 ? 1 : xp < 500 ? 2 : xp < 2000 ? 3 : 4,
      isAdmin: i === 0,
      createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
      lastActive: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    };
  });
};

export const generateMockCampaigns = (): MockCampaign[] => {
  const agents = ['Monster Positioner', 'VSL Monster', 'Sales Page Monster', 'Launch Monster', 'Email Monster', 'Ads Monster', 'Headline Monster'];
  const statuses: Array<'in_progress' | 'completed' | 'draft'> = ['in_progress', 'completed', 'draft'];
  
  return Array.from({ length: 8 }, (_, i) => ({
    id: `campaign-${i + 1}`,
    name: `Campanha ${i + 1}`,
    agentUsed: agents[Math.floor(Math.random() * agents.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    copyScore: Math.random() > 0.5 ? Math.floor(Math.random() * 30) + 70 : undefined
  }));
};

export const generateMockHeadlines = (): MockHeadline[] => {
  const headlines = [
    'Descubra o Segredo que 97% dos Empreendedores Ignoram',
    'Como Triplicar Suas Vendas em 30 Dias (Sem Gastar Mais)',
    'A Fórmula Comprovada para Escalar Seu Negócio',
    'Pare de Perder Dinheiro: Este Erro Está Custando Caro',
    'O Método Usado por Experts para Dominar o Mercado',
    'Transforme Visitantes em Clientes com Esta Estratégia',
    'Você Está Cometendo Este Erro Fatal em Suas Vendas?',
    'A Verdade Sobre Copywriting que Ninguém te Conta'
  ];
  const categories: Array<'vsl' | 'sales_page' | 'email' | 'ads'> = ['vsl', 'sales_page', 'email', 'ads'];
  
  return headlines.map((text, i) => ({
    id: `headline-${i + 1}`,
    text,
    category: categories[Math.floor(Math.random() * categories.length)],
    copyScore: Math.floor(Math.random() * 30) + 70,
    isFavorite: Math.random() > 0.7,
    createdAt: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

export const generateMockDiscounts = (): MockDiscount[] => {
  const codes = ['LAUNCH50', 'PROMO30', 'FIRST20', 'VIP40', 'SPECIAL25', 'WELCOME15', 'SAVE35', 'MEGA45', 'BLACK60', 'CYBER55'];
  
  return codes.map((code, i) => ({
    id: `discount-${i + 1}`,
    code,
    type: Math.random() > 0.5 ? 'percentage' : 'fixed',
    value: Math.random() > 0.5 ? Math.floor(Math.random() * 50) + 10 : Math.floor(Math.random() * 100) + 20,
    maxUses: Math.random() > 0.3 ? Math.floor(Math.random() * 100) + 10 : null,
    currentUses: Math.floor(Math.random() * 50),
    expiresAt: Math.random() > 0.4 ? new Date(Date.now() + Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString() : null,
    isActive: Math.random() > 0.2,
    createdAt: new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

export const generateMockTransactions = (): MockTransaction[] => {
  const descriptions = ['Upgrade para Pro', 'Recarga de Créditos', 'Assinatura Legend', 'Compra de Créditos', 'Renovação Pro'];
  const statuses: Array<'completed' | 'pending' | 'failed'> = ['completed', 'completed', 'completed', 'pending', 'failed'];
  
  return Array.from({ length: 10 }, (_, i) => ({
    id: `txn-${i + 1}`,
    amount: Math.floor(Math.random() * 200) + 50,
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    status: statuses[Math.floor(Math.random() * statuses.length)],
    date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString()
  }));
};

// Export instances for direct use
export const mockUsers = generateMockUsers().map((user, index) => ({
  id: user.id,
  name: user.firstName,
  email: user.email,
  plan: user.subscriptionStatus,
  credits: user.credits,
  joined: new Date(user.createdAt).toLocaleDateString(),
}));

export const mockDiscounts = generateMockDiscounts().map((discount) => ({
  id: discount.id,
  code: discount.code,
  type: discount.type,
  value: discount.value,
  uses: discount.currentUses,
  maxUses: discount.maxUses,
  expiresAt: discount.expiresAt,
  active: discount.isActive,
}));

// Analytics data
export const mockAnalyticsData = {
  userGrowth: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    users: Math.floor(Math.random() * 50) + 800 + i * 5,
  })),
  revenue: Array.from({ length: 12 }, (_, i) => ({
    month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR', { month: 'short' }),
    amount: Math.floor(Math.random() * 10000) + 20000,
  })),
  creditsUsage: Array.from({ length: 30 }, (_, i) => ({
    day: `Day ${i + 1}`,
    credits: Math.floor(Math.random() * 5000) + 3000,
  })),
  planDistribution: [
    { name: 'Free', value: 680 },
    { name: 'Pro', value: 420 },
    { name: 'Legend', value: 134 },
  ],
  topAgents: [
    { name: 'VSL Monster', usage: 1234, color: '#F56565' },
    { name: 'Sales Page Monster', usage: 987, color: '#38A169' },
    { name: 'Email Monster', usage: 856, color: '#ED8936' },
    { name: 'Ads Monster', usage: 742, color: '#9F7AEA' },
    { name: 'Launch Monster', usage: 623, color: '#4299E1' },
  ],
  topUsers: [
    { name: 'Carlos Silva', email: 'carlos.silva@example.com', credits: 2340 },
    { name: 'Ana Costa', email: 'ana.costa@example.com', credits: 1890 },
    { name: 'Bruno Santos', email: 'bruno.santos@example.com', credits: 1567 },
    { name: 'Diana Lima', email: 'diana.lima@example.com', credits: 1423 },
    { name: 'Eduardo Souza', email: 'eduardo.souza@example.com', credits: 1298 },
  ],
};
