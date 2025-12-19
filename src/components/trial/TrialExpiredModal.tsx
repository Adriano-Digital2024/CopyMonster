import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, CreditCard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface TrialExpiredModalProps {
  open: boolean;
  type: 'trial_expired' | 'no_credits';
}

export function TrialExpiredModal({ open, type }: TrialExpiredModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleUpgrade = () => {
    navigate('/dashboard/billing');
  };

  const isTrialExpired = type === 'trial_expired';

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            {isTrialExpired ? (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            ) : (
              <CreditCard className="h-8 w-8 text-destructive" />
            )}
          </div>
          <DialogTitle className="text-xl">
            {isTrialExpired 
              ? t('trial.expired.title') 
              : t('trial.noCredits.title')
            }
          </DialogTitle>
          <DialogDescription className="text-base">
            {isTrialExpired 
              ? t('trial.expired.description') 
              : t('trial.noCredits.description')
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">
              {t('trial.upgrade.benefits')}
            </h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>✓ {t('trial.upgrade.benefit1')}</li>
              <li>✓ {t('trial.upgrade.benefit2')}</li>
              <li>✓ {t('trial.upgrade.benefit3')}</li>
            </ul>
          </div>
          
          <Button 
            onClick={handleUpgrade} 
            className="w-full"
            size="lg"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {t('trial.upgrade.button')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
