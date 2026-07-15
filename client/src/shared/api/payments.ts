import { apiGet, apiPost } from './client';

export interface PaymentLegDto {
  legKey: string;
  type: 'order_seller' | 'order_tax' | string;
  toLabel: string;
  toWishPhone?: string;
  toWishAccount?: string;
  amount: number;
  status: string;
  clientSecret: string;
  stripePaymentIntentId: string;
}

export interface LedgerLegDto {
  legKey: string;
  type: string;
  toLabel: string;
  amount: number;
  status: string;
}

export interface CreateStripePaymentIntentDto {
  paymentId: string;
  clientSecret: string | null;
  amountTotal: number;
  amountSubtotal?: number;
  amountTax?: number;
  currency?: string;
  taxRate?: number;
  legs: PaymentLegDto[];
  ledgerLegs?: LedgerLegDto[];
}

export interface PaymentStatusDto {
  id: string;
  status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  order: any | null;
  amountTotal: number;
  amountSubtotal?: number;
  amountTax?: number;
  currency?: string;
  legs?: Array<{
    legKey: string;
    type: string;
    toLabel: string;
    amount: number;
    status: string;
  }>;
}

export async function createStripePaymentIntent(input: {
  items: { productId: string; quantity: number }[];
}): Promise<CreateStripePaymentIntentDto> {
  return apiPost('/payments/stripe/create-intent', input);
}

export async function fetchStripePaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
  return apiGet(`/payments/stripe/${paymentId}`);
}

// ============= Subscription payments (business) ============

export type SubscriptionPlanRole = 'business';

export interface CreateStripeSubscriptionIntentDto {
  paymentId: string;
  clientSecret: string;
  amountTotal: number;
}

export interface SubscriptionPaymentStatusDto {
  id: string;
  status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  amountTotal: number;
  planRole: SubscriptionPlanRole;
  userSubscriptionStatus: 'active' | 'inactive';
}

export async function createStripeSubscriptionPaymentIntent(input: {
  planRole: SubscriptionPlanRole;
}): Promise<CreateStripeSubscriptionIntentDto> {
  return apiPost('/payments/stripe/subscription/create-intent', input);
}

export async function fetchStripeSubscriptionPaymentStatus(
  paymentId: string
): Promise<SubscriptionPaymentStatusDto> {
  return apiGet(`/payments/stripe/subscription/${paymentId}`);
}
