/**
 * NovaMart UI Renderer & Interaction Controller
 * Handles DOM updates, modal animations, cart drawer, and toast alerts.
 */

import { cart } from "./cart.js";
import { API } from "./api.js";

export const UI = {
  // Theme Management
  initTheme() {
    const savedTheme = localStorage.getItem("novamart_theme") || "dark";
    document.documentElement.setAttribute("data-theme", savedTheme);
    this.updateThemeButtonIcon(savedTheme);

    const themeToggleBtn = document.getElementById("theme-toggle-btn");
    if (themeToggleBtn) {
      themeToggleBtn.addEventListener("click", () => {
        const current = document.documentElement.getAttribute("data-theme") || "dark";
        const nextTheme = current === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", nextTheme);
        localStorage.setItem("novamart_theme", nextTheme);
        this.updateThemeButtonIcon(nextTheme);
        this.showToast(`Switched to ${nextTheme} theme`, "info");
      });
    }
  },

  updateThemeButtonIcon(theme) {
    const btn = document.getElementById("theme-toggle-btn");
    if (!btn) return;
    if (theme === "light") {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
      btn.setAttribute("title", "Switch to Dark Mode");
    } else {
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
      btn.setAttribute("title", "Switch to Light Mode");
    }
  },

  // Toast Notifications
  showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    if (!container) return;

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    let iconSvg = "";
    if (type === "success") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (type === "error") {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
    } else {
      iconSvg = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
    }

    toast.innerHTML = `
      <span class="toast-icon">${iconSvg}</span>
      <span class="toast-msg">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(10px)";
      toast.style.transition = "all 0.25s ease";
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  },

  // Category Pills Rendering
  renderCategories(categories, activeSlug, onSelectCategory) {
    const nav = document.getElementById("category-nav-scroll");
    if (!nav) return;

    nav.innerHTML = categories
      .map(cat => {
        const isActive = cat.slug.toLowerCase() === activeSlug.toLowerCase();
        return `
          <button class="cat-pill ${isActive ? "active" : ""}" data-slug="${cat.slug}" id="cat-pill-${cat.slug}">
            <span>${cat.name}</span>
            <span class="cat-pill-count">${cat.item_count || 0}</span>
          </button>
        `;
      })
      .join("");

    nav.querySelectorAll(".cat-pill").forEach(btn => {
      btn.addEventListener("click", () => {
        const slug = btn.getAttribute("data-slug");
        onSelectCategory(slug);
      });
    });
  },

  // Product Grid Rendering
  renderProducts(products, onQuickView, onAddToCart) {
    const grid = document.getElementById("product-grid");
    const countEl = document.getElementById("results-count-number");
    if (!grid) return;

    if (countEl) {
      countEl.textContent = products.length;
    }

    if (products.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3>No matching products found</h3>
          <p>Try adjusting your search query, price filters, or select a different department.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = products
      .map(p => {
        const badgeClass = p.badge ? p.badge.toLowerCase().replace(/\s+/g, "-") : "";
        const badgeHtml = p.badge
          ? `<span class="card-badge ${badgeClass}">${p.badge}</span>`
          : "";

        const origPriceHtml = p.original_price
          ? `<span class="original-price">$${p.original_price.toFixed(2)}</span>`
          : "";

        const discountHtml = p.discount_pct
          ? `<span class="discount-tag">-${p.discount_pct}%</span>`
          : "";

        // Star rating generator
        const fullStars = Math.floor(p.rating || 5);
        const starsSvg = Array.from({ length: 5 })
          .map((_, i) =>
            i < fullStars
              ? `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
              : `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
          )
          .join("");

        return `
          <article class="product-card" id="card-${p.id}">
            <div class="card-image-box">
              ${badgeHtml}
              <img src="${p.image}" alt="${p.name}" loading="lazy" />
              <button class="card-quick-view-btn" data-id="${p.id}">
                Quick View
              </button>
            </div>
            <div class="card-content">
              <span class="card-category-label">${p.category}</span>
              <h3 class="card-title" title="${p.name}">${p.name}</h3>
              <div class="card-rating-row">
                <span class="stars-list">${starsSvg}</span>
                <span class="review-count">(${p.review_count || 0})</span>
              </div>
              <div class="card-price-row">
                <span class="current-price">$${p.price.toFixed(2)}</span>
                ${origPriceHtml}
                ${discountHtml}
              </div>
              <button class="btn btn-primary card-add-btn" data-id="${p.id}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Add to Cart
              </button>
            </div>
          </article>
        `;
      })
      .join("");

    // Attach Action Listeners
    grid.querySelectorAll(".card-quick-view-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        onQuickView(id);
      });
    });

    grid.querySelectorAll(".card-add-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        onAddToCart(id);
      });
    });
  },

  // Cart Drawer UI Management
  openCartDrawer() {
    const backdrop = document.getElementById("drawer-backdrop");
    const drawer = document.getElementById("cart-drawer");
    if (backdrop && drawer) {
      backdrop.classList.add("active");
      drawer.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeCartDrawer() {
    const backdrop = document.getElementById("drawer-backdrop");
    const drawer = document.getElementById("cart-drawer");
    if (backdrop && drawer) {
      backdrop.classList.remove("active");
      drawer.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  async updateCartUI() {
    const badge = document.getElementById("cart-badge-count");
    const count = cart.getItemCount();
    if (badge) {
      badge.textContent = count;
      badge.classList.add("bounce");
      setTimeout(() => badge.classList.remove("bounce"), 300);
    }

    const items = cart.getItems();
    const coupon = cart.getCoupon();
    const calc = await API.calculateCart(items, coupon);

    // Free Shipping Progress
    const progressBar = document.getElementById("shipping-progress-fill");
    const progressText = document.getElementById("shipping-progress-label");
    if (progressBar && progressText) {
      const threshold = calc.free_shipping_threshold || 100;
      const pct = Math.min(100, Math.round((calc.subtotal / threshold) * 100));
      progressBar.style.width = `${pct}%`;

      if (calc.is_free_shipping && calc.subtotal > 0) {
        progressText.innerHTML = `<span>🎉 You unlocked <strong>FREE Standard Shipping</strong>!</span>`;
      } else {
        const remaining = Math.max(0, threshold - calc.subtotal).toFixed(2);
        progressText.innerHTML = `<span>Add <strong>$${remaining}</strong> more for <strong>FREE Shipping</strong></span><span>${pct}%</span>`;
      }
    }

    // Render Cart Item Rows
    const listEl = document.getElementById("cart-items-list");
    if (listEl) {
      if (calc.items.length === 0) {
        listEl.innerHTML = `
          <div style="text-align: center; padding: 3rem 1rem; color: var(--text-dim);">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin: 0 auto 1rem; display: block;">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <p style="font-weight: 600; color: var(--text-main); margin-bottom: 0.25rem;">Your cart is empty</p>
            <p style="font-size: 0.85rem;">Browse products and add your favorite items!</p>
          </div>
        `;
      } else {
        listEl.innerHTML = calc.items
          .map(
            item => `
            <div class="cart-item-row" id="cart-row-${item.product_id}">
              <div class="cart-item-thumb">
                <img src="${item.product_image}" alt="${item.product_name}">
              </div>
              <div class="cart-item-details">
                <div class="cart-item-name" title="${item.product_name}">${item.product_name}</div>
                <div class="cart-item-price">$${item.unit_price.toFixed(2)}</div>
                <div class="cart-qty-control">
                  <button class="qty-btn" data-action="dec" data-id="${item.product_id}">-</button>
                  <span class="qty-number">${item.quantity}</span>
                  <button class="qty-btn" data-action="inc" data-id="${item.product_id}">+</button>
                </div>
              </div>
              <div style="text-align: right;">
                <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 0.5rem;">$${item.total_price.toFixed(2)}</div>
                <button class="cart-item-remove-btn" data-id="${item.product_id}" title="Remove item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          `
          )
          .join("");

        // Attach quantity buttons
        listEl.querySelectorAll(".qty-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const action = btn.getAttribute("data-action");
            const id = btn.getAttribute("data-id");
            const item = items.find(i => i.id === id);
            if (!item) return;
            if (action === "inc") {
              cart.updateQuantity(id, item.quantity + 1);
            } else if (action === "dec") {
              cart.updateQuantity(id, item.quantity - 1);
            }
          });
        });

        // Attach remove buttons
        listEl.querySelectorAll(".cart-item-remove-btn").forEach(btn => {
          btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            cart.removeItem(id);
            UI.showToast("Item removed from cart", "info");
          });
        });
      }
    }

    // Coupon Display & Calculation summary
    const couponChipContainer = document.getElementById("coupon-chip-container");
    if (couponChipContainer) {
      if (calc.discount_applied) {
        couponChipContainer.innerHTML = `
          <div class="coupon-chip">
            <span>🏷️ ${calc.discount_applied}</span>
            <button id="remove-coupon-btn" style="color: var(--accent-rose); font-weight: bold;">✕</button>
          </div>
        `;
        document.getElementById("remove-coupon-btn")?.addEventListener("click", () => {
          cart.removeCoupon();
          UI.showToast("Coupon removed", "info");
        });
      } else {
        couponChipContainer.innerHTML = "";
      }
    }

    // Totals Rows
    const subtotalEl = document.getElementById("calc-subtotal");
    const discountRow = document.getElementById("calc-discount-row");
    const discountEl = document.getElementById("calc-discount");
    const shippingEl = document.getElementById("calc-shipping");
    const taxEl = document.getElementById("calc-tax");
    const totalEl = document.getElementById("calc-total");
    const checkoutBtn = document.getElementById("cart-checkout-btn");

    if (subtotalEl) subtotalEl.textContent = `$${calc.subtotal.toFixed(2)}`;
    if (discountRow && discountEl) {
      if (calc.discount_amount > 0) {
        discountRow.style.display = "flex";
        discountEl.textContent = `-$${calc.discount_amount.toFixed(2)}`;
      } else {
        discountRow.style.display = "none";
      }
    }
    if (shippingEl) {
      shippingEl.textContent = calc.is_free_shipping ? "FREE" : `$${calc.shipping_fee.toFixed(2)}`;
    }
    if (taxEl) taxEl.textContent = `$${calc.tax_amount.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${calc.total.toFixed(2)}`;

    if (checkoutBtn) {
      checkoutBtn.disabled = calc.items.length === 0;
    }
  },

  // Quick View Modal
  showQuickView(product, onAddToCart) {
    const modal = document.getElementById("quick-view-modal");
    if (!modal) return;

    const modalBody = document.getElementById("quick-view-body");
    const fullStars = Math.floor(product.rating || 5);
    const starsSvg = Array.from({ length: 5 })
      .map((_, i) =>
        i < fullStars
          ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="#fbbf24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
          : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`
      )
      .join("");

    modalBody.innerHTML = `
      <div class="qv-grid">
        <div class="qv-image-box">
          <img src="${product.image}" alt="${product.name}">
        </div>
        <div class="qv-info-box">
          <span class="card-category-label">${product.category}</span>
          <h2 class="qv-title">${product.name}</h2>
          <div class="card-rating-row" style="margin-bottom: 1rem;">
            <span>${starsSvg}</span>
            <span style="font-weight: 600; color: var(--text-main); margin-left: 0.25rem;">${product.rating}</span>
            <span class="review-count">(${product.review_count} verified reviews)</span>
          </div>
          <p class="qv-desc">${product.description}</p>
          <ul class="qv-features-list">
            ${(product.features || []).map(f => `<li>${f}</li>`).join("")}
          </ul>
          <div class="card-price-row" style="margin-bottom: 1.5rem;">
            <span class="current-price" style="font-size: 1.6rem;">$${product.price.toFixed(2)}</span>
            ${product.original_price ? `<span class="original-price">$${product.original_price.toFixed(2)}</span>` : ""}
            ${product.discount_pct ? `<span class="discount-tag">-${product.discount_pct}% OFF</span>` : ""}
          </div>
          <div style="display: flex; gap: 1rem; align-items: center;">
            <div class="cart-qty-control" style="padding: 0.25rem 0.5rem;">
              <button class="qty-btn" id="qv-qty-dec">-</button>
              <span class="qty-number" id="qv-qty-num" style="min-width: 34px;">1</span>
              <button class="qty-btn" id="qv-qty-inc">+</button>
            </div>
            <button class="btn btn-primary" id="qv-add-btn" style="flex: 1;">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;

    let selectedQty = 1;
    const qtyNum = document.getElementById("qv-qty-num");
    document.getElementById("qv-qty-inc")?.addEventListener("click", () => {
      selectedQty++;
      qtyNum.textContent = selectedQty;
    });
    document.getElementById("qv-qty-dec")?.addEventListener("click", () => {
      if (selectedQty > 1) {
        selectedQty--;
        qtyNum.textContent = selectedQty;
      }
    });

    document.getElementById("qv-add-btn")?.addEventListener("click", () => {
      onAddToCart(product.id, selectedQty);
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  },

  // Checkout Modal
  openCheckoutModal() {
    this.closeCartDrawer();
    const modal = document.getElementById("checkout-modal");
    if (modal) {
      modal.classList.add("active");
      document.body.style.overflow = "hidden";
    }
  },

  closeCheckoutModal() {
    const modal = document.getElementById("checkout-modal");
    if (modal) {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    }
  },

  // Order Success Modal
  showOrderSuccess(order) {
    this.closeCheckoutModal();
    const modal = document.getElementById("order-success-modal");
    const body = document.getElementById("order-success-body");
    if (!modal || !body) return;

    body.innerHTML = `
      <div class="success-icon-box">✓</div>
      <h2 style="font-size: 1.6rem; margin-bottom: 0.5rem;">Thank You, ${order.customer.full_name}!</h2>
      <p style="color: var(--text-muted); font-size: 0.95rem;">
        Your order has been placed and is being prepared for fulfillment.
      </p>
      <div class="order-code-badge">${order.order_id}</div>
      <div style="background: var(--bg-surface-elevated); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 1.25rem; text-align: left; margin: 1.5rem 0; font-size: 0.875rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-dim);">Tracking Number:</span>
          <span style="font-weight: 700; color: var(--primary);">${order.tracking_number}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-dim);">Shipping To:</span>
          <span style="font-weight: 600;">${order.customer.address}, ${order.customer.city}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
          <span style="color: var(--text-dim);">Payment Method:</span>
          <span style="font-weight: 600; text-transform: uppercase;">${order.payment_method}</span>
        </div>
        <div style="display: flex; justify-content: space-between; border-top: 1px solid var(--border-subtle); padding-top: 0.5rem; font-weight: 800; font-size: 1rem; color: var(--text-main);">
          <span>Total Paid:</span>
          <span>$${order.summary.total.toFixed(2)}</span>
        </div>
      </div>
      <button class="btn btn-primary" id="success-continue-btn" style="width: 100%;">
        Continue Shopping
      </button>
    `;

    document.getElementById("success-continue-btn")?.addEventListener("click", () => {
      modal.classList.remove("active");
      document.body.style.overflow = "";
    });

    modal.classList.add("active");
    document.body.style.overflow = "hidden";
  }
};
