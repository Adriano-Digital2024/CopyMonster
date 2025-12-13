import { useState, useEffect } from 'react';
import { Rocket, Plus, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Campaign {
  id: string;
  name: string;
  status: string;
  description?: string;
  goals?: string;
  target_audience?: string;
  created_at: string;
}

export default function Campaigns() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [filter, setFilter] = useState<string>('all');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCampaigns();
    }
  }, [user]);

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    if (filter === 'all') return true;
    return campaign.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">{t('campaigns.status.completed')}</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">{t('campaigns.status.inProgress')}</Badge>;
      case 'draft':
        return <Badge variant="outline">{t('campaigns.status.draft')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('campaigns.title')}</h1>
            <p className="text-muted-foreground">
              {t('campaigns.subtitle')}
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t('campaigns.newCampaign')}
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-muted-foreground" />
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('campaigns.filter.all')}</SelectItem>
                <SelectItem value="completed">{t('campaigns.filter.completed')}</SelectItem>
                <SelectItem value="in_progress">{t('campaigns.filter.inProgress')}</SelectItem>
                <SelectItem value="draft">{t('campaigns.filter.draft')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        {/* Campaigns List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <EmptyState
            icon={Rocket}
            title={t('campaigns.empty.title')}
            description={t('campaigns.empty.description')}
            actionLabel={t('campaigns.newCampaign')}
            onAction={() => {}}
          />
        ) : (
          <div className="grid gap-4">
            {filteredCampaigns.map((campaign) => (
              <Card key={campaign.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{campaign.name}</h3>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{new Date(campaign.created_at).toLocaleDateString(t('date.locale'))}</span>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground">{campaign.description}</p>
                    )}
                  </div>
                  <Button variant="outline">{t('campaigns.viewDetails')}</Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}