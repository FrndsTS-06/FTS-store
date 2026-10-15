import React, { useState, useEffect } from 'react';
import { Category } from '../../types/catalog';
import { CategoryCreatePayload, CategoryUpdatePayload } from '../../types/admin';
import { apiClient, ApiError } from '../../services/api';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { X, Layers, Check, AlertCircle } from 'lucide-react';

interface CategoryFormModalProps {
  category?: Category | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (savedCat: Category) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  category,
  isOpen,
  onClose,
  onSaved,
}) => {
  const isEditing = Boolean(category);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('tag');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name || '');
      setSlug(category.slug || '');
      setDescription(category.description || '');
      setIconName(category.icon_name || 'tag');
      setImageUrl(category.image_url || '');
      setIsActive(category.is_active ?? true);
    } else {
      setName('');
      setSlug('');
      setDescription('');
      setIconName('tag');
      setImageUrl('');
      setIsActive(true);
    }
    setErrors({});
    setServerError(null);
  }, [category, isOpen]);

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
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Category name is required';
    if (!slug.trim()) errs.slug = 'Slug identifier is required';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      if (isEditing && category) {
        const payload: CategoryUpdatePayload = {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          icon_name: iconName.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          is_active: isActive,
        };
        const updated = await apiClient.updateCategory(category.id, payload);
        onSaved(updated);
        onClose();
      } else {
        const payload: CategoryCreatePayload = {
          name: name.trim(),
          slug: slug.trim(),
          description: description.trim() || undefined,
          icon_name: iconName.trim() || undefined,
          image_url: imageUrl.trim() || undefined,
          is_active: isActive,
        };
        const created = await apiClient.createCategory(payload);
        onSaved(created);
        onClose();
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(err?.message || 'Failed to persist category.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 text-slate-100">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-400" />
              {isEditing ? `Edit Category: ${category?.name}` : 'Create New Category'}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Organize your catalog departments and navigation taxonomy.
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
            label="Category Name *"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Smart Wearables & Audio"
            error={errors.name}
          />

          <Input
            label="URL Slug *"
            value={slug}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            placeholder="e.g. smart-wearables"
            error={errors.slug}
            helperText="Used in catalog query filters: /products?category=smart-wearables"
          />

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Category Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Summary of products under this category..."
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Icon Key"
              value={iconName}
              onChange={(e) => setIconName(e.target.value)}
              placeholder="e.g. cpu, activity, shopping-bag"
            />
            <Input
              label="Banner Image URL"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-700/50 flex items-center gap-3">
            <input
              type="checkbox"
              id="cat_is_active"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-indigo-500 rounded border-slate-700 bg-slate-900 focus:ring-indigo-500"
            />
            <label htmlFor="cat_is_active" className="text-xs text-slate-300 cursor-pointer">
              <strong>Active Category:</strong> Visible in storefront filters and navigation menus.
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
              {isEditing ? 'Save Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
