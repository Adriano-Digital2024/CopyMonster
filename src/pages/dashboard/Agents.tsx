import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAgents } from '@/hooks/useAgents';
import { useDnaGuard } from '@/hooks/useDnaGuard';
import { Loader2, Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard, ShieldAlert, ArrowRight, type LucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, LucideIcon> = {
  Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard
};

const slugToTranslationKey: Record<string, string> = {
  'brand-positioning-monster': 'positioner',
  'vsl-monster': 'vsl',
  'sales-page-monster': 'sales',
  'launch-monster': 'launch',
  'email-monster': 'email',
  'ads-monster': 'ads',
  'headline-monster': 'headline',
  'short-monster': 'short',
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
  const { toast } = useToast();
  const { agents, loading } = useAgents();
  const { hasDna, isLoading: dnaLoading } = useDnaGuard();

  const activeAgents = agents.filter(
    agent => agent.is_active && agent.is_public && agent.slug !== 'brand-positioning-monster'
  );

  const copywritingAgents = activeAgents.filter(agent => !agent.category?.includes('campaign'));
  const campaignAgents = activeAgents.filter(agent => agent.category?.includes('campaign'));

  const getAgentIcon = (iconName: string): LucideIcon => iconMap[iconName] || Target;

  const getAgentBadge = (agent: any) => {
    if (agent.is_featured) return t('agents.badge.popular');
    if (agent.category === 'campaign') return t('agents.badge.new');
    return null;
  };

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

  const handleAgentClick = (agentSlug: string) => {
    if (!hasDna) {
      toast({
        title: t('dna.required.title'),
        description: t('dna.required.message'),
        variant: 'destructive',
      });
      navigate('/dashboard/positioning');
      return;
    }
    navigate(`/dashboard/agents/${agentSlug}`);
  };

  if (loading || dnaLoading) {
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
        className={`p-5 cursor-pointer group border-border/60 rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-elevated ${!hasDna ? 'opacity-60' : ''}`}
        onClick={() => handleAgentClick(agent.slug)}
      >
        <div className="flex flex-col h-full gap-4">
          <div className="flex items-start justify-between">
            <div className="p-2.5 rounded-lg" style={{ backgroundColor: `${agent.color}1f` }}>
              <Icon className="h-6 w-6" style={{ color: agent.color }} />
            </div>
            {badge && <Badge variant="outline" className="text-[10px] font-medium">{badge}</Badge>}
          </div>
          <div className="space-y-1.5 flex-1">
            <h3 className="text-base font-semibold leading-tight group-hover:text-primary transition-colors">{name}</h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="justify-start px-0 h-auto text-primary hover:text-primary hover:bg-transparent group-hover:gap-3 transition-all"
            onClick={(e) => { e.stopPropagation(); handleAgentClick(agent.slug); }}
          >
            {t('agents.page.launchAgent')}
            <ArrowRight className="h-4 w-4" />
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
          <p className="text-muted-foreground">{t('agents.page.subtitle')}</p>
        </div>

        {/* DNA Required Banner */}
        {!hasDna && (
          <Card className="p-6 border-primary/30 bg-primary/5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-full bg-primary/10">
                <ShieldAlert className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 space-y-2">
                <h3 className="text-lg font-semibold">{t('dna.required.title')}</h3>
                <p className="text-sm text-muted-foreground">{t('dna.required.message')}</p>
                <Button onClick={() => navigate('/dashboard/positioning')} className="gap-2 mt-2">
                  <Target className="h-4 w-4" />
                  {t('dna.required.cta')}
                </Button>
              </div>
            </div>
          </Card>
        )}

        {copywritingAgents.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold">{t('agents.categories.copywriting', 'Agentes de Copywriting')}</h2>
              <span className="text-xs text-muted-foreground">{copywritingAgents.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {copywritingAgents.map(renderAgentCard)}
            </div>
          </div>
        )}

        {campaignAgents.length > 0 && (
          <div className="space-y-5">
            <div className="flex items-baseline gap-3">
              <h2 className="text-lg font-semibold">{t('agents.categories.campaign', 'Agentes de Campanha Completa')}</h2>
              <span className="text-xs text-muted-foreground">{campaignAgents.length}</span>
              <Badge variant="outline" className="text-[10px]">{t('agents.badge.new', 'Novo')}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('agents.categories.campaignDescription', 'Campanhas prontas para uso imediato com todos os assets inclusos')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
