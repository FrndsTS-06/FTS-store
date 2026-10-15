import React from 'react';
import {
  ShieldCheck,
  Truck,
  RotateCcw,
  Headphones
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageContainer } from '../components/common/PageContainer';
import { GlassCard } from '../components/common/glass';

import { HeroBanner } from '../components/home/HeroBanner';
import { CategoryShortcuts } from '../components/home/CategoryShortcuts';
import { FeaturedProductsSection } from '../components/home/FeaturedProductsSection';
import { PromoBanners } from '../components/home/PromoBanners';
import { DealsOfTheDaySection } from '../components/home/DealsOfTheDaySection';
import { BestSellersSection } from '../components/home/BestSellersSection';
import { TestimonialsSection } from '../components/home/TestimonialsSection';
import { NewsletterStrip } from '../components/home/NewsletterStrip';

import { usePrefersReducedMotion } from '../motion';

const CUSTOMER_BENEFITS = [
  {
    icon: <Truck className="w-5 h-5 animate-bounce-subtle" />,
    title: 'Free Fast Shipping',
    desc: 'On all orders over ₹1,000',
    iconBg: 'bg-blue-500/15 border-blue-400/30 text-blue-400 shadow-fts-glow-blue',
    hoverGlow: 'blue' as const,
  },
  {
    icon: <ShieldCheck className="w-5 h-5" />,
    title: 'Authentic Warranty',
    desc: '100% verified original gear',
    iconBg: 'bg-emerald-500/15 border-emerald-400/30 text-emerald-400',
    hoverGlow: 'cyan' as const,
  },
  {
    icon: <RotateCcw className="w-5 h-5" />,
    title: '30-Day Hassle Free',
    desc: 'Simple, instant returns',
    iconBg: 'bg-purple-500/15 border-purple-400/30 text-purple-400',
    hoverGlow: 'blue' as const,
  },
  {
    icon: <Headphones className="w-5 h-5" />,
    title: '24/7 Priority Support',
    desc: 'Dedicated assistance team',
    iconBg: 'bg-cyan-500/15 border-cyan-400/30 text-cyan-400 shadow-fts-glow-cyan',
    hoverGlow: 'cyan' as const,
  },
];

export const HomePage: React.FC = () => {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <PageContainer>
      {/* 1. Full-Width Wide Hero Promotional Banner */}
      <HeroBanner />

      {/* 2. Responsive 10-Item Product Category Shortcuts */}
      <CategoryShortcuts />

      {/* 3. Value Proposition Grid with Phase 1 GlassCard Architecture */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12" aria-label="Customer Benefits">
        {CUSTOMER_BENEFITS.map((benefit, index) => (
          <motion.div
            key={benefit.title}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{
              duration: 0.45,
              delay: shouldReduceMotion ? 0 : index * 0.08,
              ease: 'easeOut',
            }}
          >
            <GlassCard
              interactive={true}
              hoverGlow={benefit.hoverGlow}
              hasSpecularSheen={true}
              className="p-5 flex items-center space-x-3.5 border border-white/10"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${benefit.iconBg}`}>
                {benefit.icon}
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-white font-display">{benefit.title}</h4>
                <p className="text-[11px] text-slate-400">{benefit.desc}</p>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </section>

      {/* 4. Six-Column Featured Products Section */}
      <FeaturedProductsSection />

      {/* 6. Two Side-by-Side Promotional Banners (Laptops & Smart Home) */}
      <PromoBanners />

      {/* 7. Deals of the Day */}
      <DealsOfTheDaySection />

      {/* 8. Best Sellers Section */}
      <BestSellersSection />

      {/* 9. Verified Customer Testimonials */}
      <TestimonialsSection />

      {/* 10. Vibrant Blue Tech Insider Newsletter Strip */}
      <NewsletterStrip />
    </PageContainer>
  );
};
