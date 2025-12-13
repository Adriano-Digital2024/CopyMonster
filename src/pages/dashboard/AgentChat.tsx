import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { getAgentBySlug } from '@/lib/copymonster-config';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useTranslation } from 'react-i18next';

export default function AgentChat() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const agent = slug ? getAgentBySlug(slug) : null;

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <h2 className="text-2xl font-bold">{t('common.notFound')}</h2>
          <Button onClick={() => navigate('/dashboard/agents')}>
            {t('common.back')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = agent.icon;

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">{t('dashboard.menu.overview')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard/agents">{t('dashboard.menu.agents')}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t(`agents.list.${agent.tKey}.name`)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard/agents')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div 
            className="p-3 rounded-lg"
            style={{ backgroundColor: `${agent.color}20` }}
          >
            <Icon 
              className="h-6 w-6" 
              style={{ color: agent.color }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{t(`agents.list.${agent.tKey}.name`)}</h1>
            <p className="text-sm text-muted-foreground">{t(`agents.list.${agent.tKey}.description`)}</p>
          </div>
        </div>

        {/* Chat Interface */}
        <Card className="flex-1 min-h-[600px] flex flex-col">
          <ChatInterface
            agentName={t(`agents.list.${agent.tKey}.name`)}
            agentColor={agent.color}
            systemPrompt={agent.systemPrompt}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}