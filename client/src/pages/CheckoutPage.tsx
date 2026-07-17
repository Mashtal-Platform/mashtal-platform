import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Lock, CheckCircle, ShoppingBag } from 'lucide-react';
import type { CartItem } from '../shared/types';
import { getImageUrl } from '../shared/api/client';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, StripeCardElement } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import {
  createStripePaymentIntent,
  fetchStripePaymentStatus,
} from '../shared/api/payments';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onSuccess: () => void;
}

function PayButtonWithSecret({
  clientSecret,
  onConfirmed,
  onError,
  onProgress,
}: {
  clientSecret: string;
  onConfirmed: () => void;
  onError: (message: string) => void;
  onProgress: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement) as StripeCardElement | null;
    if (!card) return;

    setSubmitting(true);
    try {
      onProgress('Charging your card for the full order…');
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
        return;
      }

      const pi = result.paymentIntent;
      if (pi?.status !== 'succeeded' && pi?.status !== 'requires_capture') {
        onError(`Payment incomplete (${pi?.status || 'unknown'})`);
        return;
      }

      onProgress('Payment succeeded. Confirming order…');
      onConfirmed();
    } catch (e: any) {
      onError(e?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleConfirm}
      disabled={!stripe || submitting}
      className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60"
    >
      {submitting ? 'Processing payment…' : 'Complete Order'}
    </button>
  );
}

