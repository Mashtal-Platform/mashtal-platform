import { apiGet, apiPost, apiPatch } from './client';

export type OrderStatus =
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface OrderItemDto {
  product: {
    id: string;
    name: string;
    description?: string;
    image?: string;
    category?: string;
    price: number;
    businessId?: string;
    businessName?: string;
  };
  quantity: number;
  priceAtPurchase: number;
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemDto[];
  cancelledBy?: string | null;
  cancelFeePercent?: number | null;
  cancelRefundPercent?: number | null;
}

export async function fetchMyOrders(): Promise<OrderDto[]> {
  return apiGet('/orders');
}

export async function cancelOrder(orderId: string): Promise<{
  order: OrderDto;
  message: string;
  cancelFeePercent: number;
  cancelRefundPercent: number;
}> {
  return apiPost(`/orders/${orderId}/cancel`, {});
}

/** Business: mark order ready (from processing). */
export async function markOrderReady(orderId: string): Promise<{
  order: OrderDto;
  status: 'ready';
}> {
  return apiPatch(`/orders/${orderId}/ready`, {});
}

export async function createOrder(input: {
  items: { productId: string; quantity: number; price: number }[];
}) {
  return apiPost('/orders', input);
}
