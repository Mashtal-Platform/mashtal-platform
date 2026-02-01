import React, { useState } from 'react';
import { CreditCard, MapPin, User, Lock, CheckCircle } from 'lucide-react';
import { CartItem } from '../App';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onSuccess: () => void;
}

export function CheckoutPage({ cartItems, onSuccess }: CheckoutPageProps) {
  const [step, setStep] = useState<'info' | 'payment' | 'success'>('info');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15;
  const shipping = subtotal > 200 ? 0 : 25;
  const total = subtotal + tax + shipping;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleContinueToPayment = () => {
    setStep('payment');
  };

  const handleCompleteOrder = () => {
    // In a real app, this would process the payment
    setStep('success');
    setTimeout(() => {
      onSuccess();
    }, 3000);
  };

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
              <div className="text-2xl text-green-600">SR {total.toFixed(2)}</div>
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
            <span className={step === 'info' ? 'text-green-600' : 'text-neutral-600'}>
              1. Shipping Info
            </span>
            <span className="text-neutral-300">→</span>
            <span className={step === 'payment' ? 'text-green-600' : 'text-neutral-600'}>
              2. Payment
            </span>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            {step === 'info' && (
              <div className="bg-white rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <MapPin className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl text-neutral-900">Shipping Information</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="+966 XX XXX XXXX"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">City</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="Riyadh"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm text-neutral-700 mb-2">Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="Street address"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Postal Code</label>
                    <input
                      type="text"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="12345"
                    />
                  </div>
                </div>

                <button
                  onClick={handleContinueToPayment}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                >
                  Continue to Payment
                </button>
              </div>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-xl p-6 space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-neutral-200">
                  <CreditCard className="w-6 h-6 text-green-600" />
                  <h2 className="text-xl text-neutral-900">Payment Information</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Card Number</label>
                    <input
                      type="text"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="1234 5678 9012 3456"
                      maxLength={19}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-700 mb-2">Cardholder Name</label>
                    <input
                      type="text"
                      name="cardName"
                      value={formData.cardName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                      placeholder="Name on card"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-neutral-700 mb-2">Expiry Date</label>
                      <input
                        type="text"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                        placeholder="MM/YY"
                        maxLength={5}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-neutral-700 mb-2">CVV</label>
                      <input
                        type="text"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                        placeholder="123"
                        maxLength={3}
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                  <Lock className="w-5 h-5 text-green-600 mt-0.5" />
                  <div className="text-sm text-neutral-700">
                    Your payment information is encrypted and secure. We never store your card details.
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('info')}
                    className="flex-1 border-2 border-neutral-200 text-neutral-700 py-3 rounded-lg hover:border-green-600 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCompleteOrder}
                    className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Complete Order
                  </button>
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
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="text-sm text-neutral-900">{item.productName}</div>
                      <div className="text-xs text-neutral-600">Qty: {item.quantity}</div>
                      <div className="text-sm text-green-600">SR {(item.price * item.quantity).toFixed(2)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-neutral-700">
                  <span>Subtotal</span>
                  <span>SR {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Tax (15%)</span>
                  <span>SR {tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `SR ${shipping.toFixed(2)}`}</span>
                </div>
                <div className="border-t border-neutral-200 pt-3">
                  <div className="flex justify-between text-lg">
                    <span className="text-neutral-900">Total</span>
                    <span className="text-neutral-900">SR {total.toFixed(2)}</span>
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
