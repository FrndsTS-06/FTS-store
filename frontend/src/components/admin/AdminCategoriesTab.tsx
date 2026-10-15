import React, { useState } from 'react';
import { Category } from '../../types/catalog';
import { apiClient } from '../../services/api';
import { CategoryFormModal } from './CategoryFormModal';
import { Button } from '../common/Button';
import {
  Layers,
  Plus,
  Edit2,
  Archive,
  Package,
  AlertTriangle,
} from 'lucide-react';

interface AdminCategoriesTabProps {
  categories: Category[];
  onCategoriesUpdated: () => void;
}

export const AdminCategoriesTab: React.FC<AdminCategoriesTabProps> = ({
  categories,
  onCategoriesUpdated,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [archiveTarget, setArchiveTarget] = useState<Category | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleArchiveConfirm = async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await apiClient.deleteCategory(archiveTarget.id);
      setArchiveTarget(null);
      onCategoriesUpdated();
    } catch (err: any) {
      alert(err?.message || 'Failed to archive category.');
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />
            Product Taxonomy & Departments ({categories.length})
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure storefront category classifications, banner imagery, and navigation filters.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditingCategory(null);
            setIsFormOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Category
        </Button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all backdrop-blur-sm flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs text-purple-400 font-semibold">
                  /{cat.slug}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    cat.is_active
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {cat.is_active ? 'Active' : 'Archived'}
                </span>
              </div>

              <h4 className="text-base font-bold text-white tracking-tight">{cat.name}</h4>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {cat.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-indigo-400" />
                {cat.item_count} active items
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingCategory(cat);
                    setIsFormOpen(true);
                  }}
                  leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                  className="py-1 px-2.5 text-[11px]"
                >
                  Edit
                </Button>

                {cat.is_active && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setArchiveTarget(cat)}
                    leftIcon={<Archive className="w-3.5 h-3.5" />}
                    className="py-1 px-2.5 text-[11px]"
                  >
                    Archive
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Category Modal */}
      <CategoryFormModal
        category={editingCategory}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => {
          onCategoriesUpdated();
        }}
      />

      {/* Archive Modal */}
      {archiveTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-white">Archive Category?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to archive category{' '}
              <strong className="text-white">{archiveTarget.name}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              Archiving hides it from public storefront filter bars while preserving existing product assignments.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setArchiveTarget(null)}
                disabled={isArchiving}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleArchiveConfirm}
                isLoading={isArchiving}
              >
                Confirm Archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
