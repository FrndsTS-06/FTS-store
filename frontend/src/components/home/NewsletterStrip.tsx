import React, { useState } from 'react';
import {
  Mail,
  Send,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { apiClient } from '../../services/api';
import { usePrefersReducedMotion, tapButton } from '../../motion';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const NewsletterStrip: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    message: string;
    discountCode: string;
    alreadySubscribed: boolean;
  } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Please enter an email address.');
      return;
    }

    if (!EMAIL_REGEX.test(trimmed)) {
      setErrorMessage('Please enter a valid email address (e.g. name@example.com).');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await apiClient.subscribeNewsletter(trimmed);
      if (res && res.success) {
        if (!shouldReduceMotion) {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#06b6d4', '#3b82f6', '#6366f1', '#ffffff'],
            disableForReducedMotion: true,
          });
        }
        setSuccessData({
          message: res.message,
          discountCode: res.discount_code || 'INSIDER15',
          alreadySubscribed: res.already_subscribed
        });
        setEmail('');
      } else {
        setErrorMessage(res?.message || 'Subscription request could not be completed.');
      }
    } catch (err: any) {
      console.error('Newsletter subscription failed:', err);
      setErrorMessage(err.message || 'Unable to connect to newsletter service. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!successData?.discountCode) return;
    navigator.clipboard.writeText(successData.discountCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  return (
    <motion.section
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      whileHover={shouldReduceMotion ? undefined : { scale: 1.005 }}
      className="mb-16"
      aria-label="Email Newsletter Subscription"
    >
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/80 via-blue-950/60 to-slate-950/90 backdrop-blur-2xl p-8 sm:p-12 shadow-2xl border border-white/15">
        
        {/* Specular Edge Rim Highlight */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10" />

        {/* Ambient Decorative Deep Blue & Cyan Glows */}
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-600/20 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          {/* Left Text Block */}
          <div className="lg:max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 backdrop-blur-md border border-cyan-400/30 mb-3 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
              <span>FTS STORE TECH INSIDER</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight font-display mb-2">
              Unlock 15% Off Your Next Order
            </h2>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-lg">
              Subscribe to receive verified product drops, member-only flash discounts, and hardware release updates directly to your inbox.
            </p>

            <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-4 font-medium">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                No spam ever
              </span>
              <span>•</span>
              <span>Unsubscribe anytime</span>
              <span>•</span>
              <span>Instant promo code</span>
            </div>
          </div>

          {/* Right Form / Success Container */}
          <div className="w-full lg:max-w-md">
            <AnimatePresence mode="wait">
              {successData ? (
                <motion.div
                  key="newsletter-success"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  id="newsletter-success-box"
                  className="bg-slate-900/80 text-white rounded-2xl p-6 shadow-2xl border border-cyan-400/40 backdrop-blur-xl"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {successData.alreadySubscribed ? 'Already Subscribed!' : 'Subscription Confirmed!'}
                      </h3>
                      <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                        {successData.message}
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/80 border border-white/10 rounded-xl flex items-center justify-between gap-3 shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Your Promo Code
                      </span>
                      <span className="font-mono text-base font-extrabold text-cyan-400 tracking-wider">
                        {successData.discountCode}
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                      whileTap={shouldReduceMotion ? undefined : tapButton}
                      onClick={handleCopyCode}
                      id="newsletter-copy-code-btn"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-slate-950 transition-colors cursor-pointer shadow-md font-sans"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </motion.button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSuccessData(null)}
                    className="mt-3 text-[11px] font-semibold text-slate-400 hover:text-cyan-300 transition-colors w-full text-center cursor-pointer"
                  >
                    Subscribe another email
                  </button>
                </motion.div>
              ) : (
                <motion.form
                  key="newsletter-form"
                  initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  noValidate
                  className="space-y-3"
                >
                  <div className="relative">
                    <label htmlFor="newsletter-email-input" className="sr-only">
                      Email address for newsletter
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4 text-cyan-400" />
                    </div>
                    <input
                      id="newsletter-email-input"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (errorMessage) setErrorMessage(null);
                      }}
                      disabled={isSubmitting}
                      placeholder="Enter your email address..."
                      className="w-full pl-10 pr-4 py-3.5 rounded-2xl bg-slate-950/70 text-white placeholder:text-slate-400 text-xs sm:text-sm font-medium border border-white/15 focus:outline-none focus:border-cyan-400 focus:ring-4 focus:ring-cyan-500/20 shadow-inner backdrop-blur-md disabled:opacity-75 disabled:cursor-not-allowed transition-all"
                    />
                  </div>

                  <AnimatePresence>
                    {errorMessage && (
                      <motion.div
                        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -6, height: 0 }}
                        transition={{ duration: 0.2 }}
                        id="newsletter-error-msg"
                        className="flex items-center gap-2 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-200 text-xs font-semibold overflow-hidden"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
                        <span>{errorMessage}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <motion.button
                    type="submit"
                    id="newsletter-submit-btn"
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? undefined : tapButton}
                    disabled={isSubmitting}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 active:from-cyan-600 active:to-blue-700 text-white text-xs sm:text-sm font-extrabold shadow-lg shadow-cyan-500/20 border border-white/10 transition-all flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer tracking-wide"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Subscribing...</span>
                      </>
                    ) : (
                      <>
                        <span>Subscribe & Get 15% Off</span>
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </motion.button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>
    </motion.section>
  );
};
