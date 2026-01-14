import { useEffect } from 'react';
import { CookieBanner } from './CookieBanner';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { registerConsentChecker, initializeTracking } from '@/lib/tracking';

// Optional: Configure your tracking IDs here or via environment variables
const TRACKING_CONFIG = {
  ga4MeasurementId: undefined, // e.g., 'G-XXXXXXXXXX'
  metaPixelId: undefined, // e.g., '1234567890'
};

export const CookieManager = () => {
  const cookieConsent = useCookieConsent();
  const hasConsent = cookieConsent?.hasConsent;
  const preferences = cookieConsent?.preferences;

  // Register consent checker for tracking utilities
  useEffect(() => {
    if (hasConsent) {
      registerConsentChecker(hasConsent);
    }
  }, [hasConsent]);

  // Initialize tracking when consent changes
  useEffect(() => {
    if (preferences) {
      initializeTracking(TRACKING_CONFIG);
    }
  }, [preferences]);

  return (
    <>
      <CookieBanner />
      <CookiePreferencesModal />
    </>
  );
};
