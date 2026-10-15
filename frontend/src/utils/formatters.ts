export function formatINR(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '₹0';
  }
  const numeric = typeof amount === 'number' ? amount : parseFloat(amount);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: numeric % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

export function formatPrice(amount: number | string | null | undefined): string {
  return formatINR(amount);
}

export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

export const FALLBACK_PRODUCT_IMAGE =
  'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';

export function getFallbackImage(categorySlug?: string): string {
  switch (categorySlug?.toLowerCase()) {
    case 'electronics':
      return 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80';
    case 'fashion':
      return 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=800&q=80';
    case 'home':
    case 'home-living':
      return 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80';
    case 'beauty':
      return 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&q=80';
    case 'sports':
      return 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80';
    case 'books':
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&q=80';
    case 'mobiles':
      return 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80';
    case 'laptops':
      return 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80';
    case 'accessories':
      return 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80';
    case 'smart-devices':
      return 'https://images.unsplash.com/photo-1543512214-318c7553f230?w=800&q=80';
    case 'gaming':
      return 'https://images.unsplash.com/photo-1600080972464-8e5f35f63d08?w=800&q=80';
    case 'audio':
      return 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80';
    case 'cameras':
      return 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80';
    case 'wearables':
      return 'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=800&q=80';
    case 'home-appliances':
      return 'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800&q=80';
    default:
      return FALLBACK_PRODUCT_IMAGE;
  }
}
