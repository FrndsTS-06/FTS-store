import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Product } from '../../types/catalog';
import { apiClient } from '../../services/api';
import { ErrorMessage } from '../common/ErrorMessage';
import { ProductCard } from '../products/ProductCard';

export const FeaturedProductsSection: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFeaturedProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch featured products from the real API
      const featured = await apiClient.getFeaturedProducts(12);

      // Prioritize realistic consumer electronics: smartphones, laptops, headphones, smartwatches, earbuds, accessories
      const priorityKeywords = ['phone', 'laptop', 'headphone', 'watch', 'earbud', 'charger', 'controller', 'camera'];
      
      const prioritized = [...featured].sort((a, b) => {
        const aName = a.name.toLowerCase();
        const bName = b.name.toLowerCase();
        const aMatch = priorityKeywords.some((kw) => aName.includes(kw));
        const bMatch = priorityKeywords.some((kw) => bName.includes(kw));
        if (aMatch && !bMatch) return -1;
        if (!aMatch && bMatch) return 1;
        return 0;
      });

      // Display top 6 to 12 items on the grid
      setProducts(prioritized.slice(0, 12));
    } catch (err: any) {
      console.error('Failed to load featured products:', err);
      setError(err.message || 'Unable to load featured products.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  return (
    <section className="mb-16" aria-label="Featured Products">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-1.5">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>CURATED HIGHLIGHTS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
            Featured Products
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Top-rated devices and flagship electronics curated for peak performance.
          </p>
        </div>

        <Link
          to="/products"
          id="featured-view-all-link"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors group self-start sm:self-auto"
        >
          <span>View All</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl border border-white/10 bg-slate-900/40 backdrop-blur-md animate-pulse p-3.5 flex flex-col justify-between"
            >
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-800/60 mb-3" />
              <div className="h-3.5 bg-slate-800/70 rounded w-2/3 mb-2" />
              <div className="h-4 bg-slate-800/60 rounded w-5/6 mb-3" />
              <div className="h-3 bg-slate-800/40 rounded w-1/2 mb-4" />
              <div className="h-5 bg-slate-800/60 rounded w-1/3 mb-3" />
              <div className="h-9 bg-slate-800/70 rounded-xl w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <ErrorMessage
          title="Could not load featured products"
          message={error}
          onRetry={fetchFeaturedProducts}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-2xl border border-white/10 backdrop-blur-md">
          No featured products available at this time.
        </div>
      )}

      {/* Six-Column Responsive 3D Glass Product Grid */}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              id={`featured-product-card-${product.slug}`}
              product={product}
              variant="compact"
            />
          ))}
        </div>
      )}

    </section>
  );
};
