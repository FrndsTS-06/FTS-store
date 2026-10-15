import React, { useState, useEffect } from 'react';
import { Product, Category } from '../../types/catalog';
import { apiClient } from '../../services/api';
import { ProductFormModal } from './ProductFormModal';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { Pagination } from '../common/Pagination';
import {
  Plus,
  Search,
  Filter,
  Edit2,
  Archive,
  Package,
  Layers,
  ShoppingBag,
  Check,
  AlertTriangle,
} from 'lucide-react';

interface AdminProductsTabProps {
  categories: Category[];
}

export const AdminProductsTab: React.FC<AdminProductsTabProps> = ({ categories }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Quick Stock Edit State
  const [quickStockProductId, setQuickStockProductId] = useState<string | null>(null);
  const [quickStockValue, setQuickStockValue] = useState<number>(0);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // Archive Confirm State
  const [archiveTargetProduct, setArchiveTargetProduct] = useState<Product | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getProducts({
        page,
        page_size: pageSize,
        category: categoryFilter || undefined,
        search: search.trim() || undefined,
        include_inactive: true,
      });

      let items = res.items;
      if (stockFilter === 'low_stock') {
        items = items.filter((p) => p.stock_quantity <= 5 && p.stock_quantity > 0);
      } else if (stockFilter === 'out_of_stock') {
        items = items.filter((p) => p.stock_quantity <= 0);
      } else if (stockFilter === 'archived') {
        items = items.filter((p) => !p.is_active);
      }

      setProducts(items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load products list.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, stockFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const handleQuickStockSave = async (productId: string) => {
    setIsUpdatingStock(true);
    try {
      const updated = await apiClient.updateProductStock(productId, quickStockValue);
      setProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
      setQuickStockProductId(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to update stock quantity.');
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleArchiveConfirm = async () => {
    if (!archiveTargetProduct) return;
    setIsArchiving(true);
    try {
      await apiClient.deleteProduct(archiveTargetProduct.id);
      setProducts((prev) =>
        prev.map((p) => (p.id === archiveTargetProduct.id ? { ...p, is_active: false } : p))
      );
      setArchiveTargetProduct(null);
    } catch (err: any) {
      alert(err?.message || 'Failed to archive product.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleProductSaved = (savedProduct: Product) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === savedProduct.id);
      if (exists) {
        return prev.map((p) => (p.id === savedProduct.id ? savedProduct : p));
      }
      return [savedProduct, ...prev];
    });
  };

  return (
    <div className="space-y-5">
      {/* Top Action Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, description, or SKU..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </form>

        {/* Filters and Add Product Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Layers className="w-3.5 h-3.5" />
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={stockFilter}
              onChange={(e) => {
                setStockFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="all">All Inventory Levels</option>
              <option value="low_stock">Low Stock (≤ 5 units)</option>
              <option value="out_of_stock">Out of Stock (0 units)</option>
              <option value="archived">Archived / Hidden</option>
            </select>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingProduct(null);
              setIsFormOpen(true);
            }}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            New Product
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading product catalogue..." />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs space-y-2">
          <Package className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No products found.</p>
          <p>Create your first product or modify search filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Visibility</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => {
                const isDepleted = p.stock_quantity <= 0;
                const isLow = p.stock_quantity > 0 && p.stock_quantity <= 5;

                return (
                  <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center">
                          {p.primary_image || p.images?.[0]?.url ? (
                            <img
                              src={p.primary_image || p.images?.[0]?.url}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-slate-500" />
                          )}
                        </div>
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-white truncate text-xs">{p.name}</p>
                          {p.badge && (
                            <span className="inline-block px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-semibold mt-0.5">
                              {p.badge}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap">{p.sku}</td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60">
                        {p.category?.name || 'General'}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-white">${Number(p.price).toFixed(2)}</span>
                      {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                        <span className="ml-1.5 text-[10px] line-through text-slate-500">
                          ${Number(p.compare_at_price).toFixed(2)}
                        </span>
                      )}
                    </td>

                    {/* Stock level cell with quick adjustment */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {quickStockProductId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={quickStockValue}
                            onChange={(e) => setQuickStockValue(parseInt(e.target.value, 10) || 0)}
                            className="w-16 bg-slate-800 border border-indigo-500 rounded px-1.5 py-1 text-xs text-white"
                          />
                          <button
                            onClick={() => handleQuickStockSave(p.id)}
                            disabled={isUpdatingStock}
                            className="p-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                            title="Save Stock"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQuickStockProductId(null)}
                            className="p-1 rounded text-slate-400 hover:text-white"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setQuickStockProductId(p.id);
                            setQuickStockValue(p.stock_quantity);
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border transition-colors ${
                            isDepleted
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30 hover:bg-rose-500/30'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          }`}
                          title="Click to quickly modify inventory"
                        >
                          {p.stock_quantity} units
                        </button>
                      )}
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      {p.is_active ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                          Archived
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditingProduct(p);
                            setIsFormOpen(true);
                          }}
                          leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                          className="py-1 px-2.5 text-[11px]"
                        >
                          Edit
                        </Button>

                        {p.is_active && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setArchiveTargetProduct(p)}
                            leftIcon={<Archive className="w-3.5 h-3.5" />}
                            className="py-1 px-2.5 text-[11px]"
                          >
                            Archive
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pt-2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            pageSize={pageSize}
            onPageChange={(p) => setPage(p)}
          />
        </div>
      )}

      {/* Product Create/Edit Modal */}
      <ProductFormModal
        product={editingProduct}
        categories={categories}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={handleProductSaved}
      />

      {/* Archive Confirmation Dialog */}
      {archiveTargetProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-white">Archive Product?</h3>
            </div>
            <p className="text-xs text-slate-300">
              Are you sure you want to archive <strong className="text-white">{archiveTargetProduct.name}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              Archiving hides the item from the storefront catalogue while preserving historical orders and SKU snapshot referential integrity.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setArchiveTargetProduct(null)}
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
