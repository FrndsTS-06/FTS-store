import React from 'react';
import { Star, ShieldCheck, Quote, MessageSquareQuote } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion, AnimatedNumber } from '../../motion';

interface TestimonialItem {
  id: string;
  name: string;
  role: string;
  location: string;
  avatarUrl: string;
  rating: number;
  quote: string;
  productPurchased: string;
  date: string;
}

const SAMPLE_TESTIMONIALS: TestimonialItem[] = [
  {
    id: 'test-01',
    name: 'Vikram Malhotra',
    role: 'Senior Creative Director',
    location: 'Mumbai, India',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    rating: 5,
    quote: 'The delivery was lightning-fast and the packaging was pristine. The M3 Max studio workstation handles complex 4K color grading timelines without breaking a sweat, and the Thunderbolt dock drives both studio displays flawlessly.',
    productPurchased: 'MacBook Pro 16 M3 Max Studio Workstation',
    date: 'October 2026'
  },
  {
    id: 'test-02',
    name: 'Ananya Sharma',
    role: 'Lead Cloud Architect',
    location: 'Bengaluru, India',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&q=80',
    rating: 5,
    quote: 'The hybrid active noise cancellation on the AuraPulse easily rivals the best audio flagships. The 40-hour playback duration is authentic, and having true multipoint Bluetooth switching makes my daily engineering standups seamless.',
    productPurchased: 'AuraPulse Wireless Noise-Cancelling Headphones',
    date: 'October 2026'
  },
  {
    id: 'test-03',
    name: 'Rohan Mukherjee',
    role: 'IoT Engineer & Tech Reviewer',
    location: 'Hyderabad, India',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
    rating: 5,
    quote: 'Connecting the NestAura ambient light bar with my smart home hub took under two minutes with Matter protocol. The screen audio sync latency is imperceptible, completely transforming our home workstation atmosphere.',
    productPurchased: 'NestAura Smart Ambient Light Bar with Audio Sync',
    date: 'October 2026'
  }
];

export const TestimonialsSection: React.FC = () => {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <section className="mb-16" aria-label="Customer Testimonials">
      {/* Section Header with Viewport Entrance */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <MessageSquareQuote className="w-3.5 h-3.5 text-cyan-400" />
              <span>TESTIMONIALS & REVIEWS</span>
            </span>

            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-slate-400 bg-slate-900/80 border border-white/10">
              Verified Buyer Profiles • Genuine Hardware Feedback
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
            Loved by Tech Enthusiasts
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Authentic customer experiences from verified hardware engineers, creators, and power users.
          </p>
        </div>

        {/* Aggregate Trust Metric with Genuine Numeric-Counting Animation */}
        <div className="flex items-center gap-3 bg-slate-900/60 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2.5 self-start sm:self-auto shadow-md">
          <div className="flex items-center text-amber-400">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-white tracking-tight">
              <AnimatedNumber value={4.92} decimals={2} duration={1.2} /> / 5.0
            </span>
            <span className="text-slate-400 ml-1.5">
              (<AnimatedNumber value={2400} decimals={0} duration={1.4} suffix="+ reviews" />)
            </span>
          </div>
        </div>
      </motion.div>

      {/* 3-Column Responsive Testimonials Grid with Staggered Entrance */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SAMPLE_TESTIMONIALS.map((t, index) => (
          <motion.article
            key={t.id}
            id={`testimonial-card-${t.id}`}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.55,
              delay: shouldReduceMotion ? 0 : index * 0.1,
              ease: [0.16, 1, 0.3, 1],
            }}
            whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.015 }}
            className="relative flex flex-col justify-between rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-400/40 p-6 transition-all duration-300 group shadow-lg hover:shadow-2xl hover:shadow-cyan-950/30 overflow-hidden"
          >
            {/* Top Specular Edge Rim Highlight */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

            <div>
              {/* Star Rating & Quote Icon Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1 text-amber-400">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-slate-700 group-hover:text-cyan-400/60 group-hover:rotate-6 transition-all duration-300" />
              </div>

              {/* Quote Copy */}
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed italic mb-6">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            {/* Reviewer Details & Product Badge */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex items-center gap-3.5 mb-3">
                <img
                  src={t.avatarUrl}
                  alt={t.name}
                  loading="lazy"
                  className="w-11 h-11 rounded-full object-cover border border-white/15 shadow-sm group-hover:border-cyan-400/50 transition-colors"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-200 transition-colors">
                      {t.name}
                    </h3>
                    <span title="Verified Customer" className="inline-flex">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {t.role} • {t.location}
                  </p>
                </div>
              </div>

              {/* Verified Product Purchased Tag */}
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-950/80 border border-white/10 text-[10px] text-slate-300 w-full truncate shadow-inner">
                <span className="text-emerald-400 font-bold flex-shrink-0">✓ Verified:</span>
                <span className="truncate">{t.productPurchased}</span>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};
