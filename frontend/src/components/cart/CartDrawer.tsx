import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  X,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../../context/CartContext';
import { formatPrice, getFallbackImage, FALLBACK_PRODUCT_IMAGE } from '../../utils/formatters';
import { usePrefersReducedMotion, tapFeedback, tapButton } from '../../motion';

export const CartDrawer: React.FC = () => {
  const {
    cart,
    items,
    totalItemsCount,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    isUpdating,
    error,
  } = useCart();

  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const subtotalNum = Number(cart.subtotal) || 0;
  const thresholdNum = Number(cart.free_shipping_threshold) || 1000;
  const shippingProgressPct = Math.min(100, Math.round((subtotalNum / thresholdNum) * 100));

  // Accessibility: Background Scroll Lock, Focus Management & Escape Key Handling
  useEffect(() => {
    if (isDrawerOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          closeDrawer();
        } else if (e.key === 'Tab' && drawerRef.current) {
          const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
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
  }, [isDrawerOpen, closeDrawer]);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setCouponError(null);
    setCouponSuccess(null);
    setApplyingCoupon(true);

    const res = await applyCoupon(couponInput.trim().toUpperCase());
    setApplyingCoupon(false);
    if (res.success) {
      setCouponSuccess(res.message || 'Coupon applied successfully!');
      setCouponInput('');
    } else {
      setCouponError(res.message || 'Invalid promotional coupon code.');
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    await removeCoupon();
  };

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 overflow-hidden"
          aria-labelledby="cart-drawer-title"
          role="dialog"
          aria-modal="true"
        >
          {/* Subtle Backdrop with Opacity Fade */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm cursor-pointer"
            onClick={closeDrawer}
            aria-hidden="true"
          />

          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10 pointer-events-none">
            {/* Sliding Drawer Container with Spring Physics */}
            <motion.div
              ref={drawerRef}
              initial={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              animate={shouldReduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { x: '100%' }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.25 }
                  : { type: 'spring', damping: 30, stiffness: 320 }
              }
              className="w-screen max-w-md fts-glass-panel bg-slate-950/95 backdrop-blur-3xl border-l border-white/20 shadow-2xl flex flex-col pointer-events-auto relative fts-specular-edge"
            >
              {/* Updating Indicator Line */}
              {isUpdating && (
                <div className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 animate-pulse z-20" />
              )}

              {/* Header */}
              <div className="p-5 border-b border-white/10 flex items-center justify-between bg-slate-950/70 backdrop-blur-md fts-specular-edge">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-400/30 shadow-fts-glow-cyan">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h2 id="cart-drawer-title" className="text-lg font-bold text-white font-display">
                    Your Shopping Cart
                  </h2>
                  <motion.span
                    key={totalItemsCount}
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-400/30"
                  >
                    {totalItemsCount}
                  </motion.span>
                </div>

                <motion.button
                  ref={closeButtonRef}
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
                  whileTap={shouldReduceMotion ? undefined : tapFeedback}
                  onClick={closeDrawer}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400"
                  aria-label="Close shopping cart drawer"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* Free Shipping Meter */}
              <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800/80">
                <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Truck className="w-3.5 h-3.5 text-blue-400" />
                    {cart.is_free_shipping ? (
                      <span className="text-emerald-400 font-semibold">Free Insured Shipping unlocked!</span>
                    ) : (
                      <span>
                        Add <strong className="text-white font-bold">{formatPrice(cart.amount_needed_for_free_shipping)}</strong> for Free Shipping
                      </span>
                    )}
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">{shippingProgressPct}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgressPct}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      cart.is_free_shipping
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                    }`}
                  />
                </div>
              </div>

              {/* Error Banner */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2 overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Items Content with Animated Insertions & Deletions */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                {items.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4"
                  >
                    <motion.div
                      animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
                      transition={
                        shouldReduceMotion
                          ? undefined
                          : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                      }
                      className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-fts-glow-cyan"
                    >
                      <ShoppingBag className="w-8 h-8 text-cyan-400" />
                    </motion.div>
                    <div>
                      <h3 className="text-base font-bold text-white mb-1 font-display">Your cart is empty</h3>
                      <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                        Explore our high-performance computing, smart living ecosystems, and premium audio flagships.
                      </p>
                    </div>
                    <button
                      id="cart-drawer-empty-browse-btn"
                      onClick={() => {
                        closeDrawer();
                        navigate('/products');
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-fts-glow-blue border border-cyan-400/30 transition-all cursor-pointer"
                    >
                      <span>Browse Catalog</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                ) : (
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        id={`cart-drawer-item-${item.id}`}
                        layout
                        initial={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, height: 0, scale: 0.95 }
                        }
                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                        exit={
                          shouldReduceMotion
                            ? { opacity: 0 }
                            : { opacity: 0, height: 0, scale: 0.95 }
                        }
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="p-3.5 rounded-2xl bg-slate-900/60 hover:bg-slate-900/80 border border-white/10 hover:border-cyan-400/30 shadow-md backdrop-blur-md transition-all duration-200 flex gap-3.5 group relative overflow-hidden"
                      >
                        {/* Specular Edge Sheen */}
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

                        {/* Thumbnail */}
                        <Link
                          to={`/products/${item.slug}`}
                          onClick={closeDrawer}
                          className="w-16 h-16 rounded-xl bg-slate-950/70 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5 shadow-inner"
                        >
                          <img
                            src={item.image_url || getFallbackImage(item.category_name || undefined)}
                            alt={item.name}
                            loading="lazy"
                            decoding="async"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = FALLBACK_PRODUCT_IMAGE;
                            }}
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                          />
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <Link
                                to={`/products/${item.slug}`}
                                onClick={closeDrawer}
                                className="text-sm font-semibold text-white hover:text-cyan-300 transition-colors line-clamp-1"
                              >
                                {item.name}
                              </Link>
                              <motion.button
                                whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                                onClick={() => removeItem(item.id)}
                                disabled={isUpdating}
                                className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg p-1 transition-colors cursor-pointer focus:outline-none"
                                aria-label={`Remove ${item.name} from cart`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </motion.button>
                            </div>

                            <div className="text-xs text-slate-400 font-mono mt-0.5">
                              {formatPrice(item.unit_price)} each
                            </div>

                            {item.warning && (
                              <div className="mt-1 text-[11px] text-amber-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                                <span>{item.warning}</span>
                              </div>
                            )}
                          </div>

                          {/* Quantity Stepper & Line Total */}
                          <div className="flex items-center justify-between mt-2 pt-1">
                            <div className="flex items-center border border-white/15 rounded-xl bg-slate-950/80 p-0.5 backdrop-blur-sm">
                              <motion.button
                                whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || isUpdating}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </motion.button>
                              <motion.span
                                key={item.quantity}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                className="w-7 text-center text-xs font-bold text-white font-mono"
                              >
                                {item.quantity}
                              </motion.span>
                              <motion.button
                                whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                                whileTap={shouldReduceMotion ? undefined : tapFeedback}
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                disabled={item.quantity >= item.stock_quantity || isUpdating}
                                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </motion.button>
                            </div>

                            <motion.div
                              key={item.line_total}
                              initial={{ opacity: 0.7 }}
                              animate={{ opacity: 1 }}
                              className="text-sm font-bold text-cyan-300 font-mono"
                            >
                              {formatPrice(item.line_total)}
                            </motion.div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer with Summary and CTAs */}
              {items.length > 0 && (
                <div className="p-5 border-t border-white/15 bg-slate-950/80 backdrop-blur-2xl space-y-4 fts-specular-edge">
                  {/* Promo Code Form */}
                  <div>
                    {cart.coupon_code ? (
                      <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-between text-xs backdrop-blur-sm">
                        <div className="flex items-center gap-2 text-cyan-300">
                          <Tag className="w-3.5 h-3.5 text-cyan-400" />
                          <span className="font-mono font-bold tracking-wider">{cart.coupon_code}</span>
                          <span className="text-slate-400">({cart.discount_description || 'Applied'})</span>
                        </div>
                        <button
                          onClick={handleRemoveCoupon}
                          disabled={isUpdating}
                          className="text-xs text-rose-400 hover:text-rose-300 font-semibold underline transition-colors cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <form onSubmit={handleApplyCoupon} className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            id="cart-drawer-coupon-input"
                            type="text"
                            placeholder="Promo Code (e.g. WELCOME10)"
                            value={couponInput}
                            onChange={(e) => setCouponInput(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-950/70 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 uppercase tracking-wider font-mono transition-colors shadow-inner"
                          />
                        </div>
                        <motion.button
                          id="cart-drawer-coupon-submit"
                          type="submit"
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                          whileTap={shouldReduceMotion ? undefined : tapButton}
                          disabled={!couponInput.trim() || applyingCoupon}
                          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white disabled:opacity-50 transition-all flex items-center gap-1 cursor-pointer shadow-sm border border-cyan-400/30"
                        >
                          {applyingCoupon ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Apply'}
                        </motion.button>
                      </form>
                    )}

                    {couponError && (
                      <p className="text-[11px] text-rose-400 mt-1.5">{couponError}</p>
                    )}
                    {couponSuccess && (
                      <p className="text-[11px] text-emerald-400 mt-1.5">{couponSuccess}</p>
                    )}
                  </div>

                  {/* Price Breakdown with Smooth Numeric Transitions */}
                  <div className="space-y-1.5 text-xs text-slate-400 border-t border-white/10 pt-3">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span className="text-slate-200 font-mono font-medium">{formatPrice(cart.subtotal)}</span>
                    </div>

                    {Number(cart.discount_amount) > 0 && (
                      <div className="flex justify-between text-emerald-400 font-medium">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          Promo Discount
                        </span>
                        <span className="font-mono">-{formatPrice(cart.discount_amount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between">
                      <span>Estimated Shipping</span>
                      <span className="font-mono">
                        {cart.is_free_shipping ? (
                          <span className="text-emerald-400 font-semibold uppercase text-[11px]">Free</span>
                        ) : (
                          formatPrice(cart.shipping_fee)
                        )}
                      </span>
                    </div>

                    <div className="flex justify-between">
                      <span>Estimated Sales Tax (8%)</span>
                      <span className="text-slate-200 font-mono font-medium">{formatPrice(cart.tax_amount)}</span>
                    </div>

                    <div className="flex justify-between text-sm font-bold text-white border-t border-white/10 pt-2 items-baseline">
                      <span>Estimated Total</span>
                      <motion.span
                        key={cart.total}
                        initial={{ opacity: 0.7 }}
                        animate={{ opacity: 1 }}
                        className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-mono"
                      >
                        {formatPrice(cart.total)}
                      </motion.span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <motion.button
                      id="cart-drawer-checkout-btn"
                      type="button"
                      whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                      whileTap={shouldReduceMotion ? undefined : tapButton}
                      onClick={handleCheckoutClick}
                      className="w-full py-3 px-5 rounded-xl text-sm font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 text-white shadow-fts-glow-cyan flex items-center justify-center gap-2 cursor-pointer transition-all duration-300 border border-cyan-300/40"
                    >
                      <span>Proceed to Checkout</span>
                      <ArrowRight className="w-4 h-4" />
                    </motion.button>

                    <div className="flex items-center justify-between gap-2">
                      <button
                        id="cart-drawer-view-cart-btn"
                        type="button"
                        onClick={handleViewCartClick}
                        className="flex-1 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/60 hover:bg-slate-800/80 border border-white/10 hover:border-white/20 transition-all cursor-pointer text-center"
                      >
                        View Cart Details
                      </button>
                      <button
                        onClick={clearCart}
                        disabled={isUpdating}
                        className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
