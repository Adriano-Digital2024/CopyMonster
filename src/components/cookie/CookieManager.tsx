import { useEffect } from 'react';
import { CookieBanner } from './CookieBanner';
import { CookiePreferencesModal } from './CookiePreferencesModal';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { registerConsentChecker, initializeTracking } from '@/lib/tracking';

// Tracking configuration
// Meta Pixel is now managed by MetaPixelTracker component for better SPA support
const TRACKING_CONFIG = {
  ga4MeasurementId: undefined, // e.g., 'G-XXXXXXXXXX' - Configure when needed
  metaPixelId: undefined, // Managed by MetaPixelTracker for SPA compatibility
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
