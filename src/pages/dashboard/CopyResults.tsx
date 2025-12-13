import { TrendingUp, FileText, Eye, MousePointerClick } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';

export default function CopyResults() {
  const { t } = useTranslation();
  
  const performanceData = [
    { date: '01/10', score: 72, engagement: 45, conversions: 12 },
    { date: '08/10', score: 78, engagement: 52, conversions: 18 },
    { date: '15/10', score: 85, engagement: 68, conversions: 24 },
    { date: '22/10', score: 82, engagement: 61, conversions: 21 },
    { date: '29/10', score: 89, engagement: 75, conversions: 32 },
  ];

  const recentCopies = [
    {
      id: '1',
      title: 'Headline VSL - Produto X',
      type: 'VSL',
      score: 89,
      date: '25/10/2024',
      status: 'active'
    },
    {
      id: '2',
      title: 'Email de Lançamento',
      type: 'Email',
      score: 85,
      date: '22/10/2024',
      status: 'active'
    },
    {
      id: '3',
      title: 'Ad Copy Facebook',
      type: 'Ads',
      score: 78,
      date: '20/10/2024',
      status: 'paused'
    },
  ];

  const stats = [
    {
      icon: TrendingUp,
      label: t('copyResults.stats.avgScore'),
      value: '85',
      change: '+12%',
      color: '#38A169'
    },
    {
      icon: Eye,
      label: t('copyResults.stats.engagement'),
      value: '68%',
      change: '+8%',
      color: '#4299E1'
    },
    {
      icon: MousePointerClick,
      label: t('copyResults.stats.conversionRate'),
      value: '24%',
      change: '+15%',
      color: '#F56565'
    },
    {
      icon: FileText,
      label: t('copyResults.stats.copiesGenerated'),
      value: '127',
      change: '+23',
      color: '#ECC94B'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('copyResults.title')}</h1>
            <p className="text-muted-foreground">
              {t('copyResults.subtitle')}
            </p>
          </div>
          <Select defaultValue="30">
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">{t('copyResults.filter.last7Days')}</SelectItem>
              <SelectItem value="30">{t('copyResults.filter.last30Days')}</SelectItem>
              <SelectItem value="90">{t('copyResults.filter.last90Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.label} className="p-6">
                <div className="space-y-3">
                  <div 
                    className="p-3 rounded-lg w-fit"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <Icon 
                      className="h-6 w-6" 
                      style={{ color: stat.color }}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold">{stat.value}</p>
                      <Badge variant="secondary" className="text-xs">
                        {stat.change}
                      </Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Performance Chart */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('copyResults.chart.title')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="score" 
                stroke="#6B46C1" 
                strokeWidth={2}
                name={t('copyResults.chart.copyScore')}
              />
              <Line 
                type="monotone" 
                dataKey="engagement" 
                stroke="#4299E1" 
                strokeWidth={2}
                name={t('copyResults.chart.engagement')}
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke="#38A169" 
                strokeWidth={2}
                name={t('copyResults.chart.conversions')}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Recent Copies */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('copyResults.recentCopies.title')}</h3>
          <div className="space-y-4">
            {recentCopies.map((copy) => (
              <div 
                key={copy.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="font-medium">{copy.title}</h4>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Badge variant="outline">{copy.type}</Badge>
                    <span>{copy.date}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">{t('copyResults.recentCopies.score')}</p>
                    <p className="text-2xl font-bold">{copy.score}</p>
                  </div>
                  <Badge variant={copy.status === 'active' ? 'default' : 'secondary'}>
                    {copy.status === 'active' ? t('copyResults.recentCopies.active') : t('copyResults.recentCopies.paused')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}