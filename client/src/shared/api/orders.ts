import { apiGet, apiPost } from './client';

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
  status: 'processing' | 'shipped' | 'delivered' | 'cancelled';
  total: number;
  createdAt: string;
  items: OrderItemDto[];
}

export async function fetchMyOrders(): Promise<OrderDto[]> {
  return apiGet('/orders');
}

export async function createOrder(input: {
  items: { productId: string; quantity: number; price: number }[];
}) {
  return apiPost('/orders', input);
}

