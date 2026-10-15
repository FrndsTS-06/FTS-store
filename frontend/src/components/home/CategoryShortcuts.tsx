import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone,
  Laptop,
  Headphones,
  Cpu,
  Gamepad2,
  Home,
  Volume2,
  Camera,
  Watch,
  LayoutGrid,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  MOTION_SPRINGS,
  MOTION_STAGGERS,
  usePrefersReducedMotion,
  tapFeedback
} from '../../motion';

export interface CategoryShortcutItem {
  id: string;
  name: string;
  slug: string;
  icon: React.ReactNode;
  imageUrl: string;
  badge?: string;
  glowColor?: string;
}

const CATEGORY_SHORTCUTS: CategoryShortcutItem[] = [
  {
    id: 'cat-mobiles',
    name: 'Mobiles',
    slug: 'mobiles',
    icon: <Smartphone className="w-6 h-6 text-cyan-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=400&q=80',
    badge: 'Popular',
    glowColor: 'rgba(6, 182, 212, 0.35)',
  },
  {
    id: 'cat-laptops',
    name: 'Laptops',
    slug: 'laptops',
    icon: <Laptop className="w-6 h-6 text-blue-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    badge: 'Hot',
    glowColor: 'rgba(59, 130, 246, 0.35)',
  },
  {
    id: 'cat-accessories',
    name: 'Accessories',
    slug: 'accessories',
    icon: <Headphones className="w-6 h-6 text-teal-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400&q=80',
    glowColor: 'rgba(20, 184, 166, 0.35)',
  },
  {
    id: 'cat-smart-devices',
    name: 'Smart Devices',
    slug: 'smart-devices',
    icon: <Cpu className="w-6 h-6 text-indigo-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=400&q=80',
    glowColor: 'rgba(99, 102, 241, 0.35)',
  },
  {
    id: 'cat-gaming',
    name: 'Gaming',
    slug: 'gaming',
    icon: <Gamepad2 className="w-6 h-6 text-emerald-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=400&q=80',
    badge: 'Pro',
    glowColor: 'rgba(16, 185, 129, 0.35)',
  },
  {
    id: 'cat-home-appliances',
    name: 'Home Tech',
    slug: 'home-appliances',
    icon: <Home className="w-6 h-6 text-amber-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=400&q=80',
    glowColor: 'rgba(245, 158, 11, 0.35)',
  },
  {
    id: 'cat-audio',
    name: 'Audio Gear',
    slug: 'audio',
    icon: <Volume2 className="w-6 h-6 text-pink-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&q=80',
    badge: 'Sale',
    glowColor: 'rgba(236, 72, 153, 0.35)',
  },
  {
    id: 'cat-cameras',
    name: 'Cameras',
    slug: 'cameras',
    icon: <Camera className="w-6 h-6 text-sky-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    glowColor: 'rgba(14, 165, 233, 0.35)',
  },
  {
    id: 'cat-wearables',
    name: 'Wearables',
    slug: 'wearables',
    icon: <Watch className="w-6 h-6 text-violet-400" />,
    imageUrl: 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=400&q=80',
    glowColor: 'rgba(139, 92, 246, 0.35)',
  },
  {
    id: 'cat-all',
    name: 'All Depts',
    slug: 'all',
    icon: <LayoutGrid className="w-6 h-6 text-cyan-400" />,
    imageUrl: '',
    badge: 'Explore',
    glowColor: 'rgba(6, 182, 212, 0.35)',
  },
];

export const CategoryShortcuts: React.FC = () => {
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const shouldReduceMotion = usePrefersReducedMotion();

  const handleImageError = (id: string) => {
    setImageErrors((prev) => ({ ...prev, [id]: true }));
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : MOTION_STAGGERS.normal,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 18 },
    visible: {
      opacity: 1,
      y: 0,
      transition: MOTION_SPRINGS.responsive,
    },
  };

  return (
    <section className="mb-14" aria-label="Category Shortcuts">
      
      {/* Section Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 mb-1.5">
            <Sparkles className="w-3 h-3" />
            <span>DISCOVER HARDWARE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-display">
            Shop by Category
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse genuine electronics, mobile technology, computing, and smart accessories.
          </p>
        </div>

        <Link
          to="/products"
          id="view-all-categories-link"
          className="text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors group"
        >
          <span>All Departments</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Responsive 10-Item Category Card Grid with Staggered Viewport Entrance */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3 sm:gap-4"
      >
        {CATEGORY_SHORTCUTS.map((item) => {
          const targetUrl = item.slug === 'all' ? '/products' : `/products?category=${item.slug}`;
          const isError = imageErrors[item.id] || !item.imageUrl;

          return (
            <motion.div
              key={item.id}
              variants={itemVariants}
              whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : tapFeedback}
              className="h-full"
            >
              <Link
                to={targetUrl}
                id={`category-shortcut-${item.slug}`}
                className="group relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 hover:bg-slate-900/80 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 text-center h-full shadow-md hover:shadow-xl hover:shadow-cyan-950/40 overflow-hidden"
              >
                {/* Specular Edge Highlight Rim */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

                {/* Floating Icon / Image Squircle with Depth and Ambient Glow */}
                <div className="relative mb-3">
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-slate-950/70 backdrop-blur-md border border-white/10 group-hover:border-cyan-400/50 flex items-center justify-center transition-all duration-300 shadow-md group-hover:shadow-[0_0_24px_rgba(6,182,212,0.35)] group-hover:-translate-y-1 group-hover:scale-105">
                    {!isError ? (
                      <img
                        src={item.imageUrl}
                        alt={`${item.name} category`}
                        onError={() => handleImageError(item.id)}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-slate-900 to-slate-800 text-white group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                    )}

                    {/* Ambient Glow Aura */}
                    <div className="absolute inset-0 bg-cyan-500/0 group-hover:bg-cyan-500/15 transition-colors pointer-events-none" />
                  </div>

                  {/* Micro Badge Pinned to Icon Squircle Corner */}
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-cyan-400 text-slate-950 shadow-md border border-cyan-200 z-10 pointer-events-none">
                      {item.badge}
                    </span>
                  )}
                </div>

                {/* Category Label */}
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1 leading-snug">
                  {item.name}
                </h3>

                {/* Animated Explore Arrow */}
                <span className="text-[10px] text-slate-400 group-hover:text-cyan-400 transition-colors mt-0.5 flex items-center gap-1">
                  <span>Explore</span>
                  <span className="group-hover:translate-x-1 transition-transform duration-200">&rarr;</span>
                </span>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>

    </section>
  );
};
