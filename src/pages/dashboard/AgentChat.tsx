import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard, Info, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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

interface PositioningMapping {
  id: string;
  title: string;
  conversation: any;
  completed_blocks: number;
}

export default function AgentChat() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [positioningContext, setPositioningContext] = useState<PositioningMapping | null>(null);

  useEffect(() => {
    if (slug) {
      // Fetch agent
      supabase
        .from('agents')
        .select('id, slug, name, description, icon, color, system_prompt')
        .eq('slug', slug)
        .single()
        .then(({ data, error }) => {
          if (!error && data) setAgent(data);
          setLoading(false);
        });

      // Check for positioning context
      const mappingId = localStorage.getItem('positioning_mapping_id');
      if (mappingId) {
        supabase
          .from('positioning_mappings')
          .select('id, title, conversation, completed_blocks')
          .eq('id', mappingId)
          .single()
          .then(({ data, error }) => {
            if (!error && data) {
              setPositioningContext(data);
            }
            // Clear from localStorage after loading
            localStorage.removeItem('positioning_mapping_id');
          });
      }
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

  // Build system prompt with positioning context if available
  let enhancedSystemPrompt = agent.system_prompt;
  if (positioningContext) {
    const contextSummary = extractPositioningSummary(positioningContext);
    enhancedSystemPrompt = `${agent.system_prompt}\n\n# POSITIONING CONTEXT FROM USER\nThe user has completed a strategic positioning mapping. Use this context to create more targeted and relevant copy:\n\n${contextSummary}`;
  }

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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          </div>
          {positioningContext && (
            <Badge variant="secondary" className="gap-1.5">
              <Info className="h-3 w-3" />
              {t('agents.positioningContextLoaded', 'Contexto de posicionamento carregado')}
            </Badge>
          )}
        </div>

        <Card className="flex-1 min-h-[600px] flex flex-col">
          <ChatInterface
            agentName={agent.name}
            agentColor={agent.color}
            agentSlug={agent.slug}
            systemPrompt={enhancedSystemPrompt}
          />
        </Card>
      </div>
    </DashboardLayout>
  );
}

// Helper to extract key positioning information
function extractPositioningSummary(mapping: PositioningMapping): string {
  if (!mapping.conversation || !Array.isArray(mapping.conversation)) {
    return `Positioning Title: ${mapping.title}`;
  }

  // Get the last assistant message which usually contains the final mapping
  const assistantMessages = mapping.conversation
    .filter((m: any) => m.role === 'assistant' && m.content)
    .map((m: any) => m.content);

  const lastMessage = assistantMessages[assistantMessages.length - 1] || '';
  
  // If the last message contains the complete mapping, use it
  if (lastMessage.includes('MAPEAMENTO ESTRATÉGICO') || 
      lastMessage.includes('STRATEGIC MAPPING') ||
      lastMessage.includes('MAPEO ESTRATÉGICO')) {
    return lastMessage;
  }

  // Otherwise compile key points
  let summary = `Positioning Title: ${mapping.title}\n\n`;
  summary += `Completed Blocks: ${mapping.completed_blocks}/12\n\n`;
  
  // Add relevant excerpts from the conversation
  if (assistantMessages.length > 0) {
    summary += 'Key positioning points from conversation:\n';
    assistantMessages.slice(-5).forEach((msg: string, i: number) => {
      summary += `\n--- Point ${i + 1} ---\n${msg.slice(0, 500)}${msg.length > 500 ? '...' : ''}\n`;
    });
  }

  return summary;
}