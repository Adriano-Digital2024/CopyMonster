import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/components/ThemeProvider';
import { useTranslation } from 'react-i18next';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import heroBackground from '@/assets/hero-background.jpg';
import { 
  Target, 
  Video, 
  FileText, 
  Megaphone, 
  Mail, 
  Zap, 
  MessageSquare,
  TrendingUp,
  Users,
  Rocket,
  Clock,
  Shield,
  Crown,
  Star,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Brain,
  Layers,
  Globe,
  BarChart3,
  Heart
} from 'lucide-react';

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Seção 1: Hero Principal
const HeroSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Imagem de fundo */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroBackground})` }}
      />
      
      {/* Overlay/Película para contraste - tons escuros premium */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/70" />
      
      {/* Conteúdo */}
      <div className="container mx-auto px-4 relative z-10">
        <motion.div 
          className="max-w-2xl text-left"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {t('start.hero.intro')}
          </h1>
          
          <p className="text-lg md:text-xl text-white/90 mb-4">
            {t('start.hero.story')}
          </p>
          
          <p className="text-base md:text-lg text-white/80 mb-8">
            {t('start.hero.power')}
          </p>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
            onClick={() => navigate('/auth')}
          >
            {t('start.hero.cta')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <p className="mt-6 text-primary font-medium text-lg italic">
            {t('start.hero.tagline')}
          </p>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 2: Problema/Dor
const ProblemSection = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-3xl mx-auto"
          {...fadeInUp}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-8 text-center">
            {t('start.problem.title')}
          </h2>
          
          <div className="space-y-6 text-lg text-muted-foreground">
            <p className="font-semibold text-foreground">
              {t('start.problem.honest')}
            </p>
            
            <p>
              {t('start.problem.frustration')}
            </p>
            
            <p>
              {t('start.problem.reason')}
            </p>
            
            <p className="italic">
              {t('start.problem.analogy')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 3: Apresentação do CopyMonster
const IntroSection = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          {...fadeInUp}
        >
          <p className="text-lg text-muted-foreground mb-6">
            {t('start.intro.context')}
          </p>
          
          <p className="text-primary font-bold text-xl mb-4">
            {t('start.intro.presenting')}
            <img src={theme === 'dark' ? logoDark : logoLight} alt="CopyMonster" className="h-16 mx-auto my-4" />
          </p>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            {t('start.intro.platform')}
          </h2>
          
          <p className="text-lg text-muted-foreground mb-6">
            {t('start.intro.notJust')}
          </p>
          
          <div className="bg-primary/10 p-6 rounded-xl border border-primary/30 mb-8">
            <p className="text-xl font-semibold text-foreground">
              {t('start.intro.result')}
            </p>
          </div>
          
          <Button 
            size="lg" 
            className="text-lg px-8 py-6"
            onClick={() => navigate('/auth')}
          >
            {t('start.intro.cta')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 4: DNA / Brand Positioning Monster
const DNASection = () => {
  const { t } = useTranslation();
  
  const dnaBlocks = [
    { key: 'audience', title: t('start.dna.blocks.audience.title'), description: t('start.dna.blocks.audience.desc') },
    { key: 'pains', title: t('start.dna.blocks.pains.title'), description: t('start.dna.blocks.pains.desc') },
    { key: 'differentiator', title: t('start.dna.blocks.differentiator.title'), description: t('start.dna.blocks.differentiator.desc') },
    { key: 'transformation', title: t('start.dna.blocks.transformation.title'), description: t('start.dna.blocks.transformation.desc') }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div 
          className="max-w-4xl mx-auto"
          {...fadeInUp}
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              {t('start.dna.secret')}
            </h2>
            <p className="text-lg text-muted-foreground">
              {t('start.dna.mistake')}
            </p>
          </div>
          
          <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-primary/20 rounded-xl">
                  <Brain className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground">{t('start.dna.agentName')}</h3>
                  <p className="text-muted-foreground">{t('start.dna.agentSubtitle')}</p>
                </div>
              </div>
              
              <p className="text-lg text-foreground mb-6">
                {t('start.dna.forget')}
              </p>
              
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {dnaBlocks.map((block) => (
                  <div key={block.key} className="bg-background/50 p-4 rounded-lg border border-border">
                    <h4 className="font-bold text-foreground mb-1">{block.title}</h4>
                    <p className="text-sm text-muted-foreground">{block.description}</p>
                  </div>
                ))}
              </div>
              
              <div className="bg-primary/10 p-6 rounded-xl border border-primary/30">
                <p className="text-foreground font-medium">
                  {t('start.dna.magic')}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 5: Agentes - Arquitetos de Vendas
const SalesArchitectsSection = () => {
  const { t } = useTranslation();
  
  const agents = [
    { icon: Video, name: t('start.agents.architects.vsl.name'), description: t('start.agents.architects.vsl.desc') },
    { icon: FileText, name: t('start.agents.architects.salesPage.name'), description: t('start.agents.architects.salesPage.desc') },
    { icon: Sparkles, name: t('start.agents.architects.headline.name'), description: t('start.agents.architects.headline.desc') }
  ];
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-5xl mx-auto" {...fadeInUp}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('start.agents.title')}</h2>
            <p className="text-primary font-semibold text-xl mb-4">{t('start.agents.subtitle')}</p>
            <p className="text-lg text-muted-foreground">{t('start.agents.description')}</p>
          </div>
          
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-primary/20 rounded-lg"><Rocket className="h-6 w-6 text-primary" /></div>
              <h3 className="text-2xl font-bold text-foreground">{t('start.agents.architects.title')}</h3>
              <span className="text-muted-foreground">{t('start.agents.architects.subtitle')}</span>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              {agents.map((agent, index) => (
                <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                  <Card className="h-full hover:border-primary/50 transition-colors">
                    <CardContent className="p-6">
                      <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4"><agent.icon className="h-6 w-6 text-primary" /></div>
                      <h4 className="font-bold text-foreground mb-2">{agent.name}</h4>
                      <p className="text-sm text-muted-foreground">{agent.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 6: Mestres do Tráfego Pago
const TrafficMastersSection = () => {
  const { t } = useTranslation();
  
  const agents = [
    { icon: Megaphone, name: t('start.agents.traffic.ads.name'), description: t('start.agents.traffic.ads.desc') },
    { icon: Target, name: t('start.agents.traffic.fbGoogle.name'), description: t('start.agents.traffic.fbGoogle.desc') },
    { icon: Zap, name: t('start.agents.traffic.short.name'), description: t('start.agents.traffic.short.desc') }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-5xl mx-auto" {...fadeInUp}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/20 rounded-lg"><TrendingUp className="h-6 w-6 text-primary" /></div>
            <h3 className="text-2xl font-bold text-foreground">{t('start.agents.traffic.title')}</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4"><agent.icon className="h-6 w-6 text-primary" /></div>
                    <h4 className="font-bold text-foreground mb-2">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 7: Magos do Email e Retenção
const EmailMastersSection = () => {
  const { t } = useTranslation();
  
  const agents = [
    { icon: Mail, name: t('start.agents.email.emailMonster.name'), description: t('start.agents.email.emailMonster.desc') },
    { icon: Users, name: t('start.agents.email.leadNurture.name'), description: t('start.agents.email.leadNurture.desc') },
    { icon: MessageSquare, name: t('start.agents.email.whatsapp.name'), description: t('start.agents.email.whatsapp.desc') }
  ];
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-5xl mx-auto" {...fadeInUp}>
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-primary/20 rounded-lg"><Mail className="h-6 w-6 text-primary" /></div>
            <h3 className="text-2xl font-bold text-foreground">{t('start.agents.email.title')}</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {agents.map((agent, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4"><agent.icon className="h-6 w-6 text-primary" /></div>
                    <h4 className="font-bold text-foreground mb-2">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 8: Estrategistas de Lançamento
const LaunchStrategistsSection = () => {
  const { t } = useTranslation();
  
  const agents = [
    { icon: Rocket, name: t('start.agents.launch.launchMonster.name'), description: t('start.agents.launch.launchMonster.desc') },
    { icon: Clock, name: t('start.agents.launch.internal.name'), description: t('start.agents.launch.internal.desc') },
    { icon: Zap, name: t('start.agents.launch.flash.name'), description: t('start.agents.launch.flash.desc') },
    { icon: Video, name: t('start.agents.launch.webinar.name'), description: t('start.agents.launch.webinar.desc') }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-5xl mx-auto" {...fadeInUp}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-primary/20 rounded-lg"><Rocket className="h-6 w-6 text-primary" /></div>
            <h3 className="text-2xl font-bold text-foreground">{t('start.agents.launch.title')}</h3>
          </div>
          <p className="text-muted-foreground mb-8 ml-14">{t('start.agents.launch.subtitle')}</p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {agents.map((agent, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="h-full hover:border-primary/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="p-3 bg-primary/10 rounded-lg w-fit mb-4"><agent.icon className="h-6 w-6 text-primary" /></div>
                    <h4 className="font-bold text-foreground mb-2">{agent.name}</h4>
                    <p className="text-sm text-muted-foreground">{agent.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 9: E Muito Mais
const MoreAgentsSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-3xl mx-auto text-center" {...fadeInUp}>
          <h3 className="text-2xl font-bold text-foreground mb-4">{t('start.more.title')}</h3>
          <p className="text-lg text-muted-foreground mb-8">{t('start.more.description')}</p>
          <Button size="lg" onClick={() => navigate('/auth')}>
            {t('start.more.cta')}
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 10: Exoesqueleto Criativo
const ExoskeletonSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-4xl mx-auto" {...fadeInUp}>
          <div className="text-center mb-12">
            <p className="text-xl text-muted-foreground mb-2">{t('start.exoskeleton.notJust')}</p>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">{t('start.exoskeleton.superpower')}</h2>
          </div>
          
          <div className="space-y-6 text-lg">
            <p className="text-foreground">{t('start.exoskeleton.wearing')}</p>
            <p className="text-muted-foreground">{t('start.exoskeleton.others')}</p>
            <div className="bg-primary/10 p-6 rounded-xl border border-primary/30">
              <p className="text-foreground font-medium">{t('start.exoskeleton.different')}</p>
            </div>
          </div>
          
          <div className="mt-12 text-center bg-muted/50 p-8 rounded-2xl">
            <h3 className="text-xl font-bold text-foreground mb-2">{t('start.exoskeleton.explore')}</h3>
            <p className="text-muted-foreground mb-6">{t('start.exoskeleton.connect')}</p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              {t('start.exoskeleton.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 11: Como o CopyMonster Troca o Jogo
const HowItWorksSection = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-4xl mx-auto" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">{t('start.howItWorks.title')}</h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-primary/30">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {t('start.howItWorks.step1.number')}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{t('start.howItWorks.step1.title')}</h3>
                <p className="text-muted-foreground">{t('start.howItWorks.step1.description')}</p>
              </CardContent>
            </Card>
            
            <Card className="border-primary/30">
              <CardContent className="p-8">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-2xl font-bold mb-4">
                  {t('start.howItWorks.step2.number')}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-4">{t('start.howItWorks.step2.title')}</h3>
                <p className="text-muted-foreground">{t('start.howItWorks.step2.description')}</p>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 12: Depoimentos
const TestimonialsSection = () => {
  const { t } = useTranslation();
  
  const testimonials = [
    { key: 't1', quote: t('start.testimonials.list.t1.quote'), author: t('start.testimonials.list.t1.author'), role: t('start.testimonials.list.t1.role') },
    { key: 't2', quote: t('start.testimonials.list.t2.quote'), author: t('start.testimonials.list.t2.author'), role: t('start.testimonials.list.t2.role') },
    { key: 't3', quote: t('start.testimonials.list.t3.quote'), author: t('start.testimonials.list.t3.author'), role: t('start.testimonials.list.t3.role') }
  ];
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-5xl mx-auto" {...fadeInUp}>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground text-center mb-12">{t('start.testimonials.title')}</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial) => (
              <motion.div key={testimonial.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <p className="text-4xl text-primary mb-4">"</p>
                    <p className="text-muted-foreground mb-6 italic">{testimonial.quote}</p>
                    <div>
                      <p className="font-bold text-foreground">{testimonial.author}</p>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 13: Pricing
const PricingSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const plans = [
    {
      key: 'starter',
      name: t('start.pricing.starter.name'),
      subtitle: t('start.pricing.starter.subtitle'),
      price: t('start.pricing.starter.price'),
      period: t('start.pricing.starter.period'),
      features: [
        t('start.pricing.starter.features.f1'),
        t('start.pricing.starter.features.f2'),
        t('start.pricing.starter.features.f3'),
        t('start.pricing.starter.features.f4')
      ],
      cta: t('start.pricing.starter.cta'),
      popular: false,
      icon: Rocket
    },
    {
      key: 'pro',
      name: t('start.pricing.pro.name'),
      subtitle: t('start.pricing.pro.subtitle'),
      price: t('start.pricing.pro.price'),
      period: t('start.pricing.pro.period'),
      badge: t('start.pricing.pro.badge'),
      features: [
        t('start.pricing.pro.features.f1'),
        t('start.pricing.pro.features.f2'),
        t('start.pricing.pro.features.f3'),
        t('start.pricing.pro.features.f4'),
        t('start.pricing.pro.features.f5')
      ],
      cta: t('start.pricing.pro.cta'),
      popular: true,
      icon: Crown
    },
    {
      key: 'legend',
      name: t('start.pricing.legend.name'),
      subtitle: t('start.pricing.legend.subtitle'),
      price: t('start.pricing.legend.price'),
      period: t('start.pricing.legend.period'),
      features: [
        t('start.pricing.legend.features.f1'),
        t('start.pricing.legend.features.f2'),
        t('start.pricing.legend.features.f3'),
        t('start.pricing.legend.features.f4'),
        t('start.pricing.legend.features.f5')
      ],
      cta: t('start.pricing.legend.cta'),
      popular: false,
      icon: Star
    }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-6xl mx-auto" {...fadeInUp}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{t('start.pricing.title')}</h2>
            <p className="text-lg text-muted-foreground mb-6 max-w-3xl mx-auto">{t('start.pricing.subtitle')}</p>
            <h3 className="text-2xl font-bold text-primary mb-2">{t('start.pricing.trialTitle')}</h3>
            <p className="text-muted-foreground">{t('start.pricing.trialSubtitle')}</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <motion.div key={plan.key} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className={`h-full relative ${plan.popular ? 'border-primary shadow-lg shadow-primary/20' : ''}`}>
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">{plan.badge}</Badge>
                    </div>
                  )}
                  <CardContent className="p-8">
                    <div className="text-center mb-6">
                      <div className="p-3 bg-primary/10 rounded-lg w-fit mx-auto mb-4">
                        <plan.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                      <p className="text-sm text-muted-foreground">{plan.subtitle}</p>
                      <div className="mt-4">
                        <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                    </div>
                    
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm text-muted-foreground">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      onClick={() => navigate('/auth')}
                    >
                      {plan.cta}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 14: Garantia
const GuaranteeSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-3xl mx-auto text-center" {...fadeInUp}>
          <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-6">
            <Shield className="h-12 w-12 text-primary" />
          </div>
          
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{t('start.guarantee.title')}</h2>
          
          <div className="bg-muted/50 p-8 rounded-2xl mb-8">
            <p className="text-lg text-muted-foreground">{t('start.guarantee.description')}</p>
          </div>
          
          <div className="space-y-4">
            <p className="text-xl font-bold text-foreground">{t('start.guarantee.tagline')}</p>
            <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/auth')}>
              {t('start.guarantee.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-muted-foreground">{t('start.guarantee.trial')}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Seção 15: Agências e Copywriters
const AgenciesSection = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const benefits = [
    { icon: BarChart3, text: t('start.agencies.benefits.b1') },
    { icon: Crown, text: t('start.agencies.benefits.b2') },
    { icon: Layers, text: t('start.agencies.benefits.b3') },
    { icon: MessageSquare, text: t('start.agencies.benefits.b4') }
  ];
  
  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <motion.div className="max-w-4xl mx-auto" {...fadeInUp}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">{t('start.agencies.title')}</h2>
            <p className="text-primary font-semibold text-xl">{t('start.agencies.subtitle')}</p>
          </div>
          
          <p className="text-lg text-muted-foreground text-center mb-8">{t('start.agencies.intro')}</p>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {benefits.map((benefit, index) => (
              <motion.div key={index} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <benefit.icon className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-foreground">{benefit.text}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          
          <div className="text-center">
            <p className="text-lg text-muted-foreground mb-6">{t('start.agencies.legend')}</p>
            <Button size="lg" onClick={() => navigate('/auth')}>
              {t('start.agencies.cta')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// Página Principal
const Start = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <ProblemSection />
      <IntroSection />
      <DNASection />
      <SalesArchitectsSection />
      <TrafficMastersSection />
      <EmailMastersSection />
      <LaunchStrategistsSection />
      <MoreAgentsSection />
      <ExoskeletonSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection />
      <GuaranteeSection />
      <AgenciesSection />
      <Footer />
    </div>
  );
};

export default Start;