export function CheckoutPage({ cartItems, onSuccess }: CheckoutPageProps) {
  const [step, setStep] = useState<'payment' | 'success'>('payment');
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const { isAuthenticated } = useAuth();

  const stripePublicKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  const isStripeConfigured = Boolean(stripePublicKey);
  const stripePromise = useMemo(() => {
    if (!stripePublicKey) return null;
    return loadStripe(stripePublicKey);
  }, [stripePublicKey]);

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [ledgerLegs, setLedgerLegs] = useState<
    Array<{ legKey: string; type: string; toLabel: string; amount: number; status: string }>
  >([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [progressMsg, setProgressMsg] = useState('');
  const [paymentTotalFromServer, setPaymentTotalFromServer] = useState<number | null>(null);
  const [amountTaxFromServer, setAmountTaxFromServer] = useState<number | null>(null);
  const [amountSubFromServer, setAmountSubFromServer] = useState<number | null>(null);
  const [taxRateFromServer, setTaxRateFromServer] = useState<number | null>(null);
  const [intentRetry, setIntentRetry] = useState(0);

  const taxRate = taxRateFromServer ?? 0.15;
  const tax = (amountSubFromServer ?? subtotal) * (amountTaxFromServer != null ? 0 : taxRate);
  const displayTax = amountTaxFromServer ?? tax;
  const displaySub = amountSubFromServer ?? subtotal;
  const displayTotal = paymentTotalFromServer ?? displaySub + displayTax;

  useEffect(() => {
    if (step !== 'payment') return;
    if (!isAuthenticated) return;
    if (!stripePromise) {
      setPaymentError(
        'Payment is not configured yet. Please set VITE_STRIPE_PUBLISHABLE_KEY in client/.env and restart the client.'
      );
      return;
    }
    if (cartItems.length === 0) return;
    if (clientSecret) return;

    let cancelled = false;
    const run = async () => {
      setPaymentLoading(true);
      setPaymentError('');
      try {
        const res = await createStripePaymentIntent({
          items: cartItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        });
        if (cancelled) return;
        setPaymentId(res.paymentId);
        setLedgerLegs(Array.isArray(res.ledgerLegs) ? res.ledgerLegs : []);
        setClientSecret(res.clientSecret || res.legs?.[0]?.clientSecret || null);
        setPaymentTotalFromServer(res.amountTotal);
        setAmountTaxFromServer(res.amountTax ?? null);
        setAmountSubFromServer(res.amountSubtotal ?? null);
        setTaxRateFromServer(typeof res.taxRate === 'number' ? res.taxRate : null);
      } catch (err: any) {
        if (cancelled) return;
        setPaymentError(err?.message || 'Failed to start payment');
      } finally {
        if (!cancelled) setPaymentLoading(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [step, isAuthenticated, stripePromise, cartItems, clientSecret, intentRetry]);

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 py-8 sm:py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-4 sm:p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-xl sm:text-2xl text-neutral-900 mb-3">Order Placed Successfully!</h2>
            <p className="text-neutral-600 mb-6">
              Your card was charged once. Sellers and tax are recorded separately in the ledger.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-neutral-700 mb-1">Order Total</div>
              <div className="text-2xl text-green-600">${displayTotal.toFixed(2)}</div>
            </div>
            <p className="text-sm text-neutral-500">Redirecting you back to home...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl text-neutral-900 mb-2">Checkout</h1>
          <p className="text-sm text-neutral-600">
            Card details stay with Stripe. We never store your card number. One charge covers the
            full order; sellers and tax are split in the ledger.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-6">
            {ledgerLegs.length > 0 && (
              <div className="bg-white rounded-xl p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Payment ledger</h2>
                <ul className="space-y-3">
                  {ledgerLegs.map((leg) => (
                    <li
                      key={leg.legKey}
                      className="flex items-start justify-between gap-3 border border-neutral-100 rounded-lg p-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-neutral-900">{leg.toLabel}</div>
                        <div className="text-xs text-neutral-500">
                          {leg.type === 'order_tax' ? 'Platform tax' : 'Seller payment'}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-green-700">
                        ${Number(leg.amount).toFixed(2)}
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-neutral-500 mt-3">
                  Your card is charged once for the total. These rows are how funds are tracked
                  for each seller and Mashtal tax.
                </p>
              </div>
            )}

            <div className="bg-white rounded-xl p-4 sm:p-6 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                <CreditCard className="w-6 h-6 text-green-600" />
                <h2 className="text-xl text-neutral-900">Card payment</h2>
              </div>

              {!isAuthenticated ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  Please sign in before completing checkout.
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-neutral-700 mb-2">
                    Card details (Whish Visa / any Visa or Mastercard)
                  </label>
                  <div className="p-3 border border-neutral-200 rounded-lg bg-white">
                    {stripePromise && clientSecret ? (
                      <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <CardElement
                          options={{
                            hidePostalCode: true,
                            style: {
                              base: {
                                fontSize: '14px',
                                color: '#111827',
                                '::placeholder': { color: '#6b7280' },
                              },
                            },
                          }}
                        />
                        <div className="mt-4">
                          <PayButtonWithSecret
                            clientSecret={clientSecret}
                            onError={(msg) => setPaymentError(msg)}
                            onProgress={setProgressMsg}
                            onConfirmed={async () => {
                              if (!paymentId) return;
                              const start = Date.now();
                              const poll = async () => {
                                try {
                                  const status = await fetchStripePaymentStatus(paymentId);
                                  if (status.status === 'succeeded' && status.order) {
                                    setStep('success');
                                    setTimeout(() => onSuccess(), 1000);
                                    return;
                                  }
                                  if (
                                    status.status === 'failed' ||
                                    status.status === 'canceled' ||
                                    status.status === 'refunded'
                                  ) {
                                    setPaymentError(`Payment ${status.status}. Please try again.`);
                                    return;
                                  }
                                } catch {
                                  /* ignore */
                                }
                                if (Date.now() - start > 90000) {
                                  setPaymentError(
                                    'Payment completed but order could not be confirmed in time. Check Purchase History shortly.'
                                  );
                                  return;
                                }
                                setTimeout(poll, 1500);
                              };
                              void poll();
                            }}
                          />
                        </div>
                      </Elements>
                    ) : (
                      <div className="text-sm text-neutral-500 space-y-3">
                        {paymentLoading
                          ? 'Preparing secure payment…'
                          : isStripeConfigured
                            ? paymentError
                              ? 'Payment could not start. Fix the error below, then retry.'
                              : 'Loading payment form…'
                            : 'Payment gateway is not configured.'}
                        {paymentError && !paymentLoading && (
                          <button
                            type="button"
                            className="block text-sm text-green-700 font-medium hover:underline"
                            onClick={() => {
                              setClientSecret(null);
                              setLedgerLegs([]);
                              setPaymentError('');
                              setIntentRetry((n) => n + 1);
                            }}
                          >
                            Retry payment setup
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="text-sm text-neutral-700">
                  Your card is processed by Stripe in one charge for the order total. Mashtal never
                  stores card numbers.
                </div>
              </div>

              {progressMsg && (
                <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-sm text-neutral-700">
                  {progressMsg}
                </div>
              )}

              {paymentError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                  {paymentError}
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-4 sm:p-6 sticky top-24">
              <h3 className="text-xl text-neutral-900 mb-6">Order Summary</h3>
              <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    {getImageUrl(item.image) ? (
                      <img
                        src={getImageUrl(item.image)}
                        alt={item.productName}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-neutral-200 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-6 h-6 text-neutral-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900">{item.productName}</div>
                      <div className="text-xs text-neutral-600">{item.businessName}</div>
                      <div className="text-xs text-neutral-600">Qty: {item.quantity}</div>
                      <div className="text-sm text-green-600">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span>${displaySub.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Tax (to Mashtal)</span>
                  <span>${displayTax.toFixed(2)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">${displayTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
