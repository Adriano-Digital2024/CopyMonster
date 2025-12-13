import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings } from 'lucide-react';
import { AGENTS } from '@/lib/copymonster-config';

const AdminAgents = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin.agents.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin.agents.subtitle')}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {AGENTS.map((agent) => (
            <Card key={agent.slug} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${agent.color}20` }}
                  >
                    <agent.icon className="h-6 w-6" style={{ color: agent.color }} />
                  </div>
                  <Badge variant="outline">{t('admin.agents.public')}</Badge>
                </div>
                <CardTitle className="mt-4">{agent.name}</CardTitle>
                <CardDescription>{agent.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => navigate(`/admin/agents/${agent.slug}`)}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  {t('admin.agents.configure')}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAgents;
