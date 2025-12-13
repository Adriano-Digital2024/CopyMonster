import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AGENTS } from '@/lib/copymonster-config';

export const Agents = () => {
  const { t } = useTranslation();

  return (
    <section id="agents" className="py-20 px-4">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            {t('agents.title')}
          </h2>
          <p className="text-xl text-primary font-semibold mb-4">
            {t('agents.subtitle')}
          </p>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('agents.description')}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {AGENTS.map((agent, index) => {
            const Icon = agent.icon;
            return (
              <motion.div
                key={agent.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="gradient-card card-shadow transition-smooth hover:scale-105 h-full border-border/50">
                  <CardHeader>
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center mb-4"
                      style={{ backgroundColor: agent.color + '20' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: agent.color }} />
                    </div>
                    <CardTitle className="text-xl">
                      {t(`agents.list.${agent.tKey}.name`)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {t(`agents.list.${agent.tKey}.description`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};