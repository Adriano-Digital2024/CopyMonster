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
  Newspaper,
  Clapperboard,
  Megaphone
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useNavigate } from 'react-router-dom';
import { getXPProgress } from '@/lib/copymonster-config';

const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Se o usuário for null, o DashboardLayout já está lidando com o redirecionamento/loading.
  if (!user) {
    return null; 
  }

  const agents = [
    { icon: Target, name: t('agents.list.positioner.name'), color: 'text-yellow-500', route: '/dashboard/agents/monster-positioner' },
    { icon: Film, name: t('agents.list.vsl.name'), color: 'text-red-500', route: '/dashboard/agents/vsl-monster' },
    { icon: FileText, name: t('agents.list.sales.name'), color: 'text-green-500', route: '/dashboard/agents/sales-page-monster' },
    { icon: Rocket, name: t('agents.list.launch.name'), color: 'text-blue-500', route: '/dashboard/agents/launch-monster' },
    { icon: Mail, name: t('agents.list.email.name'), color: 'text-orange-500', route: '/dashboard/agents/email-monster' },
    { icon: Megaphone, name: t('agents.list.ads.name'), color: 'text-purple-500', route: '/dashboard/agents/ads-monster' },
    { icon: Newspaper, name: t('agents.list.headline.name'), color: 'text-yellow-600', route: '/dashboard/agents/headline-monster' },
    { icon: Clapperboard, name: t('agents.list.short.name'), color: 'text-teal-500', route: '/dashboard/agents/short-monster' },
  ];

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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {agents.map((agent, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(agent.route)}
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