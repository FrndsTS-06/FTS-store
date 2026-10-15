import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../services/api';
import { AdminMetrics } from '../types/admin';
import { Category } from '../types/catalog';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { AdminMetricsCards } from '../components/admin/AdminMetricsCards';
import { AdminOrdersTab } from '../components/admin/AdminOrdersTab';
import { AdminProductsTab } from '../components/admin/AdminProductsTab';
import { AdminCategoriesTab } from '../components/admin/AdminCategoriesTab';
import { AdminAuditLogsTab } from '../components/admin/AdminAuditLogsTab';
import { OrderStatusModal } from '../components/admin/OrderStatusModal';
import { ProductFormModal } from '../components/admin/ProductFormModal';
import { CategoryFormModal } from '../components/admin/CategoryFormModal';
import {
  ShieldCheck,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Layers,
  History,
  AlertTriangle,
  Plus,
  RefreshCw,
  Eye,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
} from 'lucide-react';

type AdminTab = 'overview' | 'orders' | 'products' | 'categories' | 'audit';

export const AdminPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Action Modal States from Overview
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [metricsData, categoriesData] = await Promise.all([
        apiClient.getAdminMetrics(),
        apiClient.getCategories(true),
      ]);
      setMetrics(metricsData);
      setCategories(categoriesData);
    } catch (err: any) {
      setError(err?.message || 'Failed to initialize administrative dashboard data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getOrderStatusBadge = (st: string) => {
    switch (st.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Truck className="w-3 h-3" />
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            <Clock className="w-3 h-3" />
            Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  if (isLoading && !metrics) {
    return (
      <PageContainer title="Admin Dashboard">
        <div className="py-24 flex justify-center">
          <Loader size="lg" label="Authorizing and loading admin control panel..." />
        </div>
      </PageContainer>
    );
  }

  if (error && !metrics) {
    return (
      <PageContainer title="Admin Dashboard">
        <div className="max-w-md mx-auto py-16 text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Administrative Portal Error</h3>
          <p className="text-slate-400 text-xs">{error}</p>
          <Button variant="primary" onClick={loadData} leftIcon={<RefreshCw className="w-4 h-4" />}>
            Retry Load
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="Store Administration"
      subtitle="Complete management portal for Frnds Tech Solution administrators."
      action={
        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Sync Metrics
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsProductModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Security & Operator Bar */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border border-indigo-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400">Authenticated Administrator:</span>
              <strong className="text-white ml-1.5 font-semibold">{user?.email || 'System Admin'}</strong>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold tracking-wide border border-emerald-500/30 text-[10px]">
              ROLE: {user?.role?.toUpperCase() || 'ADMIN'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold border border-purple-500/30 text-[10px]">
              SERVER VERIFIED
            </span>
          </div>
        </div>

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            {
              id: 'orders',
              label: 'Orders',
              icon: ShoppingBag,
              badge: metrics?.total_orders,
            },
            {
              id: 'products',
              label: 'Products',
              icon: Package,
              badge: metrics?.total_products,
            },
            {
              id: 'categories',
              label: 'Categories',
              icon: Layers,
              badge: categories.length,
            },
            { id: 'audit', label: 'Audit Trail', icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 font-bold'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Display */}
        {activeTab === 'overview' && metrics && (
          <div className="space-y-8">
            {/* 1. Summary Cards */}
            <AdminMetricsCards metrics={metrics} />

            {/* 2. Low Stock Alerts Banner if any */}
            {metrics.low_stock_products > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-xs text-amber-300">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-200">
                    Warehouse Inventory Attention Required
                  </h4>
                  <p className="mt-0.5 opacity-90">
                    There are currently {metrics.low_stock_products} product(s) with 5 or fewer items remaining in stock
                    ({metrics.out_of_stock_products} completely depleted).
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('products')}
                  className="shrink-0 text-amber-300 border-amber-500/40 hover:bg-amber-500/20"
                >
                  Inspect Products
                </Button>
              </div>
            )}

            {/* 3. Recent Orders Quick Table */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-indigo-400" />
                    Recent Customer Orders
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Latest orders received across the storefront.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setActiveTab('orders')}
                >
                  View All Orders ({metrics.total_orders})
                </Button>
              </div>

              {metrics.recent_orders.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">No recent orders found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold border-b border-slate-800/80">
                      <tr>
                        <th className="py-2.5 px-3">Order Ref</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Order Status</th>
                        <th className="py-2.5 px-3">Payment</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {metrics.recent_orders.map((ro) => (
                        <tr key={ro.id} className="hover:bg-slate-800/30">
                          <td className="py-3 px-3 font-mono font-bold text-white">
                            {ro.order_number}
                          </td>
                          <td className="py-3 px-3">
                            <p className="font-semibold text-slate-200">{ro.customer_name || 'Customer'}</p>
                            <p className="text-[11px] text-slate-500">{ro.customer_email || '—'}</p>
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-100">
                            ${ro.total_amount.toFixed(2)}
                          </td>
                          <td className="py-3 px-3">{getOrderStatusBadge(ro.status)}</td>
                          <td className="py-3 px-3 uppercase text-[10px] font-bold text-slate-400">
                            {ro.payment_status}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedOrderNumber(ro.order_number)}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                              className="py-1 px-2.5 text-[11px]"
                            >
                              Manage
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* 4. Quick Actions Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Catalogue Management</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Register new products, adjust pricing, stock quantities, and gallery media.
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsProductModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Product
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Category Taxonomy</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage storefront departments, filters, and icon assignments.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCategoryModalOpen(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Create Category
                </Button>
              </div>

              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between space-y-3">
                <div>
                  <h4 className="font-bold text-white text-sm">Security Audit Trail</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspect recorded administrative actions, status updates, and inventory changes.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab('audit')}
                  leftIcon={<History className="w-4 h-4" />}
                >
                  Inspect Audit Trail
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && <AdminOrdersTab />}

        {activeTab === 'products' && (
          <AdminProductsTab categories={categories} />
        )}

        {activeTab === 'categories' && (
          <AdminCategoriesTab
            categories={categories}
            onCategoriesUpdated={loadData}
          />
        )}

        {activeTab === 'audit' && <AdminAuditLogsTab />}

        {/* Global Modals for Quick Creation from Overview */}
        {selectedOrderNumber && (
          <OrderStatusModal
            orderNumber={selectedOrderNumber}
            onClose={() => setSelectedOrderNumber(null)}
            onStatusUpdated={() => loadData()}
          />
        )}

        <ProductFormModal
          categories={categories}
          isOpen={isProductModalOpen}
          onClose={() => setIsProductModalOpen(false)}
          onSaved={() => loadData()}
        />

        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          onClose={() => setIsCategoryModalOpen(false)}
          onSaved={() => loadData()}
        />
      </div>
    </PageContainer>
  );
};
