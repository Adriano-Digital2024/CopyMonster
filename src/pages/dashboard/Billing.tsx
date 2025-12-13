import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '@/integrations/supabase/client';

// Stripe publishable key is public and safe to include in client code
const stripePromise = loadStripe('pk_live_51S6NJXRiKNxooUH0rzAdEzlbsSAQSSwgo5cc7jISDtLnRpkOIIr3GOrrbTQ7S1dWVGOYzLAB7BooYCtzh6B0YzCD00mom0T3E5');

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [discountCode, setDiscountCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      id: 'starter',
      priceId: 'price_1SDH0CRiKNxooUH0m2yK3ttC',
      popular: false
    },
    {
      id: 'pro',
      priceId: 'price_1SDH2kRiKNxooUH0kbJsDy7T',
      popular: true
    },
    {
      id: 'legend',
      priceId: 'price_1SDHAJRiKNxooUH0nUcBIFaG',
      popular: false
    }
  ];

  const handleApplyDiscount = () => {
    if (!discountCode.trim()) return;

    toast({
      title: t('dashboard.billing.toast.discountApplied'),
      description: t('dashboard.billing.toast.discountAppliedDesc', { code: discountCode })
    });
    setDiscountCode('');
  };

  const handleCheckout = async (planId: string) => {
    if (!user || !stripePromise) return;
    setIsProcessing(true);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error('Plano não encontrado');
      }

      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: plan.priceId,
          planId: plan.id,
          userEmail: user.email,
          userId: user.id
        }
      });

      if (functionError) {
        throw functionError;
      }

      const { sessionId } = data;
      
      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error('Stripe failed to load');
      }
      
      const { error } = await (stripe as any).redirectToCheckout({
        sessionId,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      toast({
        title: 'Erro no checkout',
        description: 'Ocorreu um erro ao processar seu pagamento. Tente novamente.',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('dashboard.billing.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.billing.subtitle')}
          </p>
        </div>

        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <h3 className="font-semibold">{t('dashboard.billing.currentPlan')}</h3>
              <div className="flex items-center gap-2">
                <Badge variant={user?.subscription_status === 'free' ? 'secondary' : 'default'}>
                  {t(`pricing.${user?.subscription_status || 'starter'}.name`)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {user?.credits || 0} {t('dashboard.billing.creditsRemaining')}
                </span>
              </div>
            </div>
            {user?.subscription_status !== 'free' && (
              <div className="text-sm text-muted-foreground">
                {t('dashboard.billing.renewsOn')}: 01/11/2025
              </div>
            )}
          </div>
        </Card>

        <div className="text-center">
          <Badge variant="secondary" className="text-sm py-1 px-3">
            <Star className="w-3 h-3 mr-1 inline" />
            {t('pricing.trialBadge')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.id}
              className={cn(
                'p-6 relative',
                plan.popular && 'border-primary shadow-lg'
              )}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Sparkles className="h-3 w-3 mr-1" />
                  {t('dashboard.billing.mostPopular')}
                </Badge>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold">{t(`pricing.${plan.id}.name`)}</h3>
                  <div className="mt-2 flex items-baseline">
                    <span className="text-4xl font-bold">
                      {t(`pricing.${plan.id}.price`)}
                    </span>
                    <span className="text-muted-foreground ml-2">{t(`pricing.${plan.id}.period`)}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t(`pricing.${plan.id}.subtitle`)}
                  </p>
                </div>

                <ul className="space-y-3">
                  {(t(`pricing.${plan.id}.features`, { returnObjects: true }) as string[]).map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.id === user?.subscription_status ? 'outline' : 'default'}
                  disabled={isProcessing || plan.id === user?.subscription_status}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {isProcessing ? t('dashboard.billing.processing') : 
                   plan.id === user?.subscription_status ? t('dashboard.billing.currentPlanButton') : 
                   t(`pricing.${plan.id}.cta`)}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        <Card className="p-6">
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-1">{t('dashboard.billing.discountCode')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.billing.discountSubtitle')}
              </p>
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="discount">{t('dashboard.billing.codeLabel')}</Label>
                <Input
                  id="discount"
                  value={discountCode}
                  onChange={(e) => setDiscountCode(e.target.value)}
                  placeholder={t('dashboard.billing.codePlaceholder')}
                />
              </div>
              <Button 
                onClick={handleApplyDiscount}
                className="mt-auto"
              >
                {t('dashboard.billing.applyButton')}
              </Button>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">{t('dashboard.billing.transactionHistory')}</h3>
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('dashboard.billing.noTransactions')}</p>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}