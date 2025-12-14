import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Target, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useTranslation } from 'react-i18next';

const AGENT_CONFIG = {
  slug: 'brand-positioning-monster',
  name: 'Brand Positioning Monster (DNA)',
  color: '#6B46C1',
  tKey: 'positioner'
};

export default function Positioning() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <DashboardLayout>
      <div className="space-y-4 h-full flex flex-col">
        {/* Compact Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div 
            className="p-2.5 rounded-lg"
            style={{ backgroundColor: `${AGENT_CONFIG.color}20` }}
          >
            <Target 
              className="h-5 w-5" 
              style={{ color: AGENT_CONFIG.color }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">{t(`agents.list.${AGENT_CONFIG.tKey}.name`)}</h1>
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <Sparkles className="h-3 w-3" />
                {t('positioning.guided')}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{t('positioning.subtitle')}</p>
          </div>
        </div>

        {/* Chat Interface - Full Height with Auto-Start */}
        <Card className="flex-1 min-h-[600px] flex flex-col overflow-hidden">
          <ChatInterface
            agentName={t(`agents.list.${AGENT_CONFIG.tKey}.name`)}
            agentColor={AGENT_CONFIG.color}
            agentSlug={AGENT_CONFIG.slug}
            autoStart={true}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
