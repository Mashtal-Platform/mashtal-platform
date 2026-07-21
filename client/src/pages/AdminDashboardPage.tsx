import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Users,
  Building2,
  ArrowLeftRight,
  Trash2,
  Plus,
  RefreshCw,
  Search,
  CalendarClock,
  Bell,
  Flag,
  Package,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  fetchAdminOverview,
  fetchAdminUsers,
  fetchAdminBusinesses,
  fetchAdminTransactions,
  fetchAdminSubscriptions,
  fetchAdminOrders,
  updateAdminOrderStatus,
  notifyExpiringSubscriptions,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  type AdminOverviewDto,
  type AdminUserDto,
  type AdminTransactionGroupDto,
  type AdminOrderDto,
  type AdminOrderStatus,
} from '../shared/api/admin';
import {
  fetchAdminReports,
  resolveAdminReport,
  type BusinessReportDto,
} from '../shared/api/reports';
import { toast } from 'sonner';
import { getImageUrl } from '../shared/api/client';

type Tab = 'overview' | 'users' | 'businesses' | 'subscriptions' | 'transactions' | 'orders' | 'reports';

const ORDER_STATUSES: AdminOrderStatus[] = [
  'processing',
  'ready',
  'completed',
  'cancelled',
];

function orderStatusClass(status: string) {
  switch (status) {
    case 'processing':
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    case 'ready':
      return 'bg-blue-50 text-blue-800 border-blue-200';
    case 'completed':
      return 'bg-green-50 text-green-800 border-green-200';
    case 'cancelled':
      return 'bg-red-50 text-red-800 border-red-200';
    default:
      return 'bg-neutral-50 text-neutral-700 border-neutral-200';
  }
}

const PIE_COLORS = ['#16a34a', '#2563eb', '#f59e0b', '#64748b'];

