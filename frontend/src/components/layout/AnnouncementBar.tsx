import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Phone, PackageCheck, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  usePrefersReducedMotion
} from '../../motion';

const ANNOUNCEMENTS = [
  {
    id: 'ann-1',
    badge: 'SPECIAL OFFER',
    badgeColor: 'bg-cyan-500/15 text-cyan-300 border-cyan-400/30 shadow-[0_0_10px_rgba(6,182,212,0.25)]',
    icon: Sparkles,
    content: (
      <>
        Free Express Shipping over <strong className="text-white font-semibold">₹1,000</strong> • Use code{' '}
        <strong className="text-cyan-300 font-bold bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-400/30">
          WELCOME10
        </strong>{' '}
        for 10% off
      </>
    ),
  },
  {
    id: 'ann-2',
    badge: 'HOT SALE',
    badgeColor: 'bg-amber-500/15 text-amber-300 border-amber-400/30 shadow-[0_0_10px_rgba(245,158,11,0.25)]',
    icon: Flame,
    content: (
      <>
        Up to <strong className="text-white font-semibold">40% Off</strong> on Flagship Laptops, Flagship Mobiles & Smart Audio Gear!
      </>
    ),
  },
  {
    id: 'ann-3',
    badge: 'VERIFIED',
    badgeColor: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30 shadow-[0_0_10px_rgba(16,185,129,0.25)]',
    icon: ShieldCheck,
    content: (
      <>
        100% Guaranteed Authentic Tech with Official 1-Year Brand Warranty & 30-Day Hassle-Free Returns
      </>
    ),
  },
];

export const AnnouncementBar: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % ANNOUNCEMENTS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  const current = ANNOUNCEMENTS[currentIndex];
  const Icon = current.icon;

  return (
    <motion.aside
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.easeOut }}
      className="fts-glass-nav bg-slate-950/75 backdrop-blur-md border-b border-white/10 text-[11px] text-slate-300 py-2 px-4 sm:px-6 lg:px-8 z-40 transition-colors overflow-hidden relative"
      aria-label="Promotional Announcement"
    >
      {/* Top subtle glint */}
      <div className="fts-specular-edge" aria-hidden="true" />

      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Left: Animated Cycling Promotional Message */}
        <div className="flex items-center gap-2 overflow-hidden h-6 flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="flex items-center gap-2 truncate"
            >
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide border flex-shrink-0 ${current.badgeColor}`}>
                <Icon className="w-2.5 h-2.5 animate-pulse text-current" />
                <span>{current.badge}</span>
              </span>
              <span className="truncate text-slate-300 text-xs font-medium">
                {current.content}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right: Customer Care Helpline & Utility Links */}
        <div className="hidden sm:flex items-center gap-4 flex-shrink-0 text-slate-400 font-medium text-xs">
          <a
            href="tel:+91800555387"
            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
          >
            <Phone className="w-3 h-3 text-slate-500" />
            <span>24/7 Helpline: +91 (800) 555-FTS</span>
          </a>

          <span className="text-slate-700" aria-hidden="true">•</span>

          <Link
            to="/orders"
            className="flex items-center gap-1.5 hover:text-cyan-400 transition-colors"
          >
            <PackageCheck className="w-3.5 h-3.5 text-slate-500" />
            <span>Track Order</span>
          </Link>

          <span className="text-slate-700" aria-hidden="true">•</span>

          <div className="flex items-center gap-1 text-slate-300 font-semibold">
            <span>INR (₹)</span>
          </div>
        </div>

      </div>
    </motion.aside>
  );
};
