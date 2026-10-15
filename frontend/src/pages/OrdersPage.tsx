import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Order } from '../types/order';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import {
  PackageCheck,
  Calendar,
  CreditCard,
  ShoppingBag,
  ArrowRight,
  Truck,
  RotateCcw,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await apiClient.getMyOrders();
      setOrders(res.items || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to retrieve your order history. Please retry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getOrderStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'shipped':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Truck className="w-3.5 h-3.5" />
            Shipped
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5" />
            Processing
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  const getPaymentStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Paid
          </span>
        );
      case 'refunded':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Refunded
          </span>
        );
      case 'failed':
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            Payment Failed
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Unpaid
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="My Orders">
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading your order history..." />
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer title="My Orders">
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Error Loading Orders</h3>
          <p className="text-slate-400 text-sm">{error}</p>
          <Button variant="primary" onClick={fetchOrders} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Retry
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (orders.length === 0) {
    return (
      <PageContainer
        title="My Orders"
        subtitle="Track your shipments, view receipts, and review past order history."
      >
        <EmptyState
          icon={<PackageCheck className="w-8 h-8 text-indigo-400" />}
          title="No Orders Found"
          description="You haven't placed any orders yet. When you purchase items, your receipts and tracking codes will be saved here."
          action={
            <Link to="/products">
              <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                Browse Catalogue
              </Button>
            </Link>
          }
        />
      </PageContainer>
    );
  }

  return (
    <PageContainer
      title="My Orders"
      subtitle={`You have placed ${orders.length} order${orders.length === 1 ? '' : 's'}. Track delivery updates and receipts.`}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        {orders.map((order) => {
          const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

          return (
            <div
              key={order.id}
              className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 transition-all backdrop-blur-sm space-y-5"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-base font-bold text-white tracking-wide">
                    {order.order_number}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                    {new Date(order.created_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {getOrderStatusBadge(order.status)}
                  {getPaymentStatusBadge(order.payment_status)}
                </div>
              </div>

              {/* Order Items Preview */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div className="flex items-center gap-3 overflow-x-auto max-w-full pb-1">
                  {order.items.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="w-16 h-16 rounded-xl bg-slate-800 border border-slate-700/60 overflow-hidden shrink-0 flex items-center justify-center relative group"
                      title={`${item.product_name} (x${item.quantity})`}
                    >
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-500" />
                      )}
                      <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-white px-1 rounded font-mono">
                        x{item.quantity}
                      </span>
                    </div>
                  ))}
                  {order.items.length > 4 && (
                    <div className="w-16 h-16 rounded-xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-xs font-semibold text-slate-400 shrink-0">
                      +{order.items.length - 4} more
                    </div>
                  )}
                </div>

                {/* Right Summary & Action */}
                <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-800">
                  <div className="text-left md:text-right">
                    <p className="text-xs text-slate-400">Total ({itemCount} items)</p>
                    <p className="text-xl font-bold text-emerald-400">
                      ${order.total_amount.toFixed(2)}
                    </p>
                  </div>

                  <Link to={`/orders/${order.order_number}`}>
                    <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Order Details
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Footer info: Tracking & Address */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  {order.tracking_number && (
                    <span className="flex items-center gap-1.5 font-mono">
                      <Truck className="w-3.5 h-3.5 text-indigo-400" />
                      Tracking: {order.tracking_number}
                    </span>
                  )}
                  <span>
                    Delivering to: <strong className="text-slate-300">{order.shipping_address.city}, {order.shipping_address.country}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-400">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span className="capitalize">{order.payment_method}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageContainer>
  );
};
