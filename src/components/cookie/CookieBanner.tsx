import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie, Settings, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { Link } from 'react-router-dom';

export const CookieBanner = () => {
  const { t } = useTranslation();
  const { showBanner, acceptAll, rejectNonEssential, setShowPreferencesModal } = useCookieConsent();

  if (!showBanner) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="container mx-auto max-w-4xl">
          <div className="bg-card border border-border rounded-xl shadow-2xl backdrop-blur-sm">
            <div className="p-4 md:p-6">
              {/* Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Cookie className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground text-lg">
                    {t('cookies.banner.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('cookies.banner.description')}{' '}
                    <Link 
                      to="/cookie-policy" 
                      className="text-primary hover:underline"
                    >
                      {t('cookies.banner.learnMore')}
                    </Link>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  onClick={acceptAll}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
                >
                  {t('cookies.banner.acceptAll')}
                </Button>
                <Button
                  variant="outline"
                  onClick={rejectNonEssential}
                  className="flex-1 border-border hover:bg-muted"
                >
                  {t('cookies.banner.rejectNonEssential')}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowPreferencesModal(true)}
                  className="flex-1 sm:flex-none gap-2"
                >
                  <Settings className="w-4 h-4" />
                  {t('cookies.banner.customize')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
