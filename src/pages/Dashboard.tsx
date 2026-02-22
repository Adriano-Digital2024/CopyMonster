import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Zap, 
  TrendingUp, 
  Target,
  Film,
  FileText,
  Rocket,
  Mail,
  Megaphone,
  Newspaper,
  Clapperboard,
  Loader2,
  type LucideIcon
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { getXPProgress } from '@/lib/copymonster-config';
import { useAgents } from '@/hooks/useAgents';
import { useDnaGuard } from '@/hooks/useDnaGuard';
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

const colorMap: Record<string, string> = {
  '#6B46C1': 'text-purple-500',
  '#F56565': 'text-red-500',
  '#38A169': 'text-green-500',
  '#4299E1': 'text-blue-500',
  '#ED8936': 'text-orange-500',
  '#9F7AEA': 'text-purple-500',
  '#ECC94B': 'text-yellow-500',
  '#2DD4BF': 'text-teal-500'
};

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { agents, loading: agentsLoading } = useAgents();
  const { hasDna } = useDnaGuard();

  if (!user) {
    return null; 
  }

  // Get first 8 active agents for quick access
  const quickAccessAgents = agents
    .filter(agent => agent.is_active && agent.is_public)
    .slice(0, 8)
    .map(agent => ({
      icon: iconMap[agent.icon] || Target,
      name: agent.name,
      color: colorMap[agent.color] || 'text-primary',
      route: agent.slug === 'brand-positioning-monster' 
        ? '/dashboard/positioning' 
        : `/dashboard/agents/${agent.slug}`
    }));

  const xpProgress = getXPProgress(user.xp);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {user.first_name}!</h1>
          <p className="text-muted-foreground mt-2">{t('dashboard.subtitle')}</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.credits')}</CardTitle>
              <Zap className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.credits || 0}</div>
              <p className="text-xs text-muted-foreground">{t('dashboard.creditsAvailable')}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.plan')}</CardTitle>
              <CreditCard className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user.subscription_status || 'free'}</div>
              <Button 
                variant="link" 
                className="p-0 h-auto text-xs"
                onClick={() => navigate('/dashboard/billing')}
              >
                {t('dashboard.upgrade')}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.level')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{t('common.level')} {user.level || 1}</div>
              <Progress value={xpProgress.percentage} className="mt-2" />
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Agents */}
        <div>
          <h2 className="text-2xl font-bold mb-4">{t('dashboard.quickAccess')}</h2>
          {agentsLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {quickAccessAgents.map((agent, index) => (
                <Card 
                  key={index} 
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => {
                    if (!hasDna && agent.route !== '/dashboard/positioning') {
                      toast({
                        title: t('dna.required.title'),
                        description: t('dna.required.message'),
                        variant: 'destructive',
                      });
                      navigate('/dashboard/positioning');
                      return;
                    }
                    navigate(agent.route);
                  }}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <agent.icon className={`h-8 w-8 ${agent.color}`} />
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full">{t('dashboard.launch')}</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
            <CardDescription>{t('dashboard.recentActivityDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center py-8">
              {t('dashboard.noActivity')}
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;