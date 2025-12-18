import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Video, FileText, Mail, Megaphone, ArrowRight, Target, Rocket, Newspaper, Clapperboard, Sparkles, CheckCircle2, type LucideIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
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
}

export function AgentSelectionModal({
  open,
  onOpenChange,
  mappingId,
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

  const renderAgentCard = (agent: any, index: number) => {
    const Icon = getAgentIcon(agent.icon);
    const { name, description } = getAgentTranslation(agent);
    
    return (
      <motion.div
        key={agent.slug}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Card
          className={cn(
            'p-4 cursor-pointer transition-all duration-200',
            'hover:shadow-lg hover:scale-[1.02]',
            'border-2 border-transparent hover:border-primary/30',
            'group relative overflow-hidden'
          )}
          onClick={() => handleSelectAgent(agent.slug)}
        >
          {/* Hover gradient */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              background: `linear-gradient(135deg, ${agent.color}10 0%, transparent 100%)`,
            }}
          />
          
          <div className="relative flex items-start gap-3">
            <div
              className="p-2.5 rounded-xl shrink-0 transition-transform duration-200 group-hover:scale-110"
              style={{ backgroundColor: `${agent.color}20` }}
            >
              <Icon
                className="h-5 w-5"
                style={{ color: agent.color }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm group-hover:text-primary transition-colors line-clamp-1">
                {name}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {description}
              </p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-1" />
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t('positioning.selectNextAgent', 'Criar Copys com seu Posicionamento')}
              </DialogTitle>
              <DialogDescription>
                {t('positioning.selectNextAgentDesc', 'Escolha um agente especializado para criar sua campanha')}
              </DialogDescription>
            </div>
          </div>
          
          {/* Context indicator */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-green-500/10 text-green-600 rounded-lg px-3 py-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>
              {t('positioning.contextWillBeShared', 'Seu mapeamento estratégico será automaticamente compartilhado com o agente escolhido')}
            </span>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 py-4 pr-2">
            {/* Copywriting Agents */}
            {copywritingAgents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('agents.categories.copywriting', 'Agentes de Copywriting')}
                  </h3>
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="outline" className="text-xs">
                    {copywritingAgents.length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {copywritingAgents.map((agent, i) => renderAgentCard(agent, i))}
                </div>
              </div>
            )}

            {/* Campaign Agents */}
            {campaignAgents.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('agents.categories.campaign', 'Agentes de Campanha Completa')}
                  </h3>
                  <Badge className="text-xs bg-gradient-to-r from-primary to-primary/70">
                    {t('agents.badge.new', 'Novo')}
                  </Badge>
                  <div className="h-px flex-1 bg-border" />
                  <Badge variant="outline" className="text-xs">
                    {campaignAgents.length}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground -mt-1">
                  {t('agents.categories.campaignDesc', 'Campanhas prontas para uso imediato com todos os assets inclusos')}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {campaignAgents.map((agent, i) => renderAgentCard(agent, i + copywritingAgents.length))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
