import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, Instagram, Megaphone, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMetaIntegration } from '@/hooks/useMetaIntegration';
import { MetaConnectionPrompt } from '@/components/intelligence/MetaConnectionPrompt';

export default function PerformanceOverview() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const meta = useMetaIntegration();
  const [adsData, setAdsData] = useState<any[]>([]);
  const [igData, setIgData] = useState<any[]>([]);
  const [classifications, setClassifications] = useState<{ high: number; stable: number; under: number; insufficient: number }>({ high: 0, stable: 0, under: 0, insufficient: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [ads, ig, cls] = await Promise.all([
        supabase.from('ads_data').select('*').eq('user_id', user.id).order('date_range_start', { ascending: false }).limit(500),
        supabase.from('instagram_data').select('*').eq('user_id', user.id).order('synced_at', { ascending: false }).limit(200),
        supabase.from('creative_classifications').select('classification').eq('user_id', user.id),
      ]);
      setAdsData(ads.data || []);
      setIgData(ig.data || []);

      const counts = { high: 0, stable: 0, under: 0, insufficient: 0 };
      (cls.data || []).forEach((c: any) => {
        if (c.classification === 'high_performer') counts.high++;
        else if (c.classification === 'stable') counts.stable++;
        else if (c.classification === 'underperforming') counts.under++;
        else counts.insufficient++;
      });
      setClassifications(counts);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const adsTotals = adsData.reduce((acc, row) => ({
    spend: acc.spend + (row.spend || 0),
    impressions: acc.impressions + (row.impressions || 0),
    clicks: acc.clicks + (row.clicks || 0),
    purchases: acc.purchases + (row.purchases || 0),
    purchaseValue: acc.purchaseValue + (row.purchase_value || 0),
  }), { spend: 0, impressions: 0, clicks: 0, purchases: 0, purchaseValue: 0 });

  const igTotals = igData.reduce((acc, row) => ({
    impressions: acc.impressions + (row.impressions || 0),
    reach: acc.reach + (row.reach || 0),
    engagement: acc.engagement + (row.engagement || 0),
    saves: acc.saves + (row.saves || 0),
  }), { impressions: 0, reach: 0, engagement: 0, saves: 0 });

  // IG engagement by post type
  const postTypeMap = new Map<string, { type: string; count: number; engagement: number }>();
  igData.forEach(post => {
    const type = post.post_type || 'unknown';
    const existing = postTypeMap.get(type) || { type, count: 0, engagement: 0 };
    existing.count++;
    existing.engagement += post.engagement || 0;
    postTypeMap.set(type, existing);
  });
  const postTypeData = Array.from(postTypeMap.values());

  const hasClassifications = classifications.high + classifications.stable + classifications.under + classifications.insufficient > 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('intelligence.performance.title')}</h1>
          <p className="text-muted-foreground">{t('intelligence.performance.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (!meta.isConnected || !meta.hasData) ? (
          <MetaConnectionPrompt isConnected={meta.isConnected} hasData={meta.hasData} isSynced={meta.isSynced} />
        ) : (
          <>
            {/* Classification Summary */}
            {hasClassifications && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    {t('intelligence.engine.classificationSummary')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-500/10">
                      <p className="text-2xl font-bold text-green-600">{classifications.high}</p>
                      <p className="text-xs text-muted-foreground">{t('intelligence.engine.highPerformer')}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-yellow-500/10">
                      <p className="text-2xl font-bold text-yellow-600">{classifications.stable}</p>
                      <p className="text-xs text-muted-foreground">{t('intelligence.engine.stable')}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-red-500/10">
                      <p className="text-2xl font-bold text-red-600">{classifications.under}</p>
                      <p className="text-xs text-muted-foreground">{t('intelligence.engine.underperforming')}</p>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted">
                      <p className="text-2xl font-bold text-muted-foreground">{classifications.insufficient}</p>
                      <p className="text-xs text-muted-foreground">{t('intelligence.engine.insufficientData')}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meta Ads Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Megaphone className="h-5 w-5" />
                  Meta Ads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {adsData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('intelligence.performance.noAdsData')}</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">{t('intelligence.ads.totalSpend')}</p>
                      <p className="text-xl font-bold">${adsTotals.spend.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('intelligence.ads.impressions')}</p>
                      <p className="text-xl font-bold">{adsTotals.impressions.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('intelligence.ads.clicks')}</p>
                      <p className="text-xl font-bold">{adsTotals.clicks.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('intelligence.ads.purchases')}</p>
                      <p className="text-xl font-bold">{adsTotals.purchases.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{t('intelligence.ads.revenue')}</p>
                      <p className="text-xl font-bold">${adsTotals.purchaseValue.toFixed(2)}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instagram Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Instagram className="h-5 w-5" />
                  Instagram
                </CardTitle>
              </CardHeader>
              <CardContent>
                {igData.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">{t('intelligence.performance.noIgData')}</p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-muted-foreground">{t('intelligence.ads.impressions')}</p>
                        <p className="text-xl font-bold">{igTotals.impressions.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('intelligence.performance.reach')}</p>
                        <p className="text-xl font-bold">{igTotals.reach.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('intelligence.performance.engagement')}</p>
                        <p className="text-xl font-bold">{igTotals.engagement.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{t('intelligence.performance.saves')}</p>
                        <p className="text-xl font-bold">{igTotals.saves.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={postTypeData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="type" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip />
                          <Bar dataKey="engagement" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('intelligence.performance.engagement')} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
