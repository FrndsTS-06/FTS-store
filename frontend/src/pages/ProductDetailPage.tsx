import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Home,
  ChevronRight,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeft,
  Heart,
  Copy,
  Check,
  Cpu,
  BatteryCharging,
  Wifi,
  Sparkles,
  Layers,
  FileText,
  MessageSquare
} from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ProductImageGallery } from '../components/products/ProductImageGallery';
import { ProductCard } from '../components/products/ProductCard';
import { apiClient } from '../services/api';
import { Product } from '../types/catalog';
import { formatPrice } from '../utils/formatters';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { usePrefersReducedMotion, tapButton } from '../motion';

type DetailTab = 'overview' | 'specs' | 'reviews';

export const ProductDetailPage: React.FC = () => {
  const { idOrSlug } = useParams<{ idOrSlug: string }>();
  const navigate = useNavigate();
  const { addItem, isUpdating } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const shouldReduceMotion = usePrefersReducedMotion();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [justAddedToCart, setJustAddedToCart] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [heartPulsing, setHeartPulsing] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [copiedSku, setCopiedSku] = useState(false);

  useEffect(() => {
    if (!idOrSlug) return;

    const loadProductData = async () => {
      setIsLoading(true);
      setError(null);
      setQuantity(1);

      try {
        const prod = await apiClient.getProduct(idOrSlug);
        setProduct(prod);

        // Fetch related products in the same category
        if (prod.category?.slug) {
          try {
            const relRes = await apiClient.getProducts({
              category: prod.category.slug,
              page_size: 4,
            });
            // Filter out current product
            setRelatedProducts(relRes.items.filter(item => item.id !== prod.id).slice(0, 4));
          } catch {
            // Non-critical, ignore related errors
          }
        }
      } catch (err: any) {
        console.error('Failed to load product detail:', err);
        setError(err.message || 'Product not found or unavailable.');
      } finally {
        setIsLoading(false);
      }
    };

    loadProductData();
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });
  }, [idOrSlug, shouldReduceMotion]);

  const fireBurstConfetti = () => {
    if (shouldReduceMotion) return;
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
      disableForReducedMotion: true,
    });
  };

  const handleAddToCart = async () => {
    if (!product || !product.is_in_stock || isAddingToCart) return;
    setIsAddingToCart(true);
    const success = await addItem(product.id, quantity, product.name);
    setIsAddingToCart(false);
    if (success) {
      fireBurstConfetti();
      setJustAddedToCart(true);
      setTimeout(() => setJustAddedToCart(false), 2200);
    }
  };

  const handleToggleWishlist = () => {
    if (!product) return;
    toggleWishlist(product);
    setHeartPulsing(true);
    setTimeout(() => setHeartPulsing(false), 450);
  };

  const handleBuyNow = async () => {
    if (!product || !product.is_in_stock || isAddingToCart) return;
    setIsAddingToCart(true);
    const success = await addItem(product.id, quantity, product.name);
    setIsAddingToCart(false);
    if (success) {
      fireBurstConfetti();
      navigate('/cart');
    }
  };

  const handleCopySku = () => {
    if (!product?.sku) return;
    navigator.clipboard.writeText(product.sku);
    setCopiedSku(true);
    setTimeout(() => setCopiedSku(false), 1800);
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse my-8">
          <div className="aspect-square rounded-3xl bg-slate-900/60 border border-slate-800 fts-glass-panel" />
          <div className="space-y-6">
            <div className="h-6 w-32 bg-slate-800/80 rounded-lg" />
            <div className="h-10 w-3/4 bg-slate-800/80 rounded-lg" />
            <div className="h-8 w-48 bg-slate-800/80 rounded-lg" />
            <div className="h-28 w-full bg-slate-800/80 rounded-2xl" />
            <div className="h-14 w-full bg-slate-800/80 rounded-xl" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !product) {
    return (
      <PageContainer>
        <div className="max-w-xl mx-auto my-16 text-center">
          <ErrorMessage
            title="Product Not Found"
            message={error || 'The requested product could not be located in our catalog.'}
            className="mb-6"
          />
          <Link to="/products">
            <Button variant="secondary" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Catalog
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const maxSelectable = Math.min(product.stock_quantity || 1, 10);
  const numericRating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating || '5.0');
  const isWishlisted = isInWishlist(product.id);
  const numericPrice = typeof product.price === 'number' ? product.price : parseFloat(product.price);
  const monthlyEmi = (numericPrice / 3).toFixed(2);

  return (
    <PageContainer>
      {/* 1. Translucent Frosted Glass Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="inline-flex items-center space-x-2 text-xs text-slate-400 mb-8 py-2 px-4 rounded-2xl fts-glass-card border border-slate-800/80 overflow-x-auto whitespace-nowrap shadow-sm"
      >
        <Link to="/" className="hover:text-cyan-400 transition-colors flex items-center gap-1.5">
          <Home className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 transition-colors" />
          <span>Home</span>
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <Link to="/products" className="hover:text-cyan-400 transition-colors">
          Catalog
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-cyan-400 transition-colors font-medium text-slate-300"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <span className="text-cyan-300 font-semibold truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Main Product Showcase & Interactive Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mb-16 items-start">
        {/* Left Column: 3D Interactive Media Showcase (5 cols on lg) */}
        <div className="lg:col-span-6">
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            categorySlug={product.category?.slug}
            badge={product.badge}
            discountPct={product.discount_pct}
          />
        </div>

        {/* Right Column: Frosted Glass Purchase Console (6 cols on lg) */}
        <div className="lg:col-span-6 flex flex-col fts-glass-panel fts-specular-edge rounded-3xl p-6 sm:p-8 border border-slate-700/60 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Backlight Glow */}
          <div className="pointer-events-none absolute -top-24 -right-24 w-60 h-60 bg-blue-600/15 rounded-full blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-600/10 rounded-full blur-3xl" />

          {/* Top Row: Category Chip & SKU Copy Button */}
          <div className="flex items-center justify-between gap-4 mb-3 z-10">
            {product.category ? (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-950/70 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 hover:text-cyan-200 transition-all shadow-sm"
              >
                <Sparkles className="w-3 h-3 text-cyan-400" />
                {product.category.name}
              </Link>
            ) : (
              <span className="text-xs font-bold text-slate-400 uppercase">Premium Tech</span>
            )}

            <button
              type="button"
              onClick={handleCopySku}
              aria-label={`Copy SKU ${product.sku}`}
              title="Click to copy SKU"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono text-slate-400 bg-slate-900/60 border border-slate-800 hover:border-slate-700 hover:text-slate-200 transition-all cursor-pointer"
            >
              <span>SKU: {product.sku}</span>
              {copiedSku ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>
          </div>

          {/* Product Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-snug mb-3 font-display z-10">
            {product.name}
          </h1>

          {/* Rating & Review Metric */}
          <div className="flex items-center space-x-3 mb-6 z-10">
            <div className="flex items-center text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-xl">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400 mr-1.5" />
              <span className="text-sm font-bold text-white">
                {numericRating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-300">
              {product.review_count} Verified Customer {product.review_count === 1 ? 'Review' : 'Reviews'}
            </span>
            <span className="text-xs text-slate-500">•</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">
              <CheckCircle2 className="w-3 h-3" />
              Verified Buyer Choice
            </span>
          </div>

          {/* Grand Pricing Showcase Block */}
          <div className="p-5 rounded-2xl border border-slate-700/60 bg-gradient-to-r from-slate-900/80 via-slate-900/50 to-blue-950/40 mb-6 fts-glass-card shadow-inner z-10">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {formatPrice(product.price)}
              </span>
              {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
                <span className="text-base sm:text-lg text-slate-500 line-through">
                  {formatPrice(product.compare_at_price)}
                </span>
              )}
              {product.discount_pct && product.discount_pct > 0 ? (
                <span className="ml-auto px-3 py-1 rounded-full text-xs font-extrabold bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/30 border border-rose-400/40">
                  Save {product.discount_pct}%
                </span>
              ) : null}
            </div>

            {/* Flexible Installments Note */}
            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Flexible EMI from <strong className="text-cyan-300">₹{monthlyEmi}/month</strong></span>
              <span className="text-slate-500">Includes all taxes</span>
            </div>
          </div>

          {/* Live Pulsating Stock Status Indicator */}
          <div className="mb-6 z-10">
            {product.stock_status === 'out_of_stock' || !product.is_in_stock ? (
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                </span>
                <XCircle className="w-4 h-4 text-rose-400" />
                <span>Currently Out of Stock — Pre-orders opening soon</span>
              </div>
            ) : product.stock_status === 'low_stock' || product.stock_quantity <= 5 ? (
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>High Demand — Only {product.stock_quantity} units remaining</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>In Stock & Ready to Ship — Dispatches in 24 Hours</span>
              </div>
            )}
          </div>

          {/* Description Excerpt */}
          <div className="text-slate-300 text-sm leading-relaxed mb-6 z-10">
            <p>{product.description}</p>
          </div>

          {/* Quantity Selector & Action CTA Console */}
          <div className="pt-6 border-t border-slate-800/80 mt-auto space-y-4 z-10">
            {/* Quantity Stepper */}
            {product.is_in_stock && (
              <div className="flex items-center justify-between">
                <label htmlFor="quantity-input" className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Select Quantity:
                </label>
                <div className="flex items-center border border-slate-700/80 rounded-2xl bg-slate-950/80 p-1 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1 || !product.is_in_stock || isAddingToCart}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span id="quantity-input" className="w-12 text-center text-sm font-bold text-white font-mono">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(maxSelectable, quantity + 1))}
                    disabled={quantity >= maxSelectable || !product.is_in_stock || isAddingToCart}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Primary & Secondary Buttons Row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Add to Cart Button */}
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : tapButton}
                onClick={handleAddToCart}
                disabled={!product.is_in_stock || isAddingToCart || isUpdating}
                className={`flex-1 py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2.5 shadow-xl transition-all duration-200 cursor-pointer focus:outline-none focus:ring-4 focus:ring-blue-400/30 disabled:opacity-50 disabled:cursor-not-allowed ${
                  justAddedToCart
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-emerald-500/30'
                    : product.is_in_stock
                    ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-600/30'
                    : 'bg-slate-800 text-slate-500'
                }`}
              >
                {justAddedToCart ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>Added to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      {product.is_in_stock
                        ? isAddingToCart
                          ? 'Adding...'
                          : `Add ${quantity > 1 ? `(${quantity}) ` : ''}to Cart`
                        : 'Out of Stock'}
                    </span>
                  </>
                )}
              </motion.button>

              {/* Instant Buy Now Button */}
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
                whileTap={shouldReduceMotion ? undefined : tapButton}
                onClick={handleBuyNow}
                disabled={!product.is_in_stock || isAddingToCart || isUpdating}
                className="py-3.5 px-6 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 shadow-lg backdrop-blur-md transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Zap className="w-5 h-5 text-cyan-400" />
                <span>Buy Now</span>
              </motion.button>

              {/* Pulsating Heart Wishlist Button */}
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.08 }}
                whileTap={shouldReduceMotion ? undefined : tapButton}
                animate={heartPulsing && !shouldReduceMotion ? { scale: [1, 1.35, 0.9, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onClick={handleToggleWishlist}
                aria-label={isWishlisted ? 'Remove from wishlist' : 'Save to wishlist'}
                title={isWishlisted ? 'Saved in wishlist' : 'Save to wishlist'}
                className={`p-3.5 rounded-2xl border flex items-center justify-center transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 shadow-md ${
                  isWishlisted
                    ? 'bg-rose-500/15 border-rose-500/50 text-rose-500 shadow-rose-500/20'
                    : 'bg-slate-900/90 border-slate-700/80 text-slate-400 hover:text-white hover:border-slate-600'
                }`}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isWishlisted ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                  }`}
                />
              </motion.button>
            </div>
          </div>

          {/* 3 Frosted Micro-Panels for Guarantees */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80 z-10">
            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Insured Shipping</p>
                <p className="text-[11px] text-slate-400">Free over ₹1,000</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">2-Year Warranty</p>
                <p className="text-[11px] text-slate-400">Official FTS Care</p>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-slate-800/80 flex items-start gap-2.5">
              <RotateCcw className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">30-Day Returns</p>
                <p className="text-[11px] text-slate-400">100% Guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Comprehensive Frosted Glass Exploration Tabs */}
      <section className="mb-16">
        {/* Tab Navigation Pill Bar */}
        <div
          className="flex items-center space-x-2 p-1.5 rounded-2xl fts-glass-card border border-slate-800 max-w-xl mx-auto mb-8 shadow-lg"
          role="tablist"
          aria-label="Product detail tabs"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Overview & Features</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'specs'}
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'specs'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Specifications</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'reviews'}
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none ${
              activeTab === 'reviews'
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reviews ({product.review_count})</span>
          </button>
        </div>

        {/* Tab Panels */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="fts-glass-panel fts-specular-edge rounded-3xl p-6 sm:p-10 border border-slate-700/60 shadow-xl"
              role="tabpanel"
            >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-4 font-display">
              Engineered for the Modern Digital Frontier
            </h3>
            <p className="text-slate-300 leading-relaxed text-sm sm:text-base mb-8 max-w-4xl">
              {product.description} Built with meticulous attention to detail, combining next-generation thermal efficiency, seamless wireless protocols, and an ergonomic chassis crafted for extended daily performance.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl fts-glass-card border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                  <Cpu className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Ultra-Low Latency</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Equipped with high-bandwidth processing architecture for sub-10ms response times.
                </p>
              </div>

              <div className="p-5 rounded-2xl fts-glass-card border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-3">
                  <BatteryCharging className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Rapid Cyber-Charge</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Gain up to 8 hours of battery endurance in just 15 minutes of quick USB-C charging.
                </p>
              </div>

              <div className="p-5 rounded-2xl fts-glass-card border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3">
                  <Wifi className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Seamless Sync</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Multi-point device handoff supports smooth transition between mobile, laptop, and tablet.
                </p>
              </div>

              <div className="p-5 rounded-2xl fts-glass-card border border-slate-800/80">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-white mb-1">Aerospace Durability</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Precision CNC milled frame with anti-scratch coating tested to MIL-STD-810H standards.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tab 2: Technical Specifications */}
        {activeTab === 'specs' && (
          <motion.div
            key="specs"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fts-glass-panel fts-specular-edge rounded-3xl p-6 sm:p-10 border border-slate-700/60 shadow-xl"
            role="tabpanel"
          >
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-6 font-display">
              Technical Specifications
            </h3>

            <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950/40">
              <table className="w-full text-left text-xs sm:text-sm">
                <tbody>
                  <tr className="border-b border-slate-800/80 bg-slate-900/30">
                    <td className="py-3.5 px-5 font-semibold text-slate-400 w-1/3">Brand</td>
                    <td className="py-3.5 px-5 text-white font-medium">Frnds Tech Solution (FTS Labs)</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-3.5 px-5 font-semibold text-slate-400">Model SKU</td>
                    <td className="py-3.5 px-5 font-mono text-cyan-300">{product.sku}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80 bg-slate-900/30">
                    <td className="py-3.5 px-5 font-semibold text-slate-400">Category</td>
                    <td className="py-3.5 px-5 text-white">{product.category?.name || 'Electronics'}</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-3.5 px-5 font-semibold text-slate-400">Connectivity</td>
                    <td className="py-3.5 px-5 text-white">Bluetooth 5.4, Dual-band Wi-Fi 6E, High-Speed USB-C</td>
                  </tr>
                  <tr className="border-b border-slate-800/80 bg-slate-900/30">
                    <td className="py-3.5 px-5 font-semibold text-slate-400">Battery & Charging</td>
                    <td className="py-3.5 px-5 text-white">Up to 40 Hours Endurance, Fast Charge (15 min = 8 hrs)</td>
                  </tr>
                  <tr className="border-b border-slate-800/80">
                    <td className="py-3.5 px-5 font-semibold text-slate-400">Chassis & Materials</td>
                    <td className="py-3.5 px-5 text-white">Anodized Recycled Aluminum, Bio-composite Polycarbonate</td>
                  </tr>
                  <tr className="border-b border-slate-800/80 bg-slate-900/30">
                    <td className="py-3.5 px-5 font-semibold text-slate-400">Warranty Coverage</td>
                    <td className="py-3.5 px-5 text-emerald-400 font-semibold">2-Year Official FTS Warranty & Doorstep Pickup</td>
                  </tr>
                  <tr>
                    <td className="py-3.5 px-5 font-semibold text-slate-400">In The Box</td>
                    <td className="py-3.5 px-5 text-white">1x {product.name}, 1x Braided USB-C Cable, Warranty Card, Quick-Start Guide</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {/* Tab 3: Customer Ratings & Reviews */}
        {activeTab === 'reviews' && (
          <motion.div
            key="reviews"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="fts-glass-panel fts-specular-edge rounded-3xl p-6 sm:p-10 border border-slate-700/60 shadow-xl"
            role="tabpanel"
          >
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-8 pb-8 border-b border-slate-800/80 items-center">
              {/* Score Box */}
              <div className="md:col-span-4 p-6 rounded-2xl fts-glass-card border border-slate-800 text-center">
                <span className="text-5xl font-black text-white font-display">
                  {numericRating.toFixed(1)}
                </span>
                <div className="flex items-center justify-center text-amber-400 gap-1 my-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(numericRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-700 fill-slate-700'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400">
                  Based on {product.review_count} verified buyer ratings
                </p>
              </div>

              {/* Rating Bars */}
              <div className="md:col-span-8 space-y-2">
                {[
                  { star: 5, pct: 82 },
                  { star: 4, pct: 14 },
                  { star: 3, pct: 3 },
                  { star: 2, pct: 1 },
                  { star: 1, pct: 0 },
                ].map((item) => (
                  <div key={item.star} className="flex items-center gap-3 text-xs">
                    <span className="w-12 text-slate-400 font-semibold">{item.star} Stars</span>
                    <div className="flex-1 h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                        style={{ width: `${item.pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-slate-400 font-mono">{item.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Sample Verified Reviews */}
            <div className="space-y-4">
              <div className="p-4 rounded-2xl fts-glass-card border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-600/30 border border-blue-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center">
                      AK
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Anand K.</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">3 days ago</span>
                </div>
                <div className="flex text-amber-400 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  “Outstanding build quality and finish. The glass UI and responsive touch controls feel truly next generation. Arrived in just 2 days with flawless packaging.”
                </p>
              </div>

              <div className="p-4 rounded-2xl fts-glass-card border border-slate-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-cyan-600/30 border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center">
                      PR
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Pooja R.</p>
                      <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Verified Purchase
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-500">1 week ago</span>
                </div>
                <div className="flex text-amber-400 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  “Exceeded all expectations. The battery life lasts through long commute days with ease, and the finish matches my other flagship electronics seamlessly.”
                </p>
              </div>
            </div>
          </motion.div>
        )}
        </AnimatePresence>
      </section>

      {/* 4. Related Products Showcase */}
      {relatedProducts.length > 0 && (
        <section className="pt-8 border-t border-slate-800/80 mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-white font-display">
                More in {product.category?.name || 'this Collection'}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hand-picked complementary cyber gear tested for interoperability.
              </p>
            </div>
            {product.category?.slug && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
              >
                <span>View all</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </section>
      )}
    </PageContainer>
  );
};
