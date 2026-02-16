import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAgents } from '@/hooks/useAgents';
import { Loader2, Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard, type LucideIcon } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Target,
  Film,
  FileText,
  Rocket,
  Mail,
  Megaphone,
  Newspaper,
  Clapperboard
};

// Map agent slugs to translation keys
const slugToTranslationKey: Record<string, string> = {
  'brand-positioning-monster': 'positioner',
  'vsl-monster': 'vsl',
  'sales-page-monster': 'sales',
  'launch-monster': 'launch',
  'email-monster': 'email',
  'ads-monster': 'ads',
  'headline-monster': 'headline',
  'short-monster': 'short',
  // Campaign agents
  'internal-launch-monster': 'internalLaunch',
  'flash-launch-monster': 'flashLaunch',
  'evergreen-funnel-monster': 'evergreenFunnel',
  'webinar-campaign-monster': 'webinarCampaign',
  'cart-recovery-monster': 'cartRecovery',
  'lead-nurture-monster': 'leadNurture',
  'upsell-cross-monster': 'upsellCross',
  'list-revival-monster': 'listRevival',
  'full-vsl-script-monster': 'fullVslScript',
  'whatsapp-sales-monster': 'whatsappSales',
  'high-conversion-ads-monster': 'highConversionAds',
  'strategic-stories-monster': 'strategicStories',
  'reels-tiktok-monster': 'reelsTiktok',
  'carousel-monster': 'carousel',
};

export default function Agents() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { agents, loading } = useAgents();

  // Filter only active and public agents, exclude the entry agent (brand-positioning-monster)
  const activeAgents = agents.filter(
    agent => agent.is_active && agent.is_public && agent.slug !== 'brand-positioning-monster'
  );

  // Separate copywriting agents from campaign agents
  const copywritingAgents = activeAgents.filter(agent => 
    !agent.category?.includes('campaign')
  );
  const campaignAgents = activeAgents.filter(agent => 
    agent.category?.includes('campaign')
  );

  const getAgentIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Target;
  };

  const getAgentBadge = (agent: any) => {
    if (agent.is_featured) return t('agents.badge.popular');
    if (agent.category === 'campaign') return t('agents.badge.new');
    return null;
  };

  // Get translated name and description for an agent
  const getAgentTranslation = (agent: any) => {
    const key = slugToTranslationKey[agent.slug];
    if (key) {
      const translatedName = t(`agents.list.${key}.name`, { defaultValue: '' });
      const translatedDesc = t(`agents.list.${key}.description`, { defaultValue: '' });
      return {
        name: translatedName || agent.name,
        description: translatedDesc || agent.description,
      };
    }
    return { name: agent.name, description: agent.description };
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const renderAgentCard = (agent: any) => {
    const Icon = getAgentIcon(agent.icon);
    const badge = getAgentBadge(agent);
    const { name, description } = getAgentTranslation(agent);

    return (
      <Card 
        key={agent.id}
        className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
        onClick={() => navigate(`/dashboard/agents/${agent.slug}`)}
      >
        <div className="space-y-4">
          <div className="flex items-start justify-between">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${agent.color}20` }}
            >
              <Icon 
                className="h-8 w-8" 
                style={{ color: agent.color }}
              />
            </div>
            {badge && (
              <Badge variant="secondary">{badge}</Badge>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-3">
              {description}
            </p>
          </div>

          <Button 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/dashboard/agents/${agent.slug}`);
            }}
          >
            {t('agents.page.launchAgent')}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('agents.page.title')}</h1>
          <p className="text-muted-foreground">
            {t('agents.page.subtitle')}
          </p>
        </div>

        {/* Copywriting Agents */}
        {copywritingAgents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">{t('agents.categories.copywriting', 'Agentes de Copywriting')}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {copywritingAgents.map(renderAgentCard)}
            </div>
          </div>
        )}

        {/* Campaign Agents */}
        {campaignAgents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-semibold">{t('agents.categories.campaign', 'Agentes de Campanha Completa')}</h2>
              <Badge variant="secondary" className="text-xs">{t('agents.badge.new', 'Novo')}</Badge>
            </div>
            <p className="text-muted-foreground">
              {t('agents.categories.campaignDescription', 'Campanhas prontas para uso imediato com todos os assets inclusos')}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {campaignAgents.map(renderAgentCard)}
            </div>
          </div>
        )}

        {activeAgents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('agents.page.noAgents', 'Nenhum agente disponível no momento.')}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
