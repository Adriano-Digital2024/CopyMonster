import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, FileText, Mail, Megaphone, ArrowRight, Target, Rocket, Newspaper, Clapperboard, type LucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAgents } from '@/hooks/useAgents';
import { Loader2 } from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Target,
  Film: Video,
  FileText,
  Rocket,
  Mail,
  Megaphone,
  Newspaper,
  Clapperboard,
  Video,
};

// Map agent slugs to translation keys
const slugToTranslationKey: Record<string, string> = {
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
};

interface AgentSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mappingId?: string;
  onSaveFirst?: () => void;
}

export function AgentSelectionModal({
  open,
  onOpenChange,
  mappingId,
  onSaveFirst,
}: AgentSelectionModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { agents, loading } = useAgents();

  // Filter active, public agents excluding the positioning agent
  const availableAgents = agents.filter(
    agent => agent.is_active && agent.is_public && agent.slug !== 'brand-positioning-monster'
  );

  // Separate copywriting and campaign agents
  const copywritingAgents = availableAgents.filter(agent => !agent.category?.includes('campaign'));
  const campaignAgents = availableAgents.filter(agent => agent.category?.includes('campaign'));

  const handleSelectAgent = (agentSlug: string) => {
    if (mappingId) {
      localStorage.setItem('positioning_mapping_id', mappingId);
    }
    onOpenChange(false);
    navigate(`/dashboard/agents/${agentSlug}`);
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

  const getAgentIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Target;
  };

  const renderAgentCard = (agent: any) => {
    const Icon = getAgentIcon(agent.icon);
    const { name, description } = getAgentTranslation(agent);
    
    return (
      <Card
        key={agent.slug}
        className={cn(
          'p-4 cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:scale-[1.02] hover:border-primary/50',
          'group'
        )}
        onClick={() => handleSelectAgent(agent.slug)}
      >
        <div className="flex items-start gap-3">
          <div
            className="p-2.5 rounded-lg shrink-0"
            style={{ backgroundColor: `${agent.color}20` }}
          >
            <Icon
              className="h-5 w-5"
              style={{ color: agent.color }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">
              {name}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('positioning.selectNextAgent', 'Conectar com Próximo Agente')}
          </DialogTitle>
          <DialogDescription>
            {t('positioning.selectNextAgentDesc', 'Escolha um agente para criar sua campanha usando o mapeamento estratégico')}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Copywriting Agents */}
            {copywritingAgents.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {t('agents.categories.copywriting', 'Agentes de Copywriting')}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {copywritingAgents.map(renderAgentCard)}
                </div>
              </div>
            )}

            {/* Campaign Agents */}
            {campaignAgents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {t('agents.categories.campaign', 'Agentes de Campanha Completa')}
                  </h3>
                  <Badge variant="secondary" className="text-xs">{t('agents.badge.new', 'Novo')}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campaignAgents.map(renderAgentCard)}
                </div>
              </div>
            )}
          </div>
        )}

        {onSaveFirst && (
          <div className="flex justify-end pt-2 border-t">
            <Button variant="outline" onClick={onSaveFirst}>
              {t('positioning.saveFirst', 'Salvar Mapeamento Primeiro')}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
