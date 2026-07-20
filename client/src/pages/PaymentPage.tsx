import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Lock, CheckCircle, Loader2, AlertCircle, CreditCard } from 'lucide-react';
import { UserRole, useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Page } from '../App';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import {
  createStripeSubscriptionPaymentIntent,
  fetchStripeSubscriptionPaymentStatus,
  type SubscriptionPlanRole,
} from '../shared/api/payments';

interface PaymentPageProps {
  role: UserRole;
  onNavigate: (page: Page) => void;
  onPaymentSuccess: () => void;
}

function SubscriptionPayButton({
  clientSecret,
  onConfirmed,
  onError,
}: {
  clientSecret: string;
  onConfirmed: () => void;
  onError: (message: string) => void;
}) {
  const { t } = useTranslation();
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
      onConfirmed();
    } catch (e: any) {
      onError(e?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Button
      onClick={handleConfirm}
      disabled={!stripe || submitting}
      className="w-full h-11 bg-green-600 hover:bg-green-700"
    >
      {submitting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          {t('checkout.processing')}
        </>
      ) : (
        <>
          <Lock className="w-4 h-4 mr-2" />
          {t('checkout.payBusinessFee')}
        </>
      )}
    </Button>
  );
}

export function PaymentPage({ role, onNavigate, onPaymentSuccess }: PaymentPageProps) {
  const { t } = useTranslation();
  const { isAuthenticated, refreshUser } = useAuth() as any;
  const subscriptionPrice = Number((import.meta as any).env?.VITE_BUSINESS_FEE_USD) || 499;
  const planRole: SubscriptionPlanRole = 'business';

  const stripePublicKey = (import.meta as any).env?.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  const stripePromise = useMemo(
    () => (stripePublicKey ? loadStripe(stripePublicKey) : null),
    [stripePublicKey]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountTotal, setAmountTotal] = useState(subscriptionPrice);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      setError(t('checkout.signInBeforePayment'));
      return;
    }
    if (!stripePromise) {
      setLoading(false);
      setError('Stripe is not configured (VITE_STRIPE_PUBLISHABLE_KEY).');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await createStripeSubscriptionPaymentIntent({ planRole });
        if (cancelled) return;
        setPaymentId(res.paymentId);
        setClientSecret(res.clientSecret);
        setAmountTotal(res.amountTotal);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Failed to start subscription payment');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, stripePromise, planRole]);

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-4 sm:p-8 max-w-md w-full text-center shadow-sm border border-neutral-100">
          <CheckCircle className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900 mb-2">{t('checkout.businessActivated')}</h1>
          <p className="text-neutral-600 mb-6">
            {t('checkout.businessActivatedBody')}
          </p>
          <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onPaymentSuccess()}>
            {t('checkout.continueDashboard')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 py-5 sm:py-10 px-4">
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-green-700 to-green-600 text-white p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-semibold mb-1">{t('checkout.businessSubscription')}</h1>
          <p className="text-green-50 text-sm">
            {t('checkout.businessSubSubtitle')}
          </p>
        </div>
        <div className="p-4 sm:p-6 space-y-6">
          <div className="flex justify-between items-center p-4 rounded-xl bg-neutral-50 border border-neutral-100">
            <div>
              <div className="text-sm text-neutral-500">{t('checkout.plan')}</div>
              <div className="font-semibold text-neutral-900">
                {t('checkout.businessMonthly')}
              </div>
            </div>
            <div className="text-2xl font-bold text-green-700">${Number(amountTotal).toFixed(2)}</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8 text-neutral-500 gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {t('checkout.preparingPayment')}
            </div>
          ) : error && !clientSecret ? (
            <div className="flex gap-2 p-4 rounded-lg bg-red-50 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              {error}
            </div>
          ) : stripePromise && clientSecret ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  {t('checkout.cardDetailsLabel')}
                </label>
                <div className="p-3 border border-neutral-200 rounded-lg">
                  <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <CardElement
                      options={{
                        hidePostalCode: true,
                        style: {
                          base: { fontSize: '14px', color: '#111827' },
                        },
                      }}
                    />
                    <div className="mt-4">
                      <SubscriptionPayButton
                        clientSecret={clientSecret}
                        onError={setError}
                        onConfirmed={async () => {
                          if (!paymentId) return;
                          const start = Date.now();
                          const poll = async () => {
                            try {
                              const status = await fetchStripeSubscriptionPaymentStatus(paymentId);
                              if (
                                status.status === 'succeeded' ||
                                status.userSubscriptionStatus === 'active'
                              ) {
                                if (typeof refreshUser === 'function') await refreshUser();
                                setSuccess(true);
                                return;
                              }
                              if (
                                status.status === 'failed' ||
                                status.status === 'canceled' ||
                                status.status === 'refunded'
                              ) {
                                setError(`Payment ${status.status}`);
                                return;
                              }
                            } catch {
                              /* ignore */
                            }
                            if (Date.now() - start > 90000) {
                              setError('Payment sent but confirmation timed out. Try refreshing.');
                              return;
                            }
                            setTimeout(poll, 1500);
                          };
                          void poll();
                        }}
                      />
                    </div>
                  </Elements>
                </div>
              </div>
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                  {error}
                </div>
              )}
            </div>
          ) : null}

          <button
            type="button"
            className="text-sm text-neutral-500 hover:text-neutral-800 underline"
            onClick={() => onNavigate('home')}
          >
            {t('checkout.cancelGoHome')}
          </button>
        </div>
      </div>
    </div>
  );
}
