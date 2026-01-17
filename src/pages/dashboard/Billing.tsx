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

// Load Stripe publishable key from environment variable for easier key rotation
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

// Price IDs mapping by language/currency
const priceIdsByLanguage: Record<string, { starter: string; pro: string; legend: string }> = {
  en: {
    starter: 'price_1SDH0CRiKNxooUH0m2yK3ttC',
    pro: 'price_1SDH2kRiKNxooUH0kbJsDy7T',
    legend: 'price_1SDHAJRiKNxooUH0nUcBIFaG'
  },
  pt: {
    starter: 'price_1SqRcbRiKNxooUH09cijDYsq',
    pro: 'price_1SqRe4RiKNxooUH0tYyprM4P',
    legend: 'price_1SqRgVRiKNxooUH0knqhTTF9'
  },
  es: {
    starter: 'price_1SDH0CRiKNxooUH0m2yK3ttC',
    pro: 'price_1SDH2kRiKNxooUH0kbJsDy7T',
    legend: 'price_1SDHAJRiKNxooUH0nUcBIFaG'
  }
};

export default function Billing() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, i18n } = useTranslation();
  const [discountCode, setDiscountCode] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get price IDs based on current language
  const currentLanguage = i18n.language?.substring(0, 2) || 'en';
  const priceIds = priceIdsByLanguage[currentLanguage] || priceIdsByLanguage.en;

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
        throw new Error('Plano não encontrado');
      }

      console.log('Initiating checkout for plan:', plan.id, 'priceId:', plan.priceId);

      const { data, error: functionError } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: plan.priceId,
          planId: plan.id,
          userEmail: user.email,
          userId: user.id
        }
      });

      console.log('Edge function response:', { data, functionError });

      if (functionError) {
        console.error('Function error:', functionError);
        throw new Error(functionError.message || 'Erro ao criar sessão de checkout');
      }

      if (!data) {
        throw new Error('Resposta vazia do servidor');
      }

      if (data.error) {
        console.error('Server returned error:', data.error);
        throw new Error(data.error);
      }

      if (!data.url) {
        console.error('No checkout URL in response:', data);
        throw new Error('URL de checkout não foi criada');
      }

      console.log('Redirecting browser to Stripe checkout URL:', data.url);
      window.location.href = data.url as string;
    } catch (error) {
      console.error('Erro no checkout:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro ao processar seu pagamento';
      toast({
        title: 'Erro no checkout',
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