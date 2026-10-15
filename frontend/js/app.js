/**
 * NovaMart Main Application Entrypoint
 * Coordinates state, API queries, UI updates, and customer flows.
 */

import { API } from "./api.js";
import { cart } from "./cart.js";
import { UI } from "./ui.js";

const state = {
  activeCategory: "all",
  searchQuery: "",
  sortBy: "featured",
  categories: [],
  products: []
};

let searchDebounceTimer = null;

async function checkApiConnection() {
  const isLive = await API.checkHealth();
  const badge = document.getElementById("api-status-badge");
  const label = document.getElementById("api-status-text");
  if (badge && label) {
    if (isLive) {
      badge.className = "api-status-badge";
      label.textContent = "FastAPI Connected";
    } else {
      badge.className = "api-status-badge demo-mode";
      label.textContent = "Demo Mode (API Offline)";
    }
  }
}

async function loadProducts() {
  const products = await API.getProducts({
    category: state.activeCategory,
    search: state.searchQuery,
    sort_by: state.sortBy
  });
  state.products = products;
  UI.renderProducts(products, handleQuickView, handleAddToCart);
}

function handleQuickView(productId) {
  const prod = state.products.find(p => p.id === productId);
  if (prod) {
    UI.showQuickView(prod, (id, qty) => {
      cart.addItem(id, qty);
      UI.showToast(`Added ${qty} item(s) to your cart!`, "success");
    });
  }
}

function handleAddToCart(productId, qty = 1) {
  const prod = state.products.find(p => p.id === productId);
  cart.addItem(productId, qty);
  UI.showToast(`Added "${prod ? prod.name : "item"}" to cart!`, "success");
}

async function init() {
  UI.initTheme();

  // Check backend connectivity
  await checkApiConnection();
  setInterval(checkApiConnection, 8000);

  // Load and render categories
  state.categories = await API.getCategories();
  UI.renderCategories(state.categories, state.activeCategory, async slug => {
    state.activeCategory = slug;
    UI.renderCategories(state.categories, state.activeCategory, () => {});
    await loadProducts();
  });

  // Load products
  await loadProducts();

  // Subscribe cart changes to update UI
  cart.subscribe(() => {
    UI.updateCartUI();
  });

  // Search input listeners
  const searchInput = document.getElementById("header-search-input");
  const searchClear = document.getElementById("header-search-clear");

  if (searchInput) {
    searchInput.addEventListener("input", e => {
      const val = e.target.value;
      if (searchClear) {
        searchClear.classList.toggle("active", val.length > 0);
      }
      clearTimeout(searchDebounceTimer);
      searchDebounceTimer = setTimeout(async () => {
        state.searchQuery = val;
        await loadProducts();
      }, 250);
    });
  }

  if (searchClear) {
    searchClear.addEventListener("click", async () => {
      if (searchInput) searchInput.value = "";
      searchClear.classList.remove("active");
      state.searchQuery = "";
      await loadProducts();
    });
  }

  // Sort dropdown listener
  const sortSelect = document.getElementById("sort-select");
  if (sortSelect) {
    sortSelect.addEventListener("change", async e => {
      state.sortBy = e.target.value;
      await loadProducts();
    });
  }

  // Cart Drawer open/close triggers
  document.getElementById("cart-open-btn")?.addEventListener("click", () => {
    UI.openCartDrawer();
  });
  document.getElementById("cart-drawer-close")?.addEventListener("click", () => {
    UI.closeCartDrawer();
  });
  document.getElementById("drawer-backdrop")?.addEventListener("click", () => {
    UI.closeCartDrawer();
  });

  // Coupon form submit
  document.getElementById("apply-coupon-btn")?.addEventListener("click", async () => {
    const input = document.getElementById("coupon-code-input");
    if (!input || !input.value.trim()) return;

    const res = await API.validateCoupon(input.value.trim());
    if (res.valid) {
      cart.applyCoupon(res.code);
      UI.showToast(res.message, "success");
      input.value = "";
    } else {
      UI.showToast(res.message, "error");
    }
  });

  // Proceed to Checkout button
  document.getElementById("cart-checkout-btn")?.addEventListener("click", () => {
    UI.openCheckoutModal();
  });
  document.getElementById("checkout-modal-close")?.addEventListener("click", () => {
    UI.closeCheckoutModal();
  });
  document.getElementById("quick-view-close")?.addEventListener("click", () => {
    const qvModal = document.getElementById("quick-view-modal");
    if (qvModal) {
      qvModal.classList.remove("active");
      document.body.style.overflow = "";
    }
  });

  // Payment method selection cards
  let selectedPayment = "card";
  document.querySelectorAll(".payment-method-card").forEach(cardEl => {
    cardEl.addEventListener("click", () => {
      document.querySelectorAll(".payment-method-card").forEach(c => c.classList.remove("selected"));
      cardEl.classList.add("selected");
      selectedPayment = cardEl.getAttribute("data-method");
    });
  });

  // Checkout form submit
  const checkoutForm = document.getElementById("checkout-form");
  if (checkoutForm) {
    checkoutForm.addEventListener("submit", async e => {
      e.preventDefault();
      const items = cart.getItems();
      if (items.length === 0) {
        UI.showToast("Your cart is empty!", "error");
        return;
      }

      const orderPayload = {
        customer: {
          full_name: document.getElementById("cust-name")?.value || "Valued Customer",
          email: document.getElementById("cust-email")?.value || "customer@example.com",
          phone: document.getElementById("cust-phone")?.value || "",
          address: document.getElementById("cust-address")?.value || "123 Main St",
          city: document.getElementById("cust-city")?.value || "City",
          postal_code: document.getElementById("cust-zip")?.value || "10001",
          country: "United States"
        },
        items: items.map(i => ({ product_id: i.id, quantity: i.quantity })),
        coupon_code: cart.getCoupon(),
        payment_method: selectedPayment
      };

      try {
        const orderResult = await API.createOrder(orderPayload);
        cart.clear();
        UI.showOrderSuccess(orderResult);
        UI.showToast("Order placed successfully!", "success");
      } catch (err) {
        console.error("Order submission failed:", err);
        UI.showToast("Order submission error. Please try again.", "error");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", init);
