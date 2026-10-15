import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { CartItem, CartResponse } from '../types/cart';
import { apiClient, ApiError } from '../services/api';

export interface CartNotification {
  id: string;
  message: string;
  type: 'success' | 'error';
  productName?: string;
  quantity?: number;
}

interface CartContextValue {
  cart: CartResponse;
  items: CartItem[];
  totalItemsCount: number;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
  isDrawerOpen: boolean;
  notification: CartNotification | null;
  dismissNotification: () => void;
  showNotification: (message: string, type?: 'success' | 'error', productName?: string, quantity?: number) => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, quantity?: number, productName?: string) => Promise<boolean>;
  updateQuantity: (itemIdOrProductId: string, quantity: number) => Promise<boolean>;
  removeItem: (itemIdOrProductId: string) => Promise<boolean>;
  clearCart: () => Promise<boolean>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<boolean>;
  refreshCart: () => Promise<void>;
}

const DEFAULT_CART: CartResponse = {
  items: [],
  subtotal: 0,
  discount_amount: 0,
  coupon_code: null,
  discount_description: null,
  tax_rate: 0.08,
  tax_amount: 0,
  shipping_fee: 0,
  is_free_shipping: false,
  free_shipping_threshold: 100,
  amount_needed_for_free_shipping: 100,
  total: 0,
  item_count: 0,
  unique_item_count: 0,
};

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartResponse>(() => {
    // Attempt local hydration of cached cart count
    try {
      const cached = localStorage.getItem('fts_cart_preview');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Ignore cache read failures
    }
    return DEFAULT_CART;
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [notification, setNotification] = useState<CartNotification | null>(null);
  const notificationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismissNotification = useCallback(() => {
    if (notificationTimerRef.current) {
      clearTimeout(notificationTimerRef.current);
      notificationTimerRef.current = null;
    }
    setNotification(null);
  }, []);

  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' = 'success', productName?: string, quantity?: number) => {
      const notif: CartNotification = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        message,
        type,
        productName,
        quantity,
      };
      setNotification(notif);
      if (notificationTimerRef.current) {
        clearTimeout(notificationTimerRef.current);
      }
      notificationTimerRef.current = setTimeout(() => {
        setNotification(null);
        notificationTimerRef.current = null;
      }, 4000);
    },
    []
  );

  // Sync to localStorage preview
  useEffect(() => {
    try {
      localStorage.setItem('fts_cart_preview', JSON.stringify(cart));
    } catch {
      // Ignore cache write failures
    }
  }, [cart]);

  // Initial authoritative cart fetch
  const refreshCart = useCallback(async () => {
    try {
      const freshCart = await apiClient.getCart();
      setCart(freshCart);
      setError(null);
    } catch (err: any) {
      console.warn('Failed to load initial cart state:', err);
      // Keep existing preview
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);

  const addItem = async (productId: string, quantity: number = 1, productName?: string): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const updatedCart = await apiClient.addToCart(productId, quantity);
      setCart(updatedCart);
      const displayName = productName ? `"${productName}"` : `item${quantity > 1 ? 's' : ''}`;
      showNotification(`Added ${quantity} × ${displayName} to your cart!`, 'success', productName, quantity);
      openDrawer();
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Could not add item to cart.';
      setError(msg);
      showNotification(msg, 'error', productName, quantity);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const updateQuantity = async (itemIdOrProductId: string, quantity: number): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const updatedCart = await apiClient.updateCartItem(itemIdOrProductId, quantity);
      setCart(updatedCart);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Could not update item quantity.';
      setError(msg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const removeItem = async (itemIdOrProductId: string): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const updatedCart = await apiClient.removeCartItem(itemIdOrProductId);
      setCart(updatedCart);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Could not remove item from cart.';
      setError(msg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const clearCart = async (): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const emptyCart = await apiClient.clearCart();
      setCart(emptyCart);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Could not clear cart.';
      setError(msg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const applyCoupon = async (code: string): Promise<{ success: boolean; message?: string }> => {
    setIsUpdating(true);
    setError(null);
    try {
      const updatedCart = await apiClient.applyCoupon(code);
      setCart(updatedCart);
      return { success: true, message: updatedCart.discount_description || 'Coupon applied successfully!' };
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Invalid or expired coupon code.';
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setIsUpdating(false);
    }
  };

  const removeCoupon = async (): Promise<boolean> => {
    setIsUpdating(true);
    setError(null);
    try {
      const updatedCart = await apiClient.removeCoupon();
      setCart(updatedCart);
      return true;
    } catch (err: any) {
      const msg = err instanceof ApiError ? err.message : 'Could not remove coupon.';
      setError(msg);
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  const value: CartContextValue = {
    cart,
    items: cart.items || [],
    totalItemsCount: cart.item_count || 0,
    isLoading,
    isUpdating,
    error,
    isDrawerOpen,
    notification,
    dismissNotification,
    showNotification,
    openDrawer,
    closeDrawer,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextValue => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
