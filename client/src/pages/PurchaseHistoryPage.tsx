import React, { useState, useRef, useEffect } from 'react';
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
  FileText
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { mockPurchases, Purchase } from '../data/purchaseData';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { CartItem } from '../App';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { Separator } from '../components/ui/separator';

interface PurchaseHistoryPageProps {
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigate?: (page: string) => void;
  onAddToCart?: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
}

type StatusFilter = 'all' | 'delivered' | 'processing' | 'shipped' | 'cancelled';
type SortOption = 'newest' | 'oldest' | 'price-high' | 'price-low';

export function PurchaseHistoryPage({ onNavigateToBusiness, onNavigate, onAddToCart }: PurchaseHistoryPageProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [purchases, setPurchases] = useState<Purchase[]>(mockPurchases);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [purchaseToDelete, setPurchaseToDelete] = useState<number | null>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);

  // Close sort dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    };

    if (isSortOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSortOpen]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'shipped': return <Truck className="w-4 h-4 text-blue-600" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-600" />;
      default: return <Package className="w-4 h-4 text-neutral-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-50 text-green-700 border-green-200';
      case 'processing': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'shipped': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'cancelled': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-neutral-50 text-neutral-700 border-neutral-200';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const sortPurchases = (purchases: Purchase[]) => {
    const sorted = [...purchases];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      case 'price-high':
        return sorted.sort((a, b) => (b.price * b.quantity) - (a.price * a.quantity));
      case 'price-low':
        return sorted.sort((a, b) => (a.price * a.quantity) - (b.price * b.quantity));
      default:
        return sorted;
    }
  };

  const sortAndOrganizePurchases = (purchases: Purchase[], statusFilter: StatusFilter) => {
    const sorted = sortPurchases(purchases);
    
    // When viewing 'all', move cancelled orders to the bottom
    if (statusFilter === 'all') {
      const nonCancelled = sorted.filter(p => p.status !== 'cancelled');
      const cancelled = sorted.filter(p => p.status === 'cancelled');
      return [...nonCancelled, ...cancelled];
    }
    
    return sorted;
  };

  const filteredPurchases = sortAndOrganizePurchases(
    purchases.filter(purchase => {
      // Filter by status
      if (statusFilter !== 'all' && purchase.status !== statusFilter) return false;
      
      // Filter by search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = purchase.name.toLowerCase().includes(query);
        const matchesBusiness = purchase.businessName.toLowerCase().includes(query);
        const matchesOrderId = purchase.orderId.toLowerCase().includes(query);
        return matchesName || matchesBusiness || matchesOrderId;
      }
      
      return true;
    }),
    statusFilter
  );

  const totalSpent = filteredPurchases.reduce((sum, p) => sum + (p.price * p.quantity), 0);
  const statusCounts = {
    all: purchases.length,
    delivered: purchases.filter(p => p.status === 'delivered').length,
    processing: purchases.filter(p => p.status === 'processing').length,
    shipped: purchases.filter(p => p.status === 'shipped').length,
    cancelled: purchases.filter(p => p.status === 'cancelled').length,
  };

  const handleDeletePurchase = (id: number) => {
    setPurchaseToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDeletePurchase = () => {
    if (purchaseToDelete !== null) {
      const updatedPurchases = purchases.filter(p => p.id !== purchaseToDelete);
      setPurchases(updatedPurchases);
      setShowDeleteModal(false);
      setPurchaseToDelete(null);
    }
  };

  const handleBuyAgain = (purchase: Purchase) => {
    if (onAddToCart && onNavigate) {
      // Convert Purchase to CartItem format
      const cartItem: Omit<CartItem, 'id' | 'quantity'> = {
        productId: purchase.orderId, // Using orderId as a unique product identifier
        productName: purchase.name,
        price: purchase.price,
        image: purchase.image,
        businessName: purchase.businessName,
      };
      
      // Add item to cart with the same quantity as the original purchase
      for (let i = 0; i < purchase.quantity; i++) {
        onAddToCart(cartItem);
      }
      
      // Navigate to cart page
      onNavigate('cart');
    }
  };

  const handleDownloadInvoice = (purchase: Purchase) => {
    // Mock invoice download - in production, this would fetch the actual invoice
    console.log(`Downloading invoice for order ${purchase.orderId}`);
    alert(`Invoice for ${purchase.orderId} would be downloaded here`);
  };

  const handleCancelOrder = (purchaseId: number) => {
    const updatedPurchases = purchases.map(p => 
      p.id === purchaseId ? { ...p, status: 'cancelled' as const } : p
    );
    setPurchases(updatedPurchases);
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      case 'price-high': return 'Price: High to Low';
      case 'price-low': return 'Price: Low to High';
      default: return 'Sort By';
    }
  };

  const getStatusLabel = (status: StatusFilter) => {
    switch (status) {
      case 'all': return 'All Orders';
      case 'delivered': return 'Delivered';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'cancelled': return 'Cancelled';
      default: return 'Filter';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Purchase History</h1>
              <p className="text-sm text-neutral-600 mt-0.5">
                Track and manage all your orders
              </p>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-neutral-600">Total Orders</p>
                    <p className="text-2xl font-semibold text-neutral-900 mt-1">
                      {statusCounts.all}
                    </p>
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
                    <p className="text-sm text-neutral-600">Total Spent</p>
                    <p className="text-2xl font-semibold text-neutral-900 mt-1">
                      ${purchases.reduce((sum, p) => sum + (p.price * p.quantity), 0).toFixed(2)}
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
                    <p className="text-sm text-neutral-600">Delivered</p>
                    <p className="text-2xl font-semibold text-green-600 mt-1">
                      {statusCounts.delivered}
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
                    <p className="text-sm text-neutral-600">In Progress</p>
                    <p className="text-2xl font-semibold text-blue-600 mt-1">
                      {statusCounts.processing + statusCounts.shipped}
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

      {/* Filters and Search Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder="Search orders by name, business, or order ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[160px] justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span>{getStatusLabel(statusFilter)}</span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                  <Package className="w-4 h-4 mr-2" />
                  All Orders ({statusCounts.all})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('delivered')}>
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Delivered ({statusCounts.delivered})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('processing')}>
                  <Clock className="w-4 h-4 mr-2 text-yellow-600" />
                  Processing ({statusCounts.processing})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('shipped')}>
                  <Truck className="w-4 h-4 mr-2 text-blue-600" />
                  Shipped ({statusCounts.shipped})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatusFilter('cancelled')}>
                  <XCircle className="w-4 h-4 mr-2 text-red-600" />
                  Cancelled ({statusCounts.cancelled})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort By */}
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
                    <div
                      className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      onClick={() => {
                        setSortBy('newest');
                        setIsSortOpen(false);
                      }}
                    >
                      Newest First
                    </div>
                    <div
                      className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      onClick={() => {
                        setSortBy('oldest');
                        setIsSortOpen(false);
                      }}
                    >
                      Oldest First
                    </div>
                    <div
                      className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      onClick={() => {
                        setSortBy('price-high');
                        setIsSortOpen(false);
                      }}
                    >
                      Price: High to Low
                    </div>
                    <div
                      className="px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                      onClick={() => {
                        setSortBy('price-low');
                        setIsSortOpen(false);
                      }}
                    >
                      Price: Low to High
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Filters Summary */}
          {(statusFilter !== 'all' || searchQuery.trim()) && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">
                    Showing {filteredPurchases.length} of {purchases.length} orders
                  </span>
                  {filteredPurchases.length > 0 && (
                    <span className="text-sm text-neutral-600">
                      • Total: ${totalSpent.toFixed(2)}
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
                  Clear Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {filteredPurchases.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-neutral-100 rounded-full">
                    <ShoppingBag className="w-8 h-8 text-neutral-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-neutral-900 mb-1">
                      No Orders Found
                    </h3>
                    <p className="text-sm text-neutral-600">
                      {searchQuery.trim() || statusFilter !== 'all' 
                        ? 'Try adjusting your filters or search query'
                        : 'Start shopping to see your purchase history'}
                    </p>
                  </div>
                  {onNavigate && (
                    <Button 
                      onClick={() => onNavigate('businesses')}
                      className="mt-2"
                    >
                      Browse Businesses
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredPurchases.map((purchase) => (
              <Card key={purchase.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-0">
                  {/* Order Header */}
                  <div className="bg-neutral-50 px-6 py-4 border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-neutral-900">
                              Order #{purchase.orderId}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`${getStatusColor(purchase.status)} flex items-center gap-1.5`}
                            >
                              {getStatusIcon(purchase.status)}
                              {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(purchase.date)}
                            </div>
                            <div 
                              className="flex items-center gap-1.5 hover:text-green-600 cursor-pointer transition-colors"
                              onClick={() => onNavigateToBusiness?.(purchase.businessId)}
                            >
                              <Building2 className="w-3.5 h-3.5" />
                              {purchase.businessName}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        {purchase.status === 'delivered' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadInvoice(purchase)}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Invoice
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onNavigateToBusiness?.(purchase.businessId)}
                          className="gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Store
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="flex gap-4">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        <img
                          src={purchase.image}
                          alt={purchase.name}
                          className="w-24 h-24 object-cover rounded-lg border"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-neutral-900 mb-2">
                          {purchase.name}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600">
                          <div>
                            <span className="text-neutral-500">Quantity:</span>{' '}
                            <span className="font-medium text-neutral-900">{purchase.quantity}</span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Price:</span>{' '}
                            <span className="font-medium text-neutral-900">
                              ${purchase.price.toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-neutral-500">Total:</span>{' '}
                            <span className="font-semibold text-green-600">
                              ${(purchase.price * purchase.quantity).toFixed(2)}
                            </span>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {purchase.category}
                          </Badge>
                        </div>

                        {/* Rating (if delivered and rated) */}
                        {purchase.rating && purchase.status === 'delivered' && (
                          <div className="flex items-center gap-1.5 mt-3">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < purchase.rating!
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-neutral-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-neutral-600">Your Rating</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons (Right Side) */}
                      <div className="flex flex-col gap-2 ml-auto">
                        {/* Cancel Order Button - only for processing orders */}
                        {purchase.status === 'processing' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(purchase.id)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <XCircle className="w-4 h-4" />
                            Cancel Order
                          </Button>
                        )}
                        {purchase.status === 'delivered' && (
                          <Button
                            size="sm"
                            onClick={() => handleBuyAgain(purchase)}
                            className="gap-2 whitespace-nowrap"
                          >
                            <RefreshCw className="w-4 h-4" />
                            Buy Again
                          </Button>
                        )}
                        {purchase.status === 'delivered' && !purchase.rating && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 whitespace-nowrap"
                          >
                            <Star className="w-4 h-4" />
                            Rate Product
                          </Button>
                        )}
                        {(purchase.status === 'cancelled' || purchase.status === 'delivered') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePurchase(purchase.id)}
                            className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Tracking Info for Shipped Orders */}
                    {purchase.status === 'shipped' && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Truck className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-blue-900 mb-1">
                                Your order is on the way!
                              </h4>
                              <p className="text-sm text-blue-700">
                                Expected delivery: 2-3 business days
                              </p>
                            </div>
                            <Button variant="link" size="sm" className="text-blue-600">
                              Track Order
                            </Button>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Processing Info */}
                    {purchase.status === 'processing' && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-yellow-900 mb-1">
                                Order is being processed
                              </h4>
                              <p className="text-sm text-yellow-700">
                                Your order will be shipped soon
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {/* Cancelled Info */}
                    {purchase.status === 'cancelled' && (
                      <>
                        <Separator className="my-4" />
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-red-900 mb-1">
                                Order Cancelled
                              </h4>
                              <p className="text-sm text-red-700">
                                This order has been cancelled. Refund processed.
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setPurchaseToDelete(null);
        }}
        onConfirm={confirmDeletePurchase}
        title="Remove Purchase"
        description="Are you sure you want to remove this purchase from your history? This action cannot be undone."
      />
    </div>
  );
}