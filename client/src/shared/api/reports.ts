import { apiGet, apiPost } from './client';

export const REPORT_REASON_OPTIONS = [
  { id: 'spam', label: 'Spam or unwanted promotion' },
  { id: 'fake_or_misleading', label: 'Fake or misleading business' },
  { id: 'inappropriate_content', label: 'Inappropriate content' },
  { id: 'scam_or_fraud', label: 'Scam or fraud' },
  { id: 'harassment', label: 'Harassment or abuse' },
  { id: 'other', label: 'Other' },
] as const;

export type ReportReasonId = (typeof REPORT_REASON_OPTIONS)[number]['id'];

export interface BusinessReportDto {
  id: string;
  reason: string;
  reasonLabel: string;
  details: string;
  status: 'pending' | 'reviewed' | 'dismissed' | 'action_taken';
  adminNote?: string;
  createdAt?: string;
  resolvedAt?: string | null;
  business?: {
    id: string;
    fullName?: string;
    email?: string;
    companyName?: string;
    avatar?: string;
    reportsCount?: number;
    pendingReportsCount?: number;
  };
  reporter?: {
    id: string;
    fullName?: string;
    email?: string;
    avatar?: string;
  };
}

export async function fetchMyBusinessReport(businessId: string): Promise<{
  reported: boolean;
  report: BusinessReportDto | null;
  reasons: Array<{ id: string; label: string }>;
}> {
  return apiGet(`/reports/business/${businessId}/mine`);
}

export async function submitBusinessReport(
  businessId: string,
  body: { reason: ReportReasonId | string; details?: string }
): Promise<{ report: BusinessReportDto }> {
  return apiPost(`/reports/business/${businessId}`, body);
}

export async function fetchAdminReports(params?: {
  status?: string;
}): Promise<{ reports: BusinessReportDto[]; pendingCount: number }> {
  const q = new URLSearchParams();
  if (params?.status) q.set('status', params.status);
  const qs = q.toString();
  return apiGet(`/admin/reports${qs ? `?${qs}` : ''}`);
}

export async function resolveAdminReport(
  reportId: string,
  body: {
    action: 'dismiss' | 'notify' | 'delete';
    message?: string;
    adminNote?: string;
  }
): Promise<{
  ok: boolean;
  notified?: boolean;
  deleted?: boolean;
  businessId?: string;
  report?: BusinessReportDto;
}> {
  return apiPost(`/admin/reports/${reportId}/resolve`, body);
}
