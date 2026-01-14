/**
 * Tracking utilities for conditional script loading based on cookie consent.
 * Scripts are only loaded after explicit user consent.
 */

type ConsentChecker = (category: 'essential' | 'analytics' | 'marketing') => boolean;

let consentChecker: ConsentChecker | null = null;

// Register the consent checker from the context
export const registerConsentChecker = (checker: ConsentChecker) => {
  consentChecker = checker;
};

// Check if user has consented to a category
export const hasConsent = (category: 'essential' | 'analytics' | 'marketing'): boolean => {
  if (!consentChecker) return false;
  return consentChecker(category);
};

// Track loaded scripts to prevent duplicates
const loadedScripts = new Set<string>();

// Generic script loader
const loadScript = (src: string, id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (loadedScripts.has(id)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.id = id;
    script.async = true;
    script.onload = () => {
      loadedScripts.add(id);
      resolve();
    };
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

// Initialize Google Analytics 4
export const initializeAnalytics = async (measurementId?: string): Promise<boolean> => {
  if (!hasConsent('analytics')) {
    console.log('[Tracking] Analytics consent not granted');
    return false;
  }

  if (!measurementId) {
    console.log('[Tracking] No GA4 measurement ID provided');
    return false;
  }

  try {
    await loadScript(`https://www.googletagmanager.com/gtag/js?id=${measurementId}`, 'ga4-script');
    
    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args);
    }
    gtag('js', new Date());
    gtag('config', measurementId, {
      anonymize_ip: true, // GDPR compliance
      cookie_flags: 'SameSite=None;Secure',
    });

    console.log('[Tracking] GA4 initialized');
    return true;
  } catch (error) {
    console.error('[Tracking] Failed to initialize GA4:', error);
    return false;
  }
};

// Initialize Meta Pixel
export const initializeMarketing = async (pixelId?: string): Promise<boolean> => {
  if (!hasConsent('marketing')) {
    console.log('[Tracking] Marketing consent not granted');
    return false;
  }

  if (!pixelId) {
    console.log('[Tracking] No Meta Pixel ID provided');
    return false;
  }

  try {
    // Meta Pixel base code
    const fbq = (window as unknown as { fbq?: unknown }).fbq;
    if (!fbq) {
      (function(f: Window, b: Document, e: string, v: string, n?: HTMLScriptElement, t?: Element, s?: Element | null) {
        if ((f as unknown as Record<string, unknown>).fbq) return;
        n = (f as unknown as Record<string, unknown>).fbq = function(...args: unknown[]) {
          (n as unknown as { callMethod?: (...args: unknown[]) => void; queue: unknown[] }).callMethod
            ? (n as unknown as { callMethod: (...args: unknown[]) => void }).callMethod(...args)
            : (n as unknown as { queue: unknown[] }).queue.push(args);
        } as unknown as HTMLScriptElement;
        (n as unknown as { push: typeof n }).push = n as unknown as typeof n;
        (n as unknown as { loaded: boolean }).loaded = true;
        (n as unknown as { version: string }).version = '2.0';
        (n as unknown as { queue: unknown[] }).queue = [];
        t = b.createElement(e) as Element;
        (t as HTMLScriptElement).async = true;
        (t as HTMLScriptElement).src = v;
        s = b.getElementsByTagName(e)[0];
        s?.parentNode?.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    }

    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('init', pixelId);
    (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', 'PageView');

    loadedScripts.add('meta-pixel');
    console.log('[Tracking] Meta Pixel initialized');
    return true;
  } catch (error) {
    console.error('[Tracking] Failed to initialize Meta Pixel:', error);
    return false;
  }
};

// Track custom events with consent check
export const trackEvent = (
  category: 'analytics' | 'marketing',
  eventName: string,
  eventParams?: Record<string, unknown>
): boolean => {
  if (!hasConsent(category)) {
    console.log(`[Tracking] Cannot track event "${eventName}" - no ${category} consent`);
    return false;
  }

  try {
    if (category === 'analytics' && window.gtag) {
      window.gtag('event', eventName, eventParams);
      console.log(`[Tracking] GA4 event: ${eventName}`);
      return true;
    }

    if (category === 'marketing' && (window as unknown as { fbq?: (...args: unknown[]) => void }).fbq) {
      (window as unknown as { fbq: (...args: unknown[]) => void }).fbq('track', eventName, eventParams);
      console.log(`[Tracking] Meta event: ${eventName}`);
      return true;
    }

    return false;
  } catch (error) {
    console.error(`[Tracking] Failed to track event "${eventName}":`, error);
    return false;
  }
};

// Initialize all tracking based on consent
export const initializeTracking = async (config: {
  ga4MeasurementId?: string;
  metaPixelId?: string;
}): Promise<void> => {
  const promises: Promise<boolean>[] = [];

  if (config.ga4MeasurementId) {
    promises.push(initializeAnalytics(config.ga4MeasurementId));
  }

  if (config.metaPixelId) {
    promises.push(initializeMarketing(config.metaPixelId));
  }

  await Promise.all(promises);
};

// Extend window for gtag
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}
