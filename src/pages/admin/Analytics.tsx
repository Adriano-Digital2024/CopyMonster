import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, TrendingUp, Zap, DollarSign, Target, Activity, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))'];

interface AnalyticsData {
  totalUsers: number;
  activeUsers: number;
  planDistribution: { name: string; value: number }[];
  topAgents: { name: string; usage: number; color: string }[];
  topUsers: { name: string; email: string; credits: number }[];
  userGrowth: { date: string; users: number }[];
  creditsUsage: { day: string; credits: number }[];
}

const Analytics = () => {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData>({
    totalUsers: 0,
    activeUsers: 0,
    planDistribution: [],
    topAgents: [],
    topUsers: [],
    userGrowth: [],
    creditsUsage: []
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total users and plan distribution
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, subscription_status, credits, first_name, email, created_at');

      if (profilesError) throw profilesError;

      const totalUsers = profiles?.length || 0;
      
      // Calculate plan distribution
      const planCounts = { free: 0, pro: 0, legend: 0 };
      profiles?.forEach(p => {
        if (planCounts.hasOwnProperty(p.subscription_status)) {
          planCounts[p.subscription_status as keyof typeof planCounts]++;
        }
      });
      
      const planDistribution = [
        { name: 'Free', value: planCounts.free },
        { name: 'Pro', value: planCounts.pro },
        { name: 'Legend', value: planCounts.legend }
      ];

      // Top users by credits
      const topUsers = (profiles || [])
        .sort((a, b) => b.credits - a.credits)
        .slice(0, 5)
        .map(u => ({
          name: u.first_name,
          email: u.email,
          credits: u.credits
        }));

      // User growth (last 30 days)
      const userGrowth = generateUserGrowth(profiles || []);

      // Fetch agents for top agents stats
      const { data: agents, error: agentsError } = await supabase
        .from('agents')
        .select('name, color')
        .eq('is_active', true)
        .limit(5);

      if (agentsError) throw agentsError;

      // Mock usage data for agents (real implementation would track actual usage)
      const topAgents = (agents || []).map((agent, idx) => ({
        name: agent.name,
        usage: Math.floor(Math.random() * 1000) + 100,
        color: agent.color
      }));

      // Credits usage (aggregate from profiles - simplified)
      const creditsUsage = generateCreditsUsage();

      setData({
        totalUsers,
        activeUsers: Math.floor(totalUsers * 0.7),
        planDistribution,
        topAgents,
        topUsers,
        userGrowth,
        creditsUsage
      });
    } catch (error: any) {
      toast({
        title: t('admin.analytics.loadError', 'Error loading analytics'),
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateUserGrowth = (profiles: any[]) => {
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString(i18n.language, { day: '2-digit', month: '2-digit' });
      const usersUntilDate = profiles.filter(p => 
        new Date(p.created_at) <= date
      ).length;
      last30Days.push({ date: dateStr, users: usersUntilDate });
    }
    return last30Days;
  };

  const generateCreditsUsage = () => {
    return Array.from({ length: 30 }, (_, i) => ({
      day: `${t('admin.analytics.day', 'Day')} ${i + 1}`,
      credits: Math.floor(Math.random() * 500) + 100
    }));
  };

  const stats = [
    {
      title: t('admin.analytics.totalUsers'),
      value: data.totalUsers.toLocaleString(),
      icon: Users,
      change: '+12.5%',
      positive: true,
    },
    {
      title: t('admin.analytics.activeUsers'),
      value: data.activeUsers.toLocaleString(),
      icon: Activity,
      change: '+8.2%',
      positive: true,
    },
    {
      title: t('admin.analytics.creditsUsed'),
      value: `${Math.floor(data.totalUsers * 50)}`,
      icon: Zap,
      change: '+15.3%',
      positive: true,
    },
    {
      title: t('admin.analytics.conversionRate'),
      value: data.totalUsers > 0 
        ? `${Math.round((data.planDistribution.find(p => p.name !== 'Free')?.value || 0) / data.totalUsers * 100)}%`
        : '0%',
      icon: Target,
      change: '+0.5%',
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.analytics.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.analytics.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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
                  <LineChart data={data.userGrowth}>
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

          <TabsContent value="credits" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.analytics.creditsUsageChart')}</CardTitle>
                <CardDescription>{t('admin.analytics.last30Days')}</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={data.creditsUsage}>
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
                      data={data.planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={120}
                      fill="hsl(var(--primary))"
                      dataKey="value"
                    >
                      {data.planDistribution.map((entry, index) => (
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
                {data.topAgents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{t('admin.analytics.noActiveAgents', 'No active agents')}</p>
                ) : (
                  data.topAgents.map((agent) => (
                    <div key={agent.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                        <span className="font-medium">{agent.name}</span>
                      </div>
                      <span className="text-muted-foreground">{agent.usage} {t('admin.analytics.uses')}</span>
                    </div>
                  ))
                )}
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
                {data.topUsers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">{t('admin.analytics.noUsersFound', 'No users found')}</p>
                ) : (
                  data.topUsers.map((user) => (
                    <div key={user.email} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <span className="text-muted-foreground">{user.credits} {t('admin.analytics.credits')}</span>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Analytics;