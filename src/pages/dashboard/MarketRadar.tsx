import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Radar, TrendingUp, Zap, Globe, TrendingDown, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMetaIntegration } from '@/hooks/useMetaIntegration';
import { MetaConnectionPrompt } from '@/components/intelligence/MetaConnectionPrompt';

export default function MarketRadar() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const meta = useMetaIntegration();
  const [trends, setTrends] = useState<{ declines: number; newHigh: number; total: number }>({ declines: 0, newHigh: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchTrends = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('creative_classifications')
        .select('classification')
        .eq('user_id', user.id);

      if (data) {
        const declines = data.filter((c: any) => c.classification === 'underperforming').length;
        const newHigh = data.filter((c: any) => c.classification === 'high_performer').length;
        setTrends({ declines, newHigh, total: data.length });
      }
      setLoading(false);
    };
    fetchTrends();
  }, [user]);

  const features = [
    { icon: TrendingUp, titleKey: 'intelligence.radar.feature1Title', descKey: 'intelligence.radar.feature1Desc' },
    { icon: Zap, titleKey: 'intelligence.radar.feature2Title', descKey: 'intelligence.radar.feature2Desc' },
    { icon: Globe, titleKey: 'intelligence.radar.feature3Title', descKey: 'intelligence.radar.feature3Desc' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Radar className="h-8 w-8 text-primary" />
            {t('intelligence.radar.title')}
          </h1>
          <p className="text-muted-foreground">{t('intelligence.radar.subtitle')}</p>
        </div>

        {/* Trend Signals from Classifications */}
        {!loading && trends.total > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-red-500/10">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{trends.declines}</p>
                  <p className="text-xs text-muted-foreground">{t('intelligence.radar.creativesDeclined')}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{trends.newHigh}</p>
                  <p className="text-xs text-muted-foreground">{t('intelligence.radar.highPerformers')}</p>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Radar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{trends.total}</p>
                  <p className="text-xs text-muted-foreground">{t('intelligence.radar.totalAnalyzed')}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="py-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Radar className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">{t('intelligence.radar.comingSoon')}</h2>
            <p className="text-muted-foreground max-w-md mx-auto">{t('intelligence.radar.comingSoonDesc')}</p>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">{t(feature.titleKey)}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{t(feature.descKey)}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
