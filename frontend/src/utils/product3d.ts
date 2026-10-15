/**
 * Utility to determine 3D model asset availability for products in FTS Store.
 */

export interface ModelAssetInfo {
  available: boolean;
  url: string | null;
  category: string;
}

/**
 * Determine the optimal 3D model URL based on product name and category.
 * Returns the public URL of the binary GLB model, or null if no valid 3D model exists.
 */
export function getModelUrlForCategory(categorySlug?: string, productName?: string): string | null {
  const cat = (categorySlug || '').toLowerCase().trim();
  const name = (productName || '').toLowerCase().trim();

  // Exclude categories that do not have dedicated 3D GLB assets authored
  const categoriesWithout3D = [
    'smart-devices',
    'home-appliances',
    'cameras',
    'fashion',
    'home',
    'beauty',
    'sports',
    'books',
    'accessories',
  ];
  if (categoriesWithout3D.includes(cat)) {
    return null;
  }

  // 1. Laptops / Computers (Category: 'laptops' or laptop-specific hardware)
  if (
    cat === 'laptops' ||
    name.includes('laptop') ||
    name.includes('macbook') ||
    name.includes('blade stealth') ||
    name.includes('notebook')
  ) {
    return '/models/laptop.glb';
  }

  // 2. Smartphones / Mobiles (Category: 'mobiles' or phone hardware)
  if (
    cat === 'mobiles' ||
    name.includes('smartphone') ||
    name.includes('cyberphone') ||
    (name.includes('phone') && !name.includes('headphone'))
  ) {
    return '/models/smartphone.glb';
  }

  // 3. Smartwatches / Wearables (Category: 'wearables' or watch hardware)
  if (
    cat === 'wearables' ||
    name.includes('smartwatch') ||
    name.includes('chronosync') ||
    (name.includes('watch') && !name.includes('watchband'))
  ) {
    return '/models/smartwatch.glb';
  }

  // 4. Audio / Headphones (Category: 'audio' or headphone/earbud hardware)
  if (
    cat === 'audio' ||
    name.includes('headphone') ||
    name.includes('earbud') ||
    name.includes('aurapulse')
  ) {
    return '/models/headphones.glb';
  }

  // No authentic 3D model asset authored for this product type
  return null;
}

/**
 * Check whether a product has a dedicated 3D model asset
 */
export function hasModelForProduct(categorySlug?: string, productName?: string): boolean {
  return getModelUrlForCategory(categorySlug, productName) !== null;
}
