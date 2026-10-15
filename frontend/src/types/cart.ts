export interface CartItem {
  id: string;
  product_id: string;
  name: string;
  slug: string;
  sku: string;
  image_url?: string | null;
  category_name?: string | null;
  unit_price: number | string;
  quantity: number;
  line_total: number | string;
  stock_quantity: number;
  is_in_stock: boolean;
  is_available: boolean;
  warning?: string | null;
}

export interface CartResponse {
  session_id?: string | null;
  user_id?: string | null;
  items: CartItem[];
  subtotal: number | string;
  discount_amount: number | string;
  coupon_code?: string | null;
  discount_description?: string | null;
  tax_rate: number | string;
  tax_amount: number | string;
  shipping_fee: number | string;
  is_free_shipping: boolean;
  free_shipping_threshold: number | string;
  amount_needed_for_free_shipping: number | string;
  total: number | string;
  item_count: number;
  unique_item_count: number;
}

export interface AddCartItemPayload {
  product_id: string;
  quantity?: number;
}

export interface UpdateCartItemPayload {
  quantity: number;
}
