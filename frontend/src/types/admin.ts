export interface AdminRecentOrder {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  total_amount: number;
  status: string;
  payment_status: string;
  payment_method: string;
  item_count: number;
  created_at: string;
}

export interface AdminMetrics {
  total_orders: number;
  total_revenue: number;
  total_products: number;
  active_products: number;
  low_stock_products: number;
  out_of_stock_products: number;
  registered_customers: number;
  recent_orders: AdminRecentOrder[];
}

export interface AdminOrderListItem {
  id: string;
  order_number: string;
  customer_name?: string | null;
  customer_email?: string | null;
  status: string;
  payment_status: string;
  payment_method: string;
  total_amount: number;
  item_count: number;
  tracking_number?: string | null;
  shipping_city?: string | null;
  shipping_country?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminOrderListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: AdminOrderListItem[];
}

export interface AdminOrderQueryParams {
  page?: number;
  page_size?: number;
  status?: string;
  payment_status?: string;
  search?: string;
  sort_by?: string;
}

export interface ProductImageInput {
  url: string;
  alt_text?: string;
  is_primary?: boolean;
  display_order?: number;
}

export interface ProductCreatePayload {
  name: string;
  slug: string;
  sku: string;
  category_id: string;
  price: number;
  compare_at_price?: number;
  stock_quantity: number;
  description: string;
  badge?: string;
  is_active?: boolean;
  images?: ProductImageInput[];
}

export interface ProductUpdatePayload {
  name?: string;
  slug?: string;
  sku?: string;
  category_id?: string;
  price?: number;
  compare_at_price?: number;
  stock_quantity?: number;
  description?: string;
  badge?: string;
  is_active?: boolean;
  images?: ProductImageInput[];
}

export interface CategoryCreatePayload {
  name: string;
  slug: string;
  description?: string;
  icon_name?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface CategoryUpdatePayload {
  name?: string;
  slug?: string;
  description?: string;
  icon_name?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface AuditEvent {
  id: string;
  actor_id?: string | null;
  actor_email?: string | null;
  action: string;
  entity_name: string;
  entity_id: string;
  old_values?: Record<string, any> | null;
  new_values?: Record<string, any> | null;
  ip_address?: string | null;
  created_at: string;
}
