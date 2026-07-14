import React, { useState } from 'react';
import { Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { UserRole, useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Page } from '../App';
import {
  fetchWishSubscriptionPaymentStatus,
  submitWishSubscriptionPayment,
  type SubscriptionPlanRole,
} from '../shared/api/payments';

interface PaymentPageProps {
  role: UserRole;
  onNavigate: (page: Page) => void;
  onPaymentSuccess: () => void;
}

export function PaymentPage({ role, onNavigate, onPaymentSuccess }: PaymentPageProps) {
  const { isAuthenticated } = useAuth();

  const subscriptionPrice = 499;
  const subscriptionPeriod = 'month';

  const planRole: SubscriptionPlanRole = 'business';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [form, setForm] = useState({
    senderFullName: '',
    senderPhone: '',
    transferReference: '',
    transferDate: new Date().toISOString().slice(0, 10),
  });

  const validate = () => {
    if (!isAuthenticated) {
      setError('Please sign in before completing payment.');
      return false;
    }
    if (!form.senderFullName.trim() || form.senderFullName.trim().length < 3) {
      setError('Sender full name is required.');
      return false;
    }
    if (!/^\+?[\d\s\-]{8,20}$/.test(form.senderPhone.trim())) {
      setError('Please enter a valid sender phone number.');
      return false;
    }
    const normalizedRef = form.transferReference.trim().toUpperCase();
    if (!/^[A-Z0-9\-]{6,40}$/.test(normalizedRef)) {
      setError('Transfer reference must be 6-40 chars (A-Z, 0-9, -).');
      return false;
    }
    if (!form.transferDate) {
      setError('Transfer date is required.');
      return false;
    }
    return true;
  };

  const handleSubmitWish = async () => {
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      const submitRes = await submitWishSubscriptionPayment({
        planRole,
        senderFullName: form.senderFullName.trim(),
        senderPhone: form.senderPhone.trim(),
        transferReference: form.transferReference.trim().toUpperCase(),
        transferDate: form.transferDate,
        amountTotal: subscriptionPrice,
      });

      const start = Date.now();
      const poll = async (): Promise<void> => {
        const status = await fetchWishSubscriptionPaymentStatus(submitRes.paymentId);
        if (status.status === 'succeeded') {
          setSuccess(true);
          setTimeout(() => {
            onPaymentSuccess();
            onNavigate('home');
          }, 1000);
          return;
        }
        if (status.status === 'failed' || status.status === 'canceled' || status.status === 'refunded') {
          setError(`Payment ${status.status}. Please contact support if needed.`);
          return;
        }
        if (Date.now() - start > 90000) {
          setError('Payment submitted and pending verification. We will notify you once approved.');
          return;
        }
        setTimeout(() => void poll(), 2000);
      };

      await poll();
    } catch (err: any) {
      setError(err?.message || 'Failed to submit Wish Money transfer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">Payment Successful!</h1>
            <p className="text-neutral-600">Your {role} account has been activated.</p>
            <p className="text-sm text-neutral-500 mt-4">Redirecting to home page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-neutral-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="grid md:grid-cols-5">
            {/* Payment Form - Left Side */}
            <div className="md:col-span-3 p-8">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-neutral-900 mb-2">Complete Your Payment</h1>
                <p className="text-neutral-600">Secure payment to activate your {role} account</p>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Security Badge */}
              <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <Lock className="w-5 h-5 text-green-600" />
                <p className="text-sm text-green-700">
                  <strong>Secure payment.</strong> Your information is encrypted and protected.
                </p>
              </div>

              {/* Wish Money Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="senderFullName">Sender full name (Wish Money)</Label>
                  <Input
                    id="senderFullName"
                    value={form.senderFullName}
                    onChange={(e) => setForm((p) => ({ ...p, senderFullName: e.target.value }))}
                    placeholder="Full name used in transfer"
                  />
                </div>
                <div>
                  <Label htmlFor="senderPhone">Sender phone</Label>
                  <Input
                    id="senderPhone"
                    value={form.senderPhone}
                    onChange={(e) => setForm((p) => ({ ...p, senderPhone: e.target.value }))}
                    placeholder="+961 70 123 456"
                  />
                </div>
                <div>
                  <Label htmlFor="transferReference">Transfer reference</Label>
                  <Input
                    id="transferReference"
                    value={form.transferReference}
                    onChange={(e) => setForm((p) => ({ ...p, transferReference: e.target.value.toUpperCase() }))}
                    placeholder="e.g. WM-8A9B2C"
                  />
                </div>
                <div>
                  <Label htmlFor="transferDate">Transfer date</Label>
                  <Input
                    id="transferDate"
                    type="date"
                    value={form.transferDate}
                    onChange={(e) => setForm((p) => ({ ...p, transferDate: e.target.value }))}
                  />
                </div>
                <Button type="button" className="w-full" onClick={handleSubmitWish} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Verifying transfer...
                    </>
                  ) : (
                    `Submit Wish Money $ ${subscriptionPrice}/${subscriptionPeriod}`
                  )}
                </Button>
              </div>

              <p className="text-xs text-neutral-500 text-center mt-4">
                By completing this payment, you agree to our Terms of Service and Subscription Policy
              </p>
            </div>

            {/* Order Summary - Right Side */}
            <div className="md:col-span-2 bg-neutral-50 p-8 border-l border-neutral-200">
              <h2 className="font-semibold text-neutral-900 mb-4">Order Summary</h2>

              <div className="space-y-4">
                <div className="p-4 bg-white rounded-lg border border-neutral-200">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      🏢
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 capitalize">{role} Account</h3>
                      <p className="text-sm text-neutral-600">Monthly subscription</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Subscription</span>
                      <span className="font-medium">$ {subscriptionPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Setup fee</span>
                      <span className="font-medium">$ 0</span>
                    </div>
                    <div className="border-t border-neutral-200 pt-2 flex justify-between">
                      <span className="font-semibold">Total due today</span>
                      <span className="font-bold text-green-600">$ {subscriptionPrice}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <h3 className="font-medium text-neutral-900">What's included:</h3>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-600">Full platform access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-600">Email verification</span>
                    </li>
                    {role === 'business' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-600">Sell products online</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-600">Business dashboard</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-600">Order management</span>
                        </li>
                      </>
                    )}
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-neutral-600">Priority support</span>
                    </li>
                  </ul>
                </div>

                <div className="text-xs text-neutral-500 pt-4 border-t border-neutral-200">
                  <p>Send the exact amount via Wish Money, then submit your transfer reference.</p>
                  <p className="mt-2">Activation only happens after secure server-side verification.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
