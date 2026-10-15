import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Star,
  ShieldCheck,
  Truck,
  Zap,
} from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  usePrefersReducedMotion,
  tapButton,
} from '../../motion';
import { GlassBadge, GlassButton } from '../common/glass';
import { Hero3DProductStage } from './Hero3DProductStage';

export interface HeroSlide {
  id: string;
  badge: string;
  headline: string;
  supportingText: string;
  ctaText: string;
  ctaLink: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  pricingHighlight?: string;
  featuredDevices: {
    laptopImage: string;
    phoneImage: string;
    earbudsImage: string;
    watchImage: string;
  };
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: 'slide-1',
    badge: 'MEGA TECH SALE • UP TO 40% OFF',
    headline: 'Upgrade Your Life with FTS Store',
    supportingText: 'Top brands. Best prices. Trusted by thousands.',
    ctaText: 'Shop Now',
    ctaLink: '/products',
    secondaryCtaText: 'Trending Deals',
    secondaryCtaLink: '/products?badge=Trending',
    pricingHighlight: 'Deals from ₹1,499',
    featuredDevices: {
      laptopImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      phoneImage: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80',
      earbudsImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      watchImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    },
  },
  {
    id: 'slide-2',
    badge: 'NEW GENERATION ACOUSTICS',
    headline: 'Pure Acoustic Clarity & Immersion',
    supportingText: 'Studio-grade hybrid noise cancellation, lossless codecs, and all-day battery life.',
    ctaText: 'Explore Audio Gear',
    ctaLink: '/products?category=audio',
    secondaryCtaText: 'View Earbuds',
    secondaryCtaLink: '/products?category=audio&search=earbuds',
    pricingHighlight: 'Save up to ₹2,500',
    featuredDevices: {
      laptopImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
      phoneImage: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80',
      earbudsImage: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80',
      watchImage: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80',
    },
  },
  {
    id: 'slide-3',
    badge: 'PRO PERFORMANCE COMPUTING',
    headline: 'Unleash Your Creative & Gaming Edge',
    supportingText: 'Ultra-thin OLED displays, next-gen GPU silicon, and precision mechanical key switches.',
    ctaText: 'Shop Laptops & Desks',
    ctaLink: '/products?category=laptops',
    secondaryCtaText: 'Gaming Essentials',
    secondaryCtaLink: '/products?category=gaming',
    pricingHighlight: 'Free 2-Day Shipping',
    featuredDevices: {
      laptopImage: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
      phoneImage: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80',
      earbudsImage: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
      watchImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
    },
  },
];

const AUTOPLAY_DURATION = 6000;

