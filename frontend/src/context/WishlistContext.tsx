import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Product } from '../types/catalog';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: Product[];
  wishlistCount: number;
  isInWishlist: (productId: string) => boolean;
  toggleWishlist: (product: Product) => void;
  removeFromWishlist: (productId: string) => void;
  clearWishlist: () => void;
}

const GUEST_STORAGE_KEY = 'fts_store_wishlist_guest';

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;

  const getStorageKey = useCallback((): string => {
    return isAuthenticated && userId ? `fts_store_wishlist_${userId}` : GUEST_STORAGE_KEY;
  }, [isAuthenticated, userId]);

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      // Check guest or initial key
      const initialKey = GUEST_STORAGE_KEY;
      const stored = localStorage.getItem(initialKey) || localStorage.getItem('fts_store_wishlist');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse initial stored wishlist:', e);
    }
    return [];
  });

  const prevUserIdRef = useRef<string | undefined>(undefined);

  // Sync / Merge on Authentication Transition (Guest -> Customer login)
  useEffect(() => {
    const currentStorageKey = getStorageKey();

    if (isAuthenticated && userId && prevUserIdRef.current !== userId) {
      try {
        // 1. Load user's previously saved wishlist
        const userStoredJson = localStorage.getItem(currentStorageKey);
        const userWishlist: Product[] = userStoredJson ? JSON.parse(userStoredJson) : [];

        // 2. Merge guest items into user wishlist without duplicates
        const mergedMap = new Map<string, Product>();
        for (const item of userWishlist) {
          mergedMap.set(item.id, item);
        }
        for (const item of wishlist) {
          mergedMap.set(item.id, item);
        }

        const merged = Array.from(mergedMap.values());
        setWishlist(merged);
        localStorage.setItem(currentStorageKey, JSON.stringify(merged));
      } catch (err) {
        console.warn('Failed to merge guest wishlist on customer login:', err);
      }
    } else if (!isAuthenticated && prevUserIdRef.current !== undefined) {
      // User logged out: Load guest wishlist
      try {
        const guestJson = localStorage.getItem(GUEST_STORAGE_KEY);
        setWishlist(guestJson ? JSON.parse(guestJson) : []);
      } catch {
        setWishlist([]);
      }
    }

    prevUserIdRef.current = userId;
  }, [isAuthenticated, userId, getStorageKey]);

  // Persist wishlist whenever it changes
  useEffect(() => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(wishlist));
      // Backward compatibility mirror
      localStorage.setItem('fts_store_wishlist', JSON.stringify(wishlist));
    } catch (e) {
      console.warn('Failed to save wishlist to localStorage:', e);
    }
  }, [wishlist, getStorageKey]);

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      return wishlist.some((item) => item.id === productId || item.slug === productId);
    },
    [wishlist]
  );

  const toggleWishlist = useCallback((product: Product) => {
    setWishlist((prev) => {
      const exists = prev.some((item) => item.id === product.id || item.slug === product.slug);
      if (exists) {
        return prev.filter((item) => item.id !== product.id && item.slug !== product.slug);
      } else {
        return [...prev, product];
      }
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlist((prev) => prev.filter((item) => item.id !== productId && item.slug !== productId));
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlist([]);
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        wishlistCount: wishlist.length,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        clearWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = (): WishlistContextType => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
