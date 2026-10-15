import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { apiClient, ApiError } from '../services/api';
import { ShippingAddress, Order, SimulatePaymentResponse } from '../types/order';
import { formatPrice } from '../utils/formatters';
import { PageContainer } from '../components/common/PageContainer';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Loader } from '../components/common/Loader';
import { EmptyState } from '../components/common/EmptyState';
import {
  ShieldCheck,
  CreditCard,
  Truck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ShoppingBag,
  ArrowRight,
  DollarSign,
  Lock,
  X,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { usePrefersReducedMotion, tapButton } from '../motion';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, items, isLoading: cartLoading, refreshCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const shouldReduceMotion = usePrefersReducedMotion();

  // Form State
  const [formData, setFormData] = useState<ShippingAddress>({
    full_name: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'United States',
  });
  const [guestEmail, setGuestEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cod'>('card');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Demo Payment Modal State
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulatePaymentResponse | null>(null);
  const [simulationError, setSimulationError] = useState<string | null>(null);

  // Pre-fill user profile info if logged in
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        full_name: prev.full_name || user.full_name || '',
      }));
      if (!guestEmail) {
        setGuestEmail(user.email);
      }
    }
  }, [user]);

  // Modal keyboard handling (Escape key dismisses to order detail)
  useEffect(() => {
    if (showPaymentModal && activeOrder) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setShowPaymentModal(false);
          navigate(`/orders/${activeOrder.order_number}`);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [showPaymentModal, activeOrder, navigate]);

  // Handle Input Changes
  const handleInputChange = (field: keyof ShippingAddress, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.full_name.trim()) errors.full_name = 'Full name is required';
    if (!formData.address_line1.trim()) errors.address_line1 = 'Street address is required';
    if (!formData.city.trim()) errors.city = 'City is required';
    if (!formData.state?.trim()) errors.state = 'State / Province is required';
    if (!formData.postal_code.trim()) errors.postal_code = 'Postal / ZIP code is required';

    if (!isAuthenticated && !guestEmail.trim()) {
      errors.guest_email = 'Contact email is required for order updates';
    } else if (guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      errors.guest_email = 'Please provide a valid email address';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // Prevent double submit
    if (!validateForm()) return;

    setIsSubmitting(true);
    setServerError(null);

    // Generate unique idempotency key to prevent accidental duplicate submission
    const idempotencyKey = `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    try {
      const order = await apiClient.createOrder(
        {
          shipping_address: formData,
          payment_method: paymentMethod,
          coupon_code: cart.coupon_code || undefined,
          guest_email: isAuthenticated ? undefined : guestEmail.trim(),
        },
        idempotencyKey
      );

      // Refresh cart state since items are now ordered
      await refreshCart();

      // Trigger payment handling or navigation
      if (paymentMethod === 'cod') {
        navigate(`/orders/${order.order_number}/confirmation`, { state: { order } });
      } else {
        setActiveOrder(order);
        setShowPaymentModal(true);
      }
    } catch (err: any) {
      if (err instanceof ApiError) {
        setServerError(err.message);
      } else {
        setServerError(err?.message || 'Failed to place order. Please review your cart and retry.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulatePayment = async (outcome: 'success' | 'failure') => {
    if (!activeOrder || isProcessingPayment) return;

    setIsProcessingPayment(true);
    setSimulationError(null);
    setSimulationResult(null);

    try {
      const res = await apiClient.simulatePayment(activeOrder.order_number, {
        outcome,
        card_last4: '4242',
        card_brand: paymentMethod === 'paypal' ? 'PayPal Demo' : 'Visa',
      });

      setSimulationResult(res);

      if (res.success) {
        if (!shouldReduceMotion) {
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#6366f1', '#f59e0b'],
            disableForReducedMotion: true,
          });
        }
        setTimeout(() => {
          navigate(`/orders/${activeOrder.order_number}/confirmation`, {
            state: { orderNumber: activeOrder.order_number, paymentResult: res },
          });
        }, 1200);
      }
    } catch (err: any) {
      setSimulationError(err?.message || 'Payment simulation failed to execute.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (cartLoading) {
    return (
      <PageContainer title="Checkout">
        <div className="py-20 flex justify-center">
          <Loader size="lg" label="Loading checkout details..." />
        </div>
      </PageContainer>
    );
  }

  if ((!items || items.length === 0) && !showPaymentModal && !activeOrder) {
    return (
      <PageContainer
        title="Checkout"
        subtitle="Finalize your purchase and arrange delivery."
      >
        <EmptyState
          icon={<ShoppingBag className="w-8 h-8 text-blue-400" />}
          title="Your Shopping Cart is Empty"
          description="You cannot proceed through checkout without active products in your cart."
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
      title="Secure Checkout"
      subtitle="Encrypted order finalization and authoritatively verified billing."
    >
      {/* Simulation Transparency Banner */}
      <div className="mb-8 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 backdrop-blur-sm">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <h4 className="font-semibold text-amber-200">Demo Simulation Notice</h4>
          <p className="text-amber-300/80 mt-0.5">
            This application uses a safe, simulated payment pipeline. No real credit cards will be billed,
            and no actual funds will move. Please do NOT input real card numbers or private credentials.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="mb-8 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3.5 overflow-hidden"
          >
            <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <h4 className="font-semibold text-rose-200">Unable to Complete Order</h4>
              <p className="text-rose-300/90 mt-0.5">{serverError}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Delivery & Payment Details */}
        <div className="lg:col-span-7 space-y-8">
          {/* Section 1: Customer Contact */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl relative overflow-hidden fts-specular-edge">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-400/30 shadow-fts-glow-cyan">
                1
              </div>
              <h2 className="text-lg font-bold text-white font-display">Contact Information</h2>
            </div>

            <div className="space-y-4">
              {!isAuthenticated ? (
                <div>
                  <Input
                    id="checkout-email"
                    label="Email Address for Order Confirmation"
                    type="email"
                    placeholder="customer@example.com"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      if (formErrors.guest_email) {
                        setFormErrors((prev) => {
                          const n = { ...prev };
                          delete n.guest_email;
                          return n;
                        });
                      }
                    }}
                    error={formErrors.guest_email}
                    helperText="We will send tracking notifications and receipts here."
                  />
                  <p className="text-xs text-slate-400 mt-2">
                    Already have an account?{' '}
                    <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium hover:underline">
                      Log in to sync with your profile
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-white/10 backdrop-blur-sm">
                  <div>
                    <p className="text-xs text-slate-400">Authenticated Customer</p>
                    <p className="text-sm font-semibold text-white mt-0.5">{user?.email}</p>
                  </div>
                  <span className="px-2.5 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-300 font-medium border border-cyan-400/30">
                    Logged In
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Shipping Address */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl relative overflow-hidden fts-specular-edge">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-400/30 shadow-fts-glow-cyan">
                2
              </div>
              <h2 className="text-lg font-bold text-white font-display">Delivery Address</h2>
            </div>

            <div className="space-y-4">
              <Input
                id="checkout-full-name"
                label="Full Recipient Name"
                placeholder="Jane Doe"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                error={formErrors.full_name}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  id="checkout-phone"
                  label="Phone Number (Optional)"
                  placeholder="+1 (555) 000-0000"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
                <Input
                  id="checkout-country"
                  label="Country"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                />
              </div>

              <Input
                id="checkout-address-line1"
                label="Street Address"
                placeholder="123 Innovation Blvd"
                value={formData.address_line1}
                onChange={(e) => handleInputChange('address_line1', e.target.value)}
                error={formErrors.address_line1}
              />

              <Input
                id="checkout-address-line2"
                label="Apartment, Suite, Unit (Optional)"
                placeholder="Apt 4B"
                value={formData.address_line2 || ''}
                onChange={(e) => handleInputChange('address_line2', e.target.value)}
              />

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  id="checkout-city"
                  label="City"
                  placeholder="San Francisco"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  error={formErrors.city}
                />
                <Input
                  id="checkout-state"
                  label="State / Province"
                  placeholder="CA"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  error={formErrors.state}
                />
                <Input
                  id="checkout-postal-code"
                  label="Postal / ZIP Code"
                  placeholder="94105"
                  value={formData.postal_code}
                  onChange={(e) => handleInputChange('postal_code', e.target.value)}
                  error={formErrors.postal_code}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl shadow-xl relative overflow-hidden fts-specular-edge">
            <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/10">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-400 font-bold flex items-center justify-center text-sm border border-cyan-400/30 shadow-fts-glow-cyan">
                3
              </div>
              <h2 className="text-lg font-bold text-white font-display">Payment Method</h2>
            </div>

            <div className="space-y-3">
              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-blue-950/40 border-cyan-400/60 ring-1 ring-cyan-400/30 shadow-fts-glow-cyan/20'
                    : 'bg-slate-950/40 border-white/10 hover:border-white/20 hover:bg-slate-900/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-cyan-400" />
                      Credit / Debit Card
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Demo Simulator
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulate instant card settlement with simulated 3D-Secure approval or decline.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'paypal'
                    ? 'bg-blue-950/40 border-cyan-400/60 ring-1 ring-cyan-400/30 shadow-fts-glow-cyan/20'
                    : 'bg-slate-950/40 border-white/10 hover:border-white/20 hover:bg-slate-900/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={() => setPaymentMethod('paypal')}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-sky-400" />
                      PayPal Sandbox
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                      Sandbox Simulation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Simulate digital wallet checkout without external redirect or real charges.
                  </p>
                </div>
              </label>

              <label
                className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === 'cod'
                    ? 'bg-blue-950/40 border-cyan-400/60 ring-1 ring-cyan-400/30 shadow-fts-glow-cyan/20'
                    : 'bg-slate-950/40 border-white/10 hover:border-white/20 hover:bg-slate-900/50'
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                  className="mt-1 text-cyan-500 focus:ring-cyan-500"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-white flex items-center gap-2">
                      <Truck className="w-4 h-4 text-amber-400" />
                      Cash on Delivery (COD)
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Pay on Delivery
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Order confirmed immediately. Payment collected in cash upon package delivery.
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Review & Authoritative Total */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-white/15 backdrop-blur-2xl sticky top-24 shadow-2xl relative overflow-hidden fts-specular-edge">
            <h2 className="text-lg font-bold text-white mb-4 pb-3 border-b border-white/10 flex items-center justify-between font-display">
              <span>Order Summary</span>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-400/30">
                {items.reduce((acc, i) => acc + i.quantity, 0)} items
              </span>
            </h2>

            {/* Line Items List */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-5">
              {items.map((item) => (
                <div key={item.id} className="p-2.5 rounded-2xl bg-slate-950/50 border border-white/10 flex items-center gap-3 text-sm">
                  <div className="w-14 h-14 rounded-xl bg-slate-950 border border-white/10 overflow-hidden shrink-0 flex items-center justify-center p-1 shadow-inner">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        loading="lazy"
                        decoding="async"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=800&q=80';
                        }}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <ShoppingBag className="w-6 h-6 text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate text-xs sm:text-sm">
                      {item.name}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">
                      Qty: {item.quantity} × {formatPrice(item.unit_price)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-cyan-300 font-mono text-sm">
                      {formatPrice(item.line_total)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Authoritative Calculation Breakdown */}
            <div className="pt-4 border-t border-white/10 space-y-2 text-sm">
              <div className="flex justify-between text-slate-300">
                <span>Subtotal</span>
                <span className="font-mono text-slate-200">{formatPrice(cart.subtotal)}</span>
              </div>

              {Number(cart.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span className="flex items-center gap-1.5">
                    Discount ({cart.coupon_code})
                  </span>
                  <span className="font-mono">-{formatPrice(cart.discount_amount)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-300">
                <span className="flex items-center gap-1.5">
                  Shipping
                  {cart.is_free_shipping && (
                    <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Free
                    </span>
                  )}
                </span>
                <span className="font-mono">
                  {Number(cart.shipping_fee) === 0 ? (
                    <span className="text-emerald-400 font-semibold">{formatPrice(0)}</span>
                  ) : (
                    formatPrice(cart.shipping_fee)
                  )}
                </span>
              </div>

              <div className="flex justify-between text-slate-300">
                <span>Estimated Sales Tax (8%)</span>
                <span className="font-mono text-slate-200">{formatPrice(cart.tax_amount)}</span>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-base font-bold text-white font-display">Total</span>
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400 font-mono">
                  {formatPrice(cart.total)}
                </span>
              </div>
            </div>

            <div className="mt-5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-300 backdrop-blur-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Atomic inventory deduction prevents overselling. Final total is calculated authoritatively by backend pricing rules.
              </span>
            </div>

            {/* Submit Button */}
            <div className="mt-6">
              <motion.button
                id="checkout-submit-order-btn"
                type="submit"
                disabled={isSubmitting}
                whileHover={shouldReduceMotion || isSubmitting ? undefined : { scale: 1.015 }}
                whileTap={shouldReduceMotion || isSubmitting ? undefined : tapButton}
                className="w-full py-4 px-6 rounded-2xl text-base font-bold bg-gradient-to-r from-blue-600 via-cyan-500 to-blue-600 hover:from-blue-500 hover:via-cyan-400 hover:to-blue-500 text-white shadow-fts-glow-cyan flex items-center justify-center gap-2.5 cursor-pointer transition-all duration-300 border border-cyan-300/40 disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                <span>{paymentMethod === 'cod' ? 'Confirm Order' : 'Proceed to Demo Payment'}</span>
              </motion.button>
            </div>
          </div>
        </div>
      </form>

      {/* Demo Payment Modal with AnimatePresence */}
      <AnimatePresence>
        {showPaymentModal && activeOrder && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="payment-simulator-title"
          >
            {/* Modal Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              onClick={() => {
                setShowPaymentModal(false);
                navigate(`/orders/${activeOrder.order_number}`);
              }}
              className="fixed inset-0 bg-slate-950/85 backdrop-blur-xl cursor-pointer"
              aria-hidden="true"
            />

            {/* Modal Card with Spring Pop */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, y: 15 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { scale: 0.94, opacity: 0, y: 15 }}
              transition={
                shouldReduceMotion
                  ? { duration: 0.2 }
                  : { type: 'spring', damping: 28, stiffness: 350 }
              }
              className="relative z-10 w-full max-w-lg bg-slate-950/95 border border-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 space-y-6 text-slate-100 fts-specular-edge overflow-hidden"
            >
              {/* Top Specular Edge Sheen */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center border border-cyan-400/30 shadow-fts-glow-cyan">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 id="payment-simulator-title" className="font-bold text-lg text-white font-display">
                      FTS Payment Simulator
                    </h3>
                    <p className="text-xs text-cyan-300">Simulated Gateway & Settlement Engine</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                    Demo Sandbox
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate(`/orders/${activeOrder.order_number}`);
                    }}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
                    aria-label="Dismiss payment simulator"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Order Brief */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 backdrop-blur-md space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Order Reference:</span>
                  <span className="font-mono font-semibold text-white">{activeOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Amount Due:</span>
                  <span className="font-bold text-cyan-300 font-mono">${activeOrder.total_amount.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Processor:</span>
                  <span className="text-slate-200">
                    {paymentMethod === 'paypal' ? 'PayPal Sandbox Mock' : 'FTS Demo Card Gateway'}
                  </span>
                </div>
              </div>

              {/* Mock Card Preview */}
              <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-950 via-blue-950/70 to-slate-950 border border-cyan-400/30 shadow-fts-glow-blue space-y-3 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-cyan-400/5 to-transparent pointer-events-none" />
                <div className="flex justify-between items-center text-xs text-slate-400 uppercase tracking-wider">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-5 rounded-md bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
                      <div className="w-4 h-3 border border-amber-300/40 rounded-sm" />
                    </div>
                    <span className="font-semibold text-slate-300">Test SmartCard</span>
                  </div>
                  <span className="font-bold text-cyan-300 font-mono tracking-wider">VISA DEMO</span>
                </div>
                <p className="font-mono text-xl text-white tracking-widest font-bold">
                  •••• •••• •••• 4242
                </p>
                <div className="flex justify-between text-xs text-slate-400 font-mono">
                  <span>EXP: 12/28</span>
                  <span>CVC: 888</span>
                </div>
              </div>

              {/* Simulation Status Messages */}
              <AnimatePresence>
                {simulationResult && (
                  <motion.div
                    initial={{ opacity: 0, y: -6, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -6, height: 0 }}
                    className={`p-4 rounded-2xl border flex items-start gap-3 overflow-hidden backdrop-blur-md ${
                      simulationResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {simulationResult.success ? (
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                    )}
                    <div className="text-sm">
                      <h4 className="font-semibold">
                        {simulationResult.success ? 'Payment Approved!' : 'Simulated Decline'}
                      </h4>
                      <p className="text-xs mt-0.5 opacity-90">{simulationResult.message}</p>
                      {simulationResult.success && (
                        <p className="text-xs mt-1 font-mono text-emerald-400 animate-pulse">
                          Redirecting to authoritative order receipt...
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {simulationError && (
                <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
                  {simulationError}
                </div>
              )}

              {/* Interactive Outcome Buttons */}
              <div className="space-y-3">
                <p className="text-xs text-center text-slate-400">
                  Select an outcome to test how the system handles the payment lifecycle:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    id="simulate-payment-success-btn"
                    type="button"
                    disabled={isProcessingPayment || simulationResult?.success}
                    whileHover={shouldReduceMotion || simulationResult?.success ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion || simulationResult?.success ? undefined : tapButton}
                    onClick={() => handleSimulatePayment('success')}
                    className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-600 hover:from-emerald-500 hover:to-teal-400 text-white shadow-fts-glow-cyan border border-emerald-400/40 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                        <span>Simulate Success</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    id="simulate-payment-failure-btn"
                    type="button"
                    disabled={isProcessingPayment || simulationResult?.success}
                    whileHover={shouldReduceMotion || simulationResult?.success ? undefined : { scale: 1.02 }}
                    whileTap={shouldReduceMotion || simulationResult?.success ? undefined : tapButton}
                    onClick={() => handleSimulatePayment('failure')}
                    className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-bold bg-slate-900/80 hover:bg-rose-950/60 text-rose-300 hover:text-rose-200 border border-rose-500/30 hover:border-rose-500/60 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessingPayment ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-rose-300" />
                        <span>Simulate Failure</span>
                      </>
                    )}
                  </motion.button>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPaymentModal(false);
                      navigate(`/orders/${activeOrder.order_number}`);
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                  >
                    Pay later / View Order in Pending State
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
};