function fmtDate(value?: string | null) {
  if (!value) return '—';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function fmtMoney(n: number) {
  return `$${Number(n || 0).toFixed(2)}`;
}

export function AdminDashboardPage({
  initialTab = null,
  highlightPaymentId = null,
  highlightOrderId = null,
  onClearHighlight,
  onNavigate,
}: {
  initialTab?: Tab | null;
  highlightPaymentId?: string | null;
  highlightOrderId?: string | null;
  onClearHighlight?: () => void;
  onNavigate?: (page: string, params?: any) => void;
} = {}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>(initialTab || 'overview');
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [businesses, setBusinesses] = useState<AdminUserDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminUserDto[]>([]);
  const [periodDays, setPeriodDays] = useState(60);
  const [txGroups, setTxGroups] = useState<AdminTransactionGroupDto[]>([]);
  const [orders, setOrders] = useState<AdminOrderDto[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');
  const [orderBusyId, setOrderBusyId] = useState<string | null>(null);
  const [reports, setReports] = useState<BusinessReportDto[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');
  const [pendingReportsCount, setPendingReportsCount] = useState(0);
  const [reportActionBusy, setReportActionBusy] = useState<string | null>(null);
  const [notifyMessageDraft, setNotifyMessageDraft] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [highlightedPaymentId, setHighlightedPaymentId] = useState<string | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'visitor',
  });
  const onClearHighlightRef = useRef(onClearHighlight);
  const highlightedPaymentHandledRef = useRef<string | null>(null);
  const highlightedOrderHandledRef = useRef<string | null>(null);

  useEffect(() => {
    onClearHighlightRef.current = onClearHighlight;
  }, [onClearHighlight]);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!highlightPaymentId) {
      highlightedPaymentHandledRef.current = null;
      return;
    }
    setTab('transactions');
    setHighlightedPaymentId(highlightPaymentId);
  }, [highlightPaymentId]);

  useEffect(() => {
    if (!highlightOrderId) {
      highlightedOrderHandledRef.current = null;
      return;
    }
    setTab('orders');
    setHighlightedOrderId(highlightOrderId);
  }, [highlightOrderId]);

  const loadOverview = useCallback(async () => {
    const data = await fetchAdminOverview();
    setOverview(data);
  }, []);

  const loadUsers = useCallback(async () => {
    const data = await fetchAdminUsers({ search: userSearch || undefined });
    setUsers(data.users);
  }, [userSearch]);

  const loadBusinesses = useCallback(async () => {
    const data = await fetchAdminBusinesses();
    setBusinesses(data.businesses);
  }, []);

  const loadSubscriptions = useCallback(async () => {
    const data = await fetchAdminSubscriptions({
      status: subStatus || undefined,
    });
    setSubscriptions(data.subscriptions);
    setPeriodDays(data.periodDays || 60);
  }, [subStatus]);

  const loadTransactions = useCallback(async () => {
    const data = await fetchAdminTransactions({ type: txType || undefined });
    setTxGroups(data.groups || []);
  }, [txType]);

  const loadOrders = useCallback(async () => {
    const data = await fetchAdminOrders({
      status: orderStatusFilter !== 'all' ? orderStatusFilter : undefined,
    });
    setOrders(data.orders || []);
  }, [orderStatusFilter]);

  const handleUpdateOrderStatus = async (orderId: string, status: AdminOrderStatus) => {
    setOrderBusyId(orderId);
    try {
      const { order } = await updateAdminOrderStatus(orderId, status);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, ...order } : o)));
      toast.success(`Order status updated to ${status}`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order status');
    } finally {
      setOrderBusyId(null);
    }
  };

  const loadReports = useCallback(async () => {
    const data = await fetchAdminReports({
      status: reportStatusFilter || undefined,
    });
    setReports(data.reports || []);
    setPendingReportsCount(data.pendingCount || 0);
  }, [reportStatusFilter]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'overview') await loadOverview();
      else if (tab === 'users') await loadUsers();
      else if (tab === 'businesses') await loadBusinesses();
      else if (tab === 'subscriptions') await loadSubscriptions();
      else if (tab === 'orders') await loadOrders();
      else if (tab === 'reports') await loadReports();
      else await loadTransactions();
    } catch (err: any) {
      setError(err?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }, [
    tab,
    loadOverview,
    loadUsers,
    loadBusinesses,
    loadSubscriptions,
    loadTransactions,
    loadOrders,
    loadReports,
  ]);

  const handleResolveReport = async (
    reportId: string,
    action: 'dismiss' | 'notify' | 'delete'
  ) => {
    if (action === 'delete') {
      const ok = window.confirm(
        'Delete this business account permanently? This cannot be undone.'
      );
      if (!ok) return;
    }
    setReportActionBusy(`${reportId}:${action}`);
    setNotifyMsg('');
    try {
      await resolveAdminReport(reportId, {
        action,
        message: notifyMessageDraft[reportId]?.trim() || undefined,
      });
      toast.success(
        action === 'delete'
          ? 'Business account deleted'
          : action === 'notify'
            ? 'Warning notification sent'
            : 'Report dismissed'
      );
      await loadReports();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resolve report');
    } finally {
      setReportActionBusy(null);
    }
  };

  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Keep pending report badge fresh even on other tabs
  useEffect(() => {
    fetchAdminReports({ status: 'pending' })
      .then((data) => setPendingReportsCount(data.pendingCount || 0))
      .catch(() => {});
  }, [tab]);

  useEffect(() => {
    if (!highlightPaymentId || !highlightedPaymentId) return;
    if (loading && tab === 'transactions' && txGroups.length === 0) return;
    if (highlightedPaymentHandledRef.current === highlightPaymentId) return;

    const el = document.querySelector(`[data-payment-id="${highlightPaymentId}"]`);
    if (!el) return;

    highlightedPaymentHandledRef.current = highlightPaymentId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const clearTimer = setTimeout(() => {
      setHighlightedPaymentId(null);
      onClearHighlightRef.current?.();
    }, 3000);

    return () => clearTimeout(clearTimer);
  }, [highlightPaymentId, highlightedPaymentId, txGroups, loading, tab]);

  useEffect(() => {
    if (!highlightOrderId || !highlightedOrderId) return;
    if (loading && tab === 'orders' && orders.length === 0) return;
    if (highlightedOrderHandledRef.current === highlightOrderId) return;

    const el = document.querySelector(`[data-order-id="${highlightOrderId}"]`);
    if (!el) return;

    highlightedOrderHandledRef.current = highlightOrderId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const clearTimer = setTimeout(() => {
      setHighlightedOrderId(null);
      onClearHighlightRef.current?.();
    }, 3000);

    return () => clearTimeout(clearTimer);
  }, [highlightOrderId, highlightedOrderId, orders, loading, tab]);

  const pieData = overview
    ? [
        { name: t('admin.tax'), value: overview.revenueTax },
        { name: t('admin.subscriptions'), value: overview.revenueFees },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{t('admin.title')}</h1>
            <p className="text-neutral-600 mt-1">
              {t('admin.subtitle')}
            </p>
          </div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.refresh')}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              ['overview', LayoutDashboard, t('admin.overview')],
              ['users', Users, t('admin.users')],
              ['businesses', Building2, t('admin.businesses')],
              ['subscriptions', CalendarClock, t('admin.subscriptions')],
              ['transactions', ArrowLeftRight, t('admin.transactions')],
              ['orders', Package, t('admin.orders')],
              ['reports', Flag, t('admin.reports')],
            ] as const
          ).map(([id, Icon, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === id
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-green-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {id === 'reports' && pendingReportsCount > 0 ? (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                    tab === id ? 'bg-white/20 text-white' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {pendingReportsCount}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-100">
            {error}
          </div>
        )}
        {notifyMsg && (
          <div className="mb-4 p-3 rounded-lg bg-green-50 text-green-800 text-sm border border-green-100">
            {notifyMsg}
          </div>
        )}

        {tab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                [t('admin.users'), overview.usersCount],
                [t('admin.businesses'), overview.businessesCount],
                [t('admin.activePaid'), overview.activeBusinesses],
                [t('admin.expiringSoon'), overview.expiringSoonCount ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-white rounded-xl border border-neutral-100 p-5">
                  <div className="text-sm text-neutral-500">{label}</div>
                  <div className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">{t('admin.income')}</div>
                <div className="text-xl sm:text-2xl font-bold text-green-700 mt-1">
                  {fmtMoney(overview.mashtalIncomeTotal)}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  Tax {fmtMoney(overview.revenueTax)} · Fees {fmtMoney(overview.revenueFees)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">{t('admin.incomeYear')}</div>
                <div className="text-xl sm:text-2xl font-bold text-green-700 mt-1">
                  {fmtMoney(overview.mashtalIncomeYear)}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  Tax {fmtMoney(overview.mashtalIncomeYearTax)} · Fees{' '}
                  {fmtMoney(overview.mashtalIncomeYearFees)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">{t('admin.sellerGmv')}</div>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
                  {fmtMoney(overview.gmvSellers)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">{t('admin.orders')}</div>
                <div className="text-xl sm:text-2xl font-bold text-neutral-900 mt-1">
                  {overview.ordersCount}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  {t('admin.incomeByMonth')}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.mashtalIncomeByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tax" stackId="a" fill="#16a34a" name={t('admin.tax')} />
                    <Bar dataKey="fees" stackId="a" fill="#2563eb" name={t('admin.subscriptions')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  {t('admin.income30Days')}
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={overview.volumeByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tax" stroke="#16a34a" name={t('admin.tax')} strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="fees"
                      stroke="#2563eb"
                      name={t('admin.subscriptions')}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-5 max-w-md">
              <h3 className="font-semibold text-neutral-900 mb-4">{t('admin.incomeMix')}</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-neutral-500 py-10 text-center">{t('admin.noIncomeYet')}</p>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-neutral-100 p-5">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" /> {t('admin.createUser')}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <Input
                  placeholder={t('admin.fullName')}
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                />
                <Input
                  placeholder={t('common.email')}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
                <Input
                  placeholder="Password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
                <select
                  className="border border-neutral-200 rounded-md px-3 text-sm"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                >
                  <option value="visitor">visitor</option>
                  <option value="business">business</option>
                  <option value="admin">admin</option>
                </select>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={async () => {
                    try {
                      await createAdminUser(newUser as any);
                      setNewUser({ fullName: '', email: '', password: '', role: 'visitor' });
                      await loadUsers();
                    } catch (err: any) {
                      setError(err?.message || 'Create failed');
                    }
                  }}
                >
                  Create
                </Button>
              </div>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                <Input
                  className="pl-9"
                  placeholder="Search users…"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
              </div>
              <Button variant="outline" onClick={() => void loadUsers()}>
                Search
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="p-2 sm:p-3">Name</th>
                    <th className="p-2 sm:p-3">Email</th>
                    <th className="p-2 sm:p-3">Role</th>
                    <th className="p-2 sm:p-3">Sub</th>
                    <th className="p-2 sm:p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-neutral-100">
                      <td className="p-2 sm:p-3 font-medium">{u.fullName}</td>
                      <td className="p-2 sm:p-3">{u.email}</td>
                      <td className="p-2 sm:p-3">
                        <select
                          className="border rounded px-2 py-1"
                          value={u.role}
                          onChange={async (e) => {
                            await updateAdminUser(u.id, { role: e.target.value });
                            await loadUsers();
                          }}
                        >
                          <option value="visitor">visitor</option>
                          <option value="business">business</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="p-2 sm:p-3">
                        {u.role === 'business' ? (
                          <select
                            className="border rounded px-2 py-1"
                            value={u.subscriptionStatus || 'inactive'}
                            onChange={async (e) => {
                              await updateAdminUser(u.id, {
                                subscriptionStatus: e.target.value,
                              });
                              await loadUsers();
                            }}
                          >
                            <option value="inactive">inactive</option>
                            <option value="active">active</option>
                          </select>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-2 sm:p-3">
                        <button
                          type="button"
                          className="text-red-600 hover:bg-red-50 p-2 rounded"
                          onClick={async () => {
                            if (!confirm(`Delete ${u.email}?`)) return;
                            await deleteAdminUser(u.id);
                            await loadUsers();
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'businesses' && (
          <div className="bg-white rounded-xl border border-neutral-100 overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="p-2 sm:p-3">Business</th>
                  <th className="p-2 sm:p-3">Email</th>
                  <th className="p-2 sm:p-3">Reports</th>
                  <th className="p-2 sm:p-3">Whish phone</th>
                  <th className="p-2 sm:p-3">Subscription</th>
                  <th className="p-2 sm:p-3">Expires</th>
                  <th className="p-2 sm:p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-t border-neutral-100">
                    <td className="p-2 sm:p-3 font-medium">{b.companyName || b.fullName}</td>
                    <td className="p-2 sm:p-3">{b.email}</td>
                    <td className="p-2 sm:p-3">
                      {(b.reportsCount ?? 0) > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setReportStatusFilter('');
                            setTab('reports');
                          }}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100"
                          title="View reports for this business"
                        >
                          <Flag className="w-3.5 h-3.5" />
                          {b.reportsCount}
                          {(b.pendingReportsCount ?? 0) > 0 ? (
                            <span className="text-amber-700">({b.pendingReportsCount} pending)</span>
                          ) : null}
                        </button>
                      ) : (
                        <span className="text-neutral-400 text-xs">0</span>
                      )}
                    </td>
                    <td className="p-2 sm:p-3">{b.wishPhone || '—'}</td>
                    <td className="p-2 sm:p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          b.subscriptionStatus === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {b.subscriptionStatus || 'inactive'}
                      </span>
                    </td>
                    <td className="p-2 sm:p-3 whitespace-nowrap">{fmtDate(b.subscriptionExpiresAt)}</td>
                    <td className="p-2 sm:p-3 flex gap-2">
                      <Button
                        size="sm"
                        className="h-8 bg-green-600 hover:bg-green-700"
                        onClick={async () => {
                          await updateAdminUser(b.id, { subscriptionStatus: 'active' });
                          await loadBusinesses();
                        }}
                      >
                        Activate (60d)
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8"
                        onClick={async () => {
                          await updateAdminUser(b.id, { subscriptionStatus: 'inactive' });
                          await loadBusinesses();
                        }}
                      >
                        Suspend
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'subscriptions' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center justify-between">
              <div className="flex gap-2 items-center">
                <select
                  className="border border-neutral-200 rounded-md px-3 text-sm bg-white"
                  value={subStatus}
                  onChange={(e) => setSubStatus(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="active">active</option>
                  <option value="inactive">inactive</option>
                </select>
                <Button variant="outline" onClick={() => void loadSubscriptions()}>
                  Filter
                </Button>
                <span className="text-sm text-neutral-500">
                  Period: {periodDays} days · renew required after expiry
                </span>
              </div>
              <Button
                className="bg-amber-600 hover:bg-amber-700"
                onClick={async () => {
                  try {
                    setNotifyMsg('');
                    const res = await notifyExpiringSubscriptions();
                    setNotifyMsg(res.message || `Sent ${res.sent} reminder(s)`);
                    await loadSubscriptions();
                  } catch (err: any) {
                    setError(err?.message || 'Failed to send notifications');
                  }
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Notify expiring in 3 days
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="p-2 sm:p-3">Business</th>
                    <th className="p-2 sm:p-3">Status</th>
                    <th className="p-2 sm:p-3">Started</th>
                    <th className="p-2 sm:p-3">Expires</th>
                    <th className="p-2 sm:p-3">Days left</th>
                    <th className="p-2 sm:p-3">Months</th>
                    <th className="p-2 sm:p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s) => (
                    <tr
                      key={s.id}
                      className={`border-t border-neutral-100 ${
                        s.expiresSoon ? 'bg-amber-50/60' : ''
                      }`}
                    >
                      <td className="p-2 sm:p-3">
                        <div className="font-medium">{s.companyName || s.fullName}</div>
                        <div className="text-xs text-neutral-500">{s.email}</div>
                        {s.phone ? (
                          <div className="text-xs text-neutral-500">{s.phone}</div>
                        ) : null}
                      </td>
                      <td className="p-2 sm:p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            s.subscriptionStatus === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-neutral-100 text-neutral-700'
                          }`}
                        >
                          {s.subscriptionStatus || 'inactive'}
                        </span>
                      </td>
                      <td className="p-2 sm:p-3 whitespace-nowrap">{fmtDate(s.subscriptionStartedAt)}</td>
                      <td className="p-2 sm:p-3 whitespace-nowrap">{fmtDate(s.subscriptionExpiresAt)}</td>
                      <td className="p-2 sm:p-3">
                        {s.daysRemaining == null
                          ? '—'
                          : s.daysRemaining < 0
                            ? `Ended ${Math.abs(s.daysRemaining)}d ago`
                            : `${s.daysRemaining}d`}
                      </td>
                      <td className="p-2 sm:p-3">
                        {s.monthsActive != null ? `${s.monthsActive} mo` : '—'}
                      </td>
                      <td className="p-2 sm:p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8"
                          onClick={async () => {
                            await updateAdminUser(s.id, { subscriptionStatus: 'active' });
                            await loadSubscriptions();
                          }}
                        >
                          Renew / activate
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscriptions.length === 0 && (
                <p className="p-6 text-center text-neutral-500 text-sm">{t('admin.noBusinesses')}</p>
              )}
            </div>
          </div>
        )}

        {tab === 'transactions' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select
                className="border border-neutral-200 rounded-md px-3 text-sm bg-white"
                value={txType}
                onChange={(e) => setTxType(e.target.value)}
              >
                <option value="">All types</option>
                <option value="order_seller">order_seller</option>
                <option value="order_tax">order_tax</option>
                <option value="business_subscription">business_subscription</option>
              </select>
              <Button variant="outline" onClick={() => void loadTransactions()}>
                Filter
              </Button>
            </div>

            {txGroups.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-8 text-center text-neutral-500 text-sm">
                {t('admin.noTransactions')}
              </div>
            ) : (
              <div className="space-y-4">
                {txGroups.map((g) => (
                  <div
                    key={g.id}
                    data-payment-id={g.id}
                    className={`bg-white rounded-xl border overflow-hidden transition-colors duration-500 ${
                      highlightedPaymentId === g.id
                        ? 'border-green-500 ring-2 ring-green-500 bg-green-50/40'
                        : 'border-neutral-200'
                    }`}
                  >
                    <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      <div>
                        <span className="text-neutral-500">When </span>
                        <span className="font-medium">
                          {g.createdAt ? new Date(g.createdAt).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Buyer </span>
                        <span className="font-medium">{g.buyer?.fullName || '—'}</span>
                        <div className="text-xs text-neutral-600">
                          {g.buyer?.phone || t('admin.noPhoneOnFile')}
                        </div>
                      </div>
                      <div>
                        <span className="text-neutral-500">Charged </span>
                        <span className="font-medium">{fmtMoney(g.amountTotal)}</span>
                      </div>
                      {g.mashtalIncome > 0 ? (
                        <div>
                          <span className="text-neutral-500">Mashtal </span>
                          <span className="font-medium text-green-700">
                            {fmtMoney(g.mashtalIncome)}
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {g.items?.length > 0 ? (
                      <div className="px-4 py-2 border-b border-neutral-100 text-sm text-neutral-700">
                        <span className="text-neutral-500 mr-2">Ordered:</span>
                        {g.items.map((it, idx) => (
                          <span key={`${g.id}-item-${idx}`}>
                            {idx > 0 ? ' · ' : ''}
                            {it.name} ×{it.quantity}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs sm:text-sm">
                        <thead className="text-left text-neutral-500">
                          <tr>
                            <th className="p-2 sm:p-3">Type</th>
                            <th className="p-2 sm:p-3">From</th>
                            <th className="p-2 sm:p-3">To</th>
                            <th className="p-2 sm:p-3">Amount</th>
                            <th className="p-2 sm:p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.legs.map((leg) => {
                            const fromPhone = leg.fromUser?.phone || g.buyer?.phone || '';
                            const toPhone =
                              leg.toPhone || leg.toWishPhone || leg.toUser?.phone || '';
                            return (
                            <tr key={leg.id} className="border-t border-neutral-100">
                              <td className="p-2 sm:p-3">{leg.type}</td>
                              <td className="p-2 sm:p-3">
                                <div className="font-medium text-neutral-900">
                                  {leg.fromUser?.fullName || '—'}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {fromPhone || t('admin.noPhone')}
                                </div>
                              </td>
                              <td className="p-2 sm:p-3">
                                <div className="font-medium text-neutral-900">
                                  {leg.toLabel || leg.toUser?.fullName || 'Mashtal'}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {toPhone || (leg.type === 'order_tax' ? t('admin.platform') : t('admin.noPhone'))}
                                </div>
                              </td>
                              <td className="p-2 sm:p-3 font-medium">
                                {leg.currency} {Number(leg.amount).toFixed(2)}
                              </td>
                              <td className="p-2 sm:p-3">{leg.status}</td>
                            </tr>
                            );
                          })}                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 items-center">
              <select
                className="border border-neutral-200 rounded-md px-3 py-2 text-sm bg-white"
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
              >
                <option value="all">All statuses</option>
                {ORDER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
              <Button variant="outline" onClick={() => void loadOrders()}>
                Filter
              </Button>
              <span className="text-sm text-neutral-500">{orders.length} orders</span>
            </div>

            {orders.length === 0 ? (
              <div className="bg-white rounded-xl border border-neutral-100 p-4 sm:p-8 text-center text-neutral-500 text-sm">
                {t('admin.noOrders', { defaultValue: 'No orders found' })}
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    data-order-id={order.id}
                    className={`bg-white rounded-xl border overflow-hidden transition-colors duration-500 ${
                      highlightedOrderId === order.id
                        ? 'border-green-500 ring-2 ring-green-500 bg-green-50/40'
                        : 'border-neutral-200'
                    }`}
                  >
                    <div className="px-4 py-3 bg-neutral-50 border-b border-neutral-100 flex flex-wrap gap-x-6 gap-y-2 text-sm items-center justify-between">
                      <div className="flex flex-wrap gap-x-6 gap-y-2">
                        <div>
                          <span className="text-neutral-500">Order </span>
                          <span className="font-mono text-xs font-medium">{order.id}</span>
                        </div>
                        <div>
                          <span className="text-neutral-500">When </span>
                          <span className="font-medium">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-500">Buyer </span>
                          {order.buyer?.id ? (
                            <button
                              type="button"
                              onClick={() => onNavigate?.('chats', { profileId: order.buyer!.id })}
                              className="font-medium text-green-700 hover:text-green-800 hover:underline"
                            >
                              {order.buyer.fullName || '—'}
                            </button>
                          ) : (
                            <span className="font-medium">
                              {order.buyer?.fullName || '—'}
                            </span>
                          )}
                          <div className="text-xs text-neutral-600">
                            {order.buyer?.phone || order.buyer?.email || t('admin.noPhoneOnFile')}
                          </div>
                        </div>
                        <div>
                          <span className="text-neutral-500">Total </span>
                          <span className="font-medium">{fmtMoney(order.total)}</span>
                        </div>
                        {order.cancelledBy ? (
                          <div>
                            <span className="text-neutral-500">Cancelled by </span>
                            <span className="font-medium">{order.cancelledBy}</span>
                            {order.cancelRefundPercent != null ? (
                              <span className="text-xs text-neutral-600 ml-1">
                                ({order.cancelRefundPercent}% refund / {order.cancelFeePercent}% fee)
                              </span>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded border text-xs font-medium capitalize ${orderStatusClass(order.status)}`}
                        >
                          {order.status}
                        </span>
                        <select
                          className="border border-neutral-200 rounded-md px-2 py-1.5 text-sm bg-white"
                          value={order.status}
                          disabled={orderBusyId === order.id}
                          onChange={(e) =>
                            void handleUpdateOrderStatus(
                              order.id,
                              e.target.value as AdminOrderStatus
                            )
                          }
                        >
                          {ORDER_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s.charAt(0).toUpperCase() + s.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="divide-y divide-neutral-100">
                      {order.items.map((it, idx) => (
                        <div
                          key={`${order.id}-item-${idx}`}
                          className="px-4 py-3 flex gap-3 items-center text-sm"
                        >
                          {getImageUrl(it.product.image) ? (
                            <img
                              src={getImageUrl(it.product.image)}
                              alt={it.product.name}
                              className="w-12 h-12 rounded-md object-cover border border-neutral-100 bg-neutral-50"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-md border border-neutral-100 bg-neutral-100 flex items-center justify-center">
                              <Package className="w-5 h-5 text-neutral-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-neutral-900 truncate">
                              {it.product.name}
                            </div>
                            <div className="text-xs text-neutral-500">
                              {it.product.businessName || 'Business'} · qty {it.quantity} ·{' '}
                              {fmtMoney(it.priceAtPurchase)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'reports' && (
          <div className="bg-white rounded-xl border border-neutral-200 p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900">Business reports</h2>
                <p className="text-sm text-neutral-600">
                  {pendingReportsCount} pending · review, warn, or delete accounts
                </p>
              </div>
              <select
                value={reportStatusFilter}
                onChange={(e) => setReportStatusFilter(e.target.value)}
                className="border border-neutral-200 rounded-lg px-3 py-2 text-sm"
              >
                <option value="pending">Pending</option>
                <option value="reviewed">Reviewed (warned)</option>
                <option value="dismissed">Dismissed</option>
                <option value="action_taken">Action taken</option>
                <option value="">All</option>
              </select>
            </div>

            {reports.length === 0 ? (
              <p className="text-neutral-500 text-sm py-8 text-center">{t('admin.noReports')}</p>
            ) : (
              <div className="space-y-4">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    data-report-id={r.id}
                    className="border border-neutral-200 rounded-xl p-4 space-y-3"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-neutral-900">
                          {r.business?.companyName || r.business?.fullName || 'Business'}
                        </div>
                        <div className="text-xs text-neutral-500">
                          {r.business?.email || '—'} · ID {r.business?.id || '—'}
                        </div>
                        <div className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-semibold text-red-700 bg-red-50 px-2 py-1 rounded-full">
                          <Flag className="w-3.5 h-3.5" />
                          {r.business?.reportsCount ?? 0} total report
                          {(r.business?.reportsCount ?? 0) === 1 ? '' : 's'}
                          {(r.business?.pendingReportsCount ?? 0) > 0
                            ? ` · ${r.business?.pendingReportsCount} pending`
                            : ''}
                        </div>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          r.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : r.status === 'action_taken'
                              ? 'bg-red-100 text-red-800'
                              : r.status === 'reviewed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-100 text-neutral-700'
                        }`}
                      >
                        {r.status}
                      </span>
                    </div>

                    <div className="text-sm text-neutral-700">
                      <span className="font-medium">Reason:</span> {r.reasonLabel || r.reason}
                    </div>
                    {r.details ? (
                      <div className="text-sm text-neutral-600 bg-neutral-50 rounded-lg p-3">
                        {r.details}
                      </div>
                    ) : null}
                    <div className="text-xs text-neutral-500">
                      Reported by {r.reporter?.fullName || 'User'} ({r.reporter?.email || '—'}) ·{' '}
                      {r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}
                    </div>

                    {r.status === 'pending' && (
                      <div className="space-y-2 pt-1 border-t border-neutral-100">
                        <Input
                          placeholder="Optional warning message to the business…"
                          value={notifyMessageDraft[r.id] || ''}
                          onChange={(e) =>
                            setNotifyMessageDraft((prev) => ({
                              ...prev,
                              [r.id]: e.target.value,
                            }))
                          }
                        />
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={!!reportActionBusy}
                            onClick={() => void handleResolveReport(r.id, 'dismiss')}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            className="bg-amber-600 hover:bg-amber-700 text-white"
                            disabled={!!reportActionBusy}
                            onClick={() => void handleResolveReport(r.id, 'notify')}
                          >
                            <Bell className="w-4 h-4 mr-1" />
                            {reportActionBusy === `${r.id}:notify` ? 'Sending…' : 'Send warning'}
                          </Button>
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={!!reportActionBusy}
                            onClick={() => void handleResolveReport(r.id, 'delete')}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            {reportActionBusy === `${r.id}:delete` ? 'Deleting…' : 'Delete account'}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
