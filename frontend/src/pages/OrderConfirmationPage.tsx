import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { Order } from '../types/order';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import {
  CheckCircle2,
  Package,
  Truck,
  MapPin,
  Calendar,
  CreditCard,
  AlertTriangle,
  ArrowRight,
  ShoppingBag,
} from 'lucide-react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { usePrefersReducedMotion, tapButton } from '../motion';

export const OrderConfirmationPage: React.FC = () => {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (!orderNumber) return;

    const fetchOrder = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getOrder(orderNumber);
        setOrder(data);
        if (data && !shouldReduceMotion) {
          confetti({
            particleCount: 55,
            spread: 75,
            origin: { y: 0.45 },
            colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
            disableForReducedMotion: true,
          });
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to load order receipt details.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderNumber, shouldReduceMotion]);

  if (isLoading) {
    return (
      <PageContainer title="Order Confirmation">
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Retrieving verified order receipt..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !order) {
    return (
      <PageContainer title="Order Confirmation">
        <div className="max-w-xl mx-auto py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center border border-rose-500/30">
            <Package className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-white">Receipt Unavailable</h2>
          <p className="text-slate-400">{error || 'Order record could not be found.'}</p>
          <div className="pt-4">
            <Link to="/products">
              <Button variant="primary">Return to Catalog</Button>
            </Link>
          </div>
        </div>
      </PageContainer>
    );
  }

  const isSimulated = order.payments?.some(
    (p) => p.gateway_metadata && p.gateway_metadata.simulated
  ) || order.payment_method !== 'cod';

  return (
    <PageContainer
      title="Order Confirmed!"
      subtitle="Your purchase has been securely accepted and scheduled for dispatch."
    >
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Celebration Header with Spring Entrance */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="p-8 rounded-3xl bg-gradient-to-b from-emerald-950/40 to-slate-900/60 border border-emerald-500/30 text-center relative overflow-hidden backdrop-blur-md shadow-2xl"
        >
          <motion.div
            initial={shouldReduceMotion ? { scale: 1 } : { scale: 0 }}
            animate={shouldReduceMotion ? { scale: 1 } : { scale: [0, 1.25, 1] }}
            transition={{ duration: 0.55, delay: 0.1, type: 'spring' }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 mx-auto flex items-center justify-center shadow-xl shadow-emerald-500/20 mb-5"
          >
            <CheckCircle2 className="w-10 h-10" />
          </motion.div>

          <h1 className="text-3xl font-extrabold text-white tracking-tight font-display">
            Thank You for Your Order!
          </h1>
          <p className="text-slate-300 mt-2 max-w-lg mx-auto text-sm sm:text-base">
            We have confirmed order <span className="font-mono font-bold text-white">{order.order_number}</span>.
            A confirmation receipt and tracking updates will follow shortly.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {new Date(order.created_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            {order.tracking_number && (
              <span className="px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300 flex items-center gap-2 font-mono">
                <Truck className="w-3.5 h-3.5 text-emerald-400" />
                {order.tracking_number}
              </span>
            )}

            <span
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${
                order.payment_status === 'paid'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}
            >
              Payment: {order.payment_status}
            </span>

            <span className="px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Status: {order.status}
            </span>
          </div>
        </motion.div>

        {/* Simulation Transparency Banner */}
        {isSimulated && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-semibold text-amber-200">Simulation Status Disclosure</h4>
              <p className="text-amber-300/80 mt-0.5">
                This transaction was completed using the <strong>FTS Demo Payment Simulator</strong>.
                No real bank transfer, credit card authorization, or money movement occurred.
              </p>
            </div>
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Shipping Address */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl fts-specular-edge relative overflow-hidden">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-3">
              <MapPin className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display">Delivery Address</h3>
            </div>
            <div className="text-sm text-slate-300 space-y-1">
              <p className="font-bold text-white">{order.shipping_address.full_name}</p>
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
                <p className="text-slate-400 text-xs mt-2 font-mono">
                  Phone: {order.shipping_address.phone}
                </p>
              )}
            </div>
          </div>

          {/* Payment Details */}
          <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl fts-specular-edge relative overflow-hidden">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm mb-3">
              <CreditCard className="w-4 h-4 text-cyan-400" />
              <h3 className="font-display">Payment Information</h3>
            </div>
            <div className="text-sm text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Method:</span>
                <span className="font-semibold text-white capitalize">{order.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Billed:</span>
                <span className="font-bold text-cyan-300 font-mono">${order.total_amount.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Payment Status:</span>
                <span className="capitalize font-semibold text-emerald-400">{order.payment_status}</span>
              </div>
              {order.payments && order.payments.length > 0 && order.payments[0].transaction_reference && (
                <div className="flex justify-between text-xs pt-2 border-t border-white/10">
                  <span className="text-slate-400">Reference:</span>
                  <span className="font-mono text-cyan-300">
                    {order.payments[0].transaction_reference}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Purchased Items Table */}
        <div className="p-6 sm:p-7 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl fts-specular-edge relative overflow-hidden">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2 font-display">
            <Package className="w-4 h-4 text-cyan-400" />
            <span>Purchased Items Snapshot</span>
          </h3>

          <div className="space-y-3">
            {order.items.map((item) => (
              <div key={item.id} className="p-3 rounded-2xl bg-slate-950/50 border border-white/10 flex items-center gap-4 text-sm">
                <div className="w-14 h-14 rounded-xl bg-slate-950 overflow-hidden shrink-0 border border-white/10 flex items-center justify-center p-1 shadow-inner">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.product_name}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <ShoppingBag className="w-6 h-6 text-slate-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white truncate">{item.product_name}</p>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">SKU: {item.product_sku}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-cyan-300 font-mono">
                    ${item.total_price.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5 font-mono">
                    {item.quantity} × ${item.unit_price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Pricing Totals */}
          <div className="pt-4 mt-4 border-t border-white/10 space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono text-slate-200">${order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>Discount ({order.coupon_code || 'Promotional'})</span>
                <span className="font-mono">-${order.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-400">
              <span>Shipping</span>
              <span className="font-mono text-slate-200">${order.shipping_fee.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Tax ({order.tax_rate * 100}%)</span>
              <span className="font-mono text-slate-200">${order.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-white pt-2.5 border-t border-white/10 items-baseline">
              <span className="font-display">Grand Total</span>
              <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-mono">
                ${order.total_amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <motion.div
            whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
            whileTap={shouldReduceMotion ? undefined : tapButton}
          >
            <Link to="/products">
              <Button variant="secondary" leftIcon={<ShoppingBag className="w-4 h-4" />}>
                Continue Shopping
              </Button>
            </Link>
          </motion.div>

          <div className="flex items-center gap-3">
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : tapButton}
            >
              <Link to="/orders">
                <Button variant="outline">My Orders</Button>
              </Link>
            </motion.div>
            <motion.div
              whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
              whileTap={shouldReduceMotion ? undefined : tapButton}
            >
              <Link to={`/orders/${order.order_number}`}>
                <Button variant="primary" rightIcon={<ArrowRight className="w-4 h-4" />}>
                  View Order Details
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};
