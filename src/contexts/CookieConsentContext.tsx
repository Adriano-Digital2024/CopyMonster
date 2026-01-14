import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type CookieCategory = 'essential' | 'analytics' | 'marketing';

export interface CookiePreferences {
  essential: boolean; // Always true
  analytics: boolean;
  marketing: boolean;
  timestamp: number;
  version: string;
}

interface CookieConsentContextType {
  preferences: CookiePreferences | null;
  hasConsented: boolean;
  showBanner: boolean;
  showPreferencesModal: boolean;
  setShowPreferencesModal: (show: boolean) => void;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  updatePreferences: (prefs: Partial<Omit<CookiePreferences, 'essential' | 'timestamp' | 'version'>>) => void;
  hasConsent: (category: CookieCategory) => boolean;
  revokeConsent: () => void;
}

const STORAGE_KEY = 'cookie_consent_preferences';
const CONSENT_VERSION = '1.0';
const CONSENT_EXPIRY_DAYS = 365;

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  timestamp: 0,
  version: CONSENT_VERSION,
};

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

export const useCookieConsent = () => {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error('useCookieConsent must be used within a CookieConsentProvider');
  }
  return context;
};

const isConsentValid = (preferences: CookiePreferences): boolean => {
  const expiryMs = CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
  const isExpired = Date.now() - preferences.timestamp > expiryMs;
  const isVersionMatch = preferences.version === CONSENT_VERSION;
  return !isExpired && isVersionMatch;
};

export const CookieConsentProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferencesModal, setShowPreferencesModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as CookiePreferences;
        if (isConsentValid(parsed)) {
          setPreferences(parsed);
          setShowBanner(false);
        } else {
          // Consent expired or version mismatch
          localStorage.removeItem(STORAGE_KEY);
          setShowBanner(true);
        }
      } else {
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
    setIsInitialized(true);
  }, []);

  const savePreferences = useCallback((newPrefs: CookiePreferences) => {
    const prefsWithMeta: CookiePreferences = {
      ...newPrefs,
      essential: true, // Always true
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    };
    setPreferences(prefsWithMeta);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefsWithMeta));
    setShowBanner(false);
    setShowPreferencesModal(false);
  }, []);

  const acceptAll = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    });
  }, [savePreferences]);

  const rejectNonEssential = useCallback(() => {
    savePreferences({
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    });
  }, [savePreferences]);

  const updatePreferences = useCallback((prefs: Partial<Omit<CookiePreferences, 'essential' | 'timestamp' | 'version'>>) => {
    const current = preferences || defaultPreferences;
    savePreferences({
      ...current,
      ...prefs,
      essential: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    });
  }, [preferences, savePreferences]);

  const hasConsent = useCallback((category: CookieCategory): boolean => {
    if (category === 'essential') return true;
    if (!preferences) return false;
    return preferences[category] === true;
  }, [preferences]);

  const revokeConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPreferences(null);
    setShowBanner(true);
  }, []);

  const hasConsented = preferences !== null && isConsentValid(preferences);

  // Don't render anything until initialized to prevent flash
  if (!isInitialized) {
    return <>{children}</>;
  }

  return (
    <CookieConsentContext.Provider
      value={{
        preferences,
        hasConsented,
        showBanner,
        showPreferencesModal,
        setShowPreferencesModal,
        acceptAll,
        rejectNonEssential,
        updatePreferences,
        hasConsent,
        revokeConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
};
