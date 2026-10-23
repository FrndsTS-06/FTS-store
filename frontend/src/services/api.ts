import {
  Category,
  Product,
  ProductListResponse,
  ProductQueryParams,
  ApiErrorResponse,
} from '../types/catalog';
import { CartResponse } from '../types/cart';
import {
  User,
  AuthResponse,
  RegisterPayload,
  LoginPayload,
  ProfileUpdatePayload,
  ChangePasswordPayload,
} from '../types/auth';
import {
  Order,
  OrderCreatePayload,
  OrderListResponse,
  SimulatePaymentPayload,
  SimulatePaymentResponse,
} from '../types/order';
import {
  AdminMetrics,
  AdminOrderListResponse,
  AdminOrderQueryParams,
  ProductCreatePayload,
  ProductUpdatePayload,
  CategoryCreatePayload,
  CategoryUpdatePayload,
  AuditEvent,
} from '../types/admin';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/+$/, '');
const API_BASE_URL = rawBaseUrl.endsWith('/api/v1') ? rawBaseUrl : `${rawBaseUrl}/api/v1`;
const SESSION_ID_KEY = 'fts_cart_session_id';
const AUTH_TOKEN_KEY = 'fts_auth_token';

export function getCartSessionId(): string {
  try {
    let sid = localStorage.getItem(SESSION_ID_KEY);
    if (!sid) {
      sid = 'guest-' + Math.random().toString(36).substring(2, 10) + '-' + Date.now().toString(36);
      localStorage.setItem(SESSION_ID_KEY, sid);
    }
    return sid;
  } catch {
    return 'fallback-session-id';
  }
}

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignore storage errors
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('fts_auth_user');
  } catch {
    // Ignore storage errors
  }
}

export class ApiError extends Error {
  public code: string;
  public status: number;
  public details?: Array<{ field?: string; message?: string }>;

  constructor(message: string, status: number, code: string = 'API_ERROR', details?: any[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const controller = new AbortController();
  const timeoutMs = 12000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const sessionId = getCartSessionId();
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Session-ID': sessionId,
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      if (response.status === 401) {
        clearAuthToken();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('fts:session-expired'));
        }
      }

