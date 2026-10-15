import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ShoppingBag,
  Menu,
  X,
  Shield,
  User,
  ShoppingCart,
  LogOut,
  Heart,
  Search,
  ChevronDown,
  TrendingUp,
  Laptop,
  Smartphone,
  Headphones,
  Gamepad2,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MOTION_DURATIONS,
  MOTION_EASINGS,
  MOTION_SPRINGS,
  MOTION_STAGGERS,
  usePrefersReducedMotion,
  hoverLift,
  hoverScale,
  tapFeedback,
  tapButton,
  staggerContainer,
  staggerItem
} from '../../motion';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';

const SEARCH_CATEGORIES = [
  { label: 'All Departments', value: 'all' },
  { label: 'Laptops', value: 'laptops' },
  { label: 'Mobiles', value: 'mobiles' },
  { label: 'Smart Devices', value: 'smart-devices' },
  { label: 'Audio', value: 'audio' },
  { label: 'Accessories', value: 'accessories' },
  { label: 'Gaming', value: 'gaming' },
];

const QUICK_SEARCH_TAGS = [
  'OLED Laptops',
  '5G Smartphones',
  'ANC Earbuds',
  'Gaming Consoles',
  'Smartwatches',
];

const QUICK_CATEGORIES = [
  { name: 'Laptops', slug: 'laptops', icon: Laptop },
  { name: 'Mobiles', slug: 'mobiles', icon: Smartphone },
  { name: 'Audio Gear', slug: 'audio', icon: Headphones },
  { name: 'Gaming', slug: 'gaming', icon: Gamepad2 },
];

