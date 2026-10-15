/**
 * NovaMart Reactive Cart Store
 * Handles localStorage persistence, quantity manipulation, and discount coupons.
 */

const STORAGE_KEY = "novamart_cart_state_v1";

class CartStore {
  constructor() {
    this.listeners = [];
    this.state = this._loadFromStorage();
  }

  _loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          items: Array.isArray(parsed.items) ? parsed.items : [],
          coupon: parsed.coupon || null
        };
      }
    } catch (e) {
      console.error("Failed to parse cart storage:", e);
    }
    return { items: [], coupon: null };
  }

  _saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error("Failed to save cart to storage:", e);
    }
    this._notify();
  }

  _notify() {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (e) {
        console.error("Cart listener error:", e);
      }
    }
  }

  subscribe(listener) {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getItems() {
    return this.state.items;
  }

  getCoupon() {
    return this.state.coupon;
  }

  getItemCount() {
    return this.state.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  addItem(productId, quantity = 1) {
    const existing = this.state.items.find(i => i.id === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.state.items.push({ id: productId, quantity });
    }
    this._saveToStorage();
  }

  updateQuantity(productId, quantity) {
    if (quantity <= 0) {
      this.removeItem(productId);
      return;
    }
    const target = this.state.items.find(i => i.id === productId);
    if (target) {
      target.quantity = quantity;
      this._saveToStorage();
    }
  }

  removeItem(productId) {
    this.state.items = this.state.items.filter(i => i.id !== productId);
    this._saveToStorage();
  }

  applyCoupon(couponCode) {
    this.state.coupon = couponCode.trim().toUpperCase();
    this._saveToStorage();
  }

  removeCoupon() {
    this.state.coupon = null;
    this._saveToStorage();
  }

  clear() {
    this.state.items = [];
    this.state.coupon = null;
    this._saveToStorage();
  }
}

export const cart = new CartStore();
