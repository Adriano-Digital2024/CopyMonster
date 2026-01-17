import { useState, useEffect } from 'react';
import { Newspaper, Star, Copy, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTranslation } from 'react-i18next';

interface Headline {
  id: string;
  content: string;
  category?: string;
  is_favorite: boolean;
  created_at: string;
  tags?: string[];
}

export default function Headlines() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHeadlines();
    }
  }, [user]);

  const loadHeadlines = async () => {
    try {
      const { data, error } = await supabase
        .from('headlines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHeadlines(data || []);
    } catch (error) {
      console.error('Error loading headlines:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    try {
      const { error } = await supabase
        .from('headlines')
        .update({ is_favorite: !currentFavorite })
        .eq('id', id);

      if (error) throw error;
      
      setHeadlines(headlines.map(h => 
        h.id === id ? { ...h, is_favorite: !currentFavorite } : h
      ));
      
      toast({
        title: !currentFavorite ? t('headlines.toast.favorited') : t('headlines.toast.unfavorited'),
      });
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast({
        title: t('common.error'),
        variant: 'destructive',
      });
    }
  };

  const filteredHeadlines = headlines.filter((headline) => {
    const matchesSearch = headline.content.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || headline.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('headlines.toast.copiedTitle'),
      description: t('headlines.toast.copiedDesc')
    });
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      vsl: 'VSL',
      sales_page: t('headlines.category.salesPage'),
      email: t('headlines.category.email'),
      ads: t('headlines.category.ads')
    };
    return labels[category] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      vsl: '#F56565',
      sales_page: '#38A169',
      email: '#ED8936',
      ads: '#9F7AEA'
    };
    return colors[category] || '#6B46C1';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('headlines.title')}</h1>
          <p className="text-muted-foreground">
            {t('headlines.subtitle')}
          </p>
        </div>

        {/* Filters */}
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('headlines.searchPlaceholder')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('headlines.filter.all')}</SelectItem>
                  <SelectItem value="vsl">VSL</SelectItem>
                  <SelectItem value="sales_page">{t('headlines.category.salesPage')}</SelectItem>
                  <SelectItem value="email">{t('headlines.category.email')}</SelectItem>
                  <SelectItem value="ads">{t('headlines.category.ads')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </Card>

        {/* Headlines Grid */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : filteredHeadlines.length === 0 ? (
          <EmptyState
            icon={Newspaper}
            title={t('headlines.empty.title')}
            description={search ? t('headlines.empty.searchDesc') : t('headlines.empty.defaultDesc')}
          />
        ) : (
          <div className="grid gap-4">
            {filteredHeadlines.map((headline) => (
              <Card 
                key={headline.id} 
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-lg font-medium leading-relaxed">
                        {headline.content}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => toggleFavorite(headline.id, headline.is_favorite)}
                    >
                      <Star 
                        className={`h-5 w-5 ${headline.is_favorite ? 'fill-yellow-400 text-yellow-400' : ''}`}
                      />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {headline.category && (
                        <Badge 
                          variant="secondary"
                          style={{ 
                            backgroundColor: `${getCategoryColor(headline.category)}20`,
                            color: getCategoryColor(headline.category)
                          }}
                        >
                          {getCategoryLabel(headline.category)}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground">
                        {new Date(headline.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(headline.content)}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {t('headlines.copyButton')}
                    </Button>
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