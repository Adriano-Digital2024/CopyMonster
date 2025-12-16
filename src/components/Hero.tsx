import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { Sparkles, Users, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleStartTrial = () => {
    navigate('/auth');
  };

  const handleViewDemo = () => {
    const agentsSection = document.getElementById('agents');
    if (agentsSection) {
      agentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 gradient-hero opacity-50" />
      
      <div className="container relative z-10 px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-5xl mx-auto text-center"
        >
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2 inline-block" />
            {t('hero.badge')}
          </Badge>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            {t('hero.title')}<br />
            <span className="gradient-primary bg-clip-text text-transparent">
              {t('hero.titleHighlight')}
            </span><br />
            {t('hero.titleEnd')}
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {t('hero.subtitle')}
          </p>

          <div className="flex flex-wrap gap-4 justify-center mb-12">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" className="text-base px-8 py-6 gradient-primary glow-effect" onClick={handleStartTrial}>
                {t('hero.cta.primary')}
              </Button>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button size="lg" variant="outline" className="text-base px-8 py-6" onClick={handleViewDemo}>
                {t('hero.cta.secondary')}
              </Button>
            </motion.div>
          </div>

          <div className="flex flex-wrap gap-6 items-center justify-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{t('hero.trust')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{t('hero.rating')}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-12 max-w-2xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="gradient-card card-shadow rounded-lg p-6 text-center transition-smooth"
            >
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                25+
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t('hero.stats.agents')}
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="gradient-card card-shadow rounded-lg p-6 text-center transition-smooth"
            >
              <div className="text-3xl font-bold gradient-primary bg-clip-text text-transparent">
                DNA
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {t('hero.stats.dna')}
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};