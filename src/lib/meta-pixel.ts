/**
 * Meta Pixel (Facebook Pixel) implementation
 * Professional setup with consent management, SPA support, and typed events
 */

// Meta Pixel ID
export const META_PIXEL_ID = '848000381146545';

// Type definitions for Meta Pixel events
export interface MetaPixelPurchaseData {
  value: number;
  currency: string;
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  content_name?: string;
  num_items?: number;
}

export interface MetaPixelLeadData {
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

export interface MetaPixelRegistrationData {
  content_name?: string;
  status?: boolean;
  value?: number;
  currency?: string;
}

export interface MetaPixelViewContentData {
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  content_name?: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

export interface MetaPixelAddToCartData {
  content_ids?: string[];
  content_type?: 'product' | 'product_group';
  content_name?: string;
  value?: number;
  currency?: string;
}

// Track initialization state
let isInitialized = false;
let isInitializing = false;

// Extend window for fbq
declare global {
  interface Window {
    fbq: ((...args: unknown[]) => void) & {
      callMethod?: (...args: unknown[]) => void;
      queue: unknown[];
      loaded: boolean;
      version: string;
      push: (...args: unknown[]) => void;
    };
    _fbq: typeof window.fbq;
  }
}

/**
 * Check if Meta Pixel is already loaded
 */
export const isMetaPixelLoaded = (): boolean => {
  return typeof window !== 'undefined' && 
    typeof window.fbq === 'function' && 
    isInitialized;
};

/**
 * Initialize Meta Pixel
 * Only loads once, prevents duplicate initialization
 */
export const initializeMetaPixel = (): Promise<boolean> => {
  return new Promise((resolve) => {
    // Prevent duplicate initialization
    if (isInitialized || isInitializing) {
      console.log('[Meta Pixel] Already initialized or initializing');
      resolve(isInitialized);
      return;
    }

    // Check if running on server
    if (typeof window === 'undefined') {
      console.log('[Meta Pixel] Not in browser environment');
      resolve(false);
      return;
    }

    isInitializing = true;

    try {
      // Meta Pixel base code - only inject if fbq doesn't exist
      if (!window.fbq) {
        const n: Window['fbq'] = (window.fbq = function (...args: unknown[]) {
          if (n.callMethod) {
            n.callMethod(...args);
          } else {
            n.queue.push(args);
          }
        } as Window['fbq']);
        
        if (!window._fbq) window._fbq = n;
        n.push = n;
        n.loaded = true;
        n.version = '2.0';
        n.queue = [];

        // Load the script asynchronously
        const script = document.createElement('script');
        script.async = true;
        script.src = 'https://connect.facebook.net/en_US/fbevents.js';
        script.id = 'meta-pixel-script';
        
        script.onload = () => {
          console.log('[Meta Pixel] Script loaded successfully');
        };
        
        script.onerror = () => {
          console.error('[Meta Pixel] Failed to load script');
          isInitializing = false;
          resolve(false);
        };

        const firstScript = document.getElementsByTagName('script')[0];
        if (firstScript?.parentNode) {
          firstScript.parentNode.insertBefore(script, firstScript);
        } else {
          document.head.appendChild(script);
        }
      }

      // Initialize with Pixel ID
      window.fbq('init', META_PIXEL_ID);
      
      isInitialized = true;
      isInitializing = false;
      console.log('[Meta Pixel] Initialized with ID:', META_PIXEL_ID);
      resolve(true);
    } catch (error) {
      console.error('[Meta Pixel] Initialization error:', error);
      isInitializing = false;
      resolve(false);
    }
  });
};

/**
 * Track PageView event
 */
export const trackPageView = (): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track PageView');
    return false;
  }

  try {
    window.fbq('track', 'PageView');
    console.log('[Meta Pixel] PageView tracked');
    return true;
  } catch (error) {
    console.error('[Meta Pixel] PageView error:', error);
    return false;
  }
};

/**
 * Track Lead event
 */
export const trackLead = (data?: MetaPixelLeadData): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track Lead');
    return false;
  }

  try {
    window.fbq('track', 'Lead', data || {});
    console.log('[Meta Pixel] Lead tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] Lead error:', error);
    return false;
  }
};

/**
 * Track CompleteRegistration event
 */
export const trackCompleteRegistration = (data?: MetaPixelRegistrationData): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track CompleteRegistration');
    return false;
  }

  try {
    window.fbq('track', 'CompleteRegistration', data || {});
    console.log('[Meta Pixel] CompleteRegistration tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] CompleteRegistration error:', error);
    return false;
  }
};

/**
 * Track ViewContent event
 */
export const trackViewContent = (data?: MetaPixelViewContentData): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track ViewContent');
    return false;
  }

  try {
    window.fbq('track', 'ViewContent', data || {});
    console.log('[Meta Pixel] ViewContent tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] ViewContent error:', error);
    return false;
  }
};

/**
 * Track AddToCart event
 */
export const trackAddToCart = (data: MetaPixelAddToCartData): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track AddToCart');
    return false;
  }

  try {
    window.fbq('track', 'AddToCart', data);
    console.log('[Meta Pixel] AddToCart tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] AddToCart error:', error);
    return false;
  }
};

/**
 * Track Purchase event
 */
export const trackPurchase = (data: MetaPixelPurchaseData): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track Purchase');
    return false;
  }

  try {
    window.fbq('track', 'Purchase', data);
    console.log('[Meta Pixel] Purchase tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] Purchase error:', error);
    return false;
  }
};

/**
 * Track InitiateCheckout event
 */
export const trackInitiateCheckout = (data?: {
  value?: number;
  currency?: string;
  content_ids?: string[];
  num_items?: number;
}): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track InitiateCheckout');
    return false;
  }

  try {
    window.fbq('track', 'InitiateCheckout', data || {});
    console.log('[Meta Pixel] InitiateCheckout tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] InitiateCheckout error:', error);
    return false;
  }
};

/**
 * Track StartTrial event (custom)
 */
export const trackStartTrial = (data?: {
  value?: number;
  currency?: string;
  predicted_ltv?: number;
}): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log('[Meta Pixel] Not loaded, cannot track StartTrial');
    return false;
  }

  try {
    window.fbq('track', 'StartTrial', data || {});
    console.log('[Meta Pixel] StartTrial tracked', data);
    return true;
  } catch (error) {
    console.error('[Meta Pixel] StartTrial error:', error);
    return false;
  }
};

/**
 * Track custom event
 */
export const trackCustomEvent = (
  eventName: string,
  data?: Record<string, unknown>
): boolean => {
  if (!isMetaPixelLoaded()) {
    console.log(`[Meta Pixel] Not loaded, cannot track ${eventName}`);
    return false;
  }

  try {
    window.fbq('trackCustom', eventName, data || {});
    console.log(`[Meta Pixel] Custom event "${eventName}" tracked`, data);
    return true;
  } catch (error) {
    console.error(`[Meta Pixel] Custom event "${eventName}" error:`, error);
    return false;
  }
};

/**
 * Get initialization status
 */
export const getMetaPixelStatus = () => ({
  isInitialized,
  isInitializing,
  pixelId: META_PIXEL_ID,
});
