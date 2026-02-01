import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { CartItem } from '../App';

interface CartPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  onCheckout: () => void;
}

export function CartPage({ cartItems, onUpdateQuantity, onRemove, onCheckout }: CartPageProps) {
  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = subtotal * 0.15; // 15% VAT
  const shipping = subtotal > 200 ? 0 : 25; // Free shipping over SR 200
  const total = subtotal + tax + shipping;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">
            Shopping Cart
          </h1>
          <p className="text-neutral-600">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <ShoppingBag className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">Your cart is empty</h3>
            <p className="text-neutral-600 mb-6">Add some products to get started</p>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item) => (
                <div key={item.id} className="bg-white rounded-xl p-6 flex gap-4">
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-lg text-neutral-900">{item.productName}</h3>
                        <p className="text-sm text-neutral-600">{item.businessName}</p>
                      </div>
                      <button
                        onClick={() => onRemove(item.id)}
                        className="text-red-500 hover:text-red-600 p-2 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                          className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                          className="p-1 hover:bg-neutral-100 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="text-lg text-green-600">
                        SR {(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl p-6 sticky top-24">
                <h3 className="text-xl text-neutral-900 mb-6">Order Summary</h3>
                
                <div className="space-y-3 mb-6">
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
                  {subtotal < 200 && (
                    <p className="text-sm text-green-600">
                      Add SR {(200 - subtotal).toFixed(2)} more for free shipping
                    </p>
                  )}
                  <div className="border-t border-neutral-200 pt-3">
                    <div className="flex justify-between text-lg">
                      <span className="text-neutral-900">Total</span>
                      <span className="text-neutral-900">SR {total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onCheckout}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors mb-3"
                >
                  Proceed to Checkout
                </button>
                
                <p className="text-xs text-neutral-500 text-center">
                  Secure checkout powered by Mashtal
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
