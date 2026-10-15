import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Sparkles,
  Tag,
  Truck,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowLeft,
  Info,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { PageContainer } from '../components/common/PageContainer';
import { EmptyState } from '../components/common/EmptyState';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { formatPrice, getFallbackImage, FALLBACK_PRODUCT_IMAGE } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefersReducedMotion, tapFeedback, tapButton } from '../motion';

export const CartPage: React.FC = () => {
  const {
    cart,
    items,
    totalItemsCount,
    isLoading,
    isUpdating,
    error,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  } = useCart();

  const navigate = useNavigate();
  const shouldReduceMotion = usePrefersReducedMotion();
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponSuccess, setCouponSuccess] = useState<string | null>(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [itemQuantityDrafts, setItemQuantityDrafts] = useState<Record<string, string>>({});

  const subtotalNum = Number(cart.subtotal) || 0;
  const thresholdNum = Number(cart.free_shipping_threshold) || 1000;
  const shippingProgressPct = Math.min(100, Math.round((subtotalNum / thresholdNum) * 100));

  const handleApplyCoupon = async (codeToApply?: string) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;

    setCouponError(null);
    setCouponSuccess(null);
    setIsApplyingCoupon(true);

    const res = await applyCoupon(code);
    setIsApplyingCoupon(false);

    if (res.success) {
      setCouponSuccess(res.message || `Coupon ${code} applied!`);
      setCouponCode('');
    } else {
      setCouponError(res.message || 'Invalid or expired coupon code.');
    }
  };

  const handleRemoveCoupon = async () => {
    setCouponError(null);
    setCouponSuccess(null);
    await removeCoupon();
  };

  const handleQuantityInputChange = (itemId: string, rawVal: string) => {
    setItemQuantityDrafts((prev) => ({ ...prev, [itemId]: rawVal }));
  };

  const handleQuantityInputBlur = async (itemId: string, maxStock: number, currentQty: number) => {
    const draft = itemQuantityDrafts[itemId];
    if (draft === undefined) return;

    const parsed = parseInt(draft, 10);
    let target = isNaN(parsed) || parsed < 1 ? 1 : parsed;
    if (target > maxStock) target = maxStock;
    if (target > 99) target = 99;

    // Reset draft
    setItemQuantityDrafts((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });

    if (target !== currentQty) {
      await updateQuantity(itemId, target);
    }
  };

  if (isLoading && items.length === 0) {
    return (
      <PageContainer title="Shopping Cart">
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader size="lg" label="Loading cart details..." />
        </div>
      </PageContainer>
    );
  }

  if (items.length === 0) {
    return (
      <PageContainer
        title="Shopping Cart"
        subtitle="Review selected products, apply promotional coupons, and proceed to checkout."
      >
        <EmptyState
          icon={<ShoppingCart className="w-8 h-8 text-indigo-400" />}
          title="Your Shopping Cart is Empty"
          description="You don't have any items in your cart yet. Explore our curated collections across cutting-edge technology, modern apparel, and accessories."
          action={
            <Link to="/products">
              <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Explore All Products
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Shopping Cart"
      subtitle={`Review your ${totalItemsCount} selected ${totalItemsCount === 1 ? 'item' : 'items'} and proceed to checkout.`}
    >
      {/* Global Error Banner if any */}
      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-start justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Cart Items (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Top Actions Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-sm font-semibold text-slate-300">
              Items in Cart ({items.length} unique)
            </span>
            <button
              onClick={clearCart}
              disabled={isUpdating}
              className="text-xs font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Entire Cart</span>
            </button>
          </div>

          {/* Items List Card */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-xl divide-y divide-white/5 overflow-hidden shadow-xl fts-specular-edge">
            <AnimatePresence initial={false}>
              {items.map((item) => {
                const currentInputVal =
                  itemQuantityDrafts[item.id] !== undefined
                    ? itemQuantityDrafts[item.id]
                    : String(item.quantity);

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, height: 0, scale: 0.96 }
                    }
                    animate={{ opacity: 1, height: 'auto', scale: 1 }}
                    exit={
                      shouldReduceMotion
                        ? { opacity: 0 }
                        : { opacity: 0, height: 0, scale: 0.96 }
                    }
                    transition={{ duration: 0.28, ease: 'easeOut' }}
                    className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 group hover:bg-slate-900/60 transition-colors overflow-hidden"
                  >
                    {/* Thumbnail Image */}
                    <Link
                      to={`/products/${item.slug}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950/80 border border-white/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-2 shadow-inner"
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

                    {/* Title and Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {item.category_name && (
                          <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                            {item.category_name}
                          </span>
                        )}
                        <span className="text-xs text-slate-500 font-mono">
                          SKU: {item.sku}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-1 font-display">
                        <Link to={`/products/${item.slug}`}>{item.name}</Link>
                      </h3>

                      <div className="text-xs text-slate-400 font-mono mt-1">
                        Unit Price: <span className="text-slate-200 font-semibold">{formatPrice(item.unit_price)}</span>
                      </div>

                      {/* Stock Alert / Warning */}
                      {item.warning ? (
                        <div className="mt-2 text-xs text-amber-400 flex items-center gap-1.5 font-medium">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{item.warning}</span>
                        </div>
                      ) : item.stock_quantity <= 5 ? (
                        <div className="mt-1 text-xs text-amber-400/90 font-medium">
                          Only {item.stock_quantity} left in stock
                        </div>
                      ) : null}
                    </div>

                    {/* Quantity Stepper & Price Line */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3">
                      {/* Stepper Controls */}
                      <div className="flex items-center border border-white/15 rounded-xl bg-slate-950/80 p-1 backdrop-blur-sm">
                        <motion.button
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
                          whileTap={shouldReduceMotion ? undefined : tapFeedback}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1 || isUpdating}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </motion.button>

                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          aria-label="Item quantity"
                          value={currentInputVal}
                          onChange={(e) => handleQuantityInputChange(item.id, e.target.value)}
                          onBlur={() => handleQuantityInputBlur(item.id, item.stock_quantity, item.quantity)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          disabled={isUpdating}
                          className="w-12 text-center text-xs font-bold text-white font-mono bg-transparent border-none focus:outline-none focus:ring-0"
                        />

                        <motion.button
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
                          whileTap={shouldReduceMotion ? undefined : tapFeedback}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.stock_quantity || isUpdating}
                          className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </motion.button>
                      </div>

                      {/* Total & Remove */}
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <motion.div
                            key={item.line_total}
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                            className="text-sm sm:text-base font-extrabold text-cyan-300 font-mono"
                          >
                            {formatPrice(item.line_total)}
                          </motion.div>
                        </div>

                        <motion.button
                          whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
                          whileTap={shouldReduceMotion ? undefined : tapFeedback}
                          onClick={() => removeItem(item.id)}
                          disabled={isUpdating}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                          aria-label={`Remove ${item.name} from cart`}
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Navigation link back to products */}
          <div className="pt-2 flex items-center justify-between">
            <Link
              to="/products"
              className="inline-flex items-center text-xs font-semibold text-slate-400 hover:text-white transition-colors gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </Link>
          </div>

        </div>

        {/* Right Column: Order Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Order Summary Card */}
          <div className="rounded-3xl border border-white/15 bg-slate-900/80 backdrop-blur-2xl p-6 sm:p-8 space-y-6 shadow-2xl sticky top-24 relative overflow-hidden fts-specular-edge">
            
            <h2 className="text-lg font-bold text-white font-display border-b border-white/10 pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                {totalItemsCount} items
              </span>
            </h2>

            {/* Free Shipping Progress Meter */}
            <div className="p-4 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <Truck className="w-4 h-4 text-cyan-400" />
                  {cart.is_free_shipping ? (
                    <span className="text-emerald-400 font-bold">Free Insured Shipping unlocked!</span>
                  ) : (
                    <span>
                      Add <strong className="text-white font-bold">{formatPrice(cart.amount_needed_for_free_shipping)}</strong> for Free Shipping
                    </span>
                  )}
                </span>
                <span className="text-slate-400 font-mono text-[11px] font-bold">{shippingProgressPct}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    cart.is_free_shipping
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                      : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}
                  style={{ width: `${shippingProgressPct}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                <Info className="w-3 h-3 flex-shrink-0 text-slate-400" />
                Standard flat-rate shipping is ₹99 for orders under ₹1,000.
              </p>
            </div>

            {/* Promo Code Input & Badges */}
            <div className="space-y-3">
              <label htmlFor="promo-code-input" className="block text-xs font-semibold text-slate-300">
                Promotional Coupon
              </label>

              {cart.coupon_code ? (
                <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-400/25 flex items-center justify-between text-xs backdrop-blur-sm">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <Tag className="w-4 h-4 text-cyan-400" />
                    <span className="font-mono font-bold tracking-wider">{cart.coupon_code}</span>
                    <span className="text-slate-400 text-[11px]">({cart.discount_description || 'Applied'})</span>
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
                <div>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleApplyCoupon();
                    }}
                    className="flex gap-2"
                  >
                    <input
                      id="promo-code-input"
                      type="text"
                      placeholder="e.g. WELCOME10"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="flex-1 px-3.5 py-2 rounded-xl text-xs bg-slate-950/70 border border-white/15 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 uppercase font-mono tracking-wider shadow-inner"
                    />
                    <Button
                      variant="secondary"
                      size="sm"
                      type="submit"
                      disabled={!couponCode.trim() || isApplyingCoupon}
                      isLoading={isApplyingCoupon}
                    >
                      Apply
                    </Button>
                  </form>

                  {/* Suggestion Quick Chips */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-slate-400">Popular:</span>
                    {['WELCOME10', 'SUPER20', 'FESTIVE15', 'VIP30'].map((code) => (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleApplyCoupon(code)}
                        className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-800/80 hover:bg-cyan-600/30 text-slate-300 hover:text-cyan-200 border border-slate-700/60 transition-colors cursor-pointer"
                      >
                        {code}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {couponError && (
                <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{couponError}</span>
                </p>
              )}
              {couponSuccess && (
                <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{couponSuccess}</span>
                </p>
              )}
            </div>

            {/* Financial Calculations Breakdown */}
            <div className="space-y-3 pt-3 border-t border-white/10 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal ({totalItemsCount} items)</span>
                <span className="font-mono text-slate-200">{formatPrice(cart.subtotal)}</span>
              </div>

              {Number(cart.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Promo Discount
                  </span>
                  <span className="font-mono">-{formatPrice(cart.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Estimated Shipping</span>
                <span className="font-mono">
                  {cart.is_free_shipping ? (
                    <span className="text-emerald-400 font-semibold uppercase text-xs">Free</span>
                  ) : (
                    formatPrice(cart.shipping_fee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>Estimated Sales Tax (8.00%)</span>
                <span className="font-mono text-slate-200">{formatPrice(cart.tax_amount)}</span>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-base font-bold text-white font-display">Estimated Total</span>
                <div className="text-right">
                  <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-mono">
                    {formatPrice(cart.total)}
                  </div>
                  <span className="text-[11px] text-slate-400">Calculated in USD</span>
                </div>
              </div>
            </div>

            {/* Checkout Action Button */}
            <div className="pt-2 space-y-3">
              <motion.button
                id="cart-page-checkout-btn"
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : tapButton}
                onClick={() => navigate('/checkout')}
                className="w-full py-4 px-6 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 text-white shadow-fts-glow-cyan flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 border border-cyan-300/40"
              >
                <span>Proceed to Checkout</span>
                <ArrowRight className="w-5 h-5" />
              </motion.button>

              {/* Trust & Guarantee Badges */}
              <div className="pt-3 border-t border-white/10 space-y-2 text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>256-bit SSL encrypted secure checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span>30-day money-back guarantee on all orders</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </PageContainer>
  );
};
