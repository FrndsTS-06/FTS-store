import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Star,
  Heart,
  ShoppingCart,
  Loader2,
  ArrowRight,
  Clock,
  Check,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Product } from '../../types/catalog';
import { apiClient } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { formatINR, getFallbackImage, FALLBACK_PRODUCT_IMAGE } from '../../utils/formatters';
import { ErrorMessage } from '../common/ErrorMessage';
import { QuickViewModal } from '../products/QuickViewModal';
import { usePrefersReducedMotion, tapButton, tapFeedback } from '../../motion';

interface DealsOfTheDaySectionProps {
  campaignEndTime?: string | null;
}

export const DealsOfTheDaySection: React.FC<DealsOfTheDaySectionProps> = ({
  campaignEndTime
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const shouldReduceMotion = usePrefersReducedMotion();

  const [addingProductId, setAddingProductId] = useState<string | null>(null);
  const [justClaimedId, setJustClaimedId] = useState<string | null>(null);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});
  const [selectedQuickViewProduct, setSelectedQuickViewProduct] = useState<Product | null>(null);
  const [pulsingWishlistIds, setPulsingWishlistIds] = useState<Record<string, boolean>>({});

  // Dynamic live countdown: calculates till midnight or supplied campaignEndTime
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
  }>({ hours: 14, minutes: 28, seconds: 45 });

  useEffect(() => {
    const updateTimer = () => {
      let targetTime: number;
      if (campaignEndTime) {
        targetTime = new Date(campaignEndTime).getTime();
      } else {
        // Default: end of today (midnight)
        const midnight = new Date();
        midnight.setHours(23, 59, 59, 999);
        targetTime = midnight.getTime();
      }

      const now = new Date().getTime();
      const diff = Math.max(0, targetTime - now);

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [campaignEndTime]);

  const fetchDeals = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Query catalog products with sort_by="featured" to prioritize authentic badged items
      const res = await apiClient.getProducts({ page_size: 40, sort_by: 'featured' });
      const items = res.items || [];

      // Filter products with genuine active discounts (compare_at_price > price)
      const discounted = items.filter((p) => {
        const price = Number(p.price);
        const compare = p.compare_at_price ? Number(p.compare_at_price) : 0;
        return compare > price;
      });

      // Prioritize top discount percentages
      const sortedByDiscount = [...discounted].sort((a, b) => {
        const discA = Number(a.compare_at_price) - Number(a.price);
        const discB = Number(b.compare_at_price) - Number(b.price);
        return discB - discA;
      });

      setProducts(sortedByDiscount.slice(0, 4));
    } catch (err: any) {
      console.error('Failed to load deals of the day:', err);
      setError(err.message || 'Unable to load daily deals.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  const handleQuickAdd = async (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.is_in_stock || addingProductId === product.id) return;
    setAddingProductId(product.id);
    try {
      const success = await addItem(product.id, 1, product.name);
      if (success) {
        if (!shouldReduceMotion) {
          confetti({
            particleCount: 40,
            spread: 60,
            origin: { y: 0.75 },
            colors: ['#f43f5e', '#fbbf24', '#f97316', '#ec4899'],
            disableForReducedMotion: true,
          });
        }
        setJustClaimedId(product.id);
        setTimeout(() => setJustClaimedId(null), 2000);
      }
    } catch (err) {
      console.error('Failed to add deal product to cart:', err);
    } finally {
      setAddingProductId(null);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    setPulsingWishlistIds((prev) => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setPulsingWishlistIds((prev) => ({ ...prev, [product.id]: false }));
    }, 450);
  };

  const handleImageError = (productId: string) => {
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
  };

  return (
    <section className="mb-16" aria-label="Deals of the Day">
      {/* Section Header with Viewport Entrance */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-50px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
              <span>DEALS OF THE DAY</span>
            </span>

            {/* Glowing Live Countdown Timer Pills */}
            <div
              id="deals-countdown-timer"
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-rose-500/30 text-rose-300 shadow-md backdrop-blur-sm"
            >
              <Clock className="w-3.5 h-3.5 text-rose-400 animate-spin-slow" />
              <div className="flex items-center gap-1 font-mono text-xs font-bold">
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/30">
                  {String(timeLeft.hours).padStart(2, '0')}h
                </span>
                <span className="text-rose-400 font-extrabold">:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-200 border border-rose-500/30">
                  {String(timeLeft.minutes).padStart(2, '0')}m
                </span>
                <span className="text-rose-400 font-extrabold">:</span>
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/30 text-rose-100 border border-rose-500/40 animate-pulse">
                  {String(timeLeft.seconds).padStart(2, '0')}s
                </span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight font-display">
            Daily Limited Savings
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Exclusive marked-down electronics with verified savings. Refreshed regularly.
          </p>
        </div>

        <Link
          to="/products?sort=price-low"
          id="deals-view-all-link"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-rose-400 hover:text-rose-300 transition-colors group self-start sm:self-auto"
        >
          <span>All Deals</span>
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </motion.div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl border border-white/10 glass-card animate-pulse shadow-sm flex flex-col p-4 justify-between"
            >
              <div className="w-full aspect-[4/3] rounded-xl bg-slate-800/50 mb-3" />
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
          title="Could not load daily deals"
          message={error}
          onRetry={fetchDeals}
        />
      )}

      {/* Empty State */}
      {!isLoading && !error && products.length === 0 && (
        <div className="p-10 text-center text-slate-400 bg-slate-900/30 rounded-2xl border border-slate-800">
          No promotional deals scheduled right now. Check back soon!
        </div>
      )}

      {/* Deals Product Grid */}
      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((product, index) => {
            const isWishlisted = isInWishlist(product.id);
            const isAdding = addingProductId === product.id;
            const isImgErr = imageErrors[product.id];
            const imageSrc = !isImgErr
              ? product.primary_image || getFallbackImage(product.category?.slug)
              : FALLBACK_PRODUCT_IMAGE;

            const sellingPrice = Number(product.price);
            const originalPrice = product.compare_at_price ? Number(product.compare_at_price) : 0;
            const savingsAmount = originalPrice > sellingPrice ? originalPrice - sellingPrice : 0;
            const discountPct =
              originalPrice > sellingPrice
                ? Math.round(((originalPrice - sellingPrice) / originalPrice) * 100)
                : 0;

            const numericRating =
              typeof product.rating === 'number'
                ? product.rating
                : parseFloat(product.rating || '5.0');

            return (
              <motion.article
                key={product.id}
                id={`deal-card-${product.slug}`}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  duration: 0.5,
                  delay: shouldReduceMotion ? 0 : index * 0.1,
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={shouldReduceMotion ? undefined : { y: -6, scale: 1.015 }}
                className="group relative flex flex-col justify-between bg-slate-900/60 backdrop-blur-md text-white border border-white/10 hover:border-rose-400/50 rounded-2xl shadow-lg hover:shadow-2xl hover:shadow-rose-950/30 transition-all duration-300 overflow-hidden"
              >
                {/* Specular Edge Highlight */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10" />

                {/* Top Media Area */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-950/40 backdrop-blur-sm flex items-center justify-center p-3 border-b border-white/10">
                  {/* Badges Overlay */}
                  <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10 pointer-events-none">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide bg-rose-600 text-white shadow-sm flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5" />
                      <span>{discountPct > 0 ? `-${discountPct}% OFF` : 'DEAL'}</span>
                    </span>

                    {savingsAmount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-500 text-white shadow-sm w-fit">
                        Save {formatINR(savingsAmount)}
                      </span>
                    )}
                  </div>

                  {/* Wishlist Button with Animated Heart-Scale Pulse */}
                  <motion.button
                    type="button"
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                    whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
                    animate={pulsingWishlistIds[product.id] ? { scale: [1, 1.35, 0.9, 1] } : { scale: 1 }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                    onClick={(e) => handleWishlistToggle(e, product)}
                    aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
                    title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
                    className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                      isWishlisted
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
                        : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-rose-400 border border-white/10 shadow-md backdrop-blur-md'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 transition-colors ${
                        isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-400'
                      }`}
                    />
                  </motion.button>

                  {/* Quick-View Action revealed on Desktop Hover and Keyboard Focus */}
                  <div className="absolute inset-x-0 bottom-2 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-10 pointer-events-auto">
                    <motion.button
                      type="button"
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                      whileTap={shouldReduceMotion ? undefined : tapFeedback}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedQuickViewProduct(product);
                      }}
                      aria-label={`Quick view ${product.name}`}
                      className="px-2.5 py-1 rounded-xl bg-slate-900/95 hover:bg-rose-600 text-white text-[11px] font-bold border border-slate-700/80 hover:border-rose-500 shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Quick View</span>
                    </motion.button>
                  </div>

                  {/* Product Image Link */}
                  <Link
                    to={`/products/${product.slug}`}
                    className="w-full h-full flex items-center justify-center"
                    tabIndex={-1}
                    aria-hidden="true"
                  >
                    <img
                      src={imageSrc}
                      alt={product.name}
                      onError={() => handleImageError(product.id)}
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-contain object-center group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                </div>

                {/* Card Body */}
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <div>
                    {product.category?.name && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                        {product.category.name}
                      </span>
                    )}

                    <Link to={`/products/${product.slug}`} className="block group/link">
                      <h3 className="text-xs sm:text-sm font-bold text-white group-hover/link:text-rose-400 transition-colors line-clamp-2 leading-snug mb-2">
                        {product.name}
                      </h3>
                    </Link>

                    {/* Star Rating */}
                    <div className="flex items-center gap-1 mb-2.5">
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3.5 h-3.5 ${
                              i < Math.round(numericRating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-600 fill-slate-700'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-slate-300 ml-1">
                        {numericRating.toFixed(1)}
                      </span>
                      {product.review_count !== undefined && (
                        <span className="text-[11px] text-slate-400">
                          ({product.review_count})
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    {/* Price Block */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-base sm:text-lg font-extrabold text-white">
                        {formatINR(product.price)}
                      </span>
                      {originalPrice > sellingPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatINR(product.compare_at_price)}
                        </span>
                      )}
                    </div>

                    {/* Limited Inventory Meter with Shimmer Animation */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400 mb-1">
                        <span>Stock Remaining</span>
                        <span className="font-bold text-slate-200">{product.stock_quantity} left</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${Math.min(100, Math.max(15, (product.stock_quantity / 50) * 100))}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                          className="h-full bg-gradient-to-r from-rose-500 to-amber-500 rounded-full relative overflow-hidden"
                        >
                          <div className="absolute inset-0 shimmer-effect opacity-60" />
                        </motion.div>
                      </div>
                    </div>

                    {/* Claim Deal Button with Tactile Feedback */}
                    <motion.button
                      type="button"
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                      whileTap={shouldReduceMotion ? undefined : tapButton}
                      onClick={(e) => handleQuickAdd(e, product)}
                      disabled={!product.is_in_stock || isAdding}
                      aria-label={`Claim deal for ${product.name}`}
                      className={`w-full py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all duration-200 cursor-pointer ${
                        justClaimedId === product.id
                          ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                          : product.is_in_stock
                          ? 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white hover:shadow-md hover:shadow-rose-600/25'
                          : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/10'
                      }`}
                    >
                      {isAdding ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Claiming...</span>
                        </>
                      ) : justClaimedId === product.id ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Claimed!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" />
                          <span>{product.is_in_stock ? 'Claim Deal' : 'Sold Out'}</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}

      {/* Quick View Modal */}
      <QuickViewModal
        product={selectedQuickViewProduct}
        isOpen={!!selectedQuickViewProduct}
        onClose={() => setSelectedQuickViewProduct(null)}
      />

    </section>
  );
};
