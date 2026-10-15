import React, { useEffect, useRef, useState } from 'react';
import { useInView, animate } from 'framer-motion';
import { usePrefersReducedMotion } from './reducedMotion';

export interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  useGrouping?: boolean;
  className?: string;
}

/**
 * AnimatedNumber Component
 * Reusable viewport-triggered number counter for genuine numeric statistics.
 * Respects prefers-reduced-motion, animates once when visible, and supports decimals & grouping.
 */
export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  decimals = 0,
  duration = 1.2,
  prefix = '',
  suffix = '',
  useGrouping = true,
  className = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-40px' });
  const shouldReduceMotion = usePrefersReducedMotion();

  const formatNumber = (val: number, dec: number, grouping: boolean): string => {
    return val.toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec,
      useGrouping: grouping,
    });
  };

  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatNumber(shouldReduceMotion ? value : 0, decimals, useGrouping)
  );

  const hasAnimated = useRef(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      setDisplayValue(formatNumber(value, decimals, useGrouping));
      return;
    }

    if (isInView && !hasAnimated.current) {
      hasAnimated.current = true;
      const startValue = decimals > 0 ? Math.max(0, value - 1.0) : 0;
      const controls = animate(startValue, value, {
        duration,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (latest) => {
          setDisplayValue(formatNumber(latest, decimals, useGrouping));
        },
      });

      return () => controls.stop();
    }
  }, [isInView, value, decimals, duration, shouldReduceMotion, useGrouping]);

  return (
    <span
      ref={ref}
      className={className}
      aria-label={`${prefix}${formatNumber(value, decimals, useGrouping)}${suffix}`}
    >
      {prefix}
      {displayValue}
      {suffix}
    </span>
  );
};