      if (isJson && (data as ApiErrorResponse)?.error) {
        const errPayload = (data as ApiErrorResponse).error;
        throw new ApiError(
          errPayload.message || 'Server returned an error',
          response.status,
          errPayload.code,
          errPayload.details
        );
      }
      throw new ApiError(
        typeof data === 'string' && data ? data : (data?.detail || `HTTP ${response.status}: Request failed`),
        response.status,
        `HTTP_${response.status}`
      );
    }

    return data as T;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiError('Request timed out while waiting for server response.', 408, 'TIMEOUT');
    }
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      error.message || 'Network connectivity error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const apiClient = {
  // ===========================================================================
  // Authentication & Profile API
  // ===========================================================================

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.access_token);
    try {
      localStorage.setItem('fts_auth_user', JSON.stringify(res.user));
    } catch {}
    return res;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.access_token);
    try {
      localStorage.setItem('fts_auth_user', JSON.stringify(res.user));
    } catch {}
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request<void>('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore network failures on logout
    } finally {
      clearAuthToken();
    }
  },

  async getMe(): Promise<User> {
    const user = await request<User>('/auth/me');
    try {
      localStorage.setItem('fts_auth_user', JSON.stringify(user));
    } catch {}
    return user;
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const user = await request<User>('/auth/me', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    try {
      localStorage.setItem('fts_auth_user', JSON.stringify(user));
    } catch {}
    return user;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<{ message: string }> {
    return request<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
  /**
   * Health and service availability
   */
  async checkHealth(): Promise<boolean> {
    try {
      const data = await request<{ status: string }>('/health');
      return data.status === 'healthy';
    } catch {
      return false;
    }
  },

  /**
   * Fetch all active categories
   */
  async getCategories(includeInactive: boolean = false): Promise<Category[]> {
    const query = includeInactive ? '?include_inactive=true' : '';
    return request<Category[]>(`/categories${query}`);
  },

  /**
   * Fetch single category by ID or slug
   */
  async getCategory(idOrSlug: string): Promise<Category> {
    return request<Category>(`/categories/${encodeURIComponent(idOrSlug)}`);
  },

  /**
   * Query catalog products with filters, sorting, search, and pagination
   */
  async getProducts(params: ProductQueryParams = {}): Promise<ProductListResponse> {
    const query = new URLSearchParams();

    if (params.category && params.category !== 'all') {
      query.set('category', params.category);
    }
    if (params.search && params.search.trim()) {
      query.set('search', params.search.trim());
    }
    if (params.min_price !== undefined && params.min_price >= 0) {
      query.set('min_price', params.min_price.toString());
    }
    if (params.max_price !== undefined && params.max_price >= 0) {
      query.set('max_price', params.max_price.toString());
    }
    if (params.badge) {
      query.set('badge', params.badge);
    }
    if (params.in_stock_only) {
      query.set('in_stock_only', 'true');
    }
    if (params.include_inactive) {
      query.set('include_inactive', 'true');
    }
    if (params.sort_by) {
      query.set('sort_by', params.sort_by);
    }
    if (params.page && params.page > 0) {
      query.set('page', params.page.toString());
    }
    if (params.page_size && params.page_size > 0) {
      query.set('page_size', params.page_size.toString());
    }

    const queryString = query.toString();
    const endpoint = queryString ? `/products?${queryString}` : '/products';
    return request<ProductListResponse>(endpoint);
  },

  /**
   * Fetch top featured products for home highlight
   */
  async getFeaturedProducts(limit: number = 8): Promise<Product[]> {
    return request<Product[]>(`/products/featured?limit=${limit}`);
  },

  /**
   * Fetch single product by UUID or slug
   */
  async getProduct(idOrSlug: string, includeInactive: boolean = false): Promise<Product> {
    const query = includeInactive ? '?include_inactive=true' : '';
    return request<Product>(`/products/${encodeURIComponent(idOrSlug)}${query}`);
  },

  /**
   * Subscribe customer to FTS newsletter and promotional notifications
   */
  async subscribeNewsletter(email: string): Promise<{
    success: boolean;
    message: string;
    discount_code: string;
    already_subscribed: boolean;
  }> {
    return request<{
      success: boolean;
      message: string;
      discount_code: string;
      already_subscribed: boolean;
    }>('/newsletter/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // ===========================================================================
  // Shopping Cart API
  // ===========================================================================

  /**
   * Retrieve authoritative persistent cart
   */
  async getCart(): Promise<CartResponse> {
    return request<CartResponse>('/cart');
  },

  /**
   * Add a product to the cart or increment quantity
   */
  async addToCart(productId: string, quantity: number = 1): Promise<CartResponse> {
    return request<CartResponse>('/cart/items', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
  },

  /**
   * Update quantity of an item in the cart
   */
  async updateCartItem(itemIdOrProductId: string, quantity: number): Promise<CartResponse> {
    return request<CartResponse>(`/cart/items/${encodeURIComponent(itemIdOrProductId)}`, {
      method: 'PUT',
      body: JSON.stringify({ quantity }),
    });
  },

  /**
   * Remove an item from the cart
   */
  async removeCartItem(itemIdOrProductId: string): Promise<CartResponse> {
    return request<CartResponse>(`/cart/items/${encodeURIComponent(itemIdOrProductId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Clear all items in the current cart
   */
  async clearCart(): Promise<CartResponse> {
    return request<CartResponse>('/cart', {
      method: 'DELETE',
    });
  },

  /**
   * Apply promotional discount coupon
   */
  async applyCoupon(couponCode: string): Promise<CartResponse> {
    return request<CartResponse>('/cart/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ coupon_code: couponCode }),
    });
  },

  /**
   * Remove applied promotional coupon
   */
  async removeCoupon(): Promise<CartResponse> {
    return request<CartResponse>('/cart/remove-coupon', {
      method: 'DELETE',
    });
  },

  // ===========================================================================
  // Orders & Payment Simulation API
  // ===========================================================================

  /**
   * Create an order with authoritative calculation and atomic stock reservation
   */
  async createOrder(payload: OrderCreatePayload, idempotencyKey?: string): Promise<Order> {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }
    return request<Order>('/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  },

  /**
   * Retrieve orders for authenticated customer
   */
  async getMyOrders(): Promise<OrderListResponse> {
    return request<OrderListResponse>('/orders/my-orders');
  },

  /**
   * Retrieve single order details
   */
  async getOrder(orderNumber: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(orderNumber)}`);
  },

  /**
   * Run clearly labeled demo payment simulation
   */
  async simulatePayment(
    orderNumber: string,
    payload: SimulatePaymentPayload
  ): Promise<SimulatePaymentResponse> {
    return request<SimulatePaymentResponse>(`/orders/${encodeURIComponent(orderNumber)}/pay`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Cancel order and restore inventory before shipping
   */
  async cancelOrder(orderNumber: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(orderNumber)}/cancel`, {
      method: 'POST',
    });
  },

  // ===========================================================================
  // Administration Dashboard & Operations API
  // ===========================================================================

  /**
   * Fetch aggregate admin dashboard metrics
   */
  async getAdminMetrics(): Promise<AdminMetrics> {
    return request<AdminMetrics>('/admin/metrics');
  },

  /**
   * List, search, filter, and paginate all orders (Admin Only)
   */
  async getAdminOrders(params: AdminOrderQueryParams = {}): Promise<AdminOrderListResponse> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.page_size) query.set('page_size', params.page_size.toString());
    if (params.status) query.set('status', params.status);
    if (params.payment_status) query.set('payment_status', params.payment_status);
    if (params.search && params.search.trim()) query.set('search', params.search.trim());
    if (params.sort_by) query.set('sort_by', params.sort_by);

    const qs = query.toString();
    return request<AdminOrderListResponse>(qs ? `/admin/orders?${qs}` : '/admin/orders');
  },

  /**
   * Fetch single order detail with full customer info (Admin Only)
   */
  async getAdminOrder(orderNumber: string): Promise<Order> {
    return request<Order>(`/admin/orders/${encodeURIComponent(orderNumber)}`);
  },

  /**
   * Transition order status through validated state machine (Admin Only)
   */
  async updateAdminOrderStatus(
    orderNumber: string,
    status: string,
    notes?: string
  ): Promise<Order> {
    return request<Order>(`/admin/orders/${encodeURIComponent(orderNumber)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    });
  },

  /**
   * Create new product (Admin Only)
   */
  async createProduct(payload: ProductCreatePayload): Promise<Product> {
    return request<Product>('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update product details, prices, or media (Admin Only)
   */
  async updateProduct(productId: string, payload: ProductUpdatePayload): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(productId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Quick warehouse inventory adjustment (Admin Only)
   */
  async updateProductStock(productId: string, stockQuantity: number): Promise<Product> {
    return request<Product>(`/products/${encodeURIComponent(productId)}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ stock_quantity: stockQuantity }),
    });
  },

  /**
   * Archive / soft-delete product (Admin Only)
   */
  async deleteProduct(productId: string): Promise<void> {
    return request<void>(`/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Create new category (Admin Only)
   */
  async createCategory(payload: CategoryCreatePayload): Promise<Category> {
    return request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Update category details (Admin Only)
   */
  async updateCategory(categoryId: string, payload: CategoryUpdatePayload): Promise<Category> {
    return request<Category>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Archive category (Admin Only)
   */
  async deleteCategory(categoryId: string): Promise<void> {
    return request<void>(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
    });
  },

  /**
   * Retrieve admin audit log events (Admin Only)
   */
  async getAdminAuditLogs(limit: number = 50): Promise<AuditEvent[]> {
    return request<AuditEvent[]>(`/admin/audit-logs?limit=${limit}`);
  },
};
