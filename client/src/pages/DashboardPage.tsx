import React, { useState, useRef, useEffect } from 'react';
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
import {
  fetchBusinessDashboardAnalytics,
  fetchBusinessOrders,
  type DashboardPeriod,
  type BusinessDashboardDto,
  type BusinessOrderDto,
} from '../shared/api/dashboard';
import { getImageUrl } from '../shared/api/client';

interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
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
}

export function DashboardPage({
  targetSection,
  highlightProductId,
  highlightOrderId,
  onClearHighlight,
}: DashboardPageProps = {}) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<DashboardPeriod>('month');
  const [activeTab, setActiveTab] = useState<'analytics' | 'products' | 'orders'>('analytics');
  
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [orders, setOrders] = useState<BusinessOrderDto[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
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
      const apiProducts = await fetchProducts({ businessId });
      if (!Array.isArray(apiProducts)) {
        setProducts([]);
        return;
      }
      const mapped: Product[] = apiProducts.map((p: any) => ({
        id: p.id ?? '',
        name: p.name ?? '',
        price: Number(p.price) ?? 0,
        stock: Number(p.stock) ?? 0,
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

  // Open Orders tab when arriving from an order notification
  useEffect(() => {
    if (!highlightOrderId) {
      highlightedOrderIdHandledRef.current = null;
      return;
    }
    setActiveTab('orders');
    setHighlightedOrderId(highlightOrderId);
  }, [highlightOrderId]);

  // Scroll to and mark the order for 3 seconds once the list is loaded
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
      // Clear parent highlight state only — never re-navigate (that caused an unwanted re-scroll)
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
      setProductSubmitError('Please fill in name, price, and category.');
      return;
    }
    if (!businessId) {
      setProductSubmitError('You must be logged in as a business to add products.');
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
      setProductSubmitError(err?.message || 'Failed to add product. Please try again.');
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
      setProductSubmitError('Please fill in name, price, and category.');
      return;
    }
    if (!businessId) {
      setProductSubmitError('You must be logged in as a business to update products.');
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
      setProductSubmitError(err?.message || 'Failed to update product. Please try again.');
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

  // Helper for Stats Cards
  const StatsCard = ({ title, value, growth, icon: Icon, colorClass, bgClass, trend }: any) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-100 hover:shadow-lg transition-all duration-300 group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-medium text-neutral-500 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-neutral-900 tracking-tight">{value}</h3>
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
        <span className="text-xs text-neutral-400">vs last {selectedPeriod}</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">Business Analytics</h1>
            <p className="text-lg text-neutral-600">
              Welcome back, <span className="text-green-600 font-semibold">{user?.fullName || 'John Doe'}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm text-neutral-600">Last updated</p>
              <p className="text-sm font-semibold text-neutral-900">
                Today, {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Period Selector */}
        <div className="flex items-center gap-3 mb-8">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-5 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedPeriod === period
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-white text-neutral-700 border border-neutral-200 hover:border-green-600'
              }`}
            >
              <Calendar className="w-4 h-4" />
              This {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>

        {/* Stats Cards - Redesigned */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Total Revenue" 
            value={`$${currentData.totalRevenue.toLocaleString()}`} 
            growth={currentData.revenueGrowth}
            trend={currentData.revenueGrowth}
            icon={DollarSign}
            colorClass="text-green-600"
            bgClass="bg-green-50"
          />
          <StatsCard 
            title="Products Sold" 
            value={currentData.totalSold.toLocaleString()} 
            growth={currentData.soldGrowth}
            trend={currentData.soldGrowth}
            icon={ShoppingBag}
            colorClass="text-orange-600"
            bgClass="bg-orange-50"
          />
          <StatsCard 
            title="Avg Units / Order" 
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
          <TabsList className="bg-white shadow-sm border border-neutral-200">
            <TabsTrigger value="analytics">
              <BarChart3 className="w-4 h-4 mr-2" />
              Analytics & Insights
            </TabsTrigger>
            <TabsTrigger value="orders">
              <ClipboardList className="w-4 h-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="products">
              <Package className="w-4 h-4 mr-2" />
              Product Management
            </TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6 mt-6">
            
            {/* Sales & Revenue Distribution Charts */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Sales Distribution Pie Chart */}
              <Card className="p-6 bg-white shadow-lg border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">Sales Distribution</h3>
                  <div className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">By Units Sold</div>
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
                        <span className="text-sm font-bold text-neutral-900">{item.value} units</span>
                        <p className="text-xs text-neutral-500">{item.percentage}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Revenue Distribution Pie Chart */}
              <Card className="p-6 bg-white shadow-lg border border-neutral-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-neutral-900">Revenue Distribution</h3>
                  <div className="text-xs text-neutral-500 bg-neutral-100 px-3 py-1 rounded-full">By Product Revenue</div>
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

            {/* Performance Overview Chart */}
            <Card className="p-6 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Performance Overview</h3>
                  <p className="text-sm text-neutral-600">6-month sales and revenue trends</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                    <span className="text-xs text-neutral-600">Revenue</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-xs text-neutral-600">Orders</span>
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
                    name="Revenue ($)"
                    dot={{ fill: '#16a34a', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="orders" 
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    name="Orders"
                    dot={{ fill: '#3b82f6', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Top Performing Products Table */}
            <Card className="p-8 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">Top Performing Products</h3>
                  <p className="text-neutral-600 mt-1">Ranked by revenue for the selected period</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg border border-green-200">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">
                    {selectedPeriod === 'week' ? 'This Week' : selectedPeriod === 'month' ? 'This Month' : 'This Year'}
                  </span>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-neutral-200">
                {productsLoading || dashboardLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                    <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p>Loading products...</p>
                  </div>
                ) : sortedProducts.length === 0 ? (
                  <div className="text-center py-16 text-neutral-500">
                    <Package className="w-14 h-14 mx-auto mb-4 text-neutral-300" />
                    <p className="font-medium text-neutral-600">No products yet</p>
                    <p className="text-sm mt-1">Add products in the Product Inventory tab to see performance here.</p>
                  </div>
                ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-neutral-50 border-b border-neutral-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Product</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-neutral-600 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Units Sold</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-neutral-600 uppercase tracking-wider">% of Total</th>
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
                          <td className="px-6 py-5">
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
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-4">
                              <ImageWithFallback 
                                src={getImageUrl(product.image)} 
                                alt={product.name} 
                                className="w-14 h-14 rounded-lg object-cover border-2 border-neutral-100"
                              />
                              <div>
                                <p className="font-semibold text-neutral-900">{product.name}</p>
                                <p className="text-sm text-neutral-500">${product.price}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              {product.category}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="font-semibold text-neutral-900">{product.sold}</p>
                            <p className="text-xs text-neutral-500">units</p>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <p className="font-bold text-green-600">${product.revenue.toLocaleString()}</p>
                          </td>
                          <td className="px-6 py-5 text-right">
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
            <Card className="p-8 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">Customer Orders</h3>
                  <p className="text-neutral-600 mt-1">
                    Paid cart items for your products appear here after checkout
                  </p>
                </div>
                <Button
                  variant="outline"
                  onClick={() => void loadOrders()}
                  disabled={ordersLoading}
                  className="h-11"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${ordersLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>

              {ordersLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                  Loading orders…
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                  <p className="font-medium text-neutral-700">No orders yet</p>
                  <p className="text-sm mt-1">Sales appear here after customers pay</p>
                </div>
              ) : (
                <div className="overflow-hidden rounded-xl border border-neutral-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 text-left">
                        <th className="px-4 py-3 font-semibold text-neutral-700">Date</th>
                        <th className="px-4 py-3 font-semibold text-neutral-700">Buyer</th>
                        <th className="px-4 py-3 font-semibold text-neutral-700">Phone</th>
                        <th className="px-4 py-3 font-semibold text-neutral-700">Products</th>
                        <th className="px-4 py-3 font-semibold text-neutral-700">Revenue</th>
                        <th className="px-4 py-3 font-semibold text-neutral-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          data-order-id={order.id}
                          className={`border-b border-neutral-100 last:border-0 transition-colors duration-500 ${
                            highlightedOrderId === order.id
                              ? 'bg-green-100 ring-2 ring-green-500 ring-inset'
                              : 'hover:bg-neutral-50/80'
                          }`}
                        >
                          <td className="px-4 py-3 text-neutral-600 whitespace-nowrap">
                            {order.createdAt
                              ? new Date(order.createdAt).toLocaleString()
                              : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium text-neutral-900">{order.buyer?.fullName || 'Customer'}</div>
                            {order.buyer?.email ? (
                              <div className="text-xs text-neutral-500">{order.buyer.email}</div>
                            ) : null}
                          </td>
                          <td className="px-4 py-3 text-neutral-700 whitespace-nowrap">
                            {order.buyer?.phone || '—'}
                          </td>
                          <td className="px-4 py-3">
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
                          <td className="px-4 py-3 font-semibold text-green-700 whitespace-nowrap">
                            ${Number(order.sellerRevenue).toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-800 capitalize">
                              {order.status || 'processing'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Products Management Tab */}
          <TabsContent value="products" className="mt-6">
            <Card className="p-8 bg-white shadow-lg border border-neutral-100">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900">Product Inventory</h3>
                  <p className="text-neutral-600 mt-1">Manage your product catalog</p>
                </div>
                <Button 
                  onClick={() => {
                    resetProductForm();
                    setShowAddProductModal(true);
                  }}
                  className="bg-green-600 hover:bg-green-700 shadow-md px-6 h-11"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Product
                </Button>
              </div>
              
              {productsLoading ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <div className="w-10 h-10 border-2 border-green-600 border-t-transparent rounded-full animate-spin mb-4" />
                  <p>Loading products...</p>
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-16 text-neutral-500 border border-dashed border-neutral-200 rounded-2xl">
                  <Package className="w-14 h-14 mx-auto mb-4 text-neutral-300" />
                  <p className="font-medium text-neutral-600">No products yet</p>
                  <p className="text-sm mt-1">Add your first product to get started.</p>
                  <Button
                    onClick={() => { resetProductForm(); setShowAddProductModal(true); }}
                    className="mt-4 bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </div>
              ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                        <span className="text-sm text-neutral-700 font-medium">Price</span>
                        <span className="text-xl font-bold text-green-600">${product.price}</span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                          <p className="text-xs text-neutral-600 mb-1">In Stock</p>
                          <p className="font-bold text-neutral-900">{product.stock}</p>
                        </div>
                        <div className="text-center p-3 bg-neutral-50 rounded-xl">
                          <p className="text-xs text-neutral-600 mb-1">Sold</p>
                          <p className="font-bold text-green-600">{product.sold}</p>
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
            <div className="flex-none bg-gradient-to-r from-green-600 to-green-700 px-8 py-6 flex items-center justify-between rounded-t-2xl">
              <div>
                <h3 className="text-2xl font-bold text-white">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h3>
                <p className="text-green-100 text-sm mt-1">
                  {editingProduct ? 'Update product information' : 'Fill in the details to add a new product'}
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
            <div className="flex-1 overflow-y-auto p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-3">Product Image *</label>
                  <div className="flex gap-4">
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
                          <p className="text-sm font-medium text-neutral-900">Upload Image</p>
                          <p className="text-xs text-neutral-500 mt-1">PNG, JPG up to 5MB</p>
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
                      <p className="text-sm font-medium text-neutral-700 mb-2">Or paste image URL</p>
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

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">Product Name *</label>
                    <input
                      type="text"
                      value={newProduct.name || ''}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder="e.g., Premium Wheat Seeds"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">Category *</label>
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
                      <option value="">Select category</option>
                      {PREDEFINED_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                      <option value="Other">Other</option>
                    </select>
                    
                    {categorySelectValue === 'Other' && (
                      <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="Enter custom category"
                          className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500 bg-neutral-50"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-2">Description</label>
                  <textarea
                    value={newProduct.description || ''}
                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                    placeholder="Describe your product..."
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg outline-none focus:border-green-500 resize-none"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">Price ($) *</label>
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
                    <label className="block text-sm font-semibold text-neutral-900 mb-2">Stock Quantity</label>
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
              <div className="px-8 py-2 text-red-600 text-sm">{productSubmitError}</div>
            )}
            {/* Footer - Fixed */}
            <div className="flex-none border-t border-neutral-200 px-8 py-6 bg-neutral-50 flex gap-4 rounded-b-2xl">
              <Button
                variant="outline"
                className="flex-1 border-2 h-11"
                onClick={() => {
                  setProductSubmitError(null);
                  setShowAddProductModal(false);
                  resetProductForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700 h-11"
                disabled={!newProduct.name || !newProduct.price || !getFinalCategory()}
                onClick={editingProduct ? handleUpdateProduct : handleAddProduct}
              >
                <Save className="w-5 h-5 mr-2" />
                {editingProduct ? 'Update' : 'Add'} Product
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && productToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Confirm Deletion</h3>
                  <p className="text-red-100 text-sm mt-0.5">This action cannot be undone</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-neutral-700 mb-4">
                Are you sure you want to delete this product?
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
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white h-11"
                  onClick={handleDeleteProduct}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}