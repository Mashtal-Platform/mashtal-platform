import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, Lock, CheckCircle, ShoppingBag } from 'lucide-react';
import { CartItem } from '../App';
import { getImageUrl } from '../shared/api/client';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';
import { createStripePaymentIntent, fetchStripePaymentStatus } from '../shared/api/payments';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onSuccess: () => void;
}

function StripeConfirmButton({
  clientSecret,
  onConfirmed,
  onError,
}: {
  clientSecret: string;
  onConfirmed: () => void;
  onError: (message: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!stripe || !elements) return;
    const card = elements.getElement(CardElement);
    if (!card) return;

    setSubmitting(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card },
      });

      if (result.error) {
        onError(result.error.message || 'Payment failed');
        return;
      }

      // Order creation is done by webhook; we just trigger the polling flow.
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
      {submitting ? 'Processing payment...' : 'Complete Order'}
    </button>
  );
}

export function CheckoutPage({ cartItems, onSuccess }: CheckoutPageProps) {
  const [step, setStep] = useState<'payment' | 'success'>('payment');

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const total = subtotal + tax;

  const { isAuthenticated } = useAuth();

  const stripePublicKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  const isStripeConfigured = Boolean(stripePublicKey);
  const stripePromise = useMemo(() => {
    if (!stripePublicKey) return null;
    return loadStripe(stripePublicKey);
  }, [stripePublicKey]);

  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [paymentTotalFromServer, setPaymentTotalFromServer] = useState<number | null>(null);

  useEffect(() => {
    // Create the PaymentIntent as soon as we enter the payment step.
    if (step !== 'payment') return;
    if (!isAuthenticated) return;
    if (!stripePromise) {
      setPaymentLoading(false);
      setPaymentError('Payment is not configured yet. Please set VITE_STRIPE_PUBLISHABLE_KEY in client/.env and restart the client.');
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
        setClientSecret(res.clientSecret);
        setPaymentTotalFromServer(res.amountTotal);
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
  }, [step, isAuthenticated, stripePromise, cartItems, clientSecret]);

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-neutral-50 py-16 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl text-neutral-900 mb-3">Order Placed Successfully!</h2>
            <p className="text-neutral-600 mb-6">
              Thank you for your order. We'll send you a confirmation email shortly.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="text-sm text-neutral-700 mb-1">Order Total</div>
              <div className="text-2xl text-green-600">${(paymentTotalFromServer ?? total).toFixed(2)}</div>
            </div>
            <p className="text-sm text-neutral-500">
              Redirecting you back to home...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">Checkout</h1>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-green-600 font-medium">Payment</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === 'payment' && (
              <div className="bg-white rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl text-neutral-900">Payment Information</h2>
                </div>

                <div className="space-y-4">
                  {!isAuthenticated ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                      Please sign in before completing checkout.
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm text-neutral-700 mb-2">Card Details</label>
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
                            <StripeConfirmButton
                              clientSecret={clientSecret}
                              onError={(msg) => setPaymentError(msg)}
                              onConfirmed={async () => {
                                if (!paymentId) return;
                                // Poll for webhook confirmation + order creation.
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
                                    // ignore transient polling errors
                                  }

                                  if (Date.now() - start > 60000) {
                                    setPaymentError('Payment completed but order could not be confirmed in time.');
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
                          <div className="text-sm text-neutral-500">
                            {paymentLoading
                              ? 'Preparing secure payment...'
                              : isStripeConfigured
                                ? 'Loading payment form...'
                                : 'Payment gateway is not configured.'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-neutral-700">
                    Your payment information is encrypted and secure. We never store your card details.
                  </div>
                </div>

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
                    {paymentError}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('payment')}
                    disabled={paymentLoading}
                    className="flex-1 border-2 border-neutral-200 text-neutral-700 py-3 rounded-lg hover:border-green-600 transition-colors"
                  >
                    Back
                  </button>
                  {clientSecret ? (
                    <div className="flex-1" />
                  ) : (
                    <button
                      type="button"
                      className="flex-1 bg-neutral-200 text-neutral-500 py-3 rounded-lg cursor-not-allowed"
                      disabled
                    >
                      Complete Order
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl p-6 sticky top-24">
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
                      <div className="text-xs text-neutral-600">Qty: {item.quantity}</div>
                      <div className="text-sm text-green-600">${(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Tax (15%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">${(paymentTotalFromServer ?? total).toFixed(2)}</span>
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
