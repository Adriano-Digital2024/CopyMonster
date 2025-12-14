import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Target, Zap, FileText, Map } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { XP_LEVELS, calculateLevel, getXPProgress } from '@/lib/copymonster-config';
import { useTranslation } from 'react-i18next';

export default function Performance() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const xp = user?.xp || 0;
  const currentLevel = calculateLevel(xp);
  const xpProgress = getXPProgress(xp);

  const [realStats, setRealStats] = useState({
    positionings: 0,
    campaigns: 0,
    copyResults: 0,
    headlines: 0,
  });

  useEffect(() => {
    if (user) {
      loadRealStats();
    }
  }, [user]);

  const loadRealStats = async () => {
    try {
      const [positioningsRes, campaignsRes, copyResultsRes, headlinesRes] = await Promise.all([
        supabase.from('positioning_mappings').select('id', { count: 'exact', head: true }),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('copy_results').select('id', { count: 'exact', head: true }),
        supabase.from('headlines').select('id', { count: 'exact', head: true }),
      ]);

      setRealStats({
        positionings: positioningsRes.count || 0,
        campaigns: campaignsRes.count || 0,
        copyResults: copyResultsRes.count || 0,
        headlines: headlinesRes.count || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const stats = [
    {
      icon: Map,
      label: t('performance.stats.positionings'),
      value: realStats.positionings.toString(),
      color: '#6B46C1'
    },
    {
      icon: Zap,
      label: t('performance.stats.campaignsCreated'),
      value: realStats.campaigns.toString(),
      color: '#F56565'
    },
    {
      icon: FileText,
      label: t('performance.stats.copyResults'),
      value: realStats.copyResults.toString(),
      color: '#38A169'
    },
    {
      icon: Trophy,
      label: t('performance.stats.totalXP'),
      value: xp.toString(),
      color: '#ECC94B'
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('performance.title')}</h1>
          <p className="text-muted-foreground">
            {t('performance.subtitle')}
          </p>
        </div>

        {/* Current Level */}
        <Card className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-6xl">{currentLevel.icon}</div>
                <div>
                  <Badge variant="secondary" className="mb-2">
                    {t('common.level')} {currentLevel.level}
                  </Badge>
                  <h2 className="text-2xl font-bold">{currentLevel.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {xpProgress.current} / {xpProgress.next} XP
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">{t('performance.progress')}</p>
                <p className="text-3xl font-bold">{xpProgress.percentage}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <Progress value={xpProgress.percentage} className="h-3" />
              <p className="text-xs text-muted-foreground">
                {t('performance.xpRemaining', { xp: xpProgress.next - xpProgress.current })}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-semibold text-sm">{t('performance.benefitsTitle')}:</h3>
              <ul className="space-y-1">
                {currentLevel.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

        {/* All Levels */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('performance.allLevelsTitle')}</h3>
          <div className="space-y-4">
            {XP_LEVELS.map((level) => {
              const isCurrentLevel = level.level === currentLevel.level;
              const isUnlocked = xp >= level.minXP;

              return (
                <div 
                  key={level.level}
                  className={`p-4 rounded-lg border ${isCurrentLevel ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">{level.icon}</div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={isUnlocked ? 'default' : 'secondary'}>
                            {t('common.level')} {level.level}
                          </Badge>
                          {isCurrentLevel && (
                            <Badge variant="outline">{t('performance.current')}</Badge>
                          )}
                        </div>
                        <h4 className="font-semibold">{level.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {level.minXP === 0 ? t('performance.initial') : t('performance.xpRequired', { xp: level.minXP })}
                        </p>
                        <ul className="mt-2 space-y-1">
                          {level.benefits.map((benefit, i) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span>•</span>
                              <span>{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    {isUnlocked ? (
                      <Badge variant="default">{t('performance.unlocked')}</Badge>
                    ) : (
                      <Badge variant="secondary">{t('performance.locked')}</Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}