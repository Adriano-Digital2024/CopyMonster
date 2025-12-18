import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface CompletionPanelProps {
  onViewMapping: () => void;
  onCreateCopys: () => void;
  agentColor?: string;
}

export function CompletionPanel({
  onViewMapping,
  onCreateCopys,
  agentColor = '#6B46C1',
}: CompletionPanelProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="mt-6"
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border-2',
          'bg-gradient-to-br from-background via-background to-muted/50',
          'shadow-xl'
        )}
        style={{ borderColor: `${agentColor}40` }}
      >
        {/* Decorative gradient overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${agentColor} 0%, transparent 50%, ${agentColor}30 100%)`,
          }}
        />

        {/* Content */}
        <div className="relative p-6 space-y-6">
          {/* Success Header */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className="flex items-center gap-3"
          >
            <div
              className="p-3 rounded-xl"
              style={{ backgroundColor: `${agentColor}20` }}
            >
              <CheckCircle2
                className="h-6 w-6"
                style={{ color: agentColor }}
              />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                {t('positioning.completion.title', 'Mapeamento Estratégico Completo!')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('positioning.completion.subtitle', 'Seu DNA de marca está pronto para uso')}
              </p>
            </div>
            <Sparkles
              className="h-5 w-5 ml-auto animate-pulse"
              style={{ color: agentColor }}
            />
          </motion.div>

          {/* Divider */}
          <div className="h-px bg-border/50" />

          {/* Description */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="text-sm text-muted-foreground"
          >
            {t(
              'positioning.completion.description',
              'Agora você pode baixar seu documento de posicionamento ou utilizar esse mapeamento para criar copys de alta conversão com nossos agentes especializados.'
            )}
          </motion.p>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              variant="outline"
              size="lg"
              onClick={onViewMapping}
              className={cn(
                'flex-1 gap-2 h-14',
                'border-2 hover:bg-muted/50',
                'transition-all duration-200 hover:scale-[1.02]'
              )}
            >
              <FileText className="h-5 w-5" />
              <div className="text-left">
                <span className="block font-semibold">
                  {t('positioning.completion.viewMapping', 'Ver Mapeamento')}
                </span>
                <span className="block text-xs text-muted-foreground font-normal">
                  {t('positioning.completion.viewMappingHint', 'Baixar documento completo')}
                </span>
              </div>
            </Button>

            <Button
              size="lg"
              onClick={onCreateCopys}
              className={cn(
                'flex-1 gap-2 h-14',
                'transition-all duration-200 hover:scale-[1.02]',
                'shadow-lg'
              )}
              style={{ backgroundColor: agentColor }}
            >
              <Sparkles className="h-5 w-5" />
              <div className="text-left">
                <span className="block font-semibold">
                  {t('positioning.completion.createCopys', 'Criar Copys')}
                </span>
                <span className="block text-xs opacity-80 font-normal">
                  {t('positioning.completion.createCopysHint', 'Escolher próximo agente')}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 ml-auto" />
            </Button>
          </motion.div>

          {/* Context Info */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-3"
          >
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
            <span>
              {t(
                'positioning.completion.contextNote',
                'O contexto do seu mapeamento será automaticamente passado para o próximo agente.'
              )}
            </span>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
