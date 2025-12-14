import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Video, FileText, Mail, Megaphone, ArrowRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AgentOption {
  slug: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color: string;
}

const AGENT_OPTIONS: AgentOption[] = [
  {
    slug: 'vsl-monster',
    name: 'VSL Monster',
    description: 'Criar um vídeo de vendas completo',
    icon: Video,
    color: '#E53E3E',
  },
  {
    slug: 'sales-page-monster',
    name: 'Sales Page Monster',
    description: 'Criar uma página de vendas persuasiva',
    icon: FileText,
    color: '#38A169',
  },
  {
    slug: 'email-monster',
    name: 'Email Monster',
    description: 'Criar sequência de emails de vendas',
    icon: Mail,
    color: '#D69E2E',
  },
  {
    slug: 'ads-monster',
    name: 'Ads Monster',
    description: 'Criar anúncios para Meta/Google',
    icon: Megaphone,
    color: '#3182CE',
  },
];

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

  const handleSelectAgent = (agentSlug: string) => {
    // Store mapping context for the next agent
    if (mappingId) {
      localStorage.setItem('positioning_mapping_id', mappingId);
    }
    
    onOpenChange(false);
    navigate(`/dashboard/agent/${agentSlug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {t('positioning.selectNextAgent', 'Conectar com Próximo Agente')}
          </DialogTitle>
          <DialogDescription>
            {t('positioning.selectNextAgentDesc', 'Escolha um agente para criar sua campanha usando o mapeamento estratégico')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
          {AGENT_OPTIONS.map((agent) => {
            const Icon = agent.icon;
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
                      {agent.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {agent.description}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Card>
            );
          })}
        </div>

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
