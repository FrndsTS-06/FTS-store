/**
 * FTS Store Motion Configuration
 * Centralized motion tokens: durations, easings, spring presets, stagger intervals, and offsets.
 * Strictly adheres to 60fps GPU-accelerated properties (transform, opacity).
 */

export const MOTION_DURATIONS = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.35,
  slow: 0.5,
  deliberate: 0.7,
} as const;

export const MOTION_EASINGS = {
  // Standard CSS-friendly ease curves
  easeOut: [0.16, 1, 0.3, 1] as const,
  easeInOut: [0.4, 0, 0.2, 1] as const,
  anticipate: [0.38, 0.005, 0.215, 1] as const,
  subtle: [0.25, 0.1, 0.25, 1] as const,
} as const;

export const MOTION_SPRINGS = {
  // Snappy for buttons, micro-interactions, and badges
  snappy: {
    type: 'spring' as const,
    stiffness: 450,
    damping: 30,
    mass: 0.8,
  },
  // Responsive for cards, hover lifts, and list items
  responsive: {
    type: 'spring' as const,
    stiffness: 350,
    damping: 25,
    mass: 1,
  },
  // Smooth for drawers, modals, and larger surfaces
  smooth: {
    type: 'spring' as const,
    stiffness: 280,
    damping: 28,
    mass: 1,
  },
  // Gentle for ambient indicators and tabs
  gentle: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 22,
    mass: 1,
  },
} as const;

export const MOTION_STAGGERS = {
  tight: 0.03,
  normal: 0.06,
  relaxed: 0.1,
} as const;

export const MOTION_DISTANCES = {
  subtle: 8,
  sm: 16,
  md: 24,
  lg: 40,
  xl: 60,
} as const;
