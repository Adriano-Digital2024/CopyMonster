import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Trash2, Search, Download } from 'lucide-react';
import { EmptyState } from '@/components/dashboard/EmptyState';

const KnowledgeBase = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const mockDocuments = [
    { id: 1, name: 'Copywriting Frameworks.pdf', size: '2.3 MB', uploadedAt: '2024-01-15', category: 'Frameworks' },
    { id: 2, name: 'VSL Templates.docx', size: '1.8 MB', uploadedAt: '2024-01-14', category: 'Templates' },
    { id: 3, name: 'Email Sequences.csv', size: '856 KB', uploadedAt: '2024-01-10', category: 'Data' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('admin.knowledgeBase.title')}</h1>
            <p className="text-muted-foreground mt-2">{t('admin.knowledgeBase.subtitle')}</p>
          </div>
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            {t('admin.knowledgeBase.uploadDocument')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>{t('admin.knowledgeBase.allDocuments')}</CardTitle>
                <CardDescription>{t('admin.knowledgeBase.manageDocuments')}</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin.knowledgeBase.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-full md:w-[300px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockDocuments.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded bg-primary/10">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-sm text-muted-foreground">{doc.size}</p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">{doc.uploadedAt}</p>
                        <Badge variant="outline">{doc.category}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default KnowledgeBase;
