import { Book, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useTranslation } from 'react-i18next';

export default function Library() {
  const { t } = useTranslation();
  
  const frameworks = [
    { id: '1', name: 'PAS Framework', category: t('library.category.salesPage'), description: 'Problem - Agitate - Solution' },
    { id: '2', name: 'AIDA', category: t('library.category.vsl'), description: 'Attention - Interest - Desire - Action' },
    { id: '3', name: 'FAB', category: t('library.category.email'), description: 'Features - Advantages - Benefits' },
    { id: '4', name: '4 Ps', category: t('library.category.ads'), description: 'Picture - Promise - Prove - Push' },
    { id: '5', name: 'BAB', category: t('library.category.headlines'), description: 'Before - After - Bridge' },
    { id: '6', name: 'QUEST', category: t('library.category.salesPage'), description: 'Qualify - Understand - Educate - Stimulate - Transition' }
  ];

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
            <Input placeholder={t('library.searchPlaceholder')} />
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {frameworks.map((framework) => (
            <Card key={framework.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Book className="h-8 w-8 text-primary" />
                  <Badge variant="secondary">{framework.category}</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">{framework.name}</h3>
                  <p className="text-sm text-muted-foreground">{framework.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}