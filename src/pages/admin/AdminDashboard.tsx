import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Users, CreditCard, TrendingUp, Zap } from 'lucide-react';

const AdminDashboard = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('admin.stats.totalUsers'),
      value: '1,234',
      icon: Users,
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      title: t('admin.stats.activeSubscriptions'),
      value: '456',
      icon: CreditCard,
      change: '+8%',
      changeType: 'positive' as const,
    },
    {
      title: t('admin.stats.totalRevenue'),
      value: '$45,231',
      icon: TrendingUp,
      change: '+23%',
      changeType: 'positive' as const,
    },
    {
      title: t('admin.stats.creditsUsed'),
      value: '234K',
      icon: Zap,
      change: '+15%',
      changeType: 'positive' as const,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.recentActivity')}</CardTitle>
              <CardDescription>{t('admin.recentActivityDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('admin.noActivity')}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.topAgents')}</CardTitle>
              <CardDescription>{t('admin.topAgentsDescription')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center py-8">
                {t('admin.noData')}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;