// Centralized cart utilities and business logic

import { CartItem } from '../types';

const MAX_QUANTITY_PER_ITEM = 50;

export function getMaxCartQuantity(stock?: number): number {
  const stockCap = Number.isFinite(stock) && stock != null ? Math.max(0, Number(stock)) : MAX_QUANTITY_PER_ITEM;
  return Math.min(MAX_QUANTITY_PER_ITEM, stockCap);
}

export const addItemToCart = (
  currentCart: CartItem[],
  item: Omit<CartItem, 'id' | 'quantity'>
): { cart: CartItem[]; added: boolean; reason?: 'max' | 'out_of_stock' } => {
  const maxQty = getMaxCartQuantity(item.stock);
  if (maxQty <= 0) {
    return { cart: currentCart, added: false, reason: 'out_of_stock' };
  }

  const existingItem = currentCart.find((i) => i.productId === item.productId);

  if (existingItem) {
    if (existingItem.quantity >= maxQty) {
      return { cart: currentCart, added: false, reason: 'max' };
    }
    return {
      cart: currentCart.map((i) =>
        i.productId === item.productId
          ? { ...i, quantity: i.quantity + 1, stock: item.stock ?? i.stock }
          : i
      ),
      added: true,
    };
  }

  return {
    cart: [...currentCart, { ...item, id: Date.now().toString(), quantity: 1 }],
    added: true,
  };
};

export const updateCartQuantity = (
  currentCart: CartItem[],
  itemId: string,
  quantity: number
): CartItem[] => {
  if (quantity === 0) {
    return currentCart.filter((item) => item.id !== itemId);
  }

  return currentCart.map((item) => {
    if (item.id !== itemId) return item;
    const maxQty = getMaxCartQuantity(item.stock);
    const nextQty = Math.min(Math.max(1, quantity), maxQty);
    return { ...item, quantity: nextQty };
  });
};

export const removeCartItem = (
  currentCart: CartItem[],
  itemId: string
): CartItem[] => {
  return currentCart.filter((item) => item.id !== itemId);
};

export const calculateCartTotal = (cart: CartItem[]): number => {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

export const getCartItemCount = (cart: CartItem[]): number => {
  return cart.reduce((count, item) => count + item.quantity, 0);
};
