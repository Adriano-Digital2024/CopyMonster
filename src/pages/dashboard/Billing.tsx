import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Sparkles, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useMetaPixel } from '@/hooks/useMetaPixel';

// Single USD Price IDs for all languages
const priceIds = {
  starter: 'price_1SDH0CRiKNxooUH0m2yK3ttC',
  pro: 'price_1SDH2kRiKNxooUH0kbJsDy7T',
  legend: 'price_1SDHAJRiKNxooUH0nUcBIFaG',
};

const annualPriceIds = {
  starter: 'price_1TtcwERiKNxooUH0qUcxjaai',
  pro: 'price_1TtcxmRiKNxooUH0YT51blK6',
  legend: 'price_1TtczXRiKNxooUH0wjLWYEc6',
};

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [discountCode, setDiscountCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const { trackInitiateCheckout } = useMetaPixel();

  const plans = [
    {
      id: 'starter',
      priceId: priceIds.starter,
      popular: false
    },
    {
      id: 'pro',
      priceId: priceIds.pro,
      popular: true
    },
    {
      id: 'legend',
      priceId: priceIds.legend,
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
    if (!user) return;
    setIsProcessing(true);
    
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) {
        throw new Error(t('dashboard.billing.errors.planNotFound'));
      }

      const selectedPriceId = isAnnual ? annualPriceIds[planId as keyof typeof annualPriceIds] : plan.priceId;

      // Track Meta Pixel InitiateCheckout event
      trackInitiateCheckout({ content_ids: [plan.id], num_items: 1 });

      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: selectedPriceId,
          planId: plan.id,
        }
      });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || t('dashboard.billing.errors.createCheckoutError'));
      }

      if (!data) {
        throw new Error(t('dashboard.billing.errors.emptyResponse'));
      }

      if (data.error) {
        console.error('Server returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data.url) {
        console.error('No checkout URL in response:', data);
        throw new Error(t('dashboard.billing.errors.noCheckoutUrl'));
      }

      const checkoutUrl = data.url as string;
      const checkoutParsed = (() => { try { return new URL(checkoutUrl); } catch { return null; } })();
      if (!checkoutParsed || checkoutParsed.hostname !== 'checkout.stripe.com' || checkoutParsed.protocol !== 'https:') {
        throw new Error('URL de checkout inválida');
      }
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro no checkout:', error);
      const errorMessage = error instanceof Error ? error.message : t('dashboard.billing.errors.checkoutErrorDesc');
      toast({
        title: t('dashboard.billing.errors.checkoutError'),
        description: errorMessage,
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
            {user?.subscription_status !== 'free' && user?.current_period_end && (
              <div className="text-sm text-muted-foreground">
                {t('dashboard.billing.renewsOn')}: {new Date(user.current_period_end).toLocaleDateString()}
              </div>
            )}
          </div>
        </Card>

        {user?.subscription_status === 'free' && user?.trial_expires_at && new Date(user.trial_expires_at) > new Date() && (
          <div className="text-center">
            <Badge variant="secondary" className="text-sm py-1 px-3">
              <Star className="w-3 h-3 mr-1 inline" />
              {t('pricing.trialBadge')}
            </Badge>
          </div>
        )}

        {/* Billing Toggle */}
        <div className="flex items-center justify-center">
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-xl border border-border/50 dark:border-amber-500/30 dark:shadow-[0_0_12px_rgba(251,191,36,0.15)] transition-shadow duration-300">
            <span className={`text-sm ${!isAnnual ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
              {t('pricing.monthly')}
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm ${isAnnual ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
              {t('pricing.annual')}
              <Badge variant="default" className="ml-2 text-xs bg-green-600">
                🔥 {t('pricing.savePercent', { percent: '17' })}
              </Badge>
            </span>
          </div>
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
                      {isAnnual ? t(`pricing.${plan.id}.priceAnnual`) : t(`pricing.${plan.id}.price`)}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {isAnnual ? t(`pricing.${plan.id}.periodAnnual`) : t(`pricing.${plan.id}.period`)}
                    </span>
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