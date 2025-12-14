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
      <div className="space-y-6 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${AGENT_CONFIG.color}20` }}
          >
            <Target 
              className="h-6 w-6" 
              style={{ color: AGENT_CONFIG.color }}
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{t(`agents.list.${AGENT_CONFIG.tKey}.name`)}</h1>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {t('positioning.welcomeAgent')}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{t(`agents.list.${AGENT_CONFIG.tKey}.description`)}</p>
          </div>
        </div>

        {/* Welcome Card */}
        <Card className="p-4 border-l-4" style={{ borderLeftColor: AGENT_CONFIG.color }}>
          <div className="flex items-start gap-3">
            <div 
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: `${AGENT_CONFIG.color}15` }}
            >
              <Target className="h-5 w-5" style={{ color: AGENT_CONFIG.color }} />
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-1">{t('positioning.welcome.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('positioning.welcome.description')}
              </p>
            </div>
          </div>
        </Card>

        {/* Chat Interface */}
        <Card className="flex-1 min-h-[500px] flex flex-col">
          <ChatInterface
            agentName={t(`agents.list.${AGENT_CONFIG.tKey}.name`)}
            agentColor={AGENT_CONFIG.color}
            agentSlug={AGENT_CONFIG.slug}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}