export const HeroBanner: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isPaused, setIsPaused] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const bannerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(bannerRef, { margin: '80px' });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isDesktopPointer, setIsDesktopPointer] = useState(false);
  const shouldReduceMotion = usePrefersReducedMotion();

  const activeSlide = HERO_SLIDES[currentSlideIndex];

  const handleNext = useCallback(() => {
    setDirection(1);
    setCurrentSlideIndex((prev) => (prev + 1) % HERO_SLIDES.length);
  }, []);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setCurrentSlideIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
  }, []);

  // Desktop pointer detection for safe mouse parallax
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(min-width: 1024px) and (pointer: fine)');
    setIsDesktopPointer(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setIsDesktopPointer(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Keyboard navigation (ArrowLeft & ArrowRight)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;

      if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  // Autoplay timer: paused on hover, when off-screen, or when reduced motion is preferred
  useEffect(() => {
    if (isPaused || shouldReduceMotion || !isInView) return;
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.hidden) return;
      handleNext();
    }, AUTOPLAY_DURATION);
    return () => clearInterval(interval);
  }, [isPaused, shouldReduceMotion, isInView, handleNext]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!bannerRef.current || !isDesktopPointer || shouldReduceMotion) return;
    const rect = bannerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsPaused(false);
    setMousePos({ x: 0, y: 0 });
  };

  const handleImageError = (key: string) => {
    setImageErrors((prev) => ({ ...prev, [key]: true }));
  };

  return (
    <section
      ref={bannerRef}
      className="relative w-full mb-12"
      aria-label="Promotional Showcase"
      onMouseEnter={() => setIsPaused(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* ====================================================================
          Futuristic Frosted Glass Hero Container
          ==================================================================== */}
      <div className="relative overflow-hidden rounded-3xl fts-glass-panel fts-specular-edge border border-cyan-400/20 bg-gradient-to-br from-slate-950/90 via-slate-900/75 to-blue-950/50 p-6 sm:p-10 lg:p-12 shadow-2xl shadow-blue-950/40 transition-all duration-500">
        
        {/* Soft background ambient gradient blooms */}
        <motion.div 
          animate={shouldReduceMotion || !isInView ? undefined : {
            scale: [1, 1.15, 1],
            x: [0, 20, 0],
            y: [0, -15, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-0 right-1/4 -translate-y-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true"
        />
        <motion.div 
          animate={shouldReduceMotion || !isInView ? undefined : {
            scale: [1, 1.2, 1],
            x: [0, -25, 0],
            y: [0, 20, 0],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute bottom-0 right-10 translate-y-1/3 w-80 h-80 bg-cyan-400/25 rounded-full blur-3xl pointer-events-none" 
          aria-hidden="true"
        />
        <div className="absolute -top-12 -left-12 w-72 h-72 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

        {/* Decorative Floating Cyber Octahedron Accent (CSS Float) */}
        <div 
          className="absolute top-8 right-12 w-6 h-6 border border-cyan-400/40 rotate-45 animate-float-slow pointer-events-none opacity-40 hidden sm:block" 
          aria-hidden="true" 
        />
        <div 
          className="absolute bottom-16 left-8 w-4 h-4 border border-blue-400/40 rotate-12 animate-float-reverse pointer-events-none opacity-30 hidden sm:block" 
          aria-hidden="true" 
        />

        {/* 2-Column Responsive Layout with AnimatePresence */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activeSlide.id}
            custom={direction}
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : direction * 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: shouldReduceMotion ? 0 : direction * -32 }}
            transition={{ duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.easeOut }}
            className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* ================================================================
                Left Column: Headlines, Supporting Copy, and CTAs (Stable Text)
                ================================================================ */}
            <div className="lg:col-span-7 flex flex-col items-start justify-center">
              
              {/* 1. Eyebrow Tag Pill with Luminous Glass Styling */}
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION_DURATIONS.fast, delay: 0.05, ease: MOTION_EASINGS.easeOut }}
                className="mb-4"
              >
                <GlassBadge variant="cyan" hasDot={true} glow={true}>
                  <Sparkles className="w-3 h-3 text-cyan-400 mr-1" />
                  {activeSlide.badge}
                </GlassBadge>
              </motion.div>

              {/* 2. Primary Headline with kinetic reveal & gradient highlight */}
              <motion.h1
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION_DURATIONS.normal, delay: 0.12, ease: MOTION_EASINGS.easeOut }}
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.12] mb-4 font-display"
              >
                {activeSlide.id === 'slide-1' ? (
                  <>
                    Upgrade Your Life with{' '}
                    <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">
                      FTS Store
                    </span>
                  </>
                ) : (
                  activeSlide.headline
                )}
              </motion.h1>

              {/* 3. Supporting Description Copy */}
              <motion.p
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION_DURATIONS.normal, delay: 0.18, ease: MOTION_EASINGS.easeOut }}
                className="text-base sm:text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-xl mb-8"
              >
                {activeSlide.supportingText}
              </motion.p>

              {/* 4. Refined CTA Button Group with Glass Components */}
              <motion.div
                initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: MOTION_DURATIONS.normal, delay: 0.24, ease: MOTION_EASINGS.easeOut }}
                className="flex flex-wrap items-center gap-4 mb-8"
              >
                {/* Prominent Shop Now CTA */}
                <Link to={activeSlide.ctaLink} id="hero-shop-now-cta">
                  <GlassButton
                    variant="cyber"
                    size="lg"
                    icon={<ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-200" />}
                    iconPosition="right"
                    className="shadow-fts-glow-cyan"
                  >
                    {activeSlide.ctaText}
                  </GlassButton>
                </Link>

                {/* Secondary CTA */}
                {activeSlide.secondaryCtaText && activeSlide.secondaryCtaLink && (
                  <Link to={activeSlide.secondaryCtaLink} id="hero-secondary-cta">
                    <GlassButton
                      variant="secondary"
                      size="lg"
                      icon={<Zap className="w-4 h-4 text-amber-400" />}
                      iconPosition="left"
                    >
                      {activeSlide.secondaryCtaText}
                    </GlassButton>
                  </Link>
                )}
              </motion.div>

              {/* 5. Trust Badges Strip */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: MOTION_DURATIONS.normal, delay: 0.30, ease: MOTION_EASINGS.easeOut }}
                className="flex flex-wrap items-center gap-5 sm:gap-6 pt-4 border-t border-white/10 text-xs sm:text-sm text-slate-300 font-semibold"
              >
                <div className="flex items-center gap-2 group cursor-default">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/15 border border-blue-400/30 flex items-center justify-center text-blue-400">
                    <Truck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span>Free Express Shipping over ₹1,000</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <div className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                  </div>
                  <span>100% Verified Authentic</span>
                </div>
                <div className="flex items-center gap-2 group cursor-default">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-400">
                    <Star className="w-3.5 h-3.5 fill-amber-400 group-hover:scale-110 transition-transform" />
                  </div>
                  <span>4.9 / 5 Rating</span>
                </div>
              </motion.div>
            </div>

            {/* ================================================================
                Right Column: Large Floating 3D Electronics Product Composition
                ================================================================ */}
            <div className="lg:col-span-5 relative flex items-center justify-center">
              <Hero3DProductStage
                slide={activeSlide}
                mousePos={mousePos}
                isDesktopPointer={isDesktopPointer}
                shouldReduceMotion={shouldReduceMotion}
                imageErrors={imageErrors}
                onImageError={handleImageError}
              />
            </div>

          </motion.div>
        </AnimatePresence>

        {/* ====================================================================
            Carousel Controls (Left / Right Chevron Arrows)
            ==================================================================== */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 sm:left-3 z-20">
          <motion.button
            type="button"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
            whileTap={shouldReduceMotion ? undefined : tapButton}
            onClick={handlePrev}
            aria-label="Previous Slide"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full fts-glass-badge hover:bg-white/20 text-white hover:text-cyan-400 shadow-xl border border-cyan-400/30 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>

        <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:right-3 z-20">
          <motion.button
            type="button"
            whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
            whileTap={shouldReduceMotion ? undefined : tapButton}
            onClick={handleNext}
            aria-label="Next Slide"
            className="w-9 h-9 sm:w-11 sm:h-11 rounded-full fts-glass-badge hover:bg-white/20 text-white hover:text-cyan-400 shadow-xl border border-cyan-400/30 flex items-center justify-center cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 transition-colors"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        </div>

        {/* ====================================================================
            Slide Progress Pill Indicators
            ==================================================================== */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
          {HERO_SLIDES.map((slide, idx) => {
            const isActive = idx === currentSlideIndex;
            return (
              <button
                key={slide.id}
                type="button"
                onClick={() => {
                  setDirection(idx > currentSlideIndex ? 1 : -1);
                  setCurrentSlideIndex(idx);
                }}
                aria-label={`Go to slide ${idx + 1}: ${slide.headline}`}
                className={`relative overflow-hidden transition-all duration-300 rounded-full h-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
                  isActive
                    ? 'w-10 bg-white/40'
                    : 'w-2.5 bg-white/20 hover:bg-white/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    key={`progress-${currentSlideIndex}-${isPaused}`}
                    initial={{ width: '0%' }}
                    animate={{ width: isPaused ? '0%' : '100%' }}
                    transition={{ duration: isPaused ? 0 : AUTOPLAY_DURATION / 1000, ease: 'linear' }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
