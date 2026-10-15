import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AnnouncementBar } from './AnnouncementBar';
import { Navbar } from './Navbar';
import { CategoryNav } from './CategoryNav';
import { Footer } from './Footer';
import { CartDrawer } from '../cart/CartDrawer';
import { ShoppingFeedbackToast } from '../cart/ShoppingFeedbackToast';
import { AnimatedBackground } from '../common/AnimatedBackground';
import { ScrollToTopButton } from '../common/ScrollToTopButton';
import { usePrefersReducedMotion } from '../../motion';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <div className="relative min-h-screen flex flex-col bg-slate-950/60 backdrop-blur-[1px] text-slate-100 overflow-x-hidden">
      {/* Ambient Drifting Aurora Background & Subtle Dot Grid */}
      <AnimatedBackground />

      {/* Tier 1: Top Promotional & Utility Strip with Cycling Announcements */}
      <div className="relative z-30">
        <AnnouncementBar />
      </div>

      {/* Tier 2: Sticky Main Navigation Header with Search */}
      <div className="relative z-30">
        <Navbar />
      </div>

      {/* Tier 3: Horizontal Department Navigation Bar */}
      <div className="relative z-20">
        <CategoryNav />
      </div>

      {/* Main Page Content with Route Transition */}
      <main className="relative z-10 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.25, ease: 'easeOut' }}
            className="flex-1 flex flex-col"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Multi-Column Luxury Footer */}
      <div className="relative z-20">
        <Footer />
      </div>

      {/* Authoritative Slide-over Cart Drawer */}
      <CartDrawer />

      {/* Accessible Shopping Feedback Toast */}
      <ShoppingFeedbackToast />

      {/* Floating Animated Scroll To Top Button */}
      <ScrollToTopButton />
    </div>
  );
};

