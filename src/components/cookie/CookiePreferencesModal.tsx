import { useTranslation } from 'react-i18next';
import { Cookie, Shield, BarChart3, Target, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export const CookiePreferencesModal = () => {
  const { t } = useTranslation();
  const cookieConsent = useCookieConsent();

  const [localPrefs, setLocalPrefs] = useState({
    analytics: false,
    marketing: false,
  });

  // Get values from context safely
  const showPreferencesModal = cookieConsent?.showPreferencesModal ?? false;
  const setShowPreferencesModal = cookieConsent?.setShowPreferencesModal;
  const preferences = cookieConsent?.preferences;
  const updatePreferences = cookieConsent?.updatePreferences;
  const acceptAll = cookieConsent?.acceptAll;

  // Sync local state with context preferences
  useEffect(() => {
    if (preferences) {
      setLocalPrefs({
        analytics: preferences.analytics,
        marketing: preferences.marketing,
      });
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences?.(localPrefs);
  };

  const categories = [
    {
      id: 'essential',
      icon: Shield,
      enabled: true,
      disabled: true,
      title: t('cookies.categories.essential.title'),
      description: t('cookies.categories.essential.description'),
    },
    {
      id: 'analytics',
      icon: BarChart3,
      enabled: localPrefs.analytics,
      disabled: false,
      title: t('cookies.categories.analytics.title'),
      description: t('cookies.categories.analytics.description'),
    },
    {
      id: 'marketing',
      icon: Target,
      enabled: localPrefs.marketing,
      disabled: false,
      title: t('cookies.categories.marketing.title'),
      description: t('cookies.categories.marketing.description'),
    },
  ];

  if (!cookieConsent) return null;

  return (
    <Dialog open={showPreferencesModal} onOpenChange={(open) => setShowPreferencesModal?.(open)}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t('cookies.preferences.title')}
              </DialogTitle>
              <DialogDescription className="text-sm">
                {t('cookies.preferences.description')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <div
                key={category.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-background flex items-center justify-center border border-border">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-4">
                    <Label
                      htmlFor={`cookie-${category.id}`}
                      className="text-sm font-medium text-foreground cursor-pointer"
                    >
                      {category.title}
                      {category.disabled && (
                        <span className="ml-2 text-xs text-primary font-normal">
                          ({t('cookies.preferences.alwaysActive')})
                        </span>
                      )}
                    </Label>
                    <Switch
                      id={`cookie-${category.id}`}
                      checked={category.enabled}
                      disabled={category.disabled}
                      onCheckedChange={(checked) => {
                        if (category.id === 'analytics') {
                          setLocalPrefs((prev) => ({ ...prev, analytics: checked }));
                        } else if (category.id === 'marketing') {
                          setLocalPrefs((prev) => ({ ...prev, marketing: checked }));
                        }
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {category.description}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Link to full policy */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="w-4 h-4" />
            <Link
              to="/cookie-policy"
              className="text-primary hover:underline"
              onClick={() => setShowPreferencesModal?.(false)}
            >
              {t('cookies.preferences.viewFullPolicy')}
            </Link>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleSave}
            className="flex-1"
          >
            {t('cookies.preferences.savePreferences')}
          </Button>
          <Button
            onClick={acceptAll}
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {t('cookies.preferences.acceptAll')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
