import { useState, useEffect } from 'react';
import { Book, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { supabase } from '@/integrations/supabase/client';
import { useTranslation } from 'react-i18next';

interface LibraryItem {
  id: string;
  title: string;
  description: string;
  content: string;
  category: string;
  is_public: boolean;
  created_at: string;
}

export default function Library() {
  const { t } = useTranslation();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadLibraryItems();
  }, []);

  const loadLibraryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('library_items')
        .select('*')
        .eq('is_public', true)
        .order('title', { ascending: true });

      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error loading library items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.description.toLowerCase().includes(search.toLowerCase()) ||
    item.category.toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'frameworks': '#6B46C1',
      'templates': '#38A169',
      'examples': '#F56565',
      'guides': '#4299E1',
    };
    return colors[category.toLowerCase()] || '#6B46C1';
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('library.title')}</h1>
          <p className="text-muted-foreground">
            {t('library.subtitle')}
          </p>
        </div>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder={t('library.searchPlaceholder')} 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t('common.loading')}
          </div>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon={Book}
            title={t('library.empty.title')}
            description={search ? t('library.empty.searchDesc') : t('library.empty.defaultDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <Card key={item.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <Book className="h-8 w-8 text-primary" />
                    <Badge 
                      variant="secondary"
                      style={{ 
                        backgroundColor: `${getCategoryColor(item.category)}20`,
                        color: getCategoryColor(item.category)
                      }}
                    >
                      {item.category}
                    </Badge>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{item.description}</p>
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