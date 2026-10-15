import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  X,
  PackageOpen,
  ArrowUpDown,
  RotateCcw
} from 'lucide-react';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorMessage } from '../components/common/ErrorMessage';
import { ProductCard } from '../components/products/ProductCard';
import { Pagination } from '../components/common/Pagination';
import { apiClient } from '../services/api';
import { Category, ProductListResponse } from '../types/catalog';
import { usePrefersReducedMotion } from '../motion';

export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const shouldReduceMotion = usePrefersReducedMotion();

  // Extract query parameters from URL
  const selectedCategory = searchParams.get('category') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const sortBy = searchParams.get('sort_by') || 'newest';
  const minPriceParam = searchParams.get('min_price') || '';
  const maxPriceParam = searchParams.get('max_price') || '';
  const inStockOnly = searchParams.get('in_stock_only') === 'true';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = 12;

  // Local state
  const [categories, setCategories] = useState<Category[]>([]);
  const [productsData, setProductsData] = useState<ProductListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Temporary filter inputs
  const [tempSearch, setTempSearch] = useState(searchQuery);
  const [tempMinPrice, setTempMinPrice] = useState(minPriceParam);
  const [tempMaxPrice, setTempMaxPrice] = useState(maxPriceParam);

  // Sync temp search when URL changes
  useEffect(() => {
    setTempSearch(searchQuery);
  }, [searchQuery]);

  // Fetch categories once
  useEffect(() => {
    apiClient.getCategories().then(setCategories).catch(console.error);
  }, []);

  // Fetch products whenever searchParams change
  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await apiClient.getProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery || undefined,
        sort_by: sortBy,
        min_price: minPriceParam ? parseFloat(minPriceParam) : undefined,
        max_price: maxPriceParam ? parseFloat(maxPriceParam) : undefined,
        in_stock_only: inStockOnly || undefined,
        page: currentPage,
        page_size: pageSize,
      });
      setProductsData(data);
    } catch (err: any) {
      console.error('Failed to query products:', err);
      const isConnectionIssue = err?.status === 500 && (err?.message?.includes('failed') || err?.message?.includes('ECONNREFUSED'));
      const friendlyMsg = isConnectionIssue
        ? 'Could not connect to the backend server. Please verify that the backend API is running on http://127.0.0.1:8000.'
        : (err.message || 'Unable to load products. Please try again.');
      setError(friendlyMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, searchQuery, sortBy, minPriceParam, maxPriceParam, inStockOnly, currentPage]);

  // Helper to update URL search parameters
  const updateParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === '' || (key === 'category' && value === 'all')) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    // Reset page to 1 whenever a filter changes (except for page itself)
    if (key !== 'page') {
      next.delete('page');
    }
    setSearchParams(next);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParam('search', tempSearch.trim() || null);
  };

  const handlePriceApply = () => {
    const next = new URLSearchParams(searchParams);
    if (tempMinPrice && !isNaN(Number(tempMinPrice))) {
      next.set('min_price', tempMinPrice);
    } else {
      next.delete('min_price');
    }
    if (tempMaxPrice && !isNaN(Number(tempMaxPrice))) {
      next.set('max_price', tempMaxPrice);
    } else {
      next.delete('max_price');
    }
    next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setTempSearch('');
    setTempMinPrice('');
    setTempMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(
    selectedCategory !== 'all' ||
    searchQuery ||
    minPriceParam ||
    maxPriceParam ||
    inStockOnly ||
    sortBy !== 'newest'
  );

  return (
    <PageContainer
      title="Product Catalogue"
      subtitle="Discover technology, audio gear, apparel, and lifestyle equipment engineered for performance."
    >
      {/* 1. Header Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8 items-stretch md:items-center justify-between">
        {/* Search Input with Form Submit */}
        <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
          <div className="relative flex-1">
            <Input
              value={tempSearch}
              onChange={(e) => setTempSearch(e.target.value)}
              placeholder="Search products by title, description, or keyword..."
              leftIcon={<Search className="w-4 h-4 text-slate-400" />}
              rightIcon={
                tempSearch ? (
                  <button
                    type="button"
                    onClick={() => {
                      setTempSearch('');
                      updateParam('search', null);
                    }}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null
              }
            />
          </div>
          <Button type="submit" variant="primary">
            Search
          </Button>
        </form>

        {/* Sort and Filter Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Sorting Dropdown */}
          <div className="relative flex items-center">
            <label htmlFor="sort-select" className="sr-only">Sort Products</label>
            <div className="relative">
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => updateParam('sort_by', e.target.value)}
                className="appearance-none glass-input text-slate-200 border border-white/10 rounded-xl px-4 py-2.5 pr-9 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="newest" className="bg-slate-900 text-white">Newest Arrivals</option>
                <option value="price-low" className="bg-slate-900 text-white">Price: Low to High</option>
                <option value="price-high" className="bg-slate-900 text-white">Price: High to Low</option>
                <option value="name-asc" className="bg-slate-900 text-white">Name: A to Z</option>
                <option value="name-desc" className="bg-slate-900 text-white">Name: Z to A</option>
                <option value="rating" className="bg-slate-900 text-white">Top Customer Rated</option>
                <option value="featured" className="bg-slate-900 text-white">Featured Picks</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Toggle In Stock Button */}
          <button
            onClick={() => updateParam('in_stock_only', inStockOnly ? null : 'true')}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              inStockOnly
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/40 glass-pill'
                : 'glass-pill text-slate-400 hover:text-slate-200'
            }`}
          >
            In Stock Only
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none" role="tablist" aria-label="Category Filters">
        <button
          onClick={() => updateParam('category', 'all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
            selectedCategory === 'all'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
              : 'glass-pill text-slate-400 hover:text-white hover:border-white/20'
          }`}
          role="tab"
          aria-selected={selectedCategory === 'all'}
        >
          All Departments
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug;
          return (
            <button
              key={cat.id}
              onClick={() => updateParam('category', cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/25 border border-blue-400/30'
                  : 'glass-pill text-slate-400 hover:text-white hover:border-white/20'
              }`}
              role="tab"
              aria-selected={isActive}
            >
              {cat.name} ({cat.item_count})
            </button>
          );
        })}
      </div>

      {/* Price Range Filter Row */}
      <div className="flex flex-wrap items-center gap-2 mb-6 p-2.5 rounded-2xl glass-panel text-xs text-slate-400">
        <span className="font-semibold text-slate-300">Price Range:</span>
        <input
          type="number"
          placeholder="Min ₹"
          min="0"
          value={tempMinPrice}
          onChange={(e) => setTempMinPrice(e.target.value)}
          className="w-24 px-2.5 py-1.5 rounded-xl glass-input text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <span>–</span>
        <input
          type="number"
          placeholder="Max ₹"
          min="0"
          value={tempMaxPrice}
          onChange={(e) => setTempMaxPrice(e.target.value)}
          className="w-24 px-2.5 py-1.5 rounded-xl glass-input text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <Button size="sm" variant="secondary" onClick={handlePriceApply}>
          Filter Price
        </Button>
      </div>

      {/* 3. Active Filters Strip */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mb-6 p-3 rounded-2xl glass-panel">
          <span className="text-xs font-semibold text-slate-400">Active Filters:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Department: {categories.find(c => c.slug === selectedCategory)?.name || selectedCategory}
              <button onClick={() => updateParam('category', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Query: "{searchQuery}"
              <button onClick={() => updateParam('search', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              In Stock Only
              <button onClick={() => updateParam('in_stock_only', null)} className="hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFilters}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 ml-auto flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            Reset all
          </button>
        </div>
      )}

      {/* 4. Products Grid or State Handlers */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-96 rounded-2xl border border-slate-800/80 bg-slate-900/30 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <ErrorMessage
          title="Catalogue Query Error"
          message={error}
          onRetry={fetchProducts}
          className="my-8"
        />
      ) : !productsData || productsData.items.length === 0 ? (
        <EmptyState
          icon={<PackageOpen className="w-8 h-8 text-indigo-400" />}
          title="No products found"
          description="We couldn't find any items matching your active criteria. Try broadening your keywords or removing active filters."
          action={
            <Button variant="primary" size="sm" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: shouldReduceMotion ? 0.15 : 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {productsData.items.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: shouldReduceMotion ? 0.15 : 0.3,
                  delay: shouldReduceMotion ? 0 : Math.min(idx * 0.04, 0.4),
                }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </motion.div>

          {/* 5. Pagination Controls */}
          <Pagination
            currentPage={productsData.page}
            totalPages={productsData.total_pages}
            totalItems={productsData.total}
            pageSize={productsData.page_size}
            onPageChange={(p) => updateParam('page', p.toString())}
            className="mt-8"
          />
        </>
      )}
    </PageContainer>
  );
};
