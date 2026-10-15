import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  ChevronRight,
  Star,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Plus,
  Minus,
  ShoppingCart,
  Zap,
  Shield,
  Truck,
  ArrowLeft,
  Heart
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
  const [error, setError] = useState<string | null>(null);
  const [heartPulsing, setHeartPulsing] = useState(false);

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
      colors: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'],
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
    const success = await addItem(product.id, quantity);
    setIsAddingToCart(false);
    if (success) {
      fireBurstConfetti();
      navigate('/cart');
    }
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-pulse my-8">
          <div className="aspect-square rounded-3xl bg-slate-900/40 border border-slate-800" />
          <div className="space-y-6">
            <div className="h-6 w-32 bg-slate-800 rounded-lg" />
            <div className="h-10 w-3/4 bg-slate-800 rounded-lg" />
            <div className="h-8 w-48 bg-slate-800 rounded-lg" />
            <div className="h-24 w-full bg-slate-800 rounded-lg" />
            <div className="h-12 w-48 bg-slate-800 rounded-xl" />
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

  const maxSelectable = Math.min(product.stock_quantity, 10);
  const numericRating = typeof product.rating === 'number' ? product.rating : parseFloat(product.rating || '5.0');

  return (
    <PageContainer>

      {/* 1. Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-slate-400 mb-8 overflow-x-auto whitespace-nowrap">
        <Link to="/" className="hover:text-white transition-colors">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <Link to="/products" className="hover:text-white transition-colors">
          Products
        </Link>
        {product.category && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
            <Link
              to={`/products?category=${product.category.slug}`}
              className="hover:text-white transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
        <span className="text-slate-200 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* 2. Main Product Hero (Gallery + Purchase Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 mb-16">
        {/* Gallery Column */}
        <div>
          <ProductImageGallery
            images={product.images}
            productName={product.name}
            categorySlug={product.category?.slug}
            badge={product.badge}
            discountPct={product.discount_pct}
          />
        </div>

        {/* Purchase Info Column */}
        <div className="flex flex-col">
          {/* Category Chip & SKU */}
          <div className="flex items-center justify-between gap-4 mb-3">
            {product.category && (
              <Link
                to={`/products?category=${product.category.slug}`}
                className="text-xs font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                {product.category.name}
              </Link>
            )}
            <span className="text-xs font-mono text-slate-500">
              SKU: {product.sku}
            </span>
          </div>

          {/* Product Title */}
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight mb-4 font-display">
            {product.name}
          </h1>

          {/* Rating & Review Metric */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="flex items-center text-amber-400">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-bold text-slate-200 ml-1.5">
                {numericRating.toFixed(1)}
              </span>
            </div>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">
              {product.review_count} Customer {product.review_count === 1 ? 'Rating' : 'Ratings'}
            </span>
          </div>

          {/* Price & Discount Display */}
          <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/40 mb-6 flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-black text-white">
              {formatPrice(product.price)}
            </span>
            {product.compare_at_price && Number(product.compare_at_price) > Number(product.price) && (
              <span className="text-sm sm:text-base text-slate-500 line-through">
                {formatPrice(product.compare_at_price)}
              </span>
            )}
            {product.discount_pct && product.discount_pct > 0 ? (
              <span className="ml-auto px-2.5 py-1 rounded-full text-xs font-extrabold bg-rose-500 text-white">
                Save {product.discount_pct}%
              </span>
            ) : null}
          </div>

          {/* Stock Availability */}
          <div className="mb-6">
            {product.stock_status === 'out_of_stock' || !product.is_in_stock ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <XCircle className="w-4 h-4" />
                Currently Out of Stock
              </div>
            ) : product.stock_status === 'low_stock' || product.stock_quantity <= 5 ? (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <AlertTriangle className="w-4 h-4" />
                Low Stock — Only {product.stock_quantity} units remaining
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                In Stock & Ready to Ship
              </div>
            )}
          </div>

          {/* Description */}
          <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed mb-8">
            <p>{product.description}</p>
          </div>

          {/* Quantity Selector & Action CTA */}
          <div className="pt-6 border-t border-slate-800/80 mt-auto space-y-4">
            <div className="flex items-center gap-4">
              <label htmlFor="quantity-input" className="text-xs font-semibold text-slate-400">
                Quantity:
              </label>
              <div className="flex items-center border border-slate-800 rounded-xl bg-slate-900/60 p-1">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1 || !product.is_in_stock}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Decrease quantity"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span id="quantity-input" className="w-10 text-center text-sm font-bold text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(maxSelectable, quantity + 1))}
                  disabled={quantity >= maxSelectable || !product.is_in_stock}
                  className="p-1.5 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  aria-label="Increase quantity"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="primary"
                size="lg"
                className="flex-1"
                leftIcon={<ShoppingCart className="w-5 h-5" />}
                onClick={handleAddToCart}
                isLoading={isAddingToCart}
                disabled={!product.is_in_stock || isUpdating}
              >
                {product.is_in_stock ? 'Add to Shopping Cart' : 'Out of Stock'}
              </Button>
              <Button
                variant="secondary"
                size="lg"
                leftIcon={<Zap className="w-5 h-5 text-indigo-400" />}
                onClick={handleBuyNow}
                disabled={!product.is_in_stock || isAddingToCart || isUpdating}
              >
                Buy Now
              </Button>

              {/* Wishlist Button with Animated Heart Pulse */}
              <motion.button
                type="button"
                whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? undefined : tapButton}
                animate={heartPulsing && !shouldReduceMotion ? { scale: [1, 1.35, 0.9, 1] } : { scale: 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                onClick={handleToggleWishlist}
                aria-label={isInWishlist(product.id) ? 'Remove from wishlist' : 'Save to wishlist'}
                title={isInWishlist(product.id) ? 'Saved in wishlist' : 'Save to wishlist'}
                className={`p-3.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-rose-400 ${
                  isInWishlist(product.id)
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-500'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isInWishlist(product.id) ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
                  }`}
                />
              </motion.button>
            </div>
          </div>

          {/* Delivery & Warranty Guarantees */}
          <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Truck className="w-4 h-4 text-indigo-400 flex-shrink-0" />
              <span>Complimentary insured shipping over ₹1,000</span>
            </div>
            <div className="flex items-center space-x-2 text-xs text-slate-400">
              <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>Full manufacturer warranty included</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Related Products Section */}
      {relatedProducts.length > 0 && (
        <section className="pt-12 border-t border-slate-800">
          <h2 className="text-2xl font-extrabold text-white mb-6 font-display">
            More in {product.category?.name || 'this Collection'}
          </h2>
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
