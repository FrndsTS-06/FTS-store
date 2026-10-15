import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, ShoppingBag, X } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { usePrefersReducedMotion, tapFeedback } from '../../motion';

export const ShoppingFeedbackToast: React.FC = () => {
  const { notification, dismissNotification, openDrawer } = useCart();
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <AnimatePresence>
      {notification && (
        <aside
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 max-w-sm sm:max-w-md pointer-events-auto"
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.94 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
            className={`p-4 rounded-2xl shadow-2xl backdrop-blur-md border flex items-center justify-between gap-3 text-white ${
              notification.type === 'success'
                ? 'bg-gradient-to-r from-emerald-600/95 via-teal-600/95 to-cyan-600/95 border-emerald-400/30 shadow-emerald-950/60'
                : 'bg-gradient-to-r from-rose-600/95 to-red-600/95 border-rose-400/30 shadow-rose-950/60'
            }`}
          >
            {/* Status Icon */}
            <div className="flex-shrink-0">
              {notification.type === 'success' ? (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            {/* Message Body */}
            <div className="flex-1 min-w-0 pr-1">
              <p className="text-xs sm:text-sm font-semibold leading-snug break-words">
                {notification.message}
              </p>
            </div>

            {/* Action Group */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {notification.type === 'success' && (
                <motion.button
                  type="button"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                  whileTap={shouldReduceMotion ? undefined : tapFeedback}
                  onClick={() => {
                    dismissNotification();
                    openDrawer();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white text-white hover:text-slate-900 text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
                  aria-label="Open cart drawer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>View</span>
                </motion.button>
              )}

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={dismissNotification}
                aria-label="Dismiss shopping notification"
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        </aside>
      )}
    </AnimatePresence>
  );
};
