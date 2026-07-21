import { apiDelete, apiGet, apiPatch, apiPost } from './client';

export interface AdminOverviewDto {
  usersCount: number;
  businessesCount: number;
  activeBusinesses: number;
  pendingSubscriptions: number;
  ordersCount: number;
  expiringSoonCount?: number;
  revenueTax: number;
  revenueFees: number;
  mashtalIncomeTotal: number;
  mashtalIncomeYear: number;
  mashtalIncomeYearTax: number;
  mashtalIncomeYearFees: number;
  gmvSellers: number;
  transactionCounts: Record<string, { total: number; count: number }>;
  recentUsers: AdminUserDto[];
  volumeByDay: Array<{ date: string; volume: number; tax?: number; fees?: number; count: number }>;
  mashtalIncomeByMonth: Array<{ month: string; tax: number; fees: number; total: number }>;
}

export interface AdminUserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  verified?: boolean;
  subscriptionStatus?: string;
  subscriptionStartedAt?: string | null;
  subscriptionExpiresAt?: string | null;
  phone?: string;
  location?: string;
  companyName?: string;
  wishPhone?: string;
  wishAccountNumber?: string;
  createdAt?: string;
  pendingSubscriptionPaymentId?: string | null;
  pendingSubscriptionStatus?: string | null;
  daysRemaining?: number | null;
  monthsActive?: number | null;
  expiresSoon?: boolean;
  reportsCount?: number;
  pendingReportsCount?: number;
}

export interface AdminTransactionDto {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  toLabel: string;
  toWishPhone?: string;
  toPhone?: string;
  toWishAccount?: string;
  stripePaymentIntentId?: string;
  legKey?: string;
  paymentId?: string | null;
  orderId?: string | null;
  createdAt?: string;
  fromUser?: { id: string; fullName: string; email: string; phone?: string } | null;
  toUser?: { id: string; fullName: string; email: string; phone?: string } | null;
}

export interface AdminTransactionGroupDto {
  id: string;
  createdAt?: string;
  buyer?: { id?: string; fullName?: string; email?: string; phone?: string } | null;
  orderId?: string | null;
  items: Array<{ name: string; quantity: number; priceAtPurchase?: number }>;
  legs: AdminTransactionDto[];
  amountTotal: number;
  mashtalIncome: number;
}

export async function fetchAdminOverview(): Promise<AdminOverviewDto> {
  return apiGet('/admin/overview');
}

export async function fetchAdminUsers(params?: {
  role?: string;
  search?: string;
}): Promise<{ users: AdminUserDto[]; total: number }> {
  const q = new URLSearchParams();
  if (params?.role) q.set('role', params.role);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return apiGet(`/admin/users${qs ? `?${qs}` : ''}`);
}

export async function createAdminUser(input: {
  fullName: string;
  email: string;
  password: string;
  role: string;
}): Promise<AdminUserDto> {
  return apiPost('/admin/users', input);
}

export async function updateAdminUser(
  id: string,
  input: Record<string, unknown>
): Promise<AdminUserDto> {
  return apiPatch(`/admin/users/${id}`, input);
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiDelete(`/admin/users/${id}`);
}

export async function fetchAdminBusinesses(params?: {
  status?: string;
  search?: string;
}): Promise<{ businesses: AdminUserDto[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  if (params?.search) q.set('search', params.search);
  const qs = q.toString();
  return apiGet(`/admin/businesses${qs ? `?${qs}` : ''}`);
}

export async function fetchAdminTransactions(params?: {
  type?: string;
  status?: string;
}): Promise<{
  transactions: AdminTransactionDto[];
  groups: AdminTransactionGroupDto[];
  total: number;
}> {
  const q = new URLSearchParams();
  if (params?.type) q.set('type', params.type);
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiGet(`/admin/transactions${qs ? `?${qs}` : ''}`);
}

export async function fetchAdminSubscriptions(params?: {
  status?: string;
}): Promise<{ subscriptions: AdminUserDto[]; periodDays: number }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiGet(`/admin/subscriptions${qs ? `?${qs}` : ''}`);
}

export async function notifyExpiringSubscriptions(): Promise<{
  message: string;
  sent: number;
  candidates: number;
}> {
  return apiPost('/admin/subscriptions/notify-expiring', {});
}

export type AdminOrderStatus =
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export interface AdminOrderDto {
  id: string;
  status: AdminOrderStatus;
  total: number;
  createdAt?: string;
  cancelledBy?: string | null;
  cancelFeePercent?: number | null;
  cancelRefundPercent?: number | null;
  buyer?: { id: string; fullName: string; email: string; phone?: string } | null;
  items: Array<{
    quantity: number;
    priceAtPurchase: number;
    product: {
      id: string;
      name: string;
      image?: string;
      businessId?: string;
      businessName?: string;
    };
  }>;
}

export async function fetchAdminOrders(params?: {
  status?: string;
}): Promise<{ orders: AdminOrderDto[]; total: number; statuses: string[] }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiGet(`/admin/orders${qs ? `?${qs}` : ''}`);
}

export async function updateAdminOrderStatus(
  orderId: string,
  status: AdminOrderStatus
): Promise<{ order: AdminOrderDto }> {
  return apiPatch(`/admin/orders/${orderId}/status`, { status });
}