export const Navbar: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(false);
  
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { totalItemsCount, openDrawer } = useCart();
  const { wishlistCount } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync search input if URL already has search query
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const q = params.get('search');
    if (q) setSearchTerm(q);
    const cat = params.get('category');
    if (cat) setSelectedCategory(cat);
  }, [location.search]);

  // Click outside to dismiss floating search panel
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchPanelOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchPanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const executeSearch = (query: string, category: string = selectedCategory) => {
    const cleanQuery = query.trim();
    const params = new URLSearchParams();

    if (cleanQuery) {
      params.set('search', cleanQuery);
    }
    if (category && category !== 'all') {
      params.set('category', category);
    }

    const targetUrl = params.toString() ? `/products?${params.toString()}` : '/products';
    navigate(targetUrl);
    setIsSearchPanelOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchTerm, selectedCategory);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
  };

  const handleTagClick = (tag: string) => {
    setSearchTerm(tag);
    executeSearch(tag, selectedCategory);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 fts-specular-edge ${
      isScrolled 
        ? 'fts-glass-nav bg-slate-950/85 backdrop-blur-2xl border-b border-cyan-400/20 shadow-2xl shadow-blue-950/35' 
        : 'fts-glass-nav bg-slate-950/55 backdrop-blur-xl border-b border-white/10 shadow-lg'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4 sm:gap-6">
          
          {/* ================================================================
              1. Brand Logo Emblem with Staggered Entrance
              ================================================================ */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: MOTION_DURATIONS.normal, ease: MOTION_EASINGS.easeOut }}
            className="flex-shrink-0"
          >
            <Link to="/" className="flex items-center space-x-2.5 sm:space-x-3 group">
              <motion.div
                whileHover={shouldReduceMotion ? undefined : { scale: 1.08, rotate: [0, -3, 3, 0] }}
                whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
                className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-cyan-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25 border border-cyan-400/30"
              >
                <ShoppingBag className="w-5 h-5 text-white" />
              </motion.div>
              <div className="flex flex-col">
                <span className="font-display text-xl sm:text-2xl font-extrabold tracking-tight text-white leading-tight">
                  FTS <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-indigo-300 bg-clip-text text-transparent">Store</span>
                </span>
                <span className="text-[10px] font-bold text-cyan-400/80 tracking-wider uppercase -mt-0.5">
                  Electronics & Tech
                </span>
              </div>
            </Link>
          </motion.div>

          {/* ================================================================
              2. Central Universal Search Bar with Floating Glass Panel
              ================================================================ */}
          <div ref={searchContainerRef} className="hidden md:flex flex-1 max-w-2xl mx-2 relative">
            <motion.form
              initial={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: MOTION_DURATIONS.normal, delay: 0.08, ease: MOTION_EASINGS.easeOut }}
              onSubmit={handleSearchSubmit}
              id="global-header-search-form"
              className={`flex items-center w-full fts-glass-input rounded-2xl transition-all duration-300 shadow-sm overflow-hidden ${
                isSearchPanelOpen
                  ? 'border-cyan-400/60 ring-2 ring-cyan-500/30 shadow-fts-glow-cyan bg-slate-950/80'
                  : 'hover:border-cyan-400/40 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-500/30'
              }`}
            >
              {/* Category Dropdown Prefix */}
              <div className="relative border-r border-white/10 flex items-center bg-white/[0.03]">
                <select
                  id="search-category-select"
                  aria-label="Filter search by department"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none pl-3 pr-7 py-2.5 bg-transparent text-xs font-semibold text-slate-300 focus:outline-none cursor-pointer hover:text-white"
                >
                  {SEARCH_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value} className="bg-slate-900 text-white">
                      {cat.label}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 pointer-events-none" />
              </div>

              {/* Keyword Search Input */}
              <div className="relative flex-1 flex items-center">
                <input
                  id="global-header-search-input"
                  type="text"
                  value={searchTerm}
                  onFocus={() => setIsSearchPanelOpen(true)}
                  onClick={() => setIsSearchPanelOpen(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    if (!isSearchPanelOpen) setIsSearchPanelOpen(true);
                  }}
                  placeholder="Search laptops, smartphones, headphones, gadgets..."
                  className="w-full px-3.5 py-2.5 bg-transparent text-xs sm:text-sm text-white placeholder:text-slate-400 focus:outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="p-1 mr-1 text-slate-400 hover:text-white rounded-md transition-colors cursor-pointer"
                    aria-label="Clear search input"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Search Submit Button */}
              <motion.button
                whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }}
                whileTap={shouldReduceMotion ? undefined : tapButton}
                type="submit"
                id="global-header-search-submit"
                aria-label="Submit search query"
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white transition-all flex items-center justify-center cursor-pointer flex-shrink-0 shadow-sm"
              >
                <Search className="w-4 h-4" />
              </motion.button>
            </motion.form>

            {/* Floating Frosted Glass Search Panel */}
            <AnimatePresence>
              {isSearchPanelOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.98 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  id="floating-search-suggestions"
                  className="absolute top-full left-0 right-0 mt-2 p-4 rounded-2xl fts-glass-panel border border-cyan-400/25 bg-slate-950/90 shadow-2xl backdrop-blur-2xl z-50 text-left overflow-hidden"
                >
                  <div className="fts-specular-edge" />

                  {/* Popular Searches */}
                  <div className="mb-4">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400 uppercase tracking-wider mb-2">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Trending Searches</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_SEARCH_TAGS.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagClick(tag)}
                          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-white/5 hover:bg-cyan-500/15 border border-white/10 hover:border-cyan-400/30 transition-all cursor-pointer"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Quick Category Shortcuts */}
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                      <span>Quick Department Access</span>
                      <Link
                        to="/products"
                        onClick={() => setIsSearchPanelOpen(false)}
                        className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[11px]"
                      >
                        All Categories <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {QUICK_CATEGORIES.map((cat) => {
                        const Icon = cat.icon;
                        return (
                          <button
                            key={cat.slug}
                            type="button"
                            onClick={() => executeSearch('', cat.slug)}
                            className="flex flex-col items-center p-2 rounded-xl bg-white/[0.03] hover:bg-cyan-500/10 border border-white/10 hover:border-cyan-400/30 transition-all text-center group cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-400 group-hover:text-cyan-400 flex items-center justify-center mb-1">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white">
                              {cat.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ================================================================
              3. Action Group: Admin, Wishlist, Cart, Profile with Glass Badges
              ================================================================ */}
          <motion.div
            initial={{ opacity: 0, x: shouldReduceMotion ? 0 : 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: MOTION_DURATIONS.normal, delay: 0.14, ease: MOTION_EASINGS.easeOut }}
            className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0"
          >
            {isAdmin && (
              <motion.div whileHover={shouldReduceMotion ? undefined : hoverScale} whileTap={shouldReduceMotion ? undefined : tapFeedback}>
                <Link
                  to="/admin"
                  id="navbar-admin-button"
                  className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/40 border border-purple-800/50 hover:bg-purple-900/50 transition-colors"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  <span>Admin</span>
                </Link>
              </motion.div>
            )}

            {/* Wishlist Button with Reactive Pill Counter & Micro-Interactions */}
            <motion.div whileHover={shouldReduceMotion ? undefined : hoverLift} whileTap={shouldReduceMotion ? undefined : tapFeedback}>
              <Link
                to="/products"
                id="navbar-wishlist-button"
                className="relative p-2.5 rounded-xl text-slate-300 hover:text-white fts-glass-badge hover:border-cyan-400/40 transition-all group block shadow-sm"
                aria-label={`Saved Wishlist with ${wishlistCount} items`}
                title="Saved Wishlist"
              >
                <Heart className={`w-5 h-5 transition-transform group-hover:scale-110 ${wishlistCount > 0 ? 'text-rose-400 fill-rose-500/20' : 'text-slate-300'}`} />
                {wishlistCount > 0 && (
                  <motion.span
                    key={wishlistCount}
                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.4, y: -4 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { scale: [0.4, 1.25, 1], y: 0 }}
                    transition={MOTION_SPRINGS.snappy}
                    id="nav-wishlist-badge"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-rose-500/40 ring-2 ring-slate-950 pointer-events-none"
                  >
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </motion.span>
                )}
              </Link>
            </motion.div>

            {/* Shopping Cart Button with Reactive Pill Counter & Micro-Interactions */}
            <motion.div whileHover={shouldReduceMotion ? undefined : hoverLift} whileTap={shouldReduceMotion ? undefined : tapFeedback}>
              <button
                onClick={openDrawer}
                id="navbar-cart-button"
                className="relative p-2.5 rounded-xl text-slate-300 hover:text-white fts-glass-badge hover:border-cyan-400/40 transition-all group cursor-pointer shadow-sm"
                aria-label={`Shopping Cart with ${totalItemsCount} items`}
                title="Open Shopping Cart"
              >
                <ShoppingCart className="w-5 h-5 transition-transform group-hover:scale-110 text-cyan-400" />
                {totalItemsCount > 0 && (
                  <motion.span
                    key={totalItemsCount}
                    initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.4, y: -4 }}
                    animate={shouldReduceMotion ? { opacity: 1 } : { scale: [0.4, 1.25, 1], y: 0 }}
                    transition={MOTION_SPRINGS.snappy}
                    id="nav-cart-badge"
                    className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-md shadow-cyan-500/40 ring-2 ring-slate-950 pointer-events-none"
                  >
                    {totalItemsCount > 99 ? '99+' : totalItemsCount}
                  </motion.span>
                )}
              </button>
            </motion.div>

            {/* Customer Account / Sign In with Tactile Feedback */}
            {isAuthenticated && user ? (
              <div className="hidden sm:flex items-center gap-2">
                <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }} whileTap={shouldReduceMotion ? undefined : tapFeedback}>
                  <Link
                    to="/profile"
                    id="navbar-user-profile-button"
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-white/10 hover:border-cyan-400/30 transition-all max-w-[150px]"
                  >
                    <div className="w-5 h-5 rounded-md bg-gradient-to-tr from-blue-600 to-cyan-500 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0 shadow-sm">
                      {user.full_name[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="truncate">{user.full_name.split(' ')[0]}</span>
                  </Link>
                </motion.div>

                <motion.button
                  whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
                  whileTap={shouldReduceMotion ? undefined : tapFeedback}
                  onClick={() => logout()}
                  id="navbar-logout-button"
                  title="Sign Out"
                  aria-label="Sign Out"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </motion.button>
              </div>
            ) : (
              <motion.div whileHover={shouldReduceMotion ? undefined : { scale: 1.04 }} whileTap={shouldReduceMotion ? undefined : tapButton}>
                <Link
                  to="/login"
                  id="navbar-signin-button"
                  className="hidden sm:flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md shadow-blue-500/25 transition-all border border-cyan-400/30"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
              </motion.div>
            )}

            {/* Mobile Hamburger Menu Toggle with Tap Animation */}
            <motion.button
              whileHover={shouldReduceMotion ? undefined : { scale: 1.06 }}
              whileTap={shouldReduceMotion ? undefined : tapFeedback}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              id="navbar-mobile-menu-toggle"
              className="p-2 md:hidden rounded-xl text-slate-300 hover:text-white fts-glass-badge border border-white/15 transition-colors cursor-pointer"
              aria-expanded={isMobileMenuOpen}
              aria-label={isMobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
            </motion.button>
          </motion.div>

        </div>

        {/* Mobile Search Bar Row (When on screen < 768px) */}
        <div className="md:hidden pb-3">
          <form onSubmit={handleSearchSubmit} className="flex items-center fts-glass-input rounded-xl overflow-hidden transition-all border border-white/15 focus-within:border-cyan-400">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tech, phones, laptops..."
              className="flex-1 px-3 py-2 bg-transparent text-xs text-white placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-center cursor-pointer"
              aria-label="Submit search"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>

      {/* ====================================================================
          Mobile Drawer Navigation Menu with Spring Physics & Stagger
          ==================================================================== */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: shouldReduceMotion ? 0 : -8 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: shouldReduceMotion ? 0 : -8 }}
            transition={MOTION_SPRINGS.smooth}
            className="md:hidden border-t border-cyan-400/20 fts-glass-panel px-4 pt-3 pb-6 space-y-3 overflow-hidden shadow-2xl bg-slate-950/95 backdrop-blur-2xl"
          >
            <motion.div
              variants={staggerContainer(MOTION_STAGGERS.tight, 0.02)}
              initial="initial"
              animate="animate"
              className="space-y-1"
            >
              <motion.div variants={staggerItem}>
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Storefront Home
                </Link>
              </motion.div>
              <motion.div variants={staggerItem}>
                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Browse All Products
                </Link>
              </motion.div>
              <motion.div variants={staggerItem}>
                <Link
                  to="/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-xl text-xs font-semibold text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                >
                  My Orders & History
                </Link>
              </motion.div>
              {isAdmin && (
                <motion.div variants={staggerItem}>
                  <Link
                    to="/admin"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block px-3 py-2.5 rounded-xl text-xs font-semibold text-purple-300 bg-purple-950/40 border border-purple-800/40"
                  >
                    Admin Control Center
                  </Link>
                </motion.div>
              )}
            </motion.div>

            <div className="pt-3 border-t border-white/10">
              {isAuthenticated && user ? (
                <div className="space-y-2">
                  <Link
                    to="/profile"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-white"
                  >
                    <User className="w-4 h-4 text-cyan-400" />
                    <span>{user.full_name} ({user.email})</span>
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-rose-400 hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-md transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span>Sign In or Register</span>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
