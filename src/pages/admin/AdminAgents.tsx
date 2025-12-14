import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Settings, Loader2, Target, Film, FileText, Rocket, Mail, Megaphone, Newspaper, Clapperboard, type LucideIcon } from 'lucide-react';
import { useAgents } from '@/hooks/useAgents';
import { useToast } from '@/hooks/use-toast';

const iconMap: Record<string, LucideIcon> = {
  Target,
  Film,
  FileText,
  Rocket,
  Mail,
  Megaphone,
  Newspaper,
  Clapperboard
};

const AdminAgents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { agents, loading, updateAgent } = useAgents();

  const getAgentIcon = (iconName: string): LucideIcon => {
    return iconMap[iconName] || Target;
  };

  const handleToggleActive = async (agentId: string, currentStatus: boolean) => {
    try {
      await updateAgent(agentId, { is_active: !currentStatus });
      toast({
        title: currentStatus ? "Agente desativado" : "Agente ativado",
        description: "Status atualizado com sucesso"
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  // Separate agents by category
  const copywritingAgents = agents.filter(agent => !agent.category?.includes('campaign'));
  const campaignAgents = agents.filter(agent => agent.category?.includes('campaign'));

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const renderAgentCard = (agent: any) => {
    const Icon = getAgentIcon(agent.icon);
    
    return (
      <Card key={agent.id} className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div 
              className="p-3 rounded-lg"
              style={{ backgroundColor: `${agent.color}20` }}
            >
              <Icon className="h-6 w-6" style={{ color: agent.color }} />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={agent.is_active ? "default" : "outline"}>
                {agent.is_active ? t('admin.agents.active') : t('admin.agents.inactive')}
              </Badge>
              <Switch
                checked={agent.is_active}
                onCheckedChange={() => handleToggleActive(agent.id, agent.is_active)}
              />
            </div>
          </div>
          <CardTitle className="mt-4">{agent.name}</CardTitle>
          <CardDescription className="line-clamp-2">{agent.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2 text-xs">
            {agent.is_public && <Badge variant="secondary">Público</Badge>}
            {agent.is_featured && <Badge variant="secondary">Destaque</Badge>}
            {agent.category && <Badge variant="outline">{agent.category}</Badge>}
          </div>
          <Button 
            className="w-full" 
            variant="outline"
            onClick={() => navigate(`/admin/agents/${agent.slug}`)}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('admin.agents.configure')}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.agents.title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.agents.subtitle')} ({agents.length} agentes)
          </p>
        </div>

        {/* Copywriting Agents */}
        {copywritingAgents.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Agentes de Copywriting ({copywritingAgents.length})</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {copywritingAgents.map(renderAgentCard)}
            </div>
          </div>
        )}

        {/* Campaign Agents */}
        {campaignAgents.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">Agentes de Campanha ({campaignAgents.length})</h2>
              <Badge variant="secondary">Novo</Badge>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {campaignAgents.map(renderAgentCard)}
            </div>
          </div>
        )}

        {agents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Nenhum agente cadastrado.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAgents;