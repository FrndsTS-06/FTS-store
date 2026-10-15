import React, { useEffect, useState } from 'react';
import { apiClient, ApiError } from '../../services/api';
import { Order } from '../../types/order';
import { Button } from '../common/Button';
import { Loader } from '../common/Loader';
import {
  X,
  Package,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User as UserIcon,
} from 'lucide-react';

interface OrderStatusModalProps {
  orderNumber: string;
  onClose: () => void;
  onStatusUpdated: (updatedOrder: Order) => void;
}

const ALLOWED_TARGETS: Record<string, string[]> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
};

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  orderNumber,
  onClose,
  onStatusUpdated,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await apiClient.getAdminOrder(orderNumber);
        setOrder(data);
        const allowed = ALLOWED_TARGETS[data.status.toLowerCase()] || [];
        if (allowed.length > 0) {
          setSelectedStatus(allowed[0]);
        }
      } catch (err: any) {
        setError(err?.message || 'Failed to retrieve order details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber]);

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order || !selectedStatus) return;

    setIsUpdating(true);
    setUpdateError(null);

    try {
      const updated = await apiClient.updateAdminOrderStatus(
        order.order_number,
        selectedStatus,
        adminNotes.trim() || undefined
      );
      onStatusUpdated(updated);
      onClose();
    } catch (err: any) {
      if (err instanceof ApiError) {
        setUpdateError(err.message);
      } else {
        setUpdateError(err?.message || 'Failed to transition order status.');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const allowedTransitions = order ? (ALLOWED_TARGETS[order.status.toLowerCase()] || []) : [];
  const isTerminalState = order && allowedTransitions.length === 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2.5 font-mono">
              <Package className="w-5 h-5 text-indigo-400" />
              Manage Order {orderNumber}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Review order particulars and execute allowed lifecycle state transitions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <Loader size="md" label="Loading order records..." />
          </div>
        ) : error || !order ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
            {error || 'Order record could not be found.'}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status & Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Current Status
                </span>
                <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {order.status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Payment Status
                </span>
                <span className="mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {order.payment_status}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Total Value
                </span>
                <span className="mt-1 block text-base font-extrabold text-white">
                  ${order.total_amount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Customer & Delivery Information (For legitimate order operations) */}
            <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-800 space-y-2.5 text-xs text-slate-300">
              <div className="flex items-center gap-2 text-indigo-400 font-semibold uppercase tracking-wider text-[11px]">
                <UserIcon className="w-4 h-4" />
                Customer & Delivery Destination
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <div>
                  <p className="text-slate-400">Recipient Name:</p>
                  <p className="font-semibold text-white">{order.shipping_address.full_name}</p>
                </div>
                <div>
                  <p className="text-slate-400">Address:</p>
                  <p>
                    {order.shipping_address.address_line1},{' '}
                    {order.shipping_address.city}, {order.shipping_address.state}{' '}
                    {order.shipping_address.postal_code}
                  </p>
                </div>
                {order.shipping_address.phone && (
                  <div>
                    <p className="text-slate-400">Contact Phone:</p>
                    <p>{order.shipping_address.phone}</p>
                  </div>
                )}
                {order.tracking_number && (
                  <div>
                    <p className="text-slate-400">Tracking Code:</p>
                    <p className="font-mono text-indigo-300">{order.tracking_number}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Line Items Snapshot */}
            <div>
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2.5 tracking-wider">
                Order Items Snapshot ({order.items.length})
              </h4>
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden max-h-44 overflow-y-auto">
                {order.items.map((item) => (
                  <div key={item.id} className="p-3 bg-slate-900/40 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-semibold text-white">{item.product_name}</p>
                      <p className="text-slate-400 font-mono mt-0.5">SKU: {item.product_sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-200">${item.total_price.toFixed(2)}</p>
                      <p className="text-slate-500">
                        {item.quantity} × ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lifecycle Status Transition Form */}
            <form onSubmit={handleUpdateStatus} className="pt-4 border-t border-slate-800 space-y-4">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                Update Order Lifecycle Status
              </h4>

              {updateError && (
                <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {updateError}
                </div>
              )}

              {isTerminalState ? (
                <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/40 text-xs text-slate-400">
                  This order is in terminal state <strong className="text-white uppercase font-bold">{order.status}</strong>.
                  No further lifecycle transitions are permitted.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wider">
                      Allowed Target Statuses
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {allowedTransitions.map((st) => (
                        <label
                          key={st}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition-all ${
                            selectedStatus === st
                              ? 'bg-indigo-600/15 border-indigo-500 text-white ring-1 ring-indigo-500/30'
                              : 'bg-slate-800/40 border-slate-700 text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <input
                            type="radio"
                            name="target_status"
                            value={st}
                            checked={selectedStatus === st}
                            onChange={() => setSelectedStatus(st)}
                            className="text-indigo-500 focus:ring-indigo-500"
                          />
                          <span className="capitalize font-semibold text-xs">{st}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {selectedStatus === 'cancelled' && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>
                        <strong>Inventory Restoration Notice:</strong> Transitioning to cancelled will
                        automatically and atomically increment store warehouse inventory for each purchased item.
                      </span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
                      Administrative Notes (Recorded in Audit Trail)
                    </label>
                    <input
                      type="text"
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="e.g. Dispatched with tracking code or customer cancellation requested"
                      className="w-full bg-slate-800/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="secondary" size="sm" type="button" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      type="submit"
                      isLoading={isUpdating}
                      leftIcon={<CheckCircle2 className="w-4 h-4" />}
                    >
                      Confirm Transition
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
