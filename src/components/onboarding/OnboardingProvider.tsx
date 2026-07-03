import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingTour, OnboardingStep } from './OnboardingTour';

const STEPS: OnboardingStep[] = [
  {
    id: 'step1',
    targetId: 'sidebar-positioning',
    route: '/dashboard',
    placement: 'right',
  },
  {
    id: 'step2',
    targetId: 'positioning-questions',
    route: '/dashboard/positioning',
    placement: 'top',
  },
  {
    id: 'step3',
    targetId: 'positioning-save',
    route: '/dashboard/positioning',
    placement: 'bottom',
  },
  {
    id: 'step4',
    targetId: 'sidebar-agents',
    route: '/dashboard/agents',
    placement: 'right',
  },
];

interface OnboardingContextValue {
  active: boolean;
  start: () => void;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used within OnboardingProvider');
  return ctx;
}

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, updateUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const isDashboardArea = location.pathname.startsWith('/dashboard');

  useEffect(() => {
    if (!user) return;
    if (user.has_completed_onboarding) return;
    if (!isDashboardArea) return;
    // Delay a bit so layout mounts
    const t = setTimeout(() => {
      setStepIndex(0);
      setActive(true);
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.has_completed_onboarding]);

  const persistCompletion = useCallback(async () => {
    if (!user) return;
    updateUser({ has_completed_onboarding: true });
    try {
      await supabase
        .from('profiles')
        .update({ has_completed_onboarding: true } as any)
        .eq('id', user.id);
    } catch (err) {
      console.error('[onboarding] failed to persist completion', err);
    }
  }, [user, updateUser]);

  const finish = useCallback(async () => {
    setActive(false);
    await persistCompletion();
  }, [persistCompletion]);

  const next = useCallback(() => {
    setStepIndex((idx) => {
      const nextIdx = idx + 1;
      if (nextIdx >= STEPS.length) {
        finish();
        return idx;
      }
      const nextStep = STEPS[nextIdx];
      if (nextStep.route && location.pathname !== nextStep.route) {
        navigate(nextStep.route);
      }
      return nextIdx;
    });
  }, [finish, location.pathname, navigate]);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      active,
      start: () => {
        setStepIndex(0);
        setActive(true);
      },
    }),
    [active]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {active && (
        <OnboardingTour
          steps={STEPS}
          index={stepIndex}
          onNext={next}
          onSkip={finish}
        />
      )}
    </OnboardingContext.Provider>
  );
}