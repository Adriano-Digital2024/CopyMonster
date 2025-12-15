import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { XCircle, CheckCircle } from 'lucide-react';

export const ProblemSolution = () => {
  const { t } = useTranslation();
  const problems = t('problem.points', { returnObjects: true }) as Array<{ title: string; description: string }>;
  const solutions = t('solution.points', { returnObjects: true }) as Array<{ title: string; description: string }>;

  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-2 text-destructive">{t('problem.title')}</h2>
            <p className="text-muted-foreground mb-8">{t('problem.subtitle')}</p>
            <div className="space-y-6">
              {problems.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <XCircle className="w-6 h-6 text-destructive flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">{point.title}</h4>
                    <p className="text-muted-foreground text-sm">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-2 text-primary">{t('solution.title')}</h2>
            <p className="text-muted-foreground mb-8">{t('solution.subtitle')}</p>
            <div className="space-y-6">
              {solutions.map((point, index) => (
                <div key={index} className="flex gap-4">
                  <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="font-semibold mb-1">{point.title}</h4>
                    <p className="text-muted-foreground text-sm">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
