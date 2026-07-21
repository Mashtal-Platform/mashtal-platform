import { api, apiGet } from './client';

export type DashboardPeriod = 'week' | 'month' | 'year';

export interface DashboardStatsDto {
  totalRevenue: number;
  totalSold: number;
  averageUnitsPerOrder: number;
  revenueGrowth: number;
  soldGrowth: number;
  conversionGrowth: number;
}

export interface DashboardByProductDto {
  productId: string;
  name: string;
  value: number;
  percentage: string; // one decimal string (e.g. "12.3")
}

export interface DashboardMonthlyPointDto {
  month: string; // e.g. "Jan"
  revenue: number;
  orders: number; // units sold; UI labels this as "Orders"
}

export interface DashboardTopProductDto {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  sold: number;
  revenue: number;
  stock: number;
}

export interface BusinessDashboardDto {
  period: DashboardPeriod;
  stats: DashboardStatsDto;
  salesByProduct: DashboardByProductDto[];
  revenueByProduct: DashboardByProductDto[];
  monthlySeries: DashboardMonthlyPointDto[];
  topProducts: DashboardTopProductDto[];
}

export interface BusinessOrderItemDto {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  priceAtPurchase: number;
  lineTotal: number;
}

export interface BusinessOrderDto {
  id: string;
  createdAt: string;
  status: string;
  buyer: {
    id?: string;
    fullName: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  items: BusinessOrderItemDto[];
  sellerRevenue: number;
}

export async function fetchBusinessDashboardAnalytics(params: {
  businessId: string;
  period: DashboardPeriod;
}): Promise<BusinessDashboardDto> {
  const { businessId, period } = params;
  const q = new URLSearchParams({ period });
  // GET /api/dashboard/business/:businessId?period=month
  return apiGet<BusinessDashboardDto>(`/dashboard/business/${businessId}?${q.toString()}`);
}

export async function fetchBusinessOrders(params: {
  businessId: string;
  limit?: number;
}): Promise<BusinessOrderDto[]> {
  const { businessId, limit = 50 } = params;
  const q = new URLSearchParams({ limit: String(limit) });
  const data = await apiGet<{ orders: BusinessOrderDto[] }>(
    `/dashboard/business/${businessId}/orders?${q.toString()}`
  );
  return Array.isArray(data?.orders) ? data.orders : [];
}

export async function fetchProductSoldCounts(businessId: string): Promise<Record<string, number>> {
  const data = await apiGet<{ counts: Record<string, number> }>(
    `/dashboard/business/${businessId}/product-sold`
  );
  return data?.counts || {};
}

