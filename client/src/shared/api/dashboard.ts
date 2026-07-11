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

export async function fetchBusinessDashboardAnalytics(params: {
  businessId: string;
  period: DashboardPeriod;
}): Promise<BusinessDashboardDto> {
  const { businessId, period } = params;
  const q = new URLSearchParams({ period });
  // GET /api/dashboard/business/:businessId?period=month
  return apiGet<BusinessDashboardDto>(`/dashboard/business/${businessId}?${q.toString()}`);
}

