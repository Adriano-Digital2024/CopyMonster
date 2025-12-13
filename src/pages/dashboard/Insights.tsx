import { TrendingUp, Lightbulb, Target, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';

export default function Insights() {
  const { t } = useTranslation();
  
  const insights = [
    {
      id: '1',
      type: 'trend',
      title: t('insights.mock.title1'),
      description: t('insights.mock.desc1'),
      impact: 'high',
      date: '2024-10-25'
    },
    {
      id: '2',
      type: 'recommendation',
      title: t('insights.mock.title2'),
      description: t('insights.mock.desc2'),
      impact: 'medium',
      date: '2024-10-23'
    },
    {
      id: '3',
      type: 'alert',
      title: t('insights.mock.title3'),
      description: t('insights.mock.desc3'),
      impact: 'high',
      date: '2024-10-20'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'alert': return AlertCircle;
      default: return Target;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'high':
        return <Badge variant="destructive">{t('insights.impact.high')}</Badge>;
      case 'medium':
        return <Badge variant="secondary">{t('insights.impact.medium')}</Badge>;
      default:
        return <Badge variant="outline">{t('insights.impact.low')}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('insights.title')}</h1>
          <p className="text-muted-foreground">
            {t('insights.subtitle')}
          </p>
        </div>

        <div className="grid gap-6">
          {insights.map((insight) => {
            const Icon = getIcon(insight.type);
            return (
              <Card key={insight.id} className="p-6">
                <div className="flex gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 h-fit">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-semibold">{insight.title}</h3>
                      {getImpactBadge(insight.impact)}
                    </div>
                    <p className="text-muted-foreground">{insight.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(insight.date).toLocaleDateString(t('date.locale'))}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}