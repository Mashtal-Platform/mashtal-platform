import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  TrendingUp, Users, ShoppingBag, Package, 
  BarChart3, Calendar, DollarSign, Plus, Trash2, Edit, X, Upload, Save,
  AlertTriangle, ArrowUpRight, Activity, Percent, Store, Crown, Medal, Award,
  ClipboardList, RefreshCw
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, LineChart, Line, CartesianGrid } from 'recharts';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { fetchProducts, createProduct, updateProduct } from '../shared/api/products';
import { notifyError, isContentBlockedError, CONTENT_BLOCKED_DESCRIPTION } from '../shared/utils/notify';
import {
  fetchBusinessDashboardAnalytics,
  fetchBusinessOrders,
  fetchProductSoldCounts,
  type DashboardPeriod,
  type BusinessDashboardDto,
  type BusinessOrderDto,
} from '../shared/api/dashboard';
import { markOrderReady } from '../shared/api/orders';
import { getImageUrl } from '../shared/api/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  sold?: number;
  image: string;
  description: string;
  category: string;
}

const PREDEFINED_CATEGORIES = ['Seeds', 'Plants', 'Trees', 'Fertilizers', 'Tools', 'Equipment', 'Irrigation', 'Medicament'];

interface DashboardPageProps {
  targetSection?: 'analytics' | 'products' | 'orders' | null;
  highlightProductId?: string | null;
  highlightOrderId?: string | null;
  onClearHighlight?: () => void;
  onNavigate?: (page: string, params?: any) => void;
}

