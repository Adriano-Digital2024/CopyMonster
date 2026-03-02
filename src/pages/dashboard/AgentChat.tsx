import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Loader2, Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard, Info, ShieldAlert, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { useDnaGuard } from '@/hooks/useDnaGuard';
import { useMetaPixel } from '@/hooks/useMetaPixel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

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
  const { t, i18n } = useTranslation();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDnaId, setSelectedDnaId] = useState<string | null>(null);
  const [showDnaSelector, setShowDnaSelector] = useState(false);
  const { hasDna, dnaList, isLoading: dnaLoading } = useDnaGuard();
  const { trackViewContent } = useMetaPixel();

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

  // Track ViewContent when agent loads
  useEffect(() => {
    if (agent) {
      trackViewContent({ content_name: agent.name, content_category: 'agent', content_ids: [agent.slug] });
    }
  }, [agent, trackViewContent]);

  // Auto-select DNA if only one exists, or show selector
  useEffect(() => {
    if (!dnaLoading && hasDna && agent && agent.slug !== 'brand-positioning-monster') {
      // Check localStorage first (coming from AgentSelectionModal)
      const mappingId = localStorage.getItem('positioning_mapping_id');
      if (mappingId) {
        setSelectedDnaId(mappingId);
        localStorage.removeItem('positioning_mapping_id');
      } else if (dnaList.length === 1) {
        setSelectedDnaId(dnaList[0].id);
      } else if (dnaList.length > 1) {
        setShowDnaSelector(true);
      }
    }
  }, [dnaLoading, hasDna, dnaList, agent]);

  if (loading || dnaLoading) {
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

  // DNA guard - block access if no DNA (except for the DNA agent itself)
  if (!hasDna && agent.slug !== 'brand-positioning-monster') {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-6 max-w-lg mx-auto text-center">
          <div className="p-4 rounded-full bg-primary/10">
            <ShieldAlert className="h-12 w-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">{t('dna.required.title')}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {t('dna.required.message')}
          </p>
          <Button size="lg" onClick={() => navigate('/dashboard/positioning')} className="gap-2">
            <Target className="h-5 w-5" />
            {t('dna.required.cta')}
          </Button>
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{agent.name}</h1>
            <p className="text-sm text-muted-foreground">{agent.description}</p>
          </div>
          {selectedDnaId && (
            <Badge variant="secondary" className="gap-1.5 cursor-pointer" onClick={() => dnaList.length > 1 && setShowDnaSelector(true)}>
              <Info className="h-3 w-3" />
              {t('dna.contextLoaded')}
            </Badge>
          )}
        </div>

        <Card className="flex-1 min-h-[600px] flex flex-col">
          <ChatInterface
            agentName={agent.name}
            agentColor={agent.color}
            agentSlug={agent.slug}
            systemPrompt={agent.system_prompt}
            positioningMappingId={selectedDnaId || undefined}
          />
        </Card>
      </div>

      {/* DNA Selector Dialog */}
      <Dialog open={showDnaSelector} onOpenChange={setShowDnaSelector}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('dna.selector.title')}</DialogTitle>
            <DialogDescription>{t('dna.selector.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <Label>{t('dna.selector.label')}</Label>
            <Select value={selectedDnaId || ''} onValueChange={setSelectedDnaId}>
              <SelectTrigger>
                <SelectValue placeholder={t('dna.selector.placeholder')} />
              </SelectTrigger>
              <SelectContent>
                {dnaList.map((dna) => (
                  <SelectItem key={dna.id} value={dna.id}>
                    {dna.title} — {new Date(dna.updated_at).toLocaleDateString(i18n.language)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDnaSelector(false)} disabled={!selectedDnaId}>
              {t('dna.selector.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
