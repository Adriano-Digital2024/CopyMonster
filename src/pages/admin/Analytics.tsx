import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Zap, DollarSign, Target, Activity } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { mockAnalyticsData } from '@/services/mockData';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

const Analytics = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('admin.analytics.totalUsers'),
      value: '1,234',
      icon: Users,
      change: '+12.5%',
      positive: true,
    },
    {
      title: t('admin.analytics.activeUsers'),
      value: '892',
      icon: Activity,
      change: '+8.2%',
      positive: true,
    },
    {
      title: t('admin.analytics.totalRevenue'),
      value: '$45,231',
      icon: DollarSign,
      change: '+23.1%',
      positive: true,
    },
    {
      title: t('admin.analytics.conversionRate'),
      value: '3.2%',
      icon: Target,
      change: '+0.5%',
      positive: true,
    },
    {
      title: t('admin.analytics.creditsUsed'),
      value: '234K',
      icon: Zap,
      change: '+15.3%',
      positive: true,
    },
    {
      title: t('admin.analytics.growthRate'),
      value: '12.5%',
      icon: TrendingUp,
      change: '+2.1%',
      positive: true,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.analytics.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.analytics.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {stat.change} {t('admin.analytics.fromLastMonth')}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Tabs defaultValue="growth" className="space-y-4">
          <TabsList>
            <TabsTrigger value="growth">{t('admin.analytics.userGrowth')}</TabsTrigger>
            <TabsTrigger value="revenue">{t('admin.analytics.revenue')}</TabsTrigger>
            <TabsTrigger value="credits">{t('admin.analytics.creditsUsage')}</TabsTrigger>
            <TabsTrigger value="plans">{t('admin.analytics.planDistribution')}</TabsTrigger>
          </TabsList>

          <TabsContent value="growth" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.userGrowthChart')}</CardTitle>
                <CardDescription>{t('admin.analytics.last90Days')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={mockAnalyticsData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.monthlyRevenue')}</CardTitle>
                <CardDescription>{t('admin.analytics.last12Months')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={mockAnalyticsData.revenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="amount" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="credits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.creditsUsageChart')}</CardTitle>
                <CardDescription>{t('admin.analytics.last30Days')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={mockAnalyticsData.creditsUsage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="credits" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.planDistributionChart')}</CardTitle>
                <CardDescription>{t('admin.analytics.currentDistribution')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <PieChart>
                    <Pie
                      data={mockAnalyticsData.planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {mockAnalyticsData.planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.analytics.topAgents')}</CardTitle>
              <CardDescription>{t('admin.analytics.mostUsedAgents')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalyticsData.topAgents.map((agent) => (
                  <div key={agent.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                      <span className="font-medium">{agent.name}</span>
                    </div>
                    <span className="text-muted-foreground">{agent.usage} {t('admin.analytics.uses')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.analytics.topUsers')}</CardTitle>
              <CardDescription>{t('admin.analytics.mostActiveUsers')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAnalyticsData.topUsers.map((user) => (
                  <div key={user.email} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                    <span className="text-muted-foreground">{user.credits} {t('admin.analytics.credits')}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;
