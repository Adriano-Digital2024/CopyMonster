import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { AGENTS } from '@/lib/copymonster-config';

export default function Agents() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getAgentBadge = (slug: string) => {
    if (slug === 'monster-positioner') return t('agents.badge.popular');
    if (slug === 'vsl-monster') return t('agents.badge.new');
    return null;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('agents.page.title')}</h1>
          <p className="text-muted-foreground">
            {t('agents.page.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {AGENTS.map((agent) => {
            const Icon = agent.icon;
            const badge = getAgentBadge(agent.slug);

            return (
              <Card 
                key={agent.id}
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => navigate(`/dashboard/agents/${agent.slug}`)}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${agent.color}20` }}
                    >
                      <Icon 
                        className="h-8 w-8" 
                        style={{ color: agent.color }}
                      />
                    </div>
                    {badge && (
                      <Badge variant="secondary">{badge}</Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {t(`agents.list.${agent.tKey}.name`)}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {t(`agents.list.${agent.tKey}.description`)}
                    </p>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/dashboard/agents/${agent.slug}`);
                    }}
                  >
                    {t('agents.page.launchAgent')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}