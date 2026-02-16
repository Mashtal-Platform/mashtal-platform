// Centralized cart utilities and business logic

import { CartItem, Product } from '../types';

export const addItemToCart = (
  currentCart: CartItem[],
  item: Omit<CartItem, 'id' | 'quantity'>
): CartItem[] => {
  const existingItem = currentCart.find(i => i.productId === item.productId);
  
  if (existingItem) {
    return currentCart.map(i => 
      i.productId === item.productId 
        ? { ...i, quantity: i.quantity + 1 }
        : i
    );
  }
  
  return [...currentCart, { ...item, id: Date.now().toString(), quantity: 1 }];
};

export const updateCartQuantity = (
  currentCart: CartItem[],
  itemId: string,
  quantity: number
): CartItem[] => {
  if (quantity === 0) {
    return currentCart.filter(item => item.id !== itemId);
  }
  
  return currentCart.map(item => 
    item.id === itemId ? { ...item, quantity } : item
  );
};

export const removeCartItem = (
  currentCart: CartItem[],
  itemId: string
): CartItem[] => {
  return currentCart.filter(item => item.id !== itemId);
};

export const calculateCartTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const getCartItemCount = (cart: CartItem[]): number => {
  return cart.reduce((count, item) => count + item.quantity, 0);
};