export function DashboardPage({
  targetSection,
  highlightProductId,
  highlightOrderId,
  onClearHighlight,
  onNavigate,
}: DashboardPageProps = {}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('month');
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders'>('analytics');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orders, setOrders] = useState<BusinessOrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [markingReadyId, setMarkingReadyId] = useState<string | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);

  const loadProducts = async () => {
    const businessId = user?.businessId || user?.id;
    if (!businessId) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    setProductsLoading(true);
    try {
      const [apiProducts, soldCounts] = await Promise.all([
        fetchProducts({ businessId }),
        fetchProductSoldCounts(businessId).catch(() => ({} as Record<string, number>)),
      ]);
      if (!Array.isArray(apiProducts)) {
        setProducts([]);
        return;
      }
      const mapped: Product[] = apiProducts.map((p: any) => ({
        id: p.id ?? '',
        name: p.name ?? '',
        price: Number(p.price) ?? 0,
        stock: Number(p.stock) ?? 0,
        sold: soldCounts[p.id ?? ''] ?? 0,
        image: p.image ?? '',
        description: p.description ?? '',
        category: (p.category ?? '').charAt(0).toUpperCase() + (p.category ?? '').slice(1),
      }));
      setProducts(mapped);
    } catch (err) {
      console.error('[Dashboard] fetchProducts failed:', err);
      setProducts([]);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    void loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.businessId]);

  const loadOrders = async () => {
    const businessId = user?.businessId || user?.id;
    if (!businessId) {
      setOrders([]);
      return;
    }
    setOrdersLoading(true);
    try {
      const list = await fetchBusinessOrders({ businessId });
      setOrders(list);
      // Keep Products tab stock in sync after sales
      await loadProducts();
    } catch (err) {
      console.error('[Dashboard] fetchBusinessOrders failed:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  };

  const handleMarkReady = async (orderId: string) => {
    setMarkingReadyId(orderId);
    try {
      await markOrderReady(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'ready' } : o))
      );
      toast.success(t('dashboard.markedReady'));
    } catch (err: any) {
      toast.error(err?.message || t('dashboard.markReadyFailed'));
    } finally {
      setMarkingReadyId(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'orders') {
      void loadOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, user?.id, user?.businessId]);

  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // Form State
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    price: 0,
    stock: 0,
    description: '',
    image: '',
    category: '',
  });
  
  // Specifically for the "Other" category input
  const [customCategory, setCustomCategory] = useState('');
  const [categorySelectValue, setCategorySelectValue] = useState('');
  
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productImageFileRef = useRef<File | null>(null);
  const onClearHighlightRef = useRef(onClearHighlight);
  const highlightedProductIdHandledRef = useRef<string | null>(null);

  useEffect(() => {
    onClearHighlightRef.current = onClearHighlight;
  }, [onClearHighlight]);

  // Handle initial scroll to product management section if targetSection is 'products'
  useEffect(() => {
    if (targetSection === 'orders') {
      setActiveTab('orders');
      return;
    }
    if (targetSection === 'products') {
      // Set the active tab to products immediately
      setActiveTab('products');
      
      // Wait for DOM to be ready, then smoothly scroll and switch to product tab
      const timer = setTimeout(() => {
        // First, scroll to the top of the stats cards area for context
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // After brief pause, scroll to tabs section
        setTimeout(() => {
          const tabsElement = document.querySelector('[role="tablist"]');
          if (tabsElement) {
            // Smoothly scroll to tabs with offset for better visibility
            const yOffset = -20; // 20px offset from top
            const y = tabsElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
            
            // Switch to products tab after scroll completes
            setTimeout(() => {
              const productsTab = document.querySelector('[value="products"]');
              if (productsTab) {
                (productsTab as HTMLElement).click();
                
                // Add a subtle highlight effect to the product management section
                setTimeout(() => {
                  const productContent = document.querySelector('[role="tabpanel"][data-state="active"]');
                  if (productContent) {
                    productContent.classList.add('ring-4', 'ring-green-500', 'ring-offset-4');
                    setTimeout(() => {
                      productContent.classList.remove('ring-4', 'ring-green-500', 'ring-offset-4');
                    }, 2000);
                  }
                }, 300);
              }
            }, 800); // Wait for scroll to complete
          }
        }, 400); // Brief pause at top before scrolling to tabs
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [targetSection]);

  const highlightedOrderIdHandledRef = useRef<string | null>(null);

  useEffect(() => {
    if (!highlightOrderId) {
      highlightedOrderIdHandledRef.current = null;
      return;
    }
    setActiveTab('orders');
    setHighlightedOrderId(highlightOrderId);
  }, [highlightOrderId]);

  useEffect(() => {
    if (!highlightOrderId || !highlightedOrderId) return;
    if (ordersLoading) return;
    if (highlightedOrderIdHandledRef.current === highlightOrderId) return;

    const row = document.querySelector(`[data-order-id="${highlightOrderId}"]`);
    if (!row) return;

    highlightedOrderIdHandledRef.current = highlightOrderId;
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const clearTimer = setTimeout(() => {
      setHighlightedOrderId(null);
      // Clear parent highlight without re-scrolling
      onClearHighlightRef.current?.();
    }, 3000);

    return () => clearTimeout(clearTimer);
  }, [highlightOrderId, highlightedOrderId, orders, ordersLoading]);

  // Handle highlighting a specific product (run only when highlightProductId changes, not when parent re-renders)
  useEffect(() => {
    if (!highlightProductId) {
      highlightedProductIdHandledRef.current = null;
      return;
    }
    // Only run once per distinct highlight (avoid re-running when parent passes new onClearHighlight)
    if (highlightedProductIdHandledRef.current === highlightProductId) return;
    highlightedProductIdHandledRef.current = highlightProductId;

    setActiveTab('products');
    const timer = setTimeout(() => {
      const productElement = document.querySelector(`[data-product-id="${highlightProductId}"]`);
      if (productElement) {
        const yOffset = -100;
        const y = productElement.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        productElement.classList.add('ring-4', 'ring-green-600', 'ring-offset-4', 'scale-105');
        setTimeout(() => {
          productElement.classList.remove('ring-4', 'ring-green-600', 'ring-offset-4', 'scale-105');
          onClearHighlightRef.current?.();
        }, 2500);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [highlightProductId]);

  const [dashboardData, setDashboardData] = useState<BusinessDashboardDto | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  useEffect(() => {
    const businessId = user?.businessId || user?.id;
    if (!businessId) {
      setDashboardData(null);
      return;
    }

    let cancelled = false;
    setDashboardLoading(true);
    fetchBusinessDashboardAnalytics({ businessId, period: selectedPeriod })
      .then((data) => {
        if (!cancelled) setDashboardData(data);
      })
      .catch((err) => {
        console.error('[Dashboard] fetchBusinessDashboardAnalytics failed:', err);
        if (!cancelled) setDashboardData(null);
      })
      .finally(() => {
        if (!cancelled) setDashboardLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.businessId, selectedPeriod]);

  const currentData = dashboardData?.stats ?? {
    totalRevenue: 0,
    totalSold: 0,
    averageUnitsPerOrder: 0,
    revenueGrowth: 0,
    soldGrowth: 0,
    conversionGrowth: 0,
  };

  // Sorted by revenue in the backend.
  const sortedProducts = dashboardData?.topProducts ?? [];
  const salesByProduct = dashboardData?.salesByProduct ?? [];
  const revenueByProduct = dashboardData?.revenueByProduct ?? [];
  const monthlyData = dashboardData?.monthlySeries ?? [];

  const actualTotalRevenue = sortedProducts.reduce((sum, p) => sum + p.revenue, 0);

  // Colors for charts - Professional palette
  const COLORS = ['#16a34a', '#059669', '#10b981', '#34d399', '#6ee7b7', '#a7f3d0'];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      productImageFileRef.current = file;
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setNewProduct((prev) => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const getFinalCategory = () => {
    if (categorySelectValue === 'Other') {
      return customCategory.trim();
    }
    return categorySelectValue;
  };

  const [productSubmitError, setProductSubmitError] = useState<string | null>(null);

  const mapCategoryToApi = (
    cat: string
  ): 'seeds' | 'tools' | 'fertilizers' | 'plants' | 'irrigation' | 'equipment' | 'trees' | 'medicament' | 'other' => {
    const m: Record<string, 'seeds' | 'tools' | 'fertilizers' | 'plants' | 'irrigation' | 'equipment' | 'trees' | 'medicament' | 'other'> = {
      Seeds: 'seeds',
      Plants: 'plants',
      Trees: 'trees',
      Fertilizers: 'fertilizers',
      Tools: 'tools',
      Equipment: 'equipment',
      Irrigation: 'irrigation',
      Medicament: 'medicament',
    };
    const key = cat.trim();
    if (m[key]) return m[key];
    const lower = key.toLowerCase();
    if (['seeds', 'tools', 'fertilizers', 'plants', 'irrigation', 'equipment', 'trees', 'medicament', 'other'].includes(lower)) {
      return lower as 'seeds' | 'tools' | 'fertilizers' | 'plants' | 'irrigation' | 'equipment' | 'trees' | 'medicament' | 'other';
    }
    return 'other';
  };

  const handleAddProduct = async () => {
    const finalCategory = getFinalCategory();
    const businessId = user?.businessId || user?.id;

    if (!newProduct.name || !newProduct.price || !finalCategory) {
      setProductSubmitError(t('dashboard.nameRequired'));
      return;
    }
    if (!businessId) {
      setProductSubmitError(t('dashboard.mustBeBusiness'));
      return;
    }

    setProductSubmitError(null);
    try {
      const imageFile = productImageFileRef.current;
      await createProduct(
        {
          name: newProduct.name,
          description: newProduct.description || '',
          price: Number(newProduct.price),
          image: imageFile ? undefined : newProduct.image || undefined,
          category: mapCategoryToApi(finalCategory),
          stock: Number(newProduct.stock) || 0,
          businessId,
        },
        imageFile || undefined
      );
      setProductsLoading(true);
      const apiProducts = await fetchProducts({ businessId });
      const mapped: Product[] = (Array.isArray(apiProducts) ? apiProducts : []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: p.image ?? '',
        description: p.description ?? '',
        category: (p.category ?? '').charAt(0).toUpperCase() + (p.category ?? '').slice(1),
      }));
      setProducts(mapped);
      resetProductForm();
      setShowAddProductModal(false);
    } catch (err: any) {
      const msg = err?.message || t('dashboard.failedAdd');
      setProductSubmitError(isContentBlockedError(err) ? CONTENT_BLOCKED_DESCRIPTION : msg);
      notifyError(err, t('dashboard.failedAdd'));
    } finally {
      setProductsLoading(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    productImageFileRef.current = null;
    setEditingProduct(product);
    setNewProduct({ ...product, image: product.image ?? '' });
    setImagePreview(product.image ? getImageUrl(product.image) || product.image : '');
    setProductSubmitError(null);

    if (PREDEFINED_CATEGORIES.includes(product.category)) {
      setCategorySelectValue(product.category);
      setCustomCategory('');
    } else {
      setCategorySelectValue('Other');
      setCustomCategory(product.category);
    }

    setShowAddProductModal(true);
  };

  const handleUpdateProduct = async () => {
    const finalCategory = getFinalCategory();
    const businessId = user?.businessId || user?.id;

    if (!editingProduct || !newProduct.name || newProduct.price == null || !finalCategory) {
      setProductSubmitError(t('dashboard.nameRequired'));
      return;
    }
    if (!businessId) {
      setProductSubmitError(t('dashboard.mustBeBusinessUpdate'));
      return;
    }

    setProductSubmitError(null);
    try {
      setProductsLoading(true);
      const imageFile = productImageFileRef.current;
      const payload = {
        name: newProduct.name,
        description: newProduct.description || '',
        price: Number(newProduct.price),
        category: mapCategoryToApi(finalCategory),
        stock: Number(newProduct.stock) ?? 0,
        image: imageFile ? undefined : (newProduct.image ?? editingProduct.image),
      };
      await updateProduct(editingProduct.id, payload, imageFile || undefined);
      const apiProducts = await fetchProducts({ businessId });
      const mapped: Product[] = (Array.isArray(apiProducts) ? apiProducts : []).map((p: any) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        image: p.image ?? '',
        description: p.description ?? '',
        category: (p.category ?? '').charAt(0).toUpperCase() + (p.category ?? '').slice(1),
      }));
      setProducts(mapped);
      resetProductForm();
      setShowAddProductModal(false);
    } catch (err: any) {
      const msg = err?.message || t('dashboard.failedUpdate');
      setProductSubmitError(isContentBlockedError(err) ? CONTENT_BLOCKED_DESCRIPTION : msg);
      notifyError(err, t('dashboard.failedUpdate'));
    } finally {
      setProductsLoading(false);
    }
  };

  const confirmDeleteProduct = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
  };

  const handleDeleteProduct = () => {
    if (productToDelete) {
      setProducts(products.filter(p => p.id !== productToDelete.id));
      setShowDeleteModal(false);
      setProductToDelete(null);
    }
  };

  const resetProductForm = () => {
    productImageFileRef.current = null;
    setImagePreview('');
    setNewProduct({ name: '', price: 0, stock: 0, description: '', image: '', category: '' });
    setImagePreview('');
    setCategorySelectValue('');
    setCustomCategory('');
    setEditingProduct(null);
    setProductSubmitError(null);
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-xl border border-neutral-200">
          <p className="font-semibold text-neutral-900 mb-1">{payload[0].payload.name}</p>
          <p className="text-sm text-green-600 font-medium">
            {payload[0].name === 'value' ? `${payload[0].value} units` : `$${payload[0].value.toLocaleString()}`}
          </p>
          <p className="text-xs text-neutral-600 mt-1">
            {payload[0].payload.percentage}% of total
          </p>
        </div>
      );
    }
    return null;
  };

  const renewBanner = useMemo(() => {
    if (user?.role !== 'business') return null;

    const now = Date.now();
    const expiresAt = user.subscriptionExpiresAt
      ? new Date(user.subscriptionExpiresAt).getTime()
      : null;
    const daysRemaining =
      expiresAt != null
        ? Math.ceil((expiresAt - now) / (24 * 60 * 60 * 1000))
        : null;

    const isInactive = user.subscriptionStatus !== 'active';
    const isExpiringSoon =
      user.subscriptionStatus === 'active' &&
      daysRemaining != null &&
      daysRemaining <= 3 &&
      daysRemaining > 0;

    if (!isInactive && !isExpiringSoon) return null;

    if (isExpiringSoon) {
      return {
        tone: 'warning' as const,
        title: t('dashboard.subscriptionExpiringSoon', {
          defaultValue: `Your subscription expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`,
          days: daysRemaining,
        }),
        description: t('dashboard.renewAddsDays', {
          defaultValue: 'Renew now to add 60 more days to your remaining time and keep selling.',
        }),
      };
    }

    const isSuspended = isInactive && expiresAt != null && expiresAt > now;
    if (isSuspended) {
      return {
        tone: 'danger' as const,
        title: t('dashboard.subscriptionSuspended', {
          defaultValue: 'Your account has been suspended',
        }),
        description: t('dashboard.renewToReactivate', {
          defaultValue: 'Renew your subscription to reactivate your business and continue selling.',
        }),
      };
    }

    return {
      tone: 'danger' as const,
      title: t('dashboard.subscriptionExpired', {
        defaultValue: 'Your subscription has expired',
      }),
      description: t('dashboard.renewToSell', {
        defaultValue: 'Renew your subscription to continue listing and selling products.',
      }),
    };
  }, [user, t]);

  // Helper for Stats Cards
  const StatsCard = ({ title, value, growth, icon: Icon, colorClass, bgClass, trend }: any) => (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-neutral-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bgClass} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${trend >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5 rotate-180" />}
          <span>{Math.abs(trend)}%</span>
        </div>
        <span className="text-xs text-neutral-400">{t('dashboard.vsLastPeriod', { period: selectedPeriod })}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-neutral-900 mb-2">{t('dashboard.title')}</h1>
            <p className="text-lg text-neutral-600">
              {t('dashboard.welcomeBack')} <span className="text-green-600 font-semibold">{user?.fullName || 'John Doe'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-neutral-600">{t('dashboard.lastUpdated')}</p>
              <p className="text-sm font-semibold text-neutral-900">
                {t('dashboard.today')} {new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Subscription Renewal Banner */}
        {renewBanner && (
          <div
            className={`mb-6 sm:mb-8 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 border ${
              renewBanner.tone === 'warning'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            <AlertTriangle
              className={`w-6 h-6 shrink-0 ${
                renewBanner.tone === 'warning' ? 'text-amber-600' : 'text-red-600'
              }`}
            />
            <div className="flex-1">
              <h3
                className={`font-semibold text-sm sm:text-base ${
                  renewBanner.tone === 'warning' ? 'text-amber-900' : 'text-red-900'
                }`}
              >
                {renewBanner.title}
              </h3>
              <p
                className={`text-xs sm:text-sm mt-0.5 ${
                  renewBanner.tone === 'warning' ? 'text-amber-700' : 'text-red-700'
                }`}
              >
                {renewBanner.description}
              </p>
            </div>
            <Button
              onClick={() => onNavigate?.('payment', { role: 'business' })}
              className={`text-white shrink-0 ${
                renewBanner.tone === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {t('dashboard.renewNow', { defaultValue: 'Renew Now' })}
            </Button>
          </div>
        )}

        {/* Period Selector */}
        <div className="flex flex-wrap items-center gap-3 mb-6 sm:mb-8">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedPeriod === period
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-green-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              {period === 'week' ? t('dashboard.thisWeek') : period === 'month' ? t('dashboard.thisMonth') : t('dashboard.thisYear')}
            </button>
          ))}
        </div>

        {/* Stats Cards - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatsCard 
            title={t('dashboard.totalRevenue')} 
            value={`$${currentData.totalRevenue.toLocaleString()}`} 
            growth={currentData.revenueGrowth}
            trend={currentData.revenueGrowth}
            icon={DollarSign}
            colorClass="text-green-600"
            bgClass="bg-green-50"
          />
          <StatsCard 
            title={t('dashboard.productsSold')} 
            value={currentData.totalSold.toLocaleString()} 
            growth={currentData.soldGrowth}
            trend={currentData.soldGrowth}
            icon={ShoppingBag}
            colorClass="text-orange-600"
            bgClass="bg-orange-50"
          />
          <StatsCard 
            title={t('dashboard.avgUnitsPerOrder')} 
            value={currentData.averageUnitsPerOrder.toFixed(2)} 
            growth={currentData.conversionGrowth}
            trend={currentData.conversionGrowth}
            icon={Percent}
            colorClass="text-purple-600"
            bgClass="bg-purple-50"
          />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'analytics' | 'products' | 'orders')} className="w-full">
          <div className="overflow-x-auto">
            <TabsList className="bg-white shadow-sm border border-neutral-200">
              <TabsTrigger value="analytics">
                <BarChart3 className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.analytics')}</span>
                <span className="sm:hidden">{t('dashboard.analyticsShort')}</span>
              </TabsTrigger>
              <TabsTrigger value="orders">
                <ClipboardList className="w-4 h-4 mr-2" />
                {t('dashboard.orders')}
              </TabsTrigger>
              <TabsTrigger value="products">
                <Package className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">{t('dashboard.productManagement')}</span>
                <span className="sm:hidden">{t('dashboard.products')}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            
            {/* Sales & {t('dashboard.revenueDistribution')} Charts */}
            <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">
              {/* {t('dashboard.salesDistribution')} Pie Chart */}
              <Card className="p-4 sm:p-6 bg-white shadow-lg border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">{t('dashboard.salesDistribution')}</h3>
                  <div className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">{t('dashboard.byUnitsSold')}</div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={salesByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.percentage}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {salesByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3 max-h-48 overflow-y-auto">
                  {salesByProduct.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-medium text-neutral-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-neutral-900">{t('dashboard.unitsCount', { count: item.value })}</span>
                        <p className="text-xs text-neutral-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* {t('dashboard.revenueDistribution')} Pie Chart */}
              <Card className="p-4 sm:p-6 bg-white shadow-lg border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">{t('dashboard.revenueDistribution')}</h3>
                  <div className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">{t('dashboard.byProductRevenue')}</div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={revenueByProduct}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(entry) => `${entry.percentage}%`}
                      outerRadius={90}
                      innerRadius={50}
                      fill="#8884d8"
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {revenueByProduct.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 space-y-3 max-h-48 overflow-y-auto">
                  {revenueByProduct.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm font-medium text-neutral-700">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-bold text-green-600">${item.value.toLocaleString()}</span>
                        <p className="text-xs text-neutral-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>

            {/* {t('dashboard.performanceOverview')} Chart */}
            <Card className="p-4 sm:p-6 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{t('dashboard.performanceOverview')}</h3>
                  <p className="text-sm text-neutral-600">{t('dashboard.sixMonthTrends')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-xs text-neutral-600">{t('dashboard.revenue')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-neutral-600">{t('dashboard.orders')}</span>
                  </div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={320}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                  <XAxis dataKey="month" stroke="#737373" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#737373" style={{ fontSize: '12px' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'white', 
                      border: '1px solid #e5e5e5',
                      borderRadius: '8px',
                      padding: '12px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#16a34a" 
                    strokeWidth={3} 
                    name={t('dashboard.revenue')}
                    dot={{ fill: '#16a34a', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    name={t('dashboard.orders')}
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* {t('dashboard.topPerformingProducts')} Table */}
            <Card className="p-4 sm:p-8 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">{t('dashboard.topPerformingProducts')}</h3>
                  <p className="text-neutral-600 mt-1">{t('dashboard.rankedByRevenue')}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {selectedPeriod === 'week' ? t('dashboard.thisWeek') : selectedPeriod === 'month' ? t('dashboard.thisMonth') : t('dashboard.thisYear')}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-neutral-200">
                {productsLoading || dashboardLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                    <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p>{t('dashboard.loadingProducts')}</p>
                  </div>
                ) : sortedProducts.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500">
                    <Package className="w-14 h-14 mx-auto mb-4 text-neutral-300" />
                    <p className="font-medium text-neutral-600">{t('dashboard.noProducts')}</p>
                    <p className="text-sm mt-1">{t('dashboard.addProductsHint')}</p>
                  </div>
                ) : (
                <table className="w-full text-sm sm:text-base">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('dashboard.rank')}</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('dashboard.product')}</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('dashboard.category')}</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('dashboard.unitsSold')}</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('dashboard.revenue')}</th>
                      <th className="px-3 py-3 sm:px-6 sm:py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">{t('dashboard.percentOfTotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-neutral-100">
                    {sortedProducts.map((product, index) => {
                      const percentageOfTotal = actualTotalRevenue > 0 ? ((product.revenue / actualTotalRevenue) * 100).toFixed(1) : '0.0';
                      const rankIcon = index === 0 ? <Crown className="w-5 h-5 text-yellow-500" /> : 
                                      index === 1 ? <Medal className="w-5 h-5 text-gray-400" /> : 
                                      index === 2 ? <Award className="w-5 h-5 text-amber-700" /> : null;

                      return (
                        <tr key={product.id} className="hover:bg-neutral-50 transition-colors">
                          <td className="px-3 py-3 sm:px-6 sm:py-5">
                            <div className="flex items-center gap-3">
                              {rankIcon ? (
                                rankIcon
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
                                  <span className="text-sm font-bold text-neutral-600">#{index + 1}</span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-5">
                            <div className="flex items-center gap-2 sm:gap-4">
                              <ImageWithFallback 
                                src={getImageUrl(product.image)} 
                                alt={product.name} 
                                className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg object-cover border-2 border-neutral-100"
                              />
                              <div>
                                <p className="font-semibold text-neutral-900">{product.name}</p>
                                <p className="text-sm text-neutral-500">${product.price}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-5 text-right">
                            <p className="font-semibold text-neutral-900">{product.sold}</p>
                            <p className="text-xs text-neutral-500">{t('dashboard.units')}</p>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-5 text-right">
                            <p className="font-bold text-green-600">${product.revenue.toLocaleString()}</p>
                          </td>
                          <td className="px-3 py-3 sm:px-6 sm:py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <div className="w-20 h-2 bg-neutral-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-600 rounded-full transition-all"
                                  style={{ width: `${percentageOfTotal}%` }}
                                />
                              </div>
                              <span className="font-bold text-neutral-900 min-w-[45px] text-right">{percentageOfTotal}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders" className="mt-6">
            <Card className="p-4 sm:p-8 bg-white shadow-lg border border-neutral-100">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">{t('dashboard.customerOrders')}</h3>
                  <p className="text-neutral-600 mt-1">
                    {t('dashboard.ordersSubtitle')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void loadOrders()}
                  disabled={ordersLoading}
                  className="h-11"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
                  {t('common.refresh')}
                </Button>
              </div>

              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                  {t('dashboard.loadingOrders')}
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p className="font-medium text-neutral-700">{t('dashboard.noOrders')}</p>
                  <p className="text-sm mt-1">{t('dashboard.salesAppearHint')}</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('common.date')}</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('dashboard.buyer')}</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('common.phone')}</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('dashboard.products')}</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('dashboard.revenue')}</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('common.status')}</th>
                        <th className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-neutral-700">{t('common.actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => {
                        const status = (order.status || 'processing').toLowerCase();
                        const canMarkReady = status === 'processing';
                        const statusClass =
                          status === 'ready'
                            ? 'bg-blue-50 text-blue-800'
                            : status === 'completed'
                              ? 'bg-green-50 text-green-800'
                              : status === 'cancelled'
                                ? 'bg-red-50 text-red-800'
                                : 'bg-yellow-50 text-yellow-800';
                        return (
                        <tr
                          key={order.id}
                          data-order-id={order.id}
                          className={`border-b border-neutral-100 last:border-0 transition-colors duration-500 ${
                            highlightedOrderId === order.id
                              ? 'bg-green-100 ring-2 ring-green-500 ring-inset'
                              : 'hover:bg-neutral-50/80'
                          }`}
                        >
                          <td className="px-2 py-2 sm:px-4 sm:py-3 text-neutral-600 whitespace-nowrap">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : '—'}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <div className="font-medium text-neutral-900">
                              {order.buyer?.id ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onNavigate?.('chats', { profileId: order.buyer!.id })
                                  }
                                  className="text-green-700 hover:text-green-800 hover:underline text-left"
                                >
                                  {order.buyer.fullName || t('dashboard.customer')}
                                </button>
                              ) : (
                                order.buyer?.fullName || t('dashboard.customer')
                              )}
                            </div>
                            {order.buyer?.email ? (
                              <div className="text-xs text-neutral-500">{order.buyer.email}</div>
                            ) : null}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 text-neutral-700 whitespace-nowrap">
                            {order.buyer?.phone || '—'}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <ul className="space-y-1">
                              {order.items.map((it) => (
                                <li key={`${order.id}-${it.productId}`} className="text-neutral-700">
                                  {it.name}{' '}
                                  <span className="text-neutral-500">×{it.quantity}</span>
                                  <span className="text-neutral-400"> · ${Number(it.lineTotal).toFixed(2)}</span>
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3 font-semibold text-green-700 whitespace-nowrap">
                            ${Number(order.sellerRevenue).toFixed(2)}
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusClass}`}>
                              {status}
                            </span>
                          </td>
                          <td className="px-2 py-2 sm:px-4 sm:py-3">
                            {canMarkReady ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={markingReadyId === order.id}
                                onClick={() => void handleMarkReady(order.id)}
                                className="whitespace-nowrap"
                              >
                                {markingReadyId === order.id
                                  ? '…'
                                  : t('dashboard.markReady')}
                              </Button>
                            ) : (
                              <span className="text-xs text-neutral-400">—</span>
                            )}
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Products Management Tab */}
          <TabsContent value="products" className="mt-6">
            <Card className="p-4 sm:p-8 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-6 sm:mb-8">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-neutral-900">{t('dashboard.productInventory')}</h3>
                  <p className="text-neutral-600 mt-1">{t('dashboard.manageCatalog')}</p>
                </div>
                <Button 
                  onClick={() => {
                    resetProductForm();
                    setShowAddProductModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 shadow-md px-4 sm:px-6 h-11"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  {t('dashboard.addProduct')}
                </Button>
              </div>
              
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p>{t('dashboard.loadingProducts')}</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
                  <Package className="w-14 h-14 mx-auto mb-4 text-neutral-300" />
                  <p className="font-medium text-neutral-600">{t('dashboard.noProducts')}</p>
                  <p className="text-sm mt-1">{t('dashboard.addFirstProduct')}</p>
                  <Button
                    onClick={() => { resetProductForm(); setShowAddProductModal(true); }}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('dashboard.addProduct')}
                  </Button>
                </div>
              ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {products.map((product) => (
                  <div key={product.id} className="group relative bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-green-500 transition-all duration-300" data-product-id={product.id}>
                    {/* Product Image */}
                    <div className="relative h-52 overflow-hidden bg-neutral-100">
                      <ImageWithFallback 
                        src={getImageUrl(product.image)} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/95 backdrop-blur-sm text-neutral-900 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                          {product.category}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-green-50 hover:scale-110 transition-all"
                        >
                          <Edit className="w-4 h-4 text-green-600" />
                        </button>
                        <button
                          onClick={() => confirmDeleteProduct(product)}
                          className="p-2.5 bg-white rounded-xl shadow-lg hover:bg-red-50 hover:scale-110 transition-all"
                        >
                          <Trash2 className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="p-5">
                      <h4 className="font-bold text-neutral-900 text-lg mb-2 line-clamp-1">{product.name}</h4>
                      <p className="text-sm text-neutral-600 mb-4 line-clamp-2 min-h-[40px]">{product.description}</p>
                      
                      {/* Price */}
                      <div className="flex items-center justify-between mb-4 p-3 bg-green-50 rounded-xl">
                        <span className="text-sm text-neutral-700 font-medium">{t('shopping.price')}</span>
                        <span className="text-xl font-bold text-green-600">${product.price}</span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                          <p className="text-xs text-neutral-600 mb-1">{t('dashboard.inStock')}</p>
                          <p className="font-bold text-neutral-900">{product.stock}</p>
                        </div>
                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                          <p className="text-xs text-neutral-600 mb-1">{t('dashboard.sold')}</p>
                          <p className="font-bold text-green-600">{product.sold ?? 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add/Edit Product Modal - Fixed Layout */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl">
            {/* Header - Fixed */}
            <div className="flex-none bg-gradient-to-r from-green-600 to-green-700 px-4 py-4 sm:px-8 sm:py-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-white">
                  {editingProduct ? t('dashboard.editProduct') : t('dashboard.addNewProduct')}
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  {editingProduct ? t('dashboard.updateProductInfo') : t('dashboard.fillProductDetails')}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAddProductModal(false);
                  resetProductForm();
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Body - Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-3">{t('dashboard.productImage')}</label>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {imagePreview ? (
                      <div className="relative w-48 h-48 rounded-xl overflow-hidden border-2 border-green-500 shadow-lg shrink-0">
                        <img src={getImageUrl(imagePreview) || imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            productImageFileRef.current = null;
                            setImagePreview('');
                            setNewProduct((prev) => ({ ...prev, image: '' }));
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                        >
                          <X className="w-4 h-4 text-white" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-48 h-48 border-2 border-dashed border-neutral-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex flex-col items-center justify-center gap-3 shrink-0"
                      >
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <Upload className="w-8 h-8 text-green-600" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-medium text-neutral-900">{t('dashboard.uploadImage')}</p>
                          <p className="text-xs text-neutral-500 mt-1">{t('dashboard.imageHint')}</p>
                        </div>
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-neutral-700 mb-2">{t('dashboard.orPasteUrl')}</p>
                      <input
                        type="text"
                        value={newProduct.image || ''}
                        onChange={(e) => {
                          setNewProduct({ ...newProduct, image: e.target.value });
                          setImagePreview(e.target.value);
                        }}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('dashboard.productName')}</label>
                    <input
                      type="text"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g., Premium Wheat Seeds"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('dashboard.category')} *</label>
                    <select
                      value={categorySelectValue}
                      onChange={(e) => {
                        setCategorySelectValue(e.target.value);
                        if (e.target.value !== 'Other') {
                          setCustomCategory('');
                        }
                      }}
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500"
                    >
                      <option value="">{t('dashboard.selectCategory')}</option>
                      {PREDEFINED_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Other">{t('dashboard.other')}</option>
                    </select>
                    
                    {categorySelectValue === 'Other' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder={t('dashboard.customCategory')}
                          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500 bg-neutral-50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('common.description')}</label>
                  <textarea
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Describe your product..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500 resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('dashboard.priceLabel')}</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                      <input
                        type="number"
                        value={newProduct.price || ''}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                        placeholder="0.00"
                        className="w-full pl-12 pr-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">{t('dashboard.stockQuantity')}</label>
                    <input
                      type="number"
                      value={newProduct.stock || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                      placeholder="0"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {productSubmitError && (
              <div className="px-4 sm:px-8 py-2 text-red-600 text-sm">{productSubmitError}</div>
            )}
            {/* Footer - Fixed */}
            <div className="flex-none border-t border-neutral-200 px-4 py-4 sm:px-8 sm:py-6 bg-neutral-50 flex gap-4 rounded-b-2xl">
              <Button
                variant="outline"
                className="flex-1 border-2 h-11"
                onClick={() => {
                  setProductSubmitError(null);
                  setShowAddProductModal(false);
                  resetProductForm();
                }}
              >
                {t('common.cancel')}
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 h-11"
                disabled={!newProduct.name || !newProduct.price || !getFinalCategory()}
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              >
                <Save className="w-5 h-5 mr-2" />
                {editingProduct ? t('dashboard.updateProduct') : t('dashboard.addProductBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t('dashboard.confirmDeletion')}</h3>
                  <p className="text-red-100 text-sm mt-0.5">{t('dashboard.cannotUndo')}</p>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-6">
              <p className="text-neutral-700 mb-4">
                {t('dashboard.confirmDeleteProduct')}
              </p>
              
              <div className="bg-neutral-50 border-2 border-neutral-200 rounded-xl p-4 flex items-center gap-4 mb-6">
                <ImageWithFallback 
                  src={getImageUrl(productToDelete.image)} 
                  alt={productToDelete.name} 
                  className="w-20 h-20 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h4 className="font-bold text-neutral-900">{productToDelete.name}</h4>
                  <p className="text-sm text-neutral-600 mt-1">{productToDelete.category}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-2 h-11"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setProductToDelete(null);
                  }}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11"
                  onClick={handleDeleteProduct}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
