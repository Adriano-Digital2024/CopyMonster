import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, TrendingUp, DollarSign, Eye, ShoppingCart, CreditCard, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function AdsIntelligence() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [adsData, setAdsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchAds = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('ads_data')
        .select('*')
        .eq('user_id', user.id)
        .order('date_range_start', { ascending: false })
        .limit(500);
      setAdsData(data || []);
      setLoading(false);
    };
    fetchAds();
  }, [user]);

  const totals = adsData.reduce((acc, row) => ({
    spend: acc.spend + (row.spend || 0),
    impressions: acc.impressions + (row.impressions || 0),
    clicks: acc.clicks + (row.clicks || 0),
    viewContent: acc.viewContent + (row.view_content || 0),
    initiateCheckout: acc.initiateCheckout + (row.initiate_checkout || 0),
    purchases: acc.purchases + (row.purchases || 0),
    purchaseValue: acc.purchaseValue + (row.purchase_value || 0),
  }), { spend: 0, impressions: 0, clicks: 0, viewContent: 0, initiateCheckout: 0, purchases: 0, purchaseValue: 0 });

  const roas = totals.spend > 0 ? (totals.purchaseValue / totals.spend).toFixed(2) : '0';

  // Group by campaign for chart
  const campaignMap = new Map<string, { name: string; spend: number; purchases: number; purchaseValue: number }>();
  adsData.forEach(row => {
    const name = row.campaign_name || 'Unknown';
    const existing = campaignMap.get(name) || { name, spend: 0, purchases: 0, purchaseValue: 0 };
    existing.spend += row.spend || 0;
    existing.purchases += row.purchases || 0;
    existing.purchaseValue += row.purchase_value || 0;
    campaignMap.set(name, existing);
  });
  const campaignData = Array.from(campaignMap.values()).sort((a, b) => b.spend - a.spend).slice(0, 10);

  // Funnel data
  const funnelData = [
    { name: t('intelligence.ads.impressions'), value: totals.impressions },
    { name: t('intelligence.ads.clicks'), value: totals.clicks },
    { name: 'ViewContent', value: totals.viewContent },
    { name: 'InitiateCheckout', value: totals.initiateCheckout },
    { name: t('intelligence.ads.purchases'), value: totals.purchases },
  ];

  const FUNNEL_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#38A169', '#ECC94B', '#F56565'];

  const statCards = [
    { icon: DollarSign, label: t('intelligence.ads.totalSpend'), value: `$${totals.spend.toFixed(2)}` },
    { icon: Eye, label: 'ViewContent', value: totals.viewContent.toLocaleString() },
    { icon: ShoppingCart, label: 'InitiateCheckout', value: totals.initiateCheckout.toLocaleString() },
    { icon: CreditCard, label: t('intelligence.ads.purchases'), value: totals.purchases.toLocaleString() },
    { icon: TrendingUp, label: 'ROAS', value: `${roas}x` },
    { icon: BarChart3, label: t('intelligence.ads.revenue'), value: `$${totals.purchaseValue.toFixed(2)}` },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t('intelligence.ads.title')}</h1>
          <p className="text-muted-foreground">{t('intelligence.ads.subtitle')}</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : adsData.length === 0 ? (
          <Card className="p-8 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="font-semibold">{t('intelligence.ads.noData')}</h3>
            <p className="text-sm text-muted-foreground mt-1">{t('intelligence.ads.noDataDesc')}</p>
          </Card>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {statCards.map((stat) => (
                <Card key={stat.label} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <stat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">{stat.label}</span>
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                </Card>
              ))}
            </div>

            {/* Funnel */}
            <Card>
              <CardHeader>
                <CardTitle>{t('intelligence.ads.funnel')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={funnelData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis type="number" className="text-xs" />
                      <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {funnelData.map((_, index) => (
                          <Cell key={index} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Campaign Spend */}
            <Card>
              <CardHeader>
                <CardTitle>{t('intelligence.ads.byCampaign')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campaignData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" tick={false} />
                      <YAxis className="text-xs" />
                      <Tooltip />
                      <Bar dataKey="spend" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name={t('intelligence.ads.totalSpend')} />
                      <Bar dataKey="purchaseValue" fill="#38A169" radius={[4, 4, 0, 0]} name={t('intelligence.ads.revenue')} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Top Creatives */}
            <Card>
              <CardHeader>
                <CardTitle>{t('intelligence.ads.topCreatives')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {adsData
                    .filter(ad => ad.ad_creative_body || ad.ad_creative_title)
                    .sort((a, b) => (b.purchases || 0) - (a.purchases || 0))
                    .slice(0, 10)
                    .map((ad, i) => (
                      <div key={i} className="p-3 border rounded-lg space-y-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-sm line-clamp-1">{ad.ad_creative_title || ad.ad_name}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline">{ad.purchases || 0} {t('intelligence.ads.purchases')}</Badge>
                            <Badge variant="secondary">ROAS {ad.roas?.toFixed(1) || 0}x</Badge>
                          </div>
                        </div>
                        {ad.ad_creative_body && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{ad.ad_creative_body}</p>
                        )}
                      </div>
                    ))}
                  {adsData.filter(ad => ad.ad_creative_body || ad.ad_creative_title).length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('intelligence.ads.noCreatives')}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
