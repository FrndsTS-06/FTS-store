import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types/catalog';
import { ProductCreatePayload, ProductUpdatePayload } from '../../types/admin';
import { apiClient, ApiError } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { X, Package, Check, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  product?: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedProduct: Product) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  product,
  categories,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(product);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState('');
  const [compareAtPrice, setCompareAtPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('10');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name || '');
      setSlug(product.slug || '');
      setSku(product.sku || '');
      setCategoryId(product.category_id || product.category?.id || (categories[0]?.id || ''));
      setPrice(product.price ? product.price.toString() : '');
      setCompareAtPrice(product.compare_at_price ? product.compare_at_price.toString() : '');
      setStockQuantity(product.stock_quantity !== undefined ? product.stock_quantity.toString() : '0');
      setBadge(product.badge || '');
      setDescription(product.description || '');
      setImageUrl(product.primary_image || (product.images?.[0]?.url || ''));
      setIsActive(product.is_active ?? true);
    } else {
      setName('');
      setSlug('');
      setSku('');
      setCategoryId(categories[0]?.id || '');
      setPrice('');
      setCompareAtPrice('');
      setStockQuantity('25');
      setBadge('');
      setDescription('');
      setImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30');
      setIsActive(true);
    }
    setErrors({});
    setServerError(null);
  }, [product, categories, isOpen]);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !slug) {
      setSlug(
        val
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '')
      );
    }
    if (!isEditing && !sku && val.length > 3) {
      setSku(`FTS-${val.substring(0, 4).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Product name is required';
    if (!slug.trim()) errs.slug = 'URL slug is required';
    if (!sku.trim()) errs.sku = 'SKU identifier is required';
    if (!categoryId) errs.category_id = 'Category assignment is required';

    const p = parseFloat(price);
    if (isNaN(p) || p <= 0) errs.price = 'Price must be a valid amount greater than ₹0.00';

    if (compareAtPrice) {
      const cap = parseFloat(compareAtPrice);
      if (isNaN(cap) || cap < 0) errs.compare_at_price = 'Invalid compare price';
    }

    const s = parseInt(stockQuantity, 10);
    if (isNaN(s) || s < 0) errs.stock_quantity = 'Stock must be an integer >= 0';

    if (!description.trim()) errs.description = 'Product description is required';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    const priceNum = parseFloat(price);
    const compareNum = compareAtPrice ? parseFloat(compareAtPrice) : undefined;
    const stockNum = parseInt(stockQuantity, 10);

    const images = imageUrl.trim()
      ? [{ url: imageUrl.trim(), alt_text: name.trim(), is_primary: true, display_order: 0 }]
      : undefined;

    try {
      if (isEditing && product) {
        const payload: ProductUpdatePayload = {
          name: name.trim(),
          slug: slug.trim(),
          sku: sku.trim(),
          category_id: categoryId,
          price: priceNum,
          compare_at_price: compareNum,
          stock_quantity: stockNum,
          badge: badge.trim() || undefined,
          description: description.trim(),
          is_active: isActive,
          images,
        };
        const updated = await apiClient.updateProduct(product.id, payload);
        onSaved(updated);
        onClose();
      } else {
        const payload: ProductCreatePayload = {
          name: name.trim(),
          slug: slug.trim(),
          sku: sku.trim(),
          category_id: categoryId,
          price: priceNum,
          compare_at_price: compareNum,
          stock_quantity: stockNum,
          badge: badge.trim() || undefined,
          description: description.trim(),
          is_active: isActive,
          images,
        };
        const created = await apiClient.createProduct(payload);
        onSaved(created);
        onClose();
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(err?.message || 'Failed to save product record.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5">
              <Package className="w-5 h-5 text-indigo-400" />
              {isEditing ? `Edit Product: ${product?.name}` : 'Register New Catalogue Product'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage product pricing, inventory reserves, media, and search metadata.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {serverError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <Input
            label="Product Title *"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. AuraPulse Studio Pro Headphones"
            error={errors.name}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="SKU Identifier *"
              value={sku}
              onChange={(e) => setSku(e.target.value.toUpperCase())}
              placeholder="e.g. FTS-TECH-042"
              error={errors.sku}
              helperText="Unique warehouse stock keeping unit"
            />
            <Input
              label="URL Slug *"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase())}
              placeholder="e.g. aurapulse-studio-pro"
              error={errors.slug}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                Category *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.category_id && (
                <p className="text-xs text-rose-400 mt-1">{errors.category_id}</p>
              )}
            </div>

            <Input
              label="Sale Price ($ USD) *"
              type="number"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="99.99"
              error={errors.price}
            />

            <Input
              label="Original / Compare Price"
              type="number"
              step="0.01"
              value={compareAtPrice}
              onChange={(e) => setCompareAtPrice(e.target.value)}
              placeholder="129.99"
              error={errors.compare_at_price}
              helperText="For display discount %"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Initial Warehouse Stock *"
              type="number"
              step="1"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              placeholder="50"
              error={errors.stock_quantity}
              helperText="Units available in inventory"
            />

            <Input
              label="Badge Label (Optional)"
              value={badge}
              onChange={(e) => setBadge(e.target.value)}
              placeholder="Best Seller / New Arrival / Sale"
            />
          </div>

          <Input
            label="Primary Product Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
            helperText="Web-accessible product cover image"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Product Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed specifications, features, and marketing description..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            {errors.description && (
              <p className="text-xs text-rose-400 mt-1">{errors.description}</p>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
            <input
              type="checkbox"
              id="product_is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-500 rounded border-slate-700 bg-slate-900 focus:ring-indigo-500"
            />
            <label htmlFor="product_is_active" className="text-xs text-slate-300 cursor-pointer">
              <strong>Published & Purchasable:</strong> Item is visible in the public storefront catalogue.
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
            >
              {isEditing ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
