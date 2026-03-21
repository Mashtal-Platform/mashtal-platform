import { apiGet, apiPost } from './client';

export interface CreateStripePaymentIntentDto {
  paymentId: string;
  clientSecret: string;
  amountTotal: number;
}

export interface PaymentStatusDto {
  id: string;
  status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  order: any | null;
  amountTotal: number;
}

export async function createStripePaymentIntent(input: {
  items: { productId: string; quantity: number }[];
}): Promise<CreateStripePaymentIntentDto> {
  return apiPost('/payments/stripe/create-intent', input);
}

export async function fetchStripePaymentStatus(paymentId: string): Promise<PaymentStatusDto> {
  return apiGet(`/payments/stripe/${paymentId}`);
}

// ============= Subscription payments (engineer/business) ============

export type SubscriptionPlanRole = 'engineer' | 'business';

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

export async function fetchStripeSubscriptionPaymentStatus(paymentId: string): Promise<SubscriptionPaymentStatusDto> {
  return apiGet(`/payments/stripe/subscription/${paymentId}`);
}

export interface SubmitWishSubscriptionPaymentDto {
  paymentId: string;
  status: 'processing' | 'succeeded' | 'failed' | 'canceled' | 'initiated' | 'refunded';
  message: string;
}

export interface WishSubscriptionPaymentStatusDto {
  id: string;
  status: 'initiated' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded';
  amountTotal: number;
  planRole: SubscriptionPlanRole;
  transferReference: string | null;
  userSubscriptionStatus: 'active' | 'inactive';
}

export async function submitWishSubscriptionPayment(input: {
  planRole: SubscriptionPlanRole;
  senderFullName: string;
  senderPhone: string;
  transferReference: string;
  transferDate: string;
  amountTotal: number;
}): Promise<SubmitWishSubscriptionPaymentDto> {
  return apiPost('/payments/wish/subscription/submit', input);
}

export async function fetchWishSubscriptionPaymentStatus(paymentId: string): Promise<WishSubscriptionPaymentStatusDto> {
  return apiGet(`/payments/wish/subscription/${paymentId}`);
}

