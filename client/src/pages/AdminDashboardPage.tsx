import React, { useCallback, useEffect, useRef, useState } from 'react';
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
  notifyExpiringSubscriptions,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  type AdminOverviewDto,
  type AdminUserDto,
  type AdminTransactionGroupDto,
} from '../shared/api/admin';

type Tab = 'overview' | 'users' | 'businesses' | 'subscriptions' | 'transactions';

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
  onClearHighlight,
}: {
  initialTab?: Tab | null;
  highlightPaymentId?: string | null;
  onClearHighlight?: () => void;
} = {}) {
  const [tab, setTab] = useState<Tab>(initialTab || 'overview');
  const [overview, setOverview] = useState<AdminOverviewDto | null>(null);
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [businesses, setBusinesses] = useState<AdminUserDto[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminUserDto[]>([]);
  const [periodDays, setPeriodDays] = useState(60);
  const [txGroups, setTxGroups] = useState<AdminTransactionGroupDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notifyMsg, setNotifyMsg] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [txType, setTxType] = useState('');
  const [subStatus, setSubStatus] = useState('');
  const [highlightedPaymentId, setHighlightedPaymentId] = useState<string | null>(null);
  const [newUser, setNewUser] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'visitor',
  });
  const onClearHighlightRef = useRef(onClearHighlight);
  const highlightedPaymentHandledRef = useRef<string | null>(null);

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

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'overview') await loadOverview();
      else if (tab === 'users') await loadUsers();
      else if (tab === 'businesses') await loadBusinesses();
      else if (tab === 'subscriptions') await loadSubscriptions();
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
  ]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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

  const pieData = overview
    ? [
        { name: 'Tax', value: overview.revenueTax },
        { name: 'Subscriptions', value: overview.revenueFees },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Admin dashboard</h1>
            <p className="text-neutral-600 mt-1">
              Mashtal income, subscriptions, and payment ledgers
            </p>
          </div>
          <Button variant="outline" onClick={() => void refresh()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              ['overview', LayoutDashboard, 'Overview'],
              ['users', Users, 'Users'],
              ['businesses', Building2, 'Businesses'],
              ['subscriptions', CalendarClock, 'Subscriptions'],
              ['transactions', ArrowLeftRight, 'Transactions'],
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
                ['Users', overview.usersCount],
                ['Businesses', overview.businessesCount],
                ['Active paid', overview.activeBusinesses],
                ['Expiring ≤7d', overview.expiringSoonCount ?? 0],
              ].map(([label, value]) => (
                <div key={String(label)} className="bg-white rounded-xl border border-neutral-100 p-5">
                  <div className="text-sm text-neutral-500">{label}</div>
                  <div className="text-3xl font-bold text-neutral-900 mt-1">{value}</div>
                </div>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">Mashtal income (all time)</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {fmtMoney(overview.mashtalIncomeTotal)}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  Tax {fmtMoney(overview.revenueTax)} · Fees {fmtMoney(overview.revenueFees)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">Mashtal income (this year)</div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {fmtMoney(overview.mashtalIncomeYear)}
                </div>
                <div className="text-xs text-neutral-500 mt-2">
                  Tax {fmtMoney(overview.mashtalIncomeYearTax)} · Fees{' '}
                  {fmtMoney(overview.mashtalIncomeYearFees)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">Seller GMV</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">
                  {fmtMoney(overview.gmvSellers)}
                </div>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <div className="text-sm text-neutral-500">Orders</div>
                <div className="text-2xl font-bold text-neutral-900 mt-1">
                  {overview.ordersCount}
                </div>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Mashtal income by month
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={overview.mashtalIncomeByMonth || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="tax" stackId="a" fill="#16a34a" name="Tax" />
                    <Bar dataKey="fees" stackId="a" fill="#2563eb" name="Subscriptions" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-white rounded-xl border border-neutral-100 p-5">
                <h3 className="font-semibold text-neutral-900 mb-4">
                  Mashtal income (30 days)
                </h3>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={overview.volumeByDay}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tax" stroke="#16a34a" name="Tax" strokeWidth={2} />
                    <Line
                      type="monotone"
                      dataKey="fees"
                      stroke="#2563eb"
                      name="Subscriptions"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 p-5 max-w-md">
              <h3 className="font-semibold text-neutral-900 mb-4">Income mix</h3>
              {pieData.length === 0 ? (
                <p className="text-sm text-neutral-500 py-10 text-center">No Mashtal income yet</p>
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
                <Plus className="w-4 h-4" /> Create user
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
                <Input
                  placeholder="Full name"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                />
                <Input
                  placeholder="Email"
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
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="p-3">Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3">Sub</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-t border-neutral-100">
                      <td className="p-3 font-medium">{u.fullName}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">
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
                      <td className="p-3">
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
                      <td className="p-3">
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
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-left text-neutral-500">
                <tr>
                  <th className="p-3">Business</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Whish phone</th>
                  <th className="p-3">Subscription</th>
                  <th className="p-3">Expires</th>
                  <th className="p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((b) => (
                  <tr key={b.id} className="border-t border-neutral-100">
                    <td className="p-3 font-medium">{b.companyName || b.fullName}</td>
                    <td className="p-3">{b.email}</td>
                    <td className="p-3">{b.wishPhone || '—'}</td>
                    <td className="p-3">
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
                    <td className="p-3 whitespace-nowrap">{fmtDate(b.subscriptionExpiresAt)}</td>
                    <td className="p-3 flex gap-2">
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
                Notify expiring tomorrow
              </Button>
            </div>

            <div className="bg-white rounded-xl border border-neutral-100 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 text-left text-neutral-500">
                  <tr>
                    <th className="p-3">Business</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Started</th>
                    <th className="p-3">Expires</th>
                    <th className="p-3">Days left</th>
                    <th className="p-3">Months</th>
                    <th className="p-3">Actions</th>
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
                      <td className="p-3">
                        <div className="font-medium">{s.companyName || s.fullName}</div>
                        <div className="text-xs text-neutral-500">{s.email}</div>
                        {s.phone ? (
                          <div className="text-xs text-neutral-500">{s.phone}</div>
                        ) : null}
                      </td>
                      <td className="p-3">
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
                      <td className="p-3 whitespace-nowrap">{fmtDate(s.subscriptionStartedAt)}</td>
                      <td className="p-3 whitespace-nowrap">{fmtDate(s.subscriptionExpiresAt)}</td>
                      <td className="p-3">
                        {s.daysRemaining == null
                          ? '—'
                          : s.daysRemaining < 0
                            ? `Ended ${Math.abs(s.daysRemaining)}d ago`
                            : `${s.daysRemaining}d`}
                      </td>
                      <td className="p-3">
                        {s.monthsActive != null ? `${s.monthsActive} mo` : '—'}
                      </td>
                      <td className="p-3">
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
                <p className="p-6 text-center text-neutral-500 text-sm">No businesses found</p>
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
              <div className="bg-white rounded-xl border border-neutral-100 p-8 text-center text-neutral-500 text-sm">
                No transactions yet
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
                          {g.buyer?.phone || 'No phone on file'}
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
                      <table className="w-full text-sm">
                        <thead className="text-left text-neutral-500">
                          <tr>
                            <th className="p-3">Type</th>
                            <th className="p-3">From</th>
                            <th className="p-3">To</th>
                            <th className="p-3">Amount</th>
                            <th className="p-3">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {g.legs.map((t) => {
                            const fromPhone = t.fromUser?.phone || g.buyer?.phone || '';
                            const toPhone =
                              t.toPhone || t.toWishPhone || t.toUser?.phone || '';
                            return (
                            <tr key={t.id} className="border-t border-neutral-100">
                              <td className="p-3">{t.type}</td>
                              <td className="p-3">
                                <div className="font-medium text-neutral-900">
                                  {t.fromUser?.fullName || '—'}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {fromPhone || 'No phone'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="font-medium text-neutral-900">
                                  {t.toLabel || t.toUser?.fullName || 'Mashtal'}
                                </div>
                                <div className="text-xs text-neutral-500">
                                  {toPhone || (t.type === 'order_tax' ? 'Platform' : 'No phone')}
                                </div>
                              </td>
                              <td className="p-3 font-medium">
                                {t.currency} {Number(t.amount).toFixed(2)}
                              </td>
                              <td className="p-3">{t.status}</td>
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
      </div>
    </div>
  );
}
