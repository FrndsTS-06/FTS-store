import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion, tapFeedback } from '../../motion';

export const ScrollToTopButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsVisible(window.scrollY > 350);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 20 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.5, y: 20 }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.1, y: -2 }}
          whileTap={shouldReduceMotion ? undefined : tapFeedback}
          transition={{ duration: shouldReduceMotion ? 0.15 : 0.25, ease: 'easeOut' }}
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-indigo-600/90 hover:bg-indigo-600 text-white shadow-xl shadow-indigo-600/30 backdrop-blur-md border border-indigo-400/30 cursor-pointer focus:outline-none focus:ring-4 focus:ring-indigo-500/40 group"
          aria-label="Scroll to top of page"
        >
          <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform duration-200" />
          <span className="sr-only">Scroll to top</span>
        </motion.button>
      )}
    </AnimatePresence>
  );
};
