import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Flame,
  Laptop,
  Smartphone,
  Cpu,
  Volume2,
  Headphones,
  Gamepad2,
  Home,
  Camera,
  Watch
} from 'lucide-react';
import {
  MOTION_SPRINGS,
  usePrefersReducedMotion,
  hoverScale,
  tapFeedback
} from '../../motion';

interface CategoryNavItem {
  name: string;
  slug: string;
  icon: React.ReactNode;
}

const CATEGORY_NAV_ITEMS: CategoryNavItem[] = [
  { name: 'All Categories', slug: 'all', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
  { name: 'Laptops', slug: 'laptops', icon: <Laptop className="w-3.5 h-3.5" /> },
  { name: 'Mobiles', slug: 'mobiles', icon: <Smartphone className="w-3.5 h-3.5" /> },
  { name: 'Smart Devices', slug: 'smart-devices', icon: <Cpu className="w-3.5 h-3.5" /> },
  { name: 'Audio', slug: 'audio', icon: <Volume2 className="w-3.5 h-3.5" /> },
  { name: 'Accessories', slug: 'accessories', icon: <Headphones className="w-3.5 h-3.5" /> },
  { name: 'Gaming', slug: 'gaming', icon: <Gamepad2 className="w-3.5 h-3.5" /> },
  { name: 'Home Appliances', slug: 'home-appliances', icon: <Home className="w-3.5 h-3.5" /> },
  { name: 'Cameras', slug: 'cameras', icon: <Camera className="w-3.5 h-3.5" /> },
  { name: 'Wearables', slug: 'wearables', icon: <Watch className="w-3.5 h-3.5" /> },
];

export const CategoryNav: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentCategory = searchParams.get('category') || (location.pathname === '/products' && !location.search ? 'all' : '');
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <nav
      className="glass-ribbon bg-slate-950/60 backdrop-blur-md border-b border-white/10 overflow-x-auto no-scrollbar py-2 px-4 sm:px-6 lg:px-8 relative z-20"
      aria-label="Category Navigation"
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Scrollable Category Links */}
        <div className="flex items-center space-x-1 sm:space-x-1.5 flex-nowrap">
          {CATEGORY_NAV_ITEMS.map((item) => {
            const isSelected = item.slug === 'all'
              ? (location.pathname === '/products' && !location.search) || currentCategory === 'all'
              : currentCategory === item.slug;

            const linkTarget = item.slug === 'all' ? '/products' : `/products?category=${item.slug}`;

            return (
              <Link
                key={item.slug}
                to={linkTarget}
                id={`cat-nav-${item.slug}`}
                className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 ${
                  isSelected
                    ? 'text-white font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                {/* Active Category Sliding Indicator with Cyber Gradient & Cyan Glow */}
                {isSelected && (
                  <motion.div
                    layoutId={shouldReduceMotion ? undefined : 'activeCategoryNavIndicator'}
                    className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl shadow-md shadow-blue-500/25 border border-cyan-400/30"
                    transition={MOTION_SPRINGS.responsive}
                  />
                )}
                <span className={`relative z-10 transition-colors ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                  {item.icon}
                </span>
                <span className="relative z-10">{item.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Right Flash Deals Link with Micro-Interactions */}
        <motion.div
          whileHover={shouldReduceMotion ? undefined : hoverScale}
          whileTap={shouldReduceMotion ? undefined : tapFeedback}
          className="hidden md:inline-block flex-shrink-0"
        >
          <Link
            to="/products?sort=price-low"
            id="cat-nav-flash-deals"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-400/30 hover:bg-amber-500/20 shadow-sm transition-all"
          >
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>🔥 Flash Deals (Up to 40% Off)</span>
          </Link>
        </motion.div>

      </div>
    </nav>
  );
};
