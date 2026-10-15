import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { Product } from '../../types/catalog';
import { apiClient } from '../../services/api';
import { ErrorMessage } from '../common/ErrorMessage';
import { ProductCard } from '../products/ProductCard';

interface CategoryFilterTab {
  id: string;
  label: string;
  slug?: string;
}

const CATEGORY_TABS: CategoryFilterTab[] = [
  { id: 'tab-all', label: 'All Best Sellers' },
  { id: 'tab-laptops', label: 'Laptops', slug: 'laptops' },
  { id: 'tab-mobiles', label: 'Mobiles', slug: 'mobiles' },
  { id: 'tab-audio', label: 'Audio', slug: 'audio' },
  { id: 'tab-smart', label: 'Smart Devices', slug: 'smart-devices' },
  { id: 'tab-acc', label: 'Accessories', slug: 'accessories' }
];

export const BestSellersSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<string>('tab-all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBestSellers = async (categorySlug?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Query the API with sort_by="featured" to prioritize badged items and authentic catalog products
      const res = await apiClient.getProducts({
        category: categorySlug,
        sort_by: 'featured',
        page_size: 24
      });

      // Filter and prioritize products marked as "Best Seller" or top rating >= 4.7
      const items = res.items || [];
      const bestSellers = items.filter((p) => {
        const isBestSellerBadge = p.badge && p.badge.toLowerCase().includes('best');
        const numRating = typeof p.rating === 'number' ? p.rating : parseFloat(p.rating || '0');
        return isBestSellerBadge || numRating >= 4.75;
      });

      // If category has few items, include remaining top-rated items from that category
      const finalItems = bestSellers.length > 0 ? bestSellers : items;
      setProducts(finalItems.slice(0, 8));
    } catch (err: any) {
      console.error('Failed to load best sellers:', err);
      setError(err.message || 'Unable to load best sellers catalogue.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const selectedTab = CATEGORY_TABS.find((t) => t.id === activeTab);
    fetchBestSellers(selectedTab?.slug);
  }, [activeTab]);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setActiveTab(tabId);
  };

  return (
    <section className="mb-16" aria-label="Best Sellers Section">
      {/* Section Header with Category Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col lg:flex-row lg:items-end justify-between mb-8 gap-4"
      >
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 mb-1.5">
            <Award className="w-3 h-3 text-amber-400" />
            <span>TOP DEMAND HARDWARE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
            Best Sellers
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Verified top-purchased electronics and computing hardware backed by customer reviews.
          </p>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              id={`bestseller-${tab.id}`}
              onClick={() => handleTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-white bg-slate-900/60 border border-white/5 hover:border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}

          <Link
            to="/products"
            id="bestsellers-view-all-link"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors ml-2 py-2 px-2 group"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </motion.div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-88 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md animate-pulse shadow-sm flex flex-col p-4 justify-between"
            >
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-800/60 mb-3" />
              <div className="h-4 bg-slate-800/60 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-800/40 rounded w-1/2 mb-4" />
              <div className="h-5 bg-slate-800/50 rounded w-1/3 mb-3" />
              <div className="h-10 bg-slate-800/60 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorMessage
          title="Could not load best sellers"
          message={error}
          onRetry={() => {
            const selectedTab = CATEGORY_TABS.find((t) => t.id === activeTab);
            fetchBestSellers(selectedTab?.slug);
          }}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="p-10 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-white/10 backdrop-blur-md">
          No products found in this best sellers department.
        </div>
      )}

      {/* 3D Glass Product Grid with Rank Badges */}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, index) => (
            <ProductCard
              key={product.id}
              id={`bestseller-card-${product.slug}`}
              product={product}
              rankBadge={index + 1}
            />
          ))}
        </div>
      )}
    </section>
  );
};
