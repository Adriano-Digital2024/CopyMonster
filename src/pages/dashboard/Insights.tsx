import { useState, useEffect } from 'react';
import { TrendingUp, Lightbulb, Target, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface Insight {
  id: string;
  title: string;
  content: string;
  category: string;
  source: string | null;
  created_at: string;
}

export default function Insights() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadInsights();
    }
  }, [user]);

  const loadInsights = async () => {
    try {
      const { data, error } = await supabase
        .from('insights')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsights(data || []);
    } catch (error) {
      console.error('Error loading insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteInsight = async (id: string) => {
    try {
      const { error } = await supabase
        .from('insights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setInsights(insights.filter(i => i.id !== id));
      
      toast({
        title: t('insights.toast.deleted'),
      });
    } catch (error) {
      console.error('Error deleting insight:', error);
    }
  };

  const getIcon = (category: string) => {
    switch (category) {
      case 'trend': return TrendingUp;
      case 'recommendation': return Lightbulb;
      case 'alert': return AlertCircle;
      default: return Target;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'trend':
        return <Badge variant="default">{t('insights.category.trend')}</Badge>;
      case 'recommendation':
        return <Badge variant="secondary">{t('insights.category.recommendation')}</Badge>;
      case 'alert':
        return <Badge variant="destructive">{t('insights.category.alert')}</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('insights.title')}</h1>
            <p className="text-muted-foreground">
              {t('insights.subtitle')}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : insights.length === 0 ? (
          <EmptyState
            icon={Lightbulb}
            title={t('insights.empty.title')}
            description={t('insights.empty.description')}
          />
        ) : (
          <div className="grid gap-6">
            {insights.map((insight) => {
              const Icon = getIcon(insight.category);
              return (
                <Card key={insight.id} className="p-6">
                  <div className="flex gap-4">
                    <div className="p-3 rounded-lg bg-primary/10 h-fit">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold">{insight.title}</h3>
                          {getCategoryBadge(insight.category)}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteInsight(insight.id)}
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-muted-foreground">{insight.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{new Date(insight.created_at).toLocaleDateString()}</span>
                        {insight.source && <span>{t('insights.source')}: {insight.source}</span>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}