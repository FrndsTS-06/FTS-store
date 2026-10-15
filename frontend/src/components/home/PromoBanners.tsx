import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Laptop,
  Cpu,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Wifi,
  Volume2
} from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, tapButton } from '../../motion';

interface PromoBannerItem {
  id: string;
  category: string;
  tag: string;
  headline: string;
  description: string;
  priceNote: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  imageAlt: string;
  floatingBadge: {
    icon: React.ReactNode;
    text: string;
  };
  accentColor: 'blue' | 'cyan';
}

const PROMO_BANNERS: PromoBannerItem[] = [
  {
    id: 'promo-laptops-gear',
    category: 'Laptops & Workstations',
    tag: 'PERFORMANCE TECH • UP TO 20% OFF',
    headline: 'Next-Gen Laptops & Pro Workstations',
    description: 'Equipped with OLED displays, Apple M3 & RTX 40-Series silicon. Ultra-responsive speed for developers, designers, and creators.',
    priceNote: 'Starting from ₹49,999',
    ctaText: 'Shop Laptops & Gear',
    ctaLink: '/products?category=laptops',
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80',
    imageAlt: 'High-performance laptop and workspace gear',
    floatingBadge: {
      icon: <Cpu className="w-3.5 h-3.5 text-blue-400" />,
      text: 'M3 Max & RTX 4080 • OLED 120Hz'
    },
    accentColor: 'blue'
  },
  {
    id: 'promo-smart-home',
    category: 'Connected Ecosystem',
    tag: 'SMART ECOSYSTEM • UP TO 25% OFF',
    headline: 'Intelligent Living & Connected Home',
    description: 'Transform your daily routine with voice-activated 360° ambient audio, dynamic circadian lighting, and smart security hubs.',
    priceNote: 'Smart tech from ₹1,999',
    ctaText: 'Explore Smart Devices',
    ctaLink: '/products?category=smart-devices',
    imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80',
    imageAlt: 'Smart home audio and automated ambient devices',
    floatingBadge: {
      icon: <Wifi className="w-3.5 h-3.5 text-cyan-400" />,
      text: 'Matter Compatible • Voice Sync'
    },
    accentColor: 'cyan'
  }
];

export const PromoBanners: React.FC = () => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <section className="mb-16" aria-label="Special Promotional Deals">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PROMO_BANNERS.map((banner, index) => {
          const isBlue = banner.accentColor === 'blue';
          const isImgError = imageErrors[banner.id];

          return (
            <motion.article
              key={banner.id}
              id={banner.id}
              initial={
                shouldReduceMotion
                  ? { opacity: 0 }
                  : { opacity: 0, x: isBlue ? -20 : 20, y: 15 }
              }
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{
                duration: 0.6,
                delay: shouldReduceMotion ? 0 : index * 0.12,
                ease: [0.16, 1, 0.3, 1],
              }}
              whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.01 }}
              className={`relative overflow-hidden rounded-3xl border transition-all duration-300 group flex flex-col justify-between shadow-xl ${
                isBlue
                  ? 'border-white/10 bg-gradient-to-br from-slate-900/80 via-blue-950/40 to-slate-950/90 backdrop-blur-2xl hover:border-blue-400/50 hover:shadow-2xl hover:shadow-blue-950/40'
                  : 'border-white/10 bg-gradient-to-br from-slate-900/80 via-cyan-950/40 to-slate-950/90 backdrop-blur-2xl hover:border-cyan-400/50 hover:shadow-2xl hover:shadow-cyan-950/40'
              }`}
            >
              {/* Specular Edge Top Rim Highlight */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10" />

              {/* Ambient Background Glow with Restrained Drift */}
              <div
                className={`absolute -top-24 -right-24 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity duration-500 ${
                  isBlue ? 'bg-blue-600' : 'bg-cyan-500'
                }`}
                aria-hidden="true"
              />

              <div className="relative p-6 sm:p-8 z-10 flex flex-col h-full justify-between">
                <div>
                  {/* Eyebrow & Promo Tag */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border shadow-sm ${
                        isBlue
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                      }`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{banner.tag}</span>
                    </span>

                    <span className="text-[11px] font-semibold text-slate-400">
                      {banner.priceNote}
                    </span>
                  </div>

                  {/* Banner Headline */}
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-snug mb-3 font-display group-hover:text-cyan-200 transition-colors">
                    {banner.headline}
                  </h3>

                  {/* Descriptive Text */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-6 max-w-md">
                    {banner.description}
                  </p>
                </div>

                {/* Banner Visual & Interactive Row */}
                <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  {/* CTA Button with Polished Feedback */}
                  <motion.div
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? undefined : tapButton}
                    className="w-full sm:w-auto"
                  >
                    <Link
                      to={banner.ctaLink}
                      id={`${banner.id}-cta`}
                      className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-xs sm:text-sm font-bold shadow-md transition-all duration-200 group/btn w-full sm:w-auto ${
                        isBlue
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 border border-blue-400/30'
                          : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-600/30 border border-cyan-400/30'
                      }`}
                    >
                      <span>{banner.ctaText}</span>
                      <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1.5 transition-transform duration-200" />
                    </Link>
                  </motion.div>

                  {/* Supporting Trust Badges */}
                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Official Warranty</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Express Dispatch</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Image Showcase Section with Layered Glass Spec Badge */}
              <div className="relative px-6 pb-6 sm:px-8 sm:pb-8 pt-0">
                <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-white/10 bg-slate-950/70 shadow-inner group/img backdrop-blur-sm">
                  {!isImgError ? (
                    <img
                      src={banner.imageUrl}
                      alt={banner.imageAlt}
                      onError={() => handleImageError(banner.id)}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover object-center group-hover/img:scale-106 transition-transform duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                      {isBlue ? <Laptop className="w-12 h-12" /> : <Volume2 className="w-12 h-12" />}
                    </div>
                  )}

                  {/* Gradient Veil */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Glass Spec Badge with Specular Border */}
                  <motion.div
                    animate={
                      shouldReduceMotion
                        ? undefined
                        : {
                            y: [0, -4, 0],
                          }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            duration: 3.5,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: index * 0.4,
                          }
                    }
                    className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-10 pointer-events-none"
                  >
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950/80 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold shadow-lg">
                      {banner.floatingBadge.icon}
                      <span className="tracking-wide">{banner.floatingBadge.text}</span>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
};
