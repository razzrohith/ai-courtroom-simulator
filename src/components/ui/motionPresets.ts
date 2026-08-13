/**
 * Shared framer-motion variants for the Gilded Verdict design system.
 */

import type { Variants, Transition } from 'framer-motion';

export const springSoft: Transition = { type: 'spring', stiffness: 260, damping: 26 };
export const springSnappy: Transition = { type: 'spring', stiffness: 420, damping: 28 };

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: springSoft },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  visible: { opacity: 1, scale: 1, transition: springSoft },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

export const slideFromLeft: Variants = {
  hidden: { opacity: 0, x: -28 },
  visible: { opacity: 1, x: 0, transition: springSoft },
};

export const slideFromRight: Variants = {
  hidden: { opacity: 0, x: 28 },
  visible: { opacity: 1, x: 0, transition: springSoft },
};
