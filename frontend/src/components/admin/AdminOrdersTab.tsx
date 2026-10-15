import React, { useState, useEffect } from 'react';
import { apiClient } from '../../services/api';
import { AdminOrderListItem } from '../../types/admin';
import { Order } from '../../types/order';
import { OrderStatusModal } from './OrderStatusModal';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import { Pagination } from '../common/Pagination';
import {
  Search,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Clock,
  Truck,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
} from 'lucide-react';

export const AdminOrdersTab: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize] = useState(15);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getAdminOrders({
        page,
        page_size: pageSize,
        search: search.trim() || undefined,
        status: statusFilter || undefined,
        payment_status: paymentFilter || undefined,
        sort_by: sortBy,
      });
      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err?.message || 'Failed to load store orders.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter, paymentFilter, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchOrders();
  };

  const handleStatusUpdated = (updatedOrder: Order) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.order_number === updatedOrder.order_number
          ? {
              ...o,
              status: updatedOrder.status,
              payment_status: updatedOrder.payment_status,
            }
          : o
      )
    );
  };

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

  const getPaymentStatusBadge = (pst: string) => {
    switch (pst.toLowerCase()) {
      case 'completed':
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Search and Filters Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number or customer email..."
            className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
          />
        </form>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <select
              value={paymentFilter}
              onChange={(e) => {
                setPaymentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="">All Payments</option>
              <option value="completed">Paid / Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ArrowUpDown className="w-3.5 h-3.5" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              className="bg-slate-800/80 border border-slate-700/80 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="total-high">Total: High to Low</option>
              <option value="total-low">Total: Low to High</option>
            </select>
          </div>

          <button
            onClick={fetchOrders}
            title="Refresh Orders"
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading store orders..." />
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs">
          {error}
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-2xl text-xs space-y-2">
          <ShoppingBag className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="font-semibold text-slate-300">No orders match the selected filters.</p>
          <p>Try modifying your search or clearing active filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-sm">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Order Ref</th>
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Destination</th>
                <th className="py-3 px-4">Total Value</th>
                <th className="py-3 px-4">Order Status</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white whitespace-nowrap">
                    {o.order_number}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <p className="font-semibold text-white">{o.customer_name || 'Customer'}</p>
                    <p className="text-[11px] text-slate-400">{o.customer_email || '—'}</p>
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {o.shipping_city ? `${o.shipping_city}, ${o.shipping_country || 'US'}` : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-100 whitespace-nowrap">
                    ${o.total_amount.toFixed(2)}
                  </td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getOrderStatusBadge(o.status)}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">{getPaymentStatusBadge(o.payment_status)}</td>
                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap text-[11px]">
                    {new Date(o.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedOrderNumber(o.order_number)}
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

      {/* Order Status Modal */}
      {selectedOrderNumber && (
        <OrderStatusModal
          orderNumber={selectedOrderNumber}
          onClose={() => setSelectedOrderNumber(null)}
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};
