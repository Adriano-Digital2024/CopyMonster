import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useTheme } from '@/components/ThemeProvider';
import logoLight from '@/assets/logo-light.png';
import logoDark from '@/assets/logo-dark.png';
import { motion } from 'framer-motion';

const TYPING_SPEED = 45;
const PAUSE_DURATION = 2000;
const DELETE_SPEED = 25;

export default function ChatLanding() {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [inputValue, setInputValue] = useState('');
  const [placeholder, setPlaceholder] = useState('');

  const prompts = [
    t('chatLanding.prompts.salesPage'),
    t('chatLanding.prompts.instagram'),
    t('chatLanding.prompts.adCopy'),
    t('chatLanding.prompts.emailSequence'),
  ];

  const tags = [
    t('chatLanding.tags.salesPages'),
    t('chatLanding.tags.adCopy'),
    t('chatLanding.tags.instagramContent'),
    t('chatLanding.tags.launchScripts'),
    t('chatLanding.tags.emailSequences'),
  ];

  // Typing animation
  useEffect(() => {
    let currentPromptIndex = 0;
    let currentCharIndex = 0;
    let isDeleting = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    const tick = () => {
      const currentPrompt = prompts[currentPromptIndex];

      if (!isDeleting) {
        currentCharIndex++;
        setPlaceholder(currentPrompt.slice(0, currentCharIndex));

        if (currentCharIndex === currentPrompt.length) {
          isDeleting = true;
          timeoutId = setTimeout(tick, PAUSE_DURATION);
          return;
        }
        timeoutId = setTimeout(tick, TYPING_SPEED);
      } else {
        currentCharIndex--;
        setPlaceholder(currentPrompt.slice(0, currentCharIndex));

        if (currentCharIndex === 0) {
          isDeleting = false;
          currentPromptIndex = (currentPromptIndex + 1) % prompts.length;
          timeoutId = setTimeout(tick, 400);
          return;
        }
        timeoutId = setTimeout(tick, DELETE_SPEED);
      }
    };

    timeoutId = setTimeout(tick, 600);
    return () => clearTimeout(timeoutId);
  }, [t]);

  const handleSend = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const logo = theme === 'dark' ? logoDark : logoLight;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full px-6 py-4 flex items-center justify-between">
        <img
          src={logo}
          alt="CopyMonster"
          className="h-8 cursor-pointer"
          onClick={() => navigate('/')}
        />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-2xl text-center space-y-8"
        >
          {/* Headline */}
          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-tight">
              {t('chatLanding.headline')}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
              {t('chatLanding.subheadline')}
            </p>
          </div>

          {/* Chat Input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative group"
          >
            {/* Glow effect */}
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-primary/30 via-primary/10 to-primary/30 opacity-60 group-hover:opacity-100 blur-lg transition-opacity duration-500" />
            
            <div className="relative flex items-center bg-card border border-border rounded-2xl p-2 shadow-lg">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-sm sm:text-base px-4 py-3 outline-none"
              />
              <Button
                onClick={handleSend}
                size="icon"
                className="h-10 w-10 rounded-xl shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* Trust microcopy */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-xs text-muted-foreground"
          >
            {t('chatLanding.trustText')}
          </motion.p>

          {/* Category tags */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.4 }}
            className="flex flex-wrap justify-center gap-2"
          >
            {tags.map((tag) => (
              <span
                key={tag}
                className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/50 text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
