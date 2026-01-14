import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import { 
  initializeMetaPixel, 
  trackPageView, 
  isMetaPixelLoaded 
} from '@/lib/meta-pixel';

/**
 * MetaPixelTracker - SPA-compatible Meta Pixel tracking component
 * 
 * This component:
 * - Initializes Meta Pixel when marketing consent is granted
 * - Tracks PageView on every route change
 * - Prevents duplicate tracking
 * - Is fully compatible with React Router SPA navigation
 */
export const MetaPixelTracker = () => {
  const location = useLocation();
  const cookieConsent = useCookieConsent();
  const hasMarketingConsent = cookieConsent?.hasConsent('marketing') ?? false;
  const previousPathRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);

  // Initialize Meta Pixel when consent is granted
  useEffect(() => {
    if (!hasMarketingConsent) {
      console.log('[MetaPixelTracker] No marketing consent, skipping initialization');
      return;
    }

    if (isInitializedRef.current) {
      console.log('[MetaPixelTracker] Already initialized');
      return;
    }

    const init = async () => {
      const success = await initializeMetaPixel();
      if (success) {
        isInitializedRef.current = true;
        // Track initial PageView after initialization
        trackPageView();
        previousPathRef.current = location.pathname;
      }
    };

    init();
  }, [hasMarketingConsent, location.pathname]);

  // Track PageView on route changes
  useEffect(() => {
    // Skip if no consent or not initialized
    if (!hasMarketingConsent || !isMetaPixelLoaded()) {
      return;
    }

    // Skip if it's the same path (prevents duplicate on initial load)
    if (previousPathRef.current === location.pathname) {
      return;
    }

    // Track the page view
    trackPageView();
    previousPathRef.current = location.pathname;

    console.log('[MetaPixelTracker] Route changed, PageView tracked:', location.pathname);
  }, [location.pathname, hasMarketingConsent]);

  // This component doesn't render anything
  return null;
};

export default MetaPixelTracker;
