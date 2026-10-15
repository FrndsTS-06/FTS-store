import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Star,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ShoppingCart,
  Loader2,
  Check,
  Heart,
  Eye,
  Award
} from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Product } from '../../types/catalog';
import { formatINR, getFallbackImage, FALLBACK_PRODUCT_IMAGE } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { usePrefersReducedMotion, tapButton, tapFeedback } from '../../motion';
import { QuickViewModal } from './QuickViewModal';

export interface ProductCardProps {
  product: Product;
  className?: string;
  id?: string;
  variant?: 'default' | 'compact';
  rankBadge?: number;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  className = '',
  id,
  variant = 'default',
  rankBadge,
}) => {
  const { addItem } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const shouldReduceMotion = usePrefersReducedMotion();

  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>(
    product.primary_image || getFallbackImage(product.category?.slug)
  );
  const [imageError, setImageError] = useState(false);

  // 3D Tilt support: active only on fine-pointer devices and when reduced motion is disabled
  const cardRef = useRef<HTMLDivElement>(null);
  const [canTilt, setCanTilt] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(pointer: fine)');
      setCanTilt(mediaQuery.matches && !shouldReduceMotion);

      const handler = (e: MediaQueryListEvent) => {
        setCanTilt(e.matches && !shouldReduceMotion);
      };
      mediaQuery.addEventListener?.('change', handler);
      return () => mediaQuery.removeEventListener?.('change', handler);
    }
  }, [shouldReduceMotion]);

  // Motion values for hardware-accelerated 3D transforms (zero React re-renders on move)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring physics for organic motion
  const springConfig = { stiffness: 220, damping: 24, mass: 0.8 };
  const mouseXSpring = useSpring(mouseX, springConfig);
  const mouseYSpring = useSpring(mouseY, springConfig);

  // Restrained tilt angles (max ±6.5deg) to prevent clipping or obscuring interactive controls
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['6.5deg', '-6.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-6.5deg', '6.5deg']);

  // Specular reflection gradient coordinates
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], [15, 85]);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], [15, 85]);
  const glareOpacity = useMotionValue(0);
  const glareOpacitySpring = useSpring(glareOpacity, { stiffness: 260, damping: 28 });

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!canTilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const normalizedX = (e.clientX - rect.left) / rect.width - 0.5;
    const normalizedY = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
    glareOpacity.set(1);
  };

  const handlePointerLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
    glareOpacity.set(0);
  };

  const isWishlisted = isInWishlist(product.id);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.is_in_stock || isAdding) return;
    setIsAdding(true);
    try {
      const success = await addItem(product.id, 1, product.name);
      if (success) {
        if (!shouldReduceMotion) {
          confetti({
            particleCount: 35,
            spread: 55,
            origin: { y: 0.75 },
            colors: ['#06b6d4', '#3b82f6', '#6366f1', '#10b981', '#f59e0b'],
            disableForReducedMotion: true,
          });
        }
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    setHeartPulsing(true);
    setTimeout(() => setHeartPulsing(false), 450);
  };

  const handleImageError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(getFallbackImage(product.category?.slug) || FALLBACK_PRODUCT_IMAGE);
    }
  };

  const getStockBadge = () => {
    if (product.stock_status === 'out_of_stock' || !product.is_in_stock) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
          <XCircle className="w-3 h-3" />
          Out of Stock
        </span>
      );
    }
    if (product.stock_status === 'low_stock' || product.stock_quantity <= 5) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle className="w-3 h-3 animate-pulse" />
          Only {product.stock_quantity} left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        In Stock
      </span>
    );
  };

  const numericRating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating || '5.0');
  const cardElementId = id || `product-card-${product.slug || product.id}`;

  return (
    <>
      <div
        ref={cardRef}
        style={{ perspective: 1000 }}
        className={`relative group h-full ${className}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <motion.article
          id={cardElementId}
          style={{
            rotateX: canTilt ? rotateX : 0,
            rotateY: canTilt ? rotateY : 0,
            transformStyle: 'preserve-3d',
          }}
          whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="relative flex flex-col h-full rounded-2xl bg-slate-900/60 backdrop-blur-md border border-white/10 hover:border-cyan-400/50 shadow-lg hover:shadow-2xl hover:shadow-cyan-950/40 transition-colors duration-300 overflow-hidden"
        >
          {/* Specular Edge Highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none z-10" />

          {/* Dynamic Specular Sheen Reflection Layer (Follows cursor) */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10 rounded-2xl transition-opacity duration-200"
            style={{
              opacity: canTilt ? glareOpacitySpring : 0,
              background: useTransform(
                [glareX, glareY],
                ([gx, gy]) =>
                  `radial-gradient(circle at ${gx}% ${gy}%, rgba(56, 189, 248, 0.16), rgba(99, 102, 241, 0.05) 35%, transparent 70%)`
              ),
            }}
          />

          {/* Product Image Stage with 3D Depth Layer */}
          <div
            style={{ transform: canTilt ? 'translateZ(20px)' : undefined }}
            className="relative block aspect-[4/3] w-full overflow-hidden bg-slate-950/50 backdrop-blur-sm border-b border-white/10"
          >
            <Link
              to={`/products/${product.slug}`}
              className="block w-full h-full p-3 flex items-center justify-center"
              tabIndex={-1}
              aria-hidden="true"
            >
              <img
                src={imageSrc}
                alt={product.name}
                onError={handleImageError}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-contain object-center group-hover:scale-108 transition-transform duration-500 ease-out"
              />
            </Link>

            {/* Subtle Gradient Shade on Image Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

            {/* Top Badges (Top-Left) with 3D Depth */}
            <div
              style={{ transform: canTilt ? 'translateZ(30px)' : undefined }}
              className="absolute top-2.5 left-2.5 flex flex-col gap-1 pointer-events-none z-20"
            >
              {rankBadge !== undefined && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md border border-amber-400/30">
                  <Award className="w-3 h-3" />
                  #{rankBadge}
                </span>
              )}

              {product.badge && (
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide text-white shadow-md border ${
                    product.badge.toLowerCase().includes('best')
                      ? 'bg-amber-500/90 border-amber-400/40 text-white'
                      : product.badge.toLowerCase().includes('flagship') ||
                        product.badge.toLowerCase().includes('new')
                      ? 'bg-emerald-600/90 border-emerald-400/40 text-white'
                      : 'bg-blue-600/90 border-blue-400/40 text-white'
                  }`}
                >
                  {product.badge}
                </span>
              )}

              {product.discount_pct && product.discount_pct > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow-md w-fit border border-rose-400/30">
                  -{product.discount_pct}%
                </span>
              ) : null}
            </div>

            {/* Wishlist Button (Top-Right) with 3D Depth and Animated Heart-Scale Pulse */}
            <div
              style={{ transform: canTilt ? 'translateZ(35px)' : undefined }}
              className="absolute top-2.5 right-2.5 z-20 pointer-events-auto"
            >
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
                animate={heartPulsing ? { scale: [1, 1.45, 0.85, 1.2, 1] } : { scale: 1 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onClick={handleWishlistToggle}
                aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 ${
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
            </div>

            {/* Quick-View Action revealed on Desktop Hover and Keyboard Focus */}
            <div
              style={{ transform: canTilt ? 'translateZ(35px)' : undefined }}
              className="absolute inset-x-0 bottom-2.5 flex items-center justify-center opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-200 transform translate-y-2 group-hover:translate-y-0 z-20 pointer-events-auto"
            >
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsQuickViewOpen(true);
                }}
                aria-label={`Quick view ${product.name}`}
                className="px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-blue-600 text-white text-xs font-bold border border-white/15 hover:border-blue-400 shadow-xl backdrop-blur-md flex items-center gap-1.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Quick View</span>
              </motion.button>
            </div>
          </div>

          {/* Product Content Details with 3D Depth */}
          <div
            style={{ transform: canTilt ? 'translateZ(15px)' : undefined }}
            className="flex flex-1 flex-col p-3.5 sm:p-4 justify-between"
          >
            <div>
              {/* Category & Stock Row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                {product.category ? (
                  <Link
                    to={`/products?category=${product.category.slug}`}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 transition-colors uppercase tracking-wider truncate"
                  >
                    {product.category.name}
                  </Link>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Electronics</span>
                )}
                {getStockBadge()}
              </div>

              {/* Product Title */}
              <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 mb-1 font-display">
                <Link to={`/products/${product.slug}`} className="focus:outline-none focus:underline">
                  {product.name}
                </Link>
              </h3>

              {/* Description snippet for default variant */}
              {variant === 'default' && product.description && (
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2.5">
                  {product.description}
                </p>
              )}

              {/* Rating and Reviews */}
              <div className="flex items-center gap-1.5 mb-3">
                <div className="flex items-center text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-bold text-slate-200 ml-1">
                    {numericRating.toFixed(1)}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  ({product.review_count || 0} {product.review_count === 1 ? 'review' : 'reviews'})
                </span>
              </div>
            </div>

            {/* Pricing and Action Footer */}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    {formatINR(product.price)}
                  </span>
                  {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                    <span className="text-xs text-slate-500 line-through">
                      {formatINR(product.compare_at_price)}
                    </span>
                  )}
                </div>

                {/* Mobile Quick-View Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsQuickViewOpen(true);
                  }}
                  className="inline-flex sm:hidden items-center justify-center p-1.5 rounded-lg text-slate-400 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  aria-label={`Quick view ${product.name}`}
                  title="Quick View"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Action Buttons Row with 3D Depth */}
              <div
                style={{ transform: canTilt ? 'translateZ(25px)' : undefined }}
                className="flex items-center gap-2"
              >
                {/* Add to Cart Button */}
                {product.is_in_stock ? (
                  <motion.button
                    type="button"
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? undefined : tapButton}
                    onClick={handleQuickAdd}
                    disabled={isAdding}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer ${
                      justAdded
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/40 border border-emerald-400/40'
                        : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-md shadow-blue-600/20 hover:shadow-cyan-500/30 border border-white/10'
                    }`}
                    aria-label={`Add ${product.name} to shopping cart`}
                    title={justAdded ? 'Added to Cart!' : 'Add to Cart'}
                  >
                    {isAdding ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>Adding...</span>
                      </>
                    ) : justAdded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Added!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </motion.button>
                ) : (
                  <div className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold bg-white/5 text-slate-500 border border-white/10 text-center cursor-not-allowed">
                    Out of Stock
                  </div>
                )}

                {/* View Details Link */}
                <Link
                  to={`/products/${product.slug}`}
                  className="inline-flex items-center justify-center p-2 rounded-xl text-slate-300 bg-slate-800/80 hover:bg-slate-700 hover:text-white border border-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-400 hover:scale-105"
                  aria-label={`View details for ${product.name}`}
                  title="View Details"
                >
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </motion.article>
      </div>

      {/* Quick View Dialog Modal */}
      <QuickViewModal
        product={product}
        isOpen={isQuickViewOpen}
        onClose={() => setIsQuickViewOpen(false)}
      />
    </>
  );
};
