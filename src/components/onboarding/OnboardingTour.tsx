import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface OnboardingStep {
  id: string;
  targetId: string;
  route?: string;
  placement?: 'top' | 'bottom' | 'left' | 'right';
}

interface Props {
  steps: OnboardingStep[];
  index: number;
  onNext: () => void;
  onSkip: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8;
const CARD_W = 320;
const CARD_GAP = 16;

function findTarget(targetId: string): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[data-onboarding-id="${targetId}"]`);
}

export function OnboardingTour({ steps, index, onNext, onSkip }: Props) {
  const { t } = useTranslation();
  const step = steps[index];
  const [rect, setRect] = useState<Rect | null>(null);
  const [ready, setReady] = useState(false);
  const pollRef = useRef<number | null>(null);

  // Poll for the target (route change may still be settling)
  useEffect(() => {
    setReady(false);
    setRect(null);
    let attempts = 0;
    const tick = () => {
      const el = findTarget(step.targetId);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
        setReady(true);
        return;
      }
      attempts += 1;
      if (attempts > 60) {
        // ~15s at 250ms — give up and show centered modal
        setReady(true);
        return;
      }
      pollRef.current = window.setTimeout(tick, 250);
    };
    tick();
    return () => {
      if (pollRef.current) window.clearTimeout(pollRef.current);
    };
  }, [step.targetId, index]);

  // Track scroll/resize
  useLayoutEffect(() => {
    if (!ready) return;
    const update = () => {
      const el = findTarget(step.targetId);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    let ro: ResizeObserver | null = null;
    const el = findTarget(step.targetId);
    if (el && 'ResizeObserver' in window) {
      ro = new ResizeObserver(update);
      ro.observe(el);
    }
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      ro?.disconnect();
    };
  }, [ready, step.targetId]);

  // ESC to skip
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onSkip]);

  if (!ready) return null;

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
  const isLast = index === steps.length - 1;
  const total = steps.length;

  // Compute card position
  let cardStyle: React.CSSProperties = {};
  if (rect && !isMobile) {
    const placement = step.placement ?? 'bottom';
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = rect.top;
    let left = rect.left;
    if (placement === 'right') {
      top = rect.top + rect.height / 2;
      left = rect.left + rect.width + CARD_GAP;
    } else if (placement === 'left') {
      top = rect.top + rect.height / 2;
      left = rect.left - CARD_W - CARD_GAP;
    } else if (placement === 'top') {
      top = rect.top - CARD_GAP;
      left = rect.left + rect.width / 2 - CARD_W / 2;
    } else {
      top = rect.top + rect.height + CARD_GAP;
      left = rect.left + rect.width / 2 - CARD_W / 2;
    }
    // Clamp within viewport
    left = Math.max(12, Math.min(left, vw - CARD_W - 12));
    top = Math.max(12, Math.min(top, vh - 12));
    cardStyle = {
      position: 'fixed',
      top,
      left,
      width: CARD_W,
      transform:
        placement === 'right' || placement === 'left'
          ? 'translateY(-50%)'
          : placement === 'top'
          ? 'translateY(-100%)'
          : undefined,
      zIndex: 10001,
    };
  } else {
    cardStyle = {
      position: 'fixed',
      left: '50%',
      bottom: 24,
      transform: 'translateX(-50%)',
      width: 'min(92vw, 360px)',
      zIndex: 10001,
    };
  }

  const spotlight = rect
    ? {
        position: 'fixed' as const,
        top: rect.top - PAD,
        left: rect.left - PAD,
        width: rect.width + PAD * 2,
        height: rect.height + PAD * 2,
        borderRadius: 12,
        boxShadow: '0 0 0 9999px hsl(var(--background) / 0.75)',
        pointerEvents: 'none' as const,
        zIndex: 10000,
        transition: 'all 250ms ease',
        border: '2px solid hsl(var(--primary))',
      }
    : null;

  return createPortal(
    <>
      {spotlight ? (
        <div style={spotlight} className="animate-fade-in" />
      ) : (
        <div
          className="fixed inset-0 animate-fade-in"
          style={{ background: 'hsl(var(--background) / 0.75)', zIndex: 10000 }}
        />
      )}
      <div
        style={cardStyle}
        className="animate-scale-in rounded-xl border border-border bg-card text-card-foreground shadow-2xl p-5"
        role="dialog"
        aria-live="polite"
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {t('onboarding.progress', { current: index + 1, total })}
          </p>
          <button
            onClick={onSkip}
            aria-label={t('onboarding.skip')}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <h3 className="text-base font-semibold mb-1">
          {t(`onboarding.${step.id}.title`)}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          {t(`onboarding.${step.id}.body`)}
        </p>
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onSkip}>
            {t('onboarding.skip')}
          </Button>
          <Button size="sm" onClick={onNext} className="gap-1">
            {isLast ? t('onboarding.finish') : t('onboarding.next')}
            {!isLast && <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </>,
    document.body
  );
}