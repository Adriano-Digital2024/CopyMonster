import { Coins, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CreditsDisplayProps {
  showUpgradeButton?: boolean;
  variant?: 'default' | 'compact';
}

export function CreditsDisplay({ showUpgradeButton = true, variant = 'default' }: CreditsDisplayProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const credits = user?.credits || 0;
  const isLow = credits < 20;

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
          </p>
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