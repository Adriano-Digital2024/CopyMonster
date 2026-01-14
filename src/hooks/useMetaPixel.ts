import { useCallback, useMemo } from 'react';
import { useCookieConsent } from '@/contexts/CookieConsentContext';
import {
  isMetaPixelLoaded,
  trackPageView as rawTrackPageView,
  trackLead as rawTrackLead,
  trackCompleteRegistration as rawTrackCompleteRegistration,
  trackViewContent as rawTrackViewContent,
  trackAddToCart as rawTrackAddToCart,
  trackPurchase as rawTrackPurchase,
  trackInitiateCheckout as rawTrackInitiateCheckout,
  trackStartTrial as rawTrackStartTrial,
  trackCustomEvent as rawTrackCustomEvent,
  type MetaPixelPurchaseData,
  type MetaPixelLeadData,
  type MetaPixelRegistrationData,
  type MetaPixelViewContentData,
  type MetaPixelAddToCartData,
} from '@/lib/meta-pixel';

export interface UseMetaPixelReturn {
  /** Whether the Pixel is loaded and ready */
  isLoaded: boolean;
  /** Whether user has marketing consent */
  hasConsent: boolean;
  /** Track a page view */
  trackPageView: () => boolean;
  /** Track a lead event */
  trackLead: (data?: MetaPixelLeadData) => boolean;
  /** Track a complete registration event */
  trackCompleteRegistration: (data?: MetaPixelRegistrationData) => boolean;
  /** Track a view content event */
  trackViewContent: (data?: MetaPixelViewContentData) => boolean;
  /** Track an add to cart event */
  trackAddToCart: (data: MetaPixelAddToCartData) => boolean;
  /** Track a purchase event */
  trackPurchase: (data: MetaPixelPurchaseData) => boolean;
  /** Track initiate checkout event */
  trackInitiateCheckout: (data?: { value?: number; currency?: string; content_ids?: string[]; num_items?: number }) => boolean;
  /** Track start trial event */
  trackStartTrial: (data?: { value?: number; currency?: string; predicted_ltv?: number }) => boolean;
  /** Track a custom event */
  trackCustomEvent: (eventName: string, data?: Record<string, unknown>) => boolean;
}

/**
 * Hook for Meta Pixel tracking with consent verification
 * All tracking methods automatically check for marketing consent
 */
export const useMetaPixel = (): UseMetaPixelReturn => {
  const cookieConsent = useCookieConsent();
  
  const hasConsent = useMemo(() => {
    return cookieConsent?.hasConsent('marketing') ?? false;
  }, [cookieConsent]);

  const isLoaded = useMemo(() => {
    return hasConsent && isMetaPixelLoaded();
  }, [hasConsent]);

  const trackPageView = useCallback(() => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for PageView');
      return false;
    }
    return rawTrackPageView();
  }, [hasConsent]);

  const trackLead = useCallback((data?: MetaPixelLeadData) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for Lead');
      return false;
    }
    return rawTrackLead(data);
  }, [hasConsent]);

  const trackCompleteRegistration = useCallback((data?: MetaPixelRegistrationData) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for CompleteRegistration');
      return false;
    }
    return rawTrackCompleteRegistration(data);
  }, [hasConsent]);

  const trackViewContent = useCallback((data?: MetaPixelViewContentData) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for ViewContent');
      return false;
    }
    return rawTrackViewContent(data);
  }, [hasConsent]);

  const trackAddToCart = useCallback((data: MetaPixelAddToCartData) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for AddToCart');
      return false;
    }
    return rawTrackAddToCart(data);
  }, [hasConsent]);

  const trackPurchase = useCallback((data: MetaPixelPurchaseData) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for Purchase');
      return false;
    }
    return rawTrackPurchase(data);
  }, [hasConsent]);

  const trackInitiateCheckout = useCallback((data?: { value?: number; currency?: string; content_ids?: string[]; num_items?: number }) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for InitiateCheckout');
      return false;
    }
    return rawTrackInitiateCheckout(data);
  }, [hasConsent]);

  const trackStartTrial = useCallback((data?: { value?: number; currency?: string; predicted_ltv?: number }) => {
    if (!hasConsent) {
      console.log('[useMetaPixel] No marketing consent for StartTrial');
      return false;
    }
    return rawTrackStartTrial(data);
  }, [hasConsent]);

  const trackCustomEvent = useCallback((eventName: string, data?: Record<string, unknown>) => {
    if (!hasConsent) {
      console.log(`[useMetaPixel] No marketing consent for ${eventName}`);
      return false;
    }
    return rawTrackCustomEvent(eventName, data);
  }, [hasConsent]);

  return {
    isLoaded,
    hasConsent,
    trackPageView,
    trackLead,
    trackCompleteRegistration,
    trackViewContent,
    trackAddToCart,
    trackPurchase,
    trackInitiateCheckout,
    trackStartTrial,
    trackCustomEvent,
  };
};

// Re-export types for convenience
export type {
  MetaPixelPurchaseData,
  MetaPixelLeadData,
  MetaPixelRegistrationData,
  MetaPixelViewContentData,
  MetaPixelAddToCartData,
} from '@/lib/meta-pixel';
