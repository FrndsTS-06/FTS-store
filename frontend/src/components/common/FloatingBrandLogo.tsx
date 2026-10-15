import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '../../motion';

export const FloatingBrandLogo: React.FC = () => {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <aside
      aria-label="Frnds Tech Solution brand badge"
      className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-30 pointer-events-auto select-none"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}
    >
      <Link
        to="/"
        aria-label="Frnds Tech Solution homepage"
        title="Frnds Tech Solution"
        className="group block relative focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-full"
      >
        <motion.div
          whileHover={shouldReduceMotion ? undefined : { scale: 1.08, y: -2 }}
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-[76px] h-[76px] sm:w-[112px] sm:h-[112px] rounded-full p-1 sm:p-1.5 bg-slate-950/80 hover:bg-slate-900/90 backdrop-blur-xl border border-cyan-500/40 hover:border-cyan-400/70 shadow-[0_8px_32px_rgba(0,0,0,0.6),0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_12px_36px_rgba(0,0,0,0.7),0_0_28px_rgba(6,182,212,0.5)] transition-all duration-300 flex items-center justify-center cursor-pointer"
        >
          {/* Subtle Ambient Radial Glow */}
          <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-tr from-cyan-500/20 via-blue-600/10 to-indigo-500/20 opacity-80 group-hover:opacity-100 transition-opacity" />

          {/* Official FTS Logo Asset */}
          <img
            src="/images/fts-logo.png"
            alt="Frnds Tech Solution logo"
            width={104}
            height={104}
            loading="eager"
            decoding="async"
            className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(6,182,212,0.4)] transition-transform duration-300 group-hover:scale-105"
          />
        </motion.div>
      </Link>
    </aside>
  );
};

export default FloatingBrandLogo;
