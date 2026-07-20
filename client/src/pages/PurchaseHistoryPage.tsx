import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Calendar,
  Package,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Building2,
  DollarSign,
  Download,
  Star,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { fetchMyOrders, cancelOrder, OrderDto, OrderStatus } from '../shared/api/orders';
import { getImageUrl } from '../shared/api/client';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { CancelOrderModal } from '../components/CancelOrderModal';
import { CartItem } from '../App';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';
import { toast } from 'sonner';

interface PurchaseHistoryPageProps {
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigate?: (page: string) => void;
  onAddToCart?: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  highlightOrderId?: string | null;
  onClearHighlight?: () => void;
}

type StatusFilter = 'all' | OrderStatus;
type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low';

type Purchase = {
  id: string;
  orderId: string;
  productId: string;
  status: OrderStatus;
  date: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  businessId: string;
  businessName: string;
  category: string;
  rating?: number;
  cancelFeePercent?: number | null;
  cancelRefundPercent?: number | null;
};

const CANCELLABLE: OrderStatus[] = ['pending', 'processing'];

function statusLabel(status: string, t: (k: string) => string) {
  switch (status) {
    case 'pending':
      return t('purchaseHistory.pending');
    case 'processing':
      return t('purchaseHistory.processing');
    case 'ready':
      return t('purchaseHistory.ready');
    case 'completed':
      return t('purchaseHistory.completed');
    case 'cancelled':
      return t('purchaseHistory.cancelled');
    default:
      return status;
  }
}

