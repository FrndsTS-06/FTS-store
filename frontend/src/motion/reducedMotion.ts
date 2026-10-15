import { useReducedMotion } from 'framer-motion';
import type { Variants } from 'framer-motion';

/**
 * Hook to determine if the user has requested reduced motion at the OS/browser level.
 * Re-exports Framer Motion's native useReducedMotion for seamless access across components.
 */
export function usePrefersReducedMotion(): boolean {
  const shouldReduce = useReducedMotion();
  return Boolean(shouldReduce);
}

/**
 * Checks synchronously whether the user's browser environment prefers reduced motion.
 * Useful for SSR, initial state, or non-React contexts.
 */
export function checkPrefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Transforms any standard motion Variants map into an accessible version.
 * If reduced motion is requested, spatial transforms (x, y, scale, rotate) are eliminated
 * or replaced with instant opacity-only transitions to prevent vestibular discomfort.
 *
 * @param variants - The source Framer Motion Variants dictionary.
 * @param shouldReduce - Boolean indicating whether reduced motion is active.
 * @returns An accessible Variants dictionary.
 */
export function getAccessibleVariants(variants: Variants, shouldReduce: boolean): Variants {
  if (!shouldReduce) {
    return variants;
  }

  const accessible: Variants = {};

  for (const [key, val] of Object.entries(variants)) {
    if (!val) continue;

    if (typeof val === 'function') {
      accessible[key] = (custom: any, current: any, velocity: any): any => {
        const resolved = (val as Function)(custom, current, velocity);
        return sanitizeVariantForReducedMotion(resolved);
      };
    } else {
      accessible[key] = sanitizeVariantForReducedMotion(val);
    }
  }

  return accessible;
}

function sanitizeVariantForReducedMotion(variant: any): any {
  if (typeof variant !== 'object' || variant === null) {
    return variant;
  }

  const sanitized: Record<string, any> = { ...variant };

  // Remove spatial and rotational translation properties
  delete sanitized.x;
  delete sanitized.y;
  delete sanitized.z;
  delete sanitized.scale;
  delete sanitized.scaleX;
  delete sanitized.scaleY;
  delete sanitized.rotate;
  delete sanitized.rotateX;
  delete sanitized.rotateY;
  delete sanitized.rotateZ;
  delete sanitized.skew;
  delete sanitized.skewX;
  delete sanitized.skewY;

  // Flatten transition durations and remove infinite looping for instant, comfortable accessibility
  if (sanitized.transition) {
    sanitized.transition = {
      ...sanitized.transition,
      duration: Math.min(sanitized.transition.duration ?? 0.15, 0.15),
      delay: 0,
      staggerChildren: 0,
    };
    delete sanitized.transition.repeat;
    delete sanitized.transition.repeatType;
  }

  return sanitized;
}
