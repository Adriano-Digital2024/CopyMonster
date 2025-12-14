import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';

const iconMap: Record<string, LucideIcon> = {
  Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard
};

interface Agent {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  system_prompt: string;
}

export default function AgentChat() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) {
      supabase
        .from('agents')
        .select('id, slug, name, description, icon, color, system_prompt')
        .eq('slug', slug)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setAgent(data);
          setLoading(false);
        });
    }
  }, [slug]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!agent) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <h2 className="text-2xl font-bold">{t('common.notFound')}</h2>
          <Button onClick={() => navigate('/dashboard/agents')}>{t('common.back')}</Button>
        </div>
      </DashboardLayout>
    );
  }

  const Icon = iconMap[agent.icon] || Target;

  return (
    <DashboardLayout>
      <div className="space-y-6 h-full flex flex-col">
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
              <BreadcrumbPage>{agent.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/agents')}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="p-3 rounded-lg" style={{ backgroundColor: `${agent.color}20` }}>
            <Icon className="h-6 w-6" style={{ color: agent.color }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          </div>
        </div>

        <Card className="flex-1 min-h-[600px] flex flex-col">
          <ChatInterface
            agentName={agent.name}
            agentColor={agent.color}
            agentSlug={agent.slug}
            systemPrompt={agent.system_prompt}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}