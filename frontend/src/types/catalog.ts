export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon_name?: string | null;
  image_url?: string | null;
  item_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  url: string;
  alt_text?: string | null;
  is_primary: boolean;
  display_order: number;
  created_at: string;
}

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string | number;
  compare_at_price?: string | number | null;
  discount_pct?: number | null;
  stock_quantity: number;
  is_in_stock: boolean;
  stock_status: StockStatus;
  badge?: string | null;
  rating: string | number;
  review_count: number;
  is_active: boolean;
  category_id?: string | null;
  category?: Category | null;
  images: ProductImage[];
  primary_image?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ProductQueryParams {
  category?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  badge?: string;
  in_stock_only?: boolean;
  include_inactive?: boolean;
  sort_by?: 'price-low' | 'price-high' | 'name-asc' | 'name-desc' | 'newest' | 'oldest' | 'rating' | 'featured' | string;
  page?: number;
  page_size?: number;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Array<{ field?: string; message?: string }>;
  };
}
