import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

export const Pricing = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const planKeys = ['starter', 'pro', 'legend'];

  const handleCtaClick = (planKey: string) => {
    // Todos os planos redirecionam para a página de autenticação
    navigate('/auth');
  };

  return (
    <section id="pricing" className="py-20 px-4 bg-card/30">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t('pricing.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </motion.div>

        <div className="text-center mb-8">
          <Badge variant="secondary" className="text-sm py-1 px-3">
            <Star className="w-3 h-3 mr-1 inline" />
            {t('pricing.trialBadge')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {planKeys.map((planKey, index) => {
            const isPopular = planKey === 'pro';
            const badgeText = t(`pricing.${planKey}.badge`, { defaultValue: '' });

            return (
              <motion.div
                key={planKey}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={isPopular ? 'md:scale-105' : ''}
              >
                <Card className={`gradient-card card-shadow h-full flex flex-col relative ${isPopular ? 'border-primary glow-effect' : 'border-border/50'}`}>
                  {isPopular && badgeText && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="gradient-primary px-4 py-1">
                        {badgeText}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8 pt-8">
                    <CardTitle className="text-2xl mb-2">
                      {t(`pricing.${planKey}.name`)}
                    </CardTitle>
                    <div className="mb-2">
                      <span className="text-4xl font-bold">
                        {t(`pricing.${planKey}.price`)}
                      </span>
                      <span className="text-muted-foreground">
                        {t(`pricing.${planKey}.period`)}
                      </span>
                    </div>
                    <CardDescription>
                      {t(`pricing.${planKey}.subtitle`)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3">
                      {(t(`pricing.${planKey}.features`, { returnObjects: true }) as string[]).map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className={`w-full ${isPopular ? 'gradient-primary glow-effect' : ''}`}
                      variant={isPopular ? 'default' : 'outline'}
                      size="lg"
                      onClick={() => handleCtaClick(planKey)}
                    >
                      {t(`pricing.${planKey}.cta`)}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};