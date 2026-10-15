import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient, ApiError } from '../services/api';
import { Order, SimulatePaymentResponse } from '../types/order';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  Package,
  Calendar,
  Truck,
  MapPin,
  CreditCard,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowLeft,
  ShoppingBag,
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation Modal & State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Payment Simulation Modal & State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulatePaymentResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  const fetchOrder = async () => {
    if (!orderNumber) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.getOrder(orderNumber);
      setOrder(data);
    } catch (err: any) {
      if (err instanceof ApiError && err.status === 404) {
        setError('Order not found or you do not have permission to view it.');
      } else {
        setError(err?.message || 'Failed to retrieve order details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [orderNumber]);

  const handleCancelOrder = async () => {
    if (!order) return;
    setIsCancelling(true);
    setCancelError(null);

    try {
      const updatedOrder = await apiClient.cancelOrder(order.order_number);
      setOrder(updatedOrder);
      setShowCancelModal(false);
    } catch (err: any) {
      setCancelError(err?.message || 'Failed to cancel order. Please refresh and retry.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleSimulatePayment = async (outcome: 'success' | 'failure') => {
    if (!order) return;
    setIsProcessingPayment(true);
    setSimulationError(null);
    setSimulationResult(null);

    try {
      const res = await apiClient.simulatePayment(order.order_number, {
        outcome,
        card_last4: '4242',
        card_brand: 'Visa Demo',
      });
      setSimulationResult(res);

      // Refresh order to reflect new payment status
      await fetchOrder();

      if (res.success) {
        setTimeout(() => {
          setShowPaymentModal(false);
          setSimulationResult(null);
        }, 1500);
      }
    } catch (err: any) {
      setSimulationError(err?.message || 'Payment simulation failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Order Details">
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Retrieving order details..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer title="Order Details">
        <div className="max-w-md mx-auto py-12 text-center space-y-4">
          <XCircle className="w-12 h-12 text-rose-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Order Unavailable</h3>
          <p className="text-slate-400 text-sm">{error || 'Order record could not be found.'}</p>
          <div className="flex justify-center gap-3 pt-2">
            <Link to="/orders">
              <Button variant="outline">My Orders</Button>
            </Link>
            <Link to="/products">
              <Button variant="primary">Shop Store</Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const isCancellable =
    ['pending', 'processing'].includes(order.status.toLowerCase());

  const isPayable =
    ['unpaid', 'failed'].includes(order.payment_status.toLowerCase()) &&
    order.status.toLowerCase() !== 'cancelled';

  return (
    <PageContainer
      title={`Order ${order.order_number}`}
      subtitle="Complete order receipt, delivery tracking, and purchase snapshot."
    >
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/orders"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to My Orders
          </Link>

          <div className="flex items-center gap-2.5">
            {isPayable && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                leftIcon={<CreditCard className="w-4 h-4" />}
              >
                Pay Now (Demo Simulator)
              </Button>
            )}

            {isCancellable && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setShowCancelModal(true)}
                leftIcon={<XCircle className="w-4 h-4" />}
              >
                Cancel Order
              </Button>
            )}
          </div>
        </div>

        {/* Status Lifecycle Header */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="font-mono text-xl font-bold text-white tracking-wide">
                  {order.order_number}
                </h2>
                <span
                  className={`px-3 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                    order.status === 'delivered'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : order.status === 'cancelled'
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      : order.status === 'shipped'
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                Placed on {new Date(order.created_at).toLocaleString()}
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Total Billed</span>
              <p className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                ${order.total_amount.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Lifecycle Timeline */}
          {order.status.toLowerCase() !== 'cancelled' ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              {[
                { title: 'Order Placed', active: true, icon: CheckCircle2 },
                {
                  title: 'Payment Confirmed',
                  active: order.payment_status === 'paid',
                  icon: CreditCard,
                },
                {
                  title: 'Dispatched & Shipped',
                  active: ['shipped', 'delivered'].includes(order.status),
                  icon: Truck,
                },
                {
                  title: 'Delivered',
                  active: order.status === 'delivered',
                  icon: Package,
                },
              ].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border flex items-center gap-3 transition-all ${
                      step.active
                        ? 'bg-indigo-950/30 border-indigo-500/40 text-indigo-300'
                        : 'bg-slate-900/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${step.active ? 'text-indigo-400' : 'text-slate-600'}`} />
                    <div className="min-w-0">
                      <p className={`text-xs font-semibold truncate ${step.active ? 'text-white' : 'text-slate-400'}`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="text-xs text-rose-300">
                <p className="font-semibold text-rose-200">Order Cancelled</p>
                <p className="mt-0.5 opacity-90">
                  This order was cancelled prior to dispatch. All reserved inventory stock has been
                  restored back to the store catalogue.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Demo Notice */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Simulated Gateway & Payment Records:</span> All financial
            records displayed are simulated demonstrations. No real funds were transferred.
          </div>
        </div>

        {/* Items and Details 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Purchased Items (Left) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                <Package className="w-4 h-4 text-indigo-400" />
                Purchased Items ({order.items.length})
              </h3>

              <div className="divide-y divide-slate-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4 text-sm">
                    <div className="w-16 h-16 rounded-xl bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60 flex items-center justify-center">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ShoppingBag className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">{item.product_name}</p>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.product_sku}</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Price Snapshot: <span className="text-slate-200">${item.unit_price.toFixed(2)}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-200">
                        ${item.total_price.toFixed(2)}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Breakdown */}
              <div className="pt-4 border-t border-slate-800 space-y-2 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount ({order.coupon_code || 'Promotional'})</span>
                    <span>-${order.discount_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  <span>${order.shipping_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tax ({order.tax_rate * 100}%)</span>
                  <span>${order.tax_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
                  <span>Final Total</span>
                  <span className="text-xl text-emerald-400">${order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Transactions History */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <h3 className="font-bold text-white text-base mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Payment Transactions & Gateways
              </h3>

              {order.payments && order.payments.length > 0 ? (
                <div className="divide-y divide-slate-800">
                  {order.payments.map((p) => (
                    <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white capitalize">{p.payment_method}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.status === 'succeeded'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : p.status === 'refunded'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {p.status}
                          </span>
                        </div>
                        <p className="font-mono text-slate-400">
                          Ref: {p.transaction_reference || 'N/A'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-200">
                          ${p.amount.toFixed(2)} {p.currency}
                        </p>
                        <p className="text-slate-500">
                          {new Date(p.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400">No payment transaction records registered yet.</p>
              )}
            </div>
          </div>

          {/* Right Column: Address and Tracking */}
          <div className="lg:col-span-4 space-y-6">
            {/* Delivery Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-400" />
                Shipping Details
              </h3>
              <div className="text-sm text-slate-300 space-y-1">
                <p className="font-semibold text-white">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.address_line1}</p>
                {order.shipping_address.address_line2 && (
                  <p>{order.shipping_address.address_line2}</p>
                )}
                <p>
                  {order.shipping_address.city}, {order.shipping_address.state}{' '}
                  {order.shipping_address.postal_code}
                </p>
                <p>{order.shipping_address.country}</p>
                {order.shipping_address.phone && (
                  <p className="text-xs text-slate-400 pt-1">
                    Phone: {order.shipping_address.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Tracking Card */}
            <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <h3 className="font-bold text-white text-base mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" />
                Shipment Tracking
              </h3>
              <div className="space-y-2 text-xs">
                <p className="text-slate-400">Tracking Code:</p>
                <p className="font-mono font-bold text-slate-100 bg-slate-800/70 p-2 rounded-lg border border-slate-700 break-all">
                  {order.tracking_number || 'Awaiting carrier dispatch'}
                </p>
                <p className="text-slate-500 pt-1">
                  Estimated Delivery: 2-3 business days following fulfillment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-white">Cancel Order?</h3>
            </div>
            <p className="text-sm text-slate-300">
              Are you sure you want to cancel order{' '}
              <strong className="text-white font-mono">{order.order_number}</strong>?
            </p>
            <p className="text-xs text-slate-400">
              Cancelling will immediately return reserved items back to store stock and initiate a
              refund simulation if payment was completed.
            </p>

            {cancelError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {cancelError}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelOrder}
                isLoading={isCancelling}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Retry / Simulation Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <CreditCard className="w-6 h-6 text-indigo-400 shrink-0" />
              <div>
                <h3 className="font-bold text-lg text-white">FTS Payment Simulator</h3>
                <p className="text-xs text-slate-400">Simulate settlement for order {order.order_number}</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs flex justify-between">
              <span className="text-slate-400">Amount Due:</span>
              <span className="font-bold text-emerald-400">${order.total_amount.toFixed(2)} USD</span>
            </div>

            {simulationResult && (
              <div
                className={`p-3.5 rounded-xl text-xs border ${
                  simulationResult.success
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {simulationResult.message}
              </div>
            )}

            {simulationError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                {simulationError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                isLoading={isProcessingPayment}
                onClick={() => handleSimulatePayment('success')}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Simulate Success
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isProcessingPayment}
                onClick={() => handleSimulatePayment('failure')}
              >
                Simulate Failure
              </Button>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-xs text-slate-400 hover:text-slate-200 underline"
              >
                Close Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};
