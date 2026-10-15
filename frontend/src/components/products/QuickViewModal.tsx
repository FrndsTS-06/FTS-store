import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  Star,
  Heart,
  ShoppingCart,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  ExternalLink,
  ShieldCheck,
  Truck,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Product } from '../../types/catalog';
import { formatPrice, getFallbackImage, FALLBACK_PRODUCT_IMAGE } from '../../utils/formatters';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  usePrefersReducedMotion,
  tapButton,
  tapFeedback,
  modalBackdrop,
  MOTION_SPRINGS
} from '../../motion';

export interface QuickViewModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  isOpen,
  onClose,
}) => {
  const { addItem, isUpdating } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const shouldReduceMotion = usePrefersReducedMotion();

  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [heartPulsing, setHeartPulsing] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Reset state whenever product changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setJustAdded(false);
      setImageError(false);
      setHeartPulsing(false);
    }
  }, [isOpen, product]);

  // Focus management, background scroll lock, Tab focus trapping, and Escape key handling
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        } else if (e.key === 'Tab' && modalRef.current) {
          const focusables = modalRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length === 0) return;
          const first = focusables[0];
          const last = focusables[focusables.length - 1];

          if (e.shiftKey) {
            if (document.activeElement === first) {
              e.preventDefault();
              last.focus();
            }
          } else {
            if (document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }
      };

      window.addEventListener('keydown', handleKeyDown);

      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
        if (previousActiveElement.current && typeof previousActiveElement.current.focus === 'function') {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, onClose]);

  if (!product) return null;

  const isWishlisted = isInWishlist(product.id);
  const maxSelectable = Math.min(product.stock_quantity || 1, 10);
  const numericRating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating || '5.0');
  const imageSrc = !imageError
    ? product.primary_image || getFallbackImage(product.category?.slug)
    : FALLBACK_PRODUCT_IMAGE;

  const handleAddToCart = async () => {
    if (!product.is_in_stock || isAdding || isUpdating) return;
    setIsAdding(true);
    try {
      const success = await addItem(product.id, quantity, product.name);
      if (success) {
        if (!shouldReduceMotion) {
          confetti({
            particleCount: 45,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#3b82f6', '#6366f1', '#10b981', '#f59e0b', '#ec4899'],
            disableForReducedMotion: true,
          });
        }
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2200);
      }
    } catch (err) {
      console.error('Failed to add to cart:', err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    setHeartPulsing(true);
    setTimeout(() => setHeartPulsing(false), 450);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="quick-view-product-title"
        >
          {/* Glassmorphic Dark Backdrop */}
          <motion.div
            variants={modalBackdrop}
            initial="initial"
            animate="animate"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md cursor-pointer"
            aria-hidden="true"
          />

          {/* Modal Content Card */}
          <motion.div
            ref={modalRef}
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 16 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 8 }}
            transition={shouldReduceMotion ? { duration: 0.15 } : MOTION_SPRINGS.smooth}
            className="relative w-full max-w-3xl glass-panel rounded-3xl shadow-2xl shadow-black/80 overflow-hidden z-10 flex flex-col my-auto"
          >
            {/* Top Close Button */}
            <motion.button
              ref={closeButtonRef}
              type="button"
              whileHover={shouldReduceMotion ? undefined : { scale: 1.1, rotate: 90 }}
              whileTap={shouldReduceMotion ? undefined : tapFeedback}
              onClick={onClose}
              aria-label="Close quick view dialog"
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <X className="w-5 h-5" />
            </motion.button>

            {/* 2-Column Responsive Body */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 p-6 sm:p-8">
              
              {/* Left Column: Visual Media Display */}
              <div className="relative flex flex-col items-center justify-center bg-slate-950/60 rounded-2xl border border-slate-800/80 p-4 overflow-hidden aspect-square sm:aspect-auto">
                {/* Badges Overlay */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10 pointer-events-none">
                  {product.badge && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-600 text-white shadow-md">
                      {product.badge}
                    </span>
                  )}
                  {product.discount_pct && product.discount_pct > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500 text-white shadow-md">
                      Save {product.discount_pct}%
                    </span>
                  ) : null}
                </div>

                {/* Wishlist Button */}
                <motion.button
                  type="button"
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                  whileTap={shouldReduceMotion ? undefined : { scale: 0.85 }}
                  animate={heartPulsing ? { scale: [1, 1.35, 0.9, 1] } : { scale: 1 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  onClick={handleToggleWishlist}
                  aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                  title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
                  className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 flex items-center justify-center shadow-lg transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <Heart
                    className={`w-4 h-4 transition-colors ${
                      isWishlisted ? 'text-rose-500 fill-rose-500' : 'text-slate-300'
                    }`}
                  />
                </motion.button>

                {/* Primary Image with Smooth Zoom */}
                <div className="relative w-full h-full flex items-center justify-center p-2">
                  <img
                    src={imageSrc}
                    alt={product.name}
                    onError={() => setImageError(true)}
                    loading="eager"
                    className="max-h-64 sm:max-h-72 w-full object-contain object-center transition-transform duration-500 hover:scale-105"
                  />
                </div>

                {/* Guarantees Strip */}
                <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                    <span className="truncate">Fast Shipping</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">100% Genuine</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Information, Pricing & Action Form */}
              <div className="flex flex-col justify-between">
                <div>
                  {/* Category & SKU */}
                  <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                    {product.category?.name ? (
                      <span className="font-bold uppercase tracking-wider text-blue-400">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-slate-500">General</span>
                    )}
                    {product.sku && (
                      <span className="font-mono text-[11px] text-slate-500">
                        SKU: {product.sku}
                      </span>
                    )}
                  </div>

                  {/* Product Title */}
                  <h2
                    id="quick-view-product-title"
                    className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug mb-2 font-display"
                  >
                    {product.name}
                  </h2>

                  {/* Rating Stars and Count */}
                  <div className="flex items-center gap-2 mb-4">
                    <div className="flex items-center text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < Math.round(numericRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-700 fill-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-200">
                      {numericRating.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({product.review_count} {product.review_count === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>

                  {/* Pricing Box */}
                  <div className="flex items-baseline gap-2.5 p-3.5 rounded-2xl bg-slate-950/50 border border-slate-800/80 mb-4">
                    <span className="text-2xl sm:text-3xl font-extrabold text-white">
                      {formatPrice(product.price)}
                    </span>
                    {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                      <span className="text-sm text-slate-500 line-through">
                        {formatPrice(product.compare_at_price)}
                      </span>
                    )}
                  </div>

                  {/* Stock Status Pill */}
                  <div className="mb-4">
                    {!product.is_in_stock || product.stock_status === 'out_of_stock' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                        <XCircle className="w-3.5 h-3.5" />
                        Currently Out of Stock
                      </span>
                    ) : product.stock_quantity <= 5 || product.stock_status === 'low_stock' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Only {product.stock_quantity} units remaining
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        In Stock & Ready to Ship
                      </span>
                    )}
                  </div>

                  {/* Description Excerpt */}
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3 mb-6">
                    {product.description}
                  </p>
                </div>

                {/* Bottom Actions Form */}
                <div className="space-y-4 pt-4 border-t border-slate-800/80">
                  {/* Quantity Stepper (if in stock) */}
                  {product.is_in_stock && (
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-slate-300">Quantity:</span>
                      <div className="flex items-center border border-slate-700/80 rounded-xl bg-slate-950 p-1">
                        <button
                          type="button"
                          onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                          disabled={quantity <= 1 || isAdding}
                          aria-label="Decrease quantity"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-9 text-center text-xs font-bold text-white">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity((prev) => Math.min(maxSelectable, prev + 1))}
                          disabled={quantity >= maxSelectable || isAdding}
                          aria-label="Increase quantity"
                          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Add to Cart CTA with Tactile Press Feedback */}
                  <motion.button
                    type="button"
                    whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion ? undefined : tapButton}
                    onClick={handleAddToCart}
                    disabled={!product.is_in_stock || isAdding || isUpdating}
                    className={`w-full py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/40 disabled:opacity-50 disabled:cursor-not-allowed ${
                      justAdded
                        ? 'bg-emerald-600 text-white shadow-emerald-500/30'
                        : product.is_in_stock
                        ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-blue-600/30'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {isAdding || isUpdating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Adding to Cart...</span>
                      </>
                    ) : justAdded ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Added to Cart!</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="w-4 h-4" />
                        <span>{product.is_in_stock ? `Add ${quantity} to Cart` : 'Out of Stock'}</span>
                      </>
                    )}
                  </motion.button>

                  {/* Full Product Detail Link */}
                  <Link
                    to={`/products/${product.slug}`}
                    onClick={onClose}
                    className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-slate-400 hover:text-blue-400 py-1 transition-colors group"
                  >
                    <span>View full specifications & details</span>
                    <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
