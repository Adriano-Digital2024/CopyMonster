import { Coins, AlertTriangle, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CreditsDisplayProps {
  showUpgradeButton?: boolean;
  variant?: 'default' | 'compact';
}

const PLAN_LIMITS: Record<string, number> = {
  starter: 1000,
  pro: 5000,
  legend: 15000,
  free: 20,
};

export function CreditsDisplay({ showUpgradeButton = true, variant = 'default' }: CreditsDisplayProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const credits = user?.credits || 0;
  const planLimit = PLAN_LIMITS[user?.subscription_status || 'free'] || 20;
  const isLow = credits < Math.ceil(planLimit * 0.1);
  const usagePercent = Math.min(100, Math.round(((planLimit - credits) / planLimit) * 100));

  // Query monthly usage from usage_logs
  const { data: monthlyUsage } = useQuery({
    queryKey: ['monthly-usage', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabase
        .from('usage_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString());

      return count || 0;
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  if (variant === 'compact') {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md',
              isLow ? 'bg-destructive/10 text-destructive' : 'bg-muted'
            )}>
              {isLow && <AlertTriangle className="h-4 w-4" />}
              <Coins className="h-4 w-4" />
              <span className="font-medium">{credits}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('credits.available')}</p>
            <p className="text-xs text-muted-foreground">{credits} / {planLimit}</p>
            {isLow && <p className="text-destructive">{t('credits.low')}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Card className={cn(
      'p-6',
      isLow && 'border-destructive'
    )}>
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Coins className={cn(
                'h-5 w-5',
                isLow && 'text-destructive'
              )} />
              <h3 className="font-semibold">{t('dashboard.credits')}</h3>
            </div>
            <p className={cn(
              'text-3xl font-bold',
              isLow && 'text-destructive'
            )}>
              {credits}
              <span className="text-sm font-normal text-muted-foreground ml-1">/ {planLimit}</span>
            </p>
          </div>
          {monthlyUsage !== undefined && monthlyUsage > 0 && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>{monthlyUsage} {t('credits.usedThisMonth')}</span>
            </div>
          )}
        </div>

        <Progress value={usagePercent} className="h-2" />

        {isLow && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span>{t('credits.low')}</span>
          </div>
        )}
        <p className="text-sm text-muted-foreground">
          {t('credits.description')}
        </p>
      </div>
      
      {showUpgradeButton && (
        <Button
          onClick={() => navigate('/dashboard/billing')}
          className="w-full mt-4"
          variant={isLow ? 'default' : 'outline'}
        >
          {isLow ? t('credits.recharge') : t('credits.manage')}
        </Button>
      )}
    </Card>
  );
}
