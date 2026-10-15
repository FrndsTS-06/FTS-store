export interface ShippingAddress {
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code: string;
  country: string;
}

export interface CheckoutItemInput {
  product_id: string;
  quantity: number;
}

export interface OrderCreatePayload {
  shipping_address: ShippingAddress;
  payment_method: string;
  coupon_code?: string;
  items?: CheckoutItemInput[];
  idempotency_key?: string;
  guest_email?: string;
}

export interface OrderItem {
  id: string;
  product_id?: string;
  product_name: string;
  product_sku: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  image_url?: string;
}

export interface PaymentRecord {
  id: string;
  payment_method: string;
  status: string;
  amount: number;
  transaction_reference?: string;
  currency: string;
  gateway_metadata?: Record<string, any>;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  idempotency_key?: string;
  tracking_number?: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'unpaid' | 'pending' | 'paid' | 'failed' | 'refunded';
  subtotal: number;
  discount_amount: number;
  coupon_code?: string;
  tax_rate: number;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  payment_method: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  payments: PaymentRecord[];
  created_at: string;
  updated_at: string;
}

export interface OrderListResponse {
  total: number;
  items: Order[];
}

export interface SimulatePaymentPayload {
  outcome: 'success' | 'failure';
  card_last4?: string;
  card_brand?: string;
}

export interface SimulatePaymentResponse {
  success: boolean;
  order_number: string;
  payment_status: string;
  order_status: string;
  transaction_reference: string;
  message: string;
  is_simulation: boolean;
}
