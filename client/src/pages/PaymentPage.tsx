import React, { useState } from 'react';
import { CreditCard, Lock, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { UserRole } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Page } from '../App';

interface PaymentPageProps {
  role: UserRole;
  onNavigate: (page: Page) => void;
  onPaymentSuccess: () => void;
}

export function PaymentPage({ role, onNavigate, onPaymentSuccess }: PaymentPageProps) {
  const [formData, setFormData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const subscriptionPrice = role === 'engineer' ? 299 : 499;
  const subscriptionPeriod = 'month';

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g);
    return chunks ? chunks.join(' ') : cleaned;
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const validateCard = () => {
    const cardNumberClean = formData.cardNumber.replace(/\s/g, '');
    
    if (cardNumberClean.length !== 16) {
      setError('Card number must be 16 digits');
      return false;
    }

    if (!formData.cardName.trim()) {
      setError('Please enter cardholder name');
      return false;
    }

    const expiryClean = formData.expiryDate.replace('/', '');
    if (expiryClean.length !== 4) {
      setError('Please enter valid expiry date (MM/YY)');
      return false;
    }

    const month = parseInt(expiryClean.slice(0, 2));
    if (month < 1 || month > 12) {
      setError('Invalid expiry month');
      return false;
    }

    if (formData.cvv.length !== 3) {
      setError('CVV must be 3 digits');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateCard()) {
      return;
    }

    setLoading(true);

    try {
      // TODO: Implement actual payment processing via Supabase backend
      // Simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simulate success
      setSuccess(true);
      setTimeout(() => {
        onPaymentSuccess();
        onNavigate('home');
      }, 2000);
    } catch (err) {
      setError('Payment failed. Please check your card details and try again.');
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

              {/* Payment Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <div className="relative mt-1">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input
                      id="cardNumber"
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={formData.cardNumber}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value);
                        if (formatted.replace(/\s/g, '').length <= 16) {
                          setFormData({ ...formData, cardNumber: formatted });
                        }
                      }}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardName">Cardholder Name</Label>
                  <Input
                    id="cardName"
                    type="text"
                    placeholder="AHMED AL-MANSOUR"
                    value={formData.cardName}
                    onChange={(e) => setFormData({ ...formData, cardName: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      type="text"
                      placeholder="MM/YY"
                      value={formData.expiryDate}
                      onChange={(e) => {
                        const formatted = formatExpiryDate(e.target.value);
                        if (formatted.replace('/', '').length <= 4) {
                          setFormData({ ...formData, expiryDate: formatted });
                        }
                      }}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      type="text"
                      placeholder="123"
                      maxLength={3}
                      value={formData.cvv}
                      onChange={(e) => {
                        if (/^\d*$/.test(e.target.value)) {
                          setFormData({ ...formData, cvv: e.target.value });
                        }
                      }}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing payment...
                    </>
                  ) : (
                    `Pay SR ${subscriptionPrice}/${subscriptionPeriod}`
                  )}
                </Button>
              </form>

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
                      {role === 'engineer' ? '🔧' : '🏢'}
                    </div>
                    <div>
                      <h3 className="font-medium text-neutral-900 capitalize">{role} Account</h3>
                      <p className="text-sm text-neutral-600">Monthly subscription</p>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Subscription</span>
                      <span className="font-medium">SR {subscriptionPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-600">Setup fee</span>
                      <span className="font-medium">SR 0</span>
                    </div>
                    <div className="border-t border-neutral-200 pt-2 flex justify-between">
                      <span className="font-semibold">Total due today</span>
                      <span className="font-bold text-green-600">SR {subscriptionPrice}</span>
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
                    {role === 'engineer' && (
                      <>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-600">Professional tools</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                          <span className="text-neutral-600">Analytics dashboard</span>
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
                  <p>Your subscription will renew automatically on the same date each month.</p>
                  <p className="mt-2">Cancel anytime from your account settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
