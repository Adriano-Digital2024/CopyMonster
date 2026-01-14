import { useState, useEffect } from 'react';
import { TrendingUp, FileText, Star, Copy, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface CopyResult {
  id: string;
  agent_slug: string;
  content: string;
  is_favorite: boolean;
  rating: number | null;
  created_at: string;
  campaign_id: string | null;
}

export default function CopyResults() {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user } = useAuth();
  const { toast } = useToast();
  const [copyResults, setCopyResults] = useState<CopyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      loadCopyResults();
    }
  }, [user]);

  const loadCopyResults = async () => {
    try {
      const { data, error } = await supabase
        .from('copy_results')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCopyResults(data || []);
    } catch (error) {
      console.error('Error loading copy results:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('copy_results')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id);

      if (error) throw error;
      
      setCopyResults(copyResults.map(c => 
        c.id === id ? { ...c, is_favorite: !currentFavorite } : c
      ));
      
      toast({
        title: !currentFavorite ? t('dashboard:copyResults.toast.favorited') : t('dashboard:copyResults.toast.unfavorited'),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const deleteCopyResult = async (id: string) => {
    try {
      const { error } = await supabase
        .from('copy_results')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCopyResults(copyResults.filter(c => c.id !== id));
      
      toast({
        title: t('dashboard:copyResults.toast.deleted'),
      });
    } catch (error) {
      console.error('Error deleting copy result:', error);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('dashboard:copyResults.toast.copied'),
    });
  };

  const filteredResults = copyResults.filter(result => {
    if (filter === 'all') return true;
    if (filter === 'favorites') return result.is_favorite;
    return result.agent_slug === filter;
  });

  const uniqueAgents = [...new Set(copyResults.map(c => c.agent_slug))];

  const getAgentLabel = (slug: string) => {
    const labels: Record<string, string> = {
      vsl_monster: 'VSL Monster',
      sales_page_monster: 'Sales Page Monster',
      email_monster: 'Email Monster',
      ads_monster: 'Ads Monster',
      headline_monster: 'Headline Monster',
      short_monster: 'Short Monster',
      launch_monster: 'Launch Monster',
      brand_positioning_monster: 'Brand Positioning Monster',
    };
    return labels[slug] || slug;
  };

  const stats = [
    {
      icon: FileText,
      label: t('dashboard:copyResults.stats.totalCopies'),
      value: copyResults.length.toString(),
      color: '#6B46C1'
    },
    {
      icon: Star,
      label: t('dashboard:copyResults.stats.favorites'),
      value: copyResults.filter(c => c.is_favorite).length.toString(),
      color: '#ECC94B'
    },
    {
      icon: TrendingUp,
      label: t('dashboard:copyResults.stats.thisMonth'),
      value: copyResults.filter(c => {
        const date = new Date(c.created_at);
        const now = new Date();
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }).length.toString(),
      color: '#38A169'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{t('dashboard:copyResults.title')}</h1>
            <p className="text-muted-foreground">
              {t('dashboard:copyResults.subtitle')}
            </p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('dashboard:copyResults.filter.all')}</SelectItem>
              <SelectItem value="favorites">{t('dashboard:copyResults.filter.favorites')}</SelectItem>
              {uniqueAgents.map(agent => (
                <SelectItem key={agent} value={agent}>{getAgentLabel(agent)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <p className="text-3xl font-bold">{stat.value}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Copy Results List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common:common.loading')}
          </div>
        ) : filteredResults.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={t('dashboard:copyResults.empty.title')}
            description={t('dashboard:copyResults.empty.description')}
          />
        ) : (
          <div className="space-y-4">
            {filteredResults.map((result) => (
              <Card key={result.id} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{getAgentLabel(result.agent_slug)}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(result.created_at).toLocaleDateString(t('common:date.locale'))}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap line-clamp-4">
                        {result.content}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleFavorite(result.id, result.is_favorite)}
                      >
                        <Star 
                          className={`h-5 w-5 ${result.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(result.content)}
                      >
                        <Copy className="h-5 w-5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteCopyResult(result.id)}
                      >
                        <Trash2 className="h-5 w-5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}