import type { Variants } from 'framer-motion';
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
  MOTION_STAGGERS,
  MOTION_DISTANCES,
} from './config';

/**
 * 1. Simple Fade In
 * Clean opacity entrance without spatial translation.
 */
export const fadeIn: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

/**
 * 2. Fade and Slide Up
 * Premium entry commonly used for hero headlines, cards, and section banners.
 */
export const fadeSlideUp: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_DISTANCES.md,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -MOTION_DISTANCES.sm,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

/**
 * Fade and Slide Down (useful for dropdown menus, announcements, and banners)
 */
export const fadeSlideDown: Variants = {
  initial: {
    opacity: 0,
    y: -MOTION_DISTANCES.md,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -MOTION_DISTANCES.sm,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

/**
 * 3. Slide in From Left
 * Ideal for sidebars, promotional panels, and horizontal carousels.
 */
export const slideInLeft: Variants = {
  initial: {
    opacity: 0,
    x: -MOTION_DISTANCES.lg,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: -MOTION_DISTANCES.md,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

/**
 * 4. Slide in From Right
 * Mirror variant for right-anchored panels, split promotional items, or next carousel slides.
 */
export const slideInRight: Variants = {
  initial: {
    opacity: 0,
    x: MOTION_DISTANCES.lg,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    x: MOTION_DISTANCES.md,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

/**
 * 5. Staggered Children Container
 * Wraps product grids, category shortcut pills, and testimonial lists.
 */
export const staggerContainer = (
  staggerDelay: number = MOTION_STAGGERS.normal,
  delayChildren: number = 0.05
): Variants => ({
  initial: {},
  animate: {
    transition: {
      staggerChildren: staggerDelay,
      delayChildren,
    },
  },
  exit: {
    transition: {
      staggerChildren: MOTION_STAGGERS.tight,
      staggerDirection: -1,
    },
  },
});

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: MOTION_DISTANCES.sm,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: MOTION_DURATIONS.normal,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    y: -MOTION_DISTANCES.subtle,
    transition: {
      duration: MOTION_DURATIONS.fast,
    },
  },
};

/**
 * 6. Hover Lift
 * Physics-based spring hover elevation for interactive cards and buttons.
 */
export const hoverLift = {
  y: -5,
  transition: MOTION_SPRINGS.responsive,
};

export const hoverScale = {
  scale: 1.03,
  transition: MOTION_SPRINGS.snappy,
};

export const hoverCard = {
  y: -6,
  scale: 1.01,
  transition: MOTION_SPRINGS.responsive,
};

/**
 * 7. Tap Feedback
 * Satisfying tactile micro-interaction when a button, pill, or interactive tile is clicked.
 */
export const tapFeedback = {
  scale: 0.96,
  transition: MOTION_SPRINGS.snappy,
};

export const tapButton = {
  scale: 0.94,
  y: 1,
  transition: MOTION_SPRINGS.snappy,
};

/**
 * 8. Modal and Drawer Transitions
 * Authority panels that overlay the screen (e.g. CartDrawer, SearchModal, QuickView).
 */
export const drawerRight: Variants = {
  initial: {
    x: '100%',
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: MOTION_SPRINGS.smooth,
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

export const drawerLeft: Variants = {
  initial: {
    x: '-100%',
    opacity: 0.8,
  },
  animate: {
    x: 0,
    opacity: 1,
    transition: MOTION_SPRINGS.smooth,
  },
  exit: {
    x: '-100%',
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

export const modalBackdrop: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};

export const modalScale: Variants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    y: MOTION_DISTANCES.sm,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: MOTION_SPRINGS.smooth,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: MOTION_DISTANCES.subtle,
    transition: {
      duration: MOTION_DURATIONS.fast,
      ease: MOTION_EASINGS.easeOut,
    },
  },
};