export function PurchaseHistoryPage({
  onNavigateToBusiness,
  onNavigate,
  onAddToCart,
  highlightOrderId = null,
  onClearHighlight,
}: PurchaseHistoryPageProps) {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<string | null>(null);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const [cancelModalOrderId, setCancelModalOrderId] = useState<string | null>(null);
  const [highlightedOrderId, setHighlightedOrderId] = useState<string | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const highlightHandledRef = useRef<string | null>(null);
  const onClearHighlightRef = useRef(onClearHighlight);

  useEffect(() => {
    onClearHighlightRef.current = onClearHighlight;
  }, [onClearHighlight]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };
    if (isSortOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortOpen]);

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch((err) => {
        console.error('[PurchaseHistoryPage] Failed to load orders from API:', err);
      });
  }, []);

  useEffect(() => {
    if (!highlightOrderId) {
      highlightHandledRef.current = null;
      return;
    }
    setHighlightedOrderId(highlightOrderId);
  }, [highlightOrderId]);

  useEffect(() => {
    if (!highlightOrderId || !highlightedOrderId || orders.length === 0) return;
    if (highlightHandledRef.current === highlightOrderId) return;
    const el = document.querySelector(`[data-order-id="${highlightOrderId}"]`);
    if (!el) return;
    highlightHandledRef.current = highlightOrderId;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const timer = setTimeout(() => {
      setHighlightedOrderId(null);
      onClearHighlightRef.current?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [highlightOrderId, highlightedOrderId, orders]);

  const purchases: Purchase[] = orders.flatMap((order) =>
    order.items.map((item, index) => ({
      id: `${order.id}-${item.product.id || index}`,
      orderId: order.id,
      productId: item.product.id || '',
      status: order.status,
      date: order.createdAt,
      name: item.product.name,
      image: item.product.image || '',
      price: item.priceAtPurchase,
      quantity: item.quantity,
      businessId: item.product.businessId || '',
      businessName: item.product.businessName || 'Business',
      category: item.product.category || 'product',
      cancelFeePercent: order.cancelFeePercent,
      cancelRefundPercent: order.cancelRefundPercent,
    }))
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'ready':
        return <Truck className="w-4 h-4 text-blue-600" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Package className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'processing':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'ready':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const sortPurchases = (list: Purchase[]) => {
    const sorted = [...list];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'price-high':
        return sorted.sort((a, b) => b.price * b.quantity - a.price * a.quantity);
      case 'price-low':
        return sorted.sort((a, b) => a.price * a.quantity - b.price * b.quantity);
      default:
        return sorted;
    }
  };

  const sortAndOrganizePurchases = (list: Purchase[], filter: StatusFilter) => {
    const sorted = sortPurchases(list);
    if (filter === 'all') {
      const nonCancelled = sorted.filter((p) => p.status !== 'cancelled');
      const cancelled = sorted.filter((p) => p.status === 'cancelled');
      return [...nonCancelled, ...cancelled];
    }
    return sorted;
  };

  const filteredPurchases = sortAndOrganizePurchases(
    purchases.filter((purchase) => {
      if (statusFilter !== 'all' && purchase.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          purchase.name.toLowerCase().includes(query) ||
          purchase.businessName.toLowerCase().includes(query) ||
          purchase.orderId.toLowerCase().includes(query)
        );
      }
      return true;
    }),
    statusFilter
  );

  const totalSpent = filteredPurchases.reduce((sum, p) => sum + p.price * p.quantity, 0);
  const statusCounts = {
    all: purchases.length,
    pending: purchases.filter((p) => p.status === 'pending').length,
    processing: purchases.filter((p) => p.status === 'processing').length,
    ready: purchases.filter((p) => p.status === 'ready').length,
    completed: purchases.filter((p) => p.status === 'completed').length,
    cancelled: purchases.filter((p) => p.status === 'cancelled').length,
  };

  const handleDeletePurchase = (id: string) => {
    setPurchaseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePurchase = () => {
    setShowDeleteModal(false);
    setPurchaseToDelete(null);
  };

  const handleBuyAgain = (purchase: Purchase) => {
    if (onAddToCart && onNavigate) {
      const cartItem: Omit<CartItem, 'id' | 'quantity'> = {
        productId: purchase.productId || purchase.orderId,
        productName: purchase.name,
        price: purchase.price,
        image: purchase.image,
        businessName: purchase.businessName,
      };
      for (let i = 0; i < purchase.quantity; i++) {
        onAddToCart(cartItem);
      }
      onNavigate('cart');
    }
  };

  const handleDownloadInvoice = (purchase: Purchase) => {
    toast.message(t('purchaseHistory.invoiceDownloadSoon', { id: purchase.orderId }));
  };

  const cancelPreview = (() => {
    if (!cancelModalOrderId) return { fee: '0.00', refund: '0.00', total: '0.00' };
    const orderTotal =
      orders.find((o) => o.id === cancelModalOrderId)?.total ??
      purchases
        .filter((p) => p.orderId === cancelModalOrderId)
        .reduce((s, p) => s + p.price * p.quantity, 0);
    return {
      total: Number(orderTotal).toFixed(2),
      fee: (Number(orderTotal) * 0.25).toFixed(2),
      refund: (Number(orderTotal) * 0.75).toFixed(2),
    };
  })();

  const openCancelModal = (orderId: string) => {
    setCancelModalOrderId(orderId);
  };

  const confirmCancelOrder = async () => {
    if (!cancelModalOrderId) return;
    const orderId = cancelModalOrderId;
    setCancellingOrderId(orderId);
    try {
      const result = await cancelOrder(orderId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? result.order : o)));
      toast.success(result.message || t('purchaseHistory.cancelSuccess'));
      setCancelModalOrderId(null);
    } catch (err: any) {
      toast.error(err?.message || t('purchaseHistory.cancelFailed'));
    } finally {
      setCancellingOrderId(null);
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest':
        return t('purchaseHistory.newestFirst');
      case 'oldest':
        return t('purchaseHistory.oldestFirst');
      case 'price-high':
        return t('purchaseHistory.priceHighLow');
      case 'price-low':
        return t('purchaseHistory.priceLowHigh');
      default:
        return t('purchaseHistory.sortBy');
    }
  };

  const getStatusFilterLabel = (status: StatusFilter) => {
    if (status === 'all') return t('purchaseHistory.allOrders');
    return statusLabel(status, t);
  };

  const openBusiness = (businessId: string) => {
    if (!businessId) {
      toast.error(t('purchaseHistory.businessUnavailable'));
      return;
    }
    onNavigateToBusiness?.(businessId);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">
                {t('purchaseHistory.title')}
              </h1>
              <p className="text-sm text-neutral-600 mt-0.5">{t('purchaseHistory.subtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('purchaseHistory.totalOrders')}</p>
                    <p className="text-2xl font-semibold text-neutral-900 mt-1">{statusCounts.all}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('purchaseHistory.totalSpent')}</p>
                    <p className="text-2xl font-semibold text-neutral-900 mt-1">
                      $
                      {purchases
                        .filter((p) => p.status !== 'cancelled')
                        .reduce((sum, p) => sum + p.price * p.quantity, 0)
                        .toFixed(2)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('purchaseHistory.completed')}</p>
                    <p className="text-2xl font-semibold text-green-600 mt-1">
                      {statusCounts.completed}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">{t('purchaseHistory.inProgress')}</p>
                    <p className="text-2xl font-semibold text-blue-600 mt-1">
                      {statusCounts.pending + statusCounts.processing + statusCounts.ready}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <Truck className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder={t('purchaseHistory.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[160px] justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>{getStatusFilterLabel(statusFilter)}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[220px]">
                {(
                  [
                    ['all', statusCounts.all],
                    ['pending', statusCounts.pending],
                    ['processing', statusCounts.processing],
                    ['ready', statusCounts.ready],
                    ['completed', statusCounts.completed],
                    ['cancelled', statusCounts.cancelled],
                  ] as const
                ).map(([key, count]) => (
                  <DropdownMenuItem key={key} onClick={() => setStatusFilter(key)}>
                    {getStatusFilterLabel(key)} ({count})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <div ref={sortDropdownRef} className="relative">
              <Button
                variant="outline"
                className="min-w-[180px] justify-between"
                onClick={() => setIsSortOpen(!isSortOpen)}
              >
                <span>{getSortLabel(sortBy)}</span>
                <ChevronDown className="w-4 h-4 ml-2" />
              </Button>
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg w-[200px] z-10">
                  <div className="py-1">
                    {(
                      [
                        ['newest', 'newestFirst'],
                        ['oldest', 'oldestFirst'],
                        ['price-high', 'priceHighLow'],
                        ['price-low', 'priceLowHigh'],
                      ] as const
                    ).map(([value, labelKey]) => (
                      <div
                        key={value}
                        className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                        onClick={() => {
                          setSortBy(value);
                          setIsSortOpen(false);
                        }}
                      >
                        {t(`purchaseHistory.${labelKey}`)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {(statusFilter !== 'all' || searchQuery.trim()) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">
                    {t('purchaseHistory.showingOf', {
                      shown: filteredPurchases.length,
                      total: purchases.length,
                    })}
                  </span>
                  {filteredPurchases.length > 0 && (
                    <span className="text-sm text-neutral-600">
                      • {t('purchaseHistory.total')} ${totalSpent.toFixed(2)}
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-sm"
                >
                  {t('purchaseHistory.clearFilters')}
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-neutral-100 rounded-full">
                    <ShoppingBag className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">
                      {t('purchaseHistory.noOrdersFound')}
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {searchQuery.trim() || statusFilter !== 'all'
                        ? t('purchaseHistory.emptyFilterBody')
                        : t('purchaseHistory.emptyStartBody')}
                    </p>
                  </div>
                  {onNavigate && (
                    <Button onClick={() => onNavigate('businesses')} className="mt-2">
                      {t('purchaseHistory.browseBusinesses')}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPurchases.map((purchase) => (
              <Card
                key={purchase.id}
                data-order-id={purchase.orderId}
                className={`overflow-hidden hover:shadow-md transition-shadow ${
                  highlightedOrderId === purchase.orderId
                    ? 'ring-2 ring-green-500 border-green-500'
                    : ''
                }`}
              >
                <CardContent className="p-0">
                  <div className="bg-neutral-50 px-4 sm:px-6 py-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-sm font-medium text-neutral-900">
                            {t('purchaseHistory.orderNumber', { id: purchase.orderId })}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${getStatusColor(purchase.status)} flex items-center gap-1.5`}
                          >
                            {getStatusIcon(purchase.status)}
                            {statusLabel(purchase.status, t)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-neutral-600 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {formatDate(purchase.date)}
                          </div>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 hover:text-green-600 transition-colors"
                            onClick={() => openBusiness(purchase.businessId)}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            {purchase.businessName}
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {purchase.status === 'completed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(purchase)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            {t('purchaseHistory.invoice')}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openBusiness(purchase.businessId)}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          {t('purchaseHistory.viewStore')}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        {getImageUrl(purchase.image) ? (
                          <img
                            src={getImageUrl(purchase.image)}
                            alt={purchase.name}
                            className="w-24 h-24 object-cover rounded-lg border bg-neutral-50"
                          />
                        ) : (
                          <div className="w-24 h-24 rounded-lg border bg-neutral-100 flex items-center justify-center">
                            <Package className="w-8 h-8 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 mb-2">{purchase.name}</h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                          <div>
                            <span className="text-neutral-500">{t('purchaseHistory.quantity')}</span>{' '}
                            <span className="font-medium text-neutral-900">{purchase.quantity}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">{t('purchaseHistory.price')}</span>{' '}
                            <span className="font-medium text-neutral-900">
                              ${purchase.price.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500">{t('purchaseHistory.total')}</span>{' '}
                            <span className="font-semibold text-green-600">
                              ${(purchase.price * purchase.quantity).toFixed(2)}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {purchase.category}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 ml-auto">
                        {CANCELLABLE.includes(purchase.status) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={cancellingOrderId === purchase.orderId}
                            onClick={() => openCancelModal(purchase.orderId)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            {t('purchaseHistory.cancelOrder')}
                          </Button>
                        )}
                        {purchase.status === 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleBuyAgain(purchase)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <RefreshCw className="w-4 h-4" />
                            {t('purchaseHistory.buyAgain')}
                          </Button>
                        )}
                        {(purchase.status === 'cancelled' || purchase.status === 'completed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('purchaseHistory.remove')}
                          </Button>
                        )}
                      </div>
                    </div>

                    {purchase.status === 'ready' && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-blue-900 mb-1">
                                {t('purchaseHistory.readyTitle')}
                              </h4>
                              <p className="text-sm text-blue-700">
                                {t('purchaseHistory.readyBody')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {(purchase.status === 'pending' || purchase.status === 'processing') && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                                {t('purchaseHistory.processingTitle')}
                              </h4>
                              <p className="text-sm text-yellow-700">
                                {t('purchaseHistory.processingBody')}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {purchase.status === 'cancelled' && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div>
                              <h4 className="text-sm font-medium text-red-900 mb-1">
                                {t('purchaseHistory.cancelledTitle')}
                              </h4>
                              <p className="text-sm text-red-700">
                                {t('purchaseHistory.cancelledBody', {
                                  fee: purchase.cancelFeePercent ?? 25,
                                  refund: purchase.cancelRefundPercent ?? 75,
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      <CancelOrderModal
        isOpen={!!cancelModalOrderId}
        feeAmount={cancelPreview.fee}
        refundAmount={cancelPreview.refund}
        orderTotal={cancelPreview.total}
        busy={!!cancellingOrderId}
        onClose={() => {
          if (cancellingOrderId) return;
          setCancelModalOrderId(null);
        }}
        onConfirm={() => void confirmCancelOrder()}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPurchaseToDelete(null);
        }}
        onConfirm={confirmDeletePurchase}
        message={t('purchaseHistory.removeBody')}
        type="order"
      />
    </div>
  );
}
