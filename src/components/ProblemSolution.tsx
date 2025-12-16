import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { XCircle, CheckCircle, Clock, DollarSign, Brain, Target } from 'lucide-react';

export const ProblemSolution = () => {
  const { t } = useTranslation('common');

  const problems = [
    { icon: Clock, key: 'time' },
    { icon: DollarSign, key: 'cost' },
    { icon: Brain, key: 'creativity' },
    { icon: Target, key: 'conversion' },
  ];

  const solutions = [
    { icon: Clock, key: 'speed' },
    { icon: DollarSign, key: 'savings' },
    { icon: Brain, key: 'expertise' },
    { icon: Target, key: 'results' },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {t('problemSolution.title')}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t('problemSolution.subtitle')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Problems Column */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <XCircle className="w-8 h-8 text-destructive" />
              <h3 className="text-2xl font-bold text-foreground">
                {t('problemSolution.problemsTitle')}
              </h3>
            </div>
            {problems.map((problem, index) => (
              <motion.div
                key={problem.key}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 rounded-lg bg-destructive/5 border border-destructive/20"
              >
                <problem.icon className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-foreground/80">
                  {t(`problemSolution.problems.${problem.key}`)}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Solutions Column */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <div className="flex items-center gap-3 mb-6">
              <CheckCircle className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-bold text-foreground">
                {t('problemSolution.solutionsTitle')}
              </h3>
            </div>
            {solutions.map((solution, index) => (
              <motion.div
                key={solution.key}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.5 + index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-start gap-4 p-4 rounded-lg bg-primary/5 border border-primary/20"
              >
                <solution.icon className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-foreground/80">
                  {t(`problemSolution.solutions.${solution.key}`)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};
