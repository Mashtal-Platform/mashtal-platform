import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag,
  Search,
  Filter,
  ChevronDown,
  Star,
  CheckCircle,
  Bookmark,
  ShoppingCart,
  MapPin,
  TrendingUp,
  SlidersHorizontal,
  Grid3x3,
  List,
  X,
  Flame,
  Award,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { fetchProducts, ShoppingProductDto } from '../shared/api/products';
import { getImageUrl } from '../shared/api/client';
import { ProductDetailModal } from '../components/ProductDetailModal';
import type { SavedItem } from '../shared/types';

const productCategories = ['all', 'seeds', 'plants', 'trees', 'fertilizers', 'tools', 'equipment', 'irrigation', 'medicament', 'other'] as const;
type ProductCategory = (typeof productCategories)[number];

const categoryLabelKeys: Record<ProductCategory, string> = {
  all: 'shopping.all',
  seeds: 'shopping.seeds',
  plants: 'shopping.plants',
  trees: 'shopping.trees',
  fertilizers: 'shopping.fertilizers',
  tools: 'shopping.tools',
  equipment: 'shopping.equipment',
  irrigation: 'shopping.irrigation',
  medicament: 'shopping.medicament',
  other: 'shopping.other',
};
const priceRangeDefs = [
  { id: 'all', labelKey: 'shopping.allPrices', min: 0, max: Infinity },
  { id: '0-100', labelKey: 'shopping.under100', min: 0, max: 100 },
  { id: '100-300', labelKey: 'shopping.range100_300', min: 100, max: 300 },
  { id: '300-500', labelKey: 'shopping.range300_500', min: 300, max: 500 },
  { id: '500+', labelKey: 'shopping.range500plus', min: 500, max: Infinity },
] as const;
type PriceRangeId = (typeof priceRangeDefs)[number]['id'];
type ShoppingProduct = ShoppingProductDto;

interface ShoppingPageProps {
  onNavigateToBusiness?: (businessId: string) => void;
  onAddToCart?: (product: any) => void;
  isAuthenticated?: boolean;
  savedItems?: SavedItem[];
  onSaveProduct?: (item: SavedItem) => void;
  onRemoveSavedItem?: (itemId: string) => void;
  highlightProductId?: string | null;
  onClearHighlight?: () => void;
}

type SortOption = 'featured' | 'price-low' | 'price-high' | 'rating' | 'newest' | 'popular' | 'best-seller';
type ViewMode = 'grid' | 'list';

export function ShoppingPage({
  onNavigateToBusiness,
  onAddToCart,
  isAuthenticated = true,
  savedItems = [],
  onSaveProduct,
  onRemoveSavedItem,
  highlightProductId,
  onClearHighlight,
}: ShoppingPageProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('all');
  const [selectedBusiness, setSelectedBusiness] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRangeId>('all');
  const [sortBy, setSortBy] = useState<SortOption>('featured');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [backendProducts, setBackendProducts] = useState<ShoppingProduct[]>([]);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<ShoppingProduct | null>(null);

  const businesses = useMemo(() => {
    const map = new Map<string, { id: string; name: string; avatar: string }>();
    backendProducts.forEach((p) => {
      if (p.businessId && !map.has(p.businessId)) {
        map.set(p.businessId, {
          id: p.businessId,
          name: p.businessName ?? 'Unknown',
          avatar: p.businessAvatar ?? '',
        });
      }
    });
    return Array.from(map.values());
  }, [backendProducts]);

  const [retryCount, setRetryCount] = useState(0);

  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      // No businessId = all products from all businesses (shop catalog)
      const apiProducts: ShoppingProductDto[] = await fetchProducts();
      const list = Array.isArray(apiProducts) ? apiProducts : [];
      const normalized = list.map((p) => ({
        id: p?.id ?? '',
        name: p?.name ?? '',
        description: p?.description ?? '',
        price: Number(p?.price) ?? 0,
        image: p?.image ?? '',
        category: (p?.category ?? 'plants') as ShoppingProduct['category'],
        stock: Number(p?.stock) ?? 0,
        rating: Number(p?.rating) ?? 0,
        reviewsCount: Number(p?.reviewsCount) ?? 0,
        businessId: p?.businessId ?? '',
        businessName: p?.businessName ?? 'Unknown Business',
        businessAvatar: p?.businessAvatar ?? '',
        businessRole: 'business' as const,
        businessVerified: Boolean(p?.businessVerified),
        businessRating: p?.businessRating != null ? Number(p.businessRating) : undefined,
        businessLocation: p?.businessLocation ?? 'Saudi Arabia',
        inStock: (p?.inStock ?? (Number(p?.stock) > 0)),
      }));
      setBackendProducts(normalized);
    } catch (err: any) {
      console.error('[ShoppingPage] Failed to load products from API:', err);
      setProductsError(err?.message || 'Failed to load products. Please try again.');
      setBackendProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts, retryCount]);

  useEffect(() => {
    try {
      const prefetched = sessionStorage.getItem('mashtal_shop_search');
      if (prefetched && prefetched.trim()) {
        setSearchQuery(prefetched.trim());
        sessionStorage.removeItem('mashtal_shop_search');
      }
    } catch {
      // ignore storage access issues
    }
  }, []);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const sourceProducts = backendProducts;

    let filtered = [...sourceProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          (p.name ?? '').toLowerCase().includes(query) ||
          (p.description ?? '').toLowerCase().includes(query) ||
          (p.businessName ?? '').toLowerCase().includes(query) ||
          (p.category ?? '').toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    // Business filter
    if (selectedBusiness !== 'all') {
      filtered = filtered.filter((p) => p.businessId === selectedBusiness);
    }

    // Price range filter
    if (selectedPriceRange !== 'all') {
      const range = priceRangeDefs.find((r) => r.id === selectedPriceRange);
      if (range) {
        filtered = filtered.filter((p) => p.price >= range.min && p.price <= range.max);
      }
    }

    // In stock filter
    if (inStockOnly) {
      filtered = filtered.filter((p) => p.inStock);
    }

    // Sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'popular':
        // Sort by number of reviews (most reviewed = most popular)
        filtered.sort((a, b) => b.reviewsCount - a.reviewsCount);
        break;
      case 'best-seller':
        // Sort by a combination of high rating and many reviews
        filtered.sort((a, b) => {
          const scoreA = a.rating * Math.log(a.reviewsCount + 1);
          const scoreB = b.rating * Math.log(b.reviewsCount + 1);
          return scoreB - scoreA;
        });
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => b.rating * b.reviewsCount - a.rating * a.reviewsCount);
        break;
    }

    return filtered;
  }, [
    searchQuery,
    selectedCategory,
    selectedBusiness,
    selectedPriceRange,
    sortBy,
    inStockOnly,
    backendProducts,
  ]);

  const handleSaveProduct = (productId: string) => {
    const product = filteredProducts.find((p) => p.id === productId) ?? backendProducts.find((p) => p.id === productId);
    if (!product) return;

    // Check if already saved
    const savedItem = savedItems.find((item) => item.itemId === productId && item.type === 'product');
    
    if (savedItem) {
      // If already saved, remove it
      if (onRemoveSavedItem) {
        onRemoveSavedItem(savedItem.id);
      }
    } else {
      // If not saved, add it
      if (onSaveProduct) {
        const newSavedItem: SavedItem = {
          id: `product-${productId}-${Date.now()}`,
          type: 'product',
          itemId: productId,
          title: product.name,
          image: product.image,
          description: product.description,
          savedAt: new Date(),
        };
        onSaveProduct(newSavedItem);
      }
    }
  };

  const handleAddToCart = (product: ShoppingProduct) => {
    if (onAddToCart) {
      onAddToCart({
        productId: product.id,
        productName: product.name,
        price: product.price,
        image: product.image,
        businessName: product.businessName,
        stock: product.stock,
      });
    }
  };

  const handleProductRated = (productId: string, averageRating: number, reviewsCount: number) => {
    setBackendProducts((prev) =>
      prev.map((p) =>
        p.id === productId ? { ...p, rating: averageRating, reviewsCount } : p
      )
    );
    setSelectedProduct((prev) =>
      prev?.id === productId ? { ...prev, rating: averageRating, reviewsCount } : prev
    );
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'featured':
        return t('shopping.featured');
      case 'price-low':
        return t('shopping.priceLowHigh');
      case 'price-high':
        return t('shopping.priceHighLow');
      case 'rating':
        return t('shopping.highestRated');
      case 'newest':
        return t('shopping.newest');
      case 'popular':
        return t('shopping.mostPopular');
      case 'best-seller':
        return t('shopping.bestSellers');
      default:
        return t('shopping.sortBy');
    }
  };

  const getCategoryLabel = (category: ProductCategory) =>
    category === 'all' ? t('shopping.allCategories') : t(categoryLabelKeys[category]);

  const activeFiltersCount = [
    selectedCategory !== 'all',
    selectedBusiness !== 'all',
    selectedPriceRange !== 'all',
    inStockOnly,
  ].filter(Boolean).length;

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedBusiness('all');
    setSelectedPriceRange('all');
    setInStockOnly(false);
    setSearchQuery('');
  };

  // Scroll to and highlight product when highlightProductId is set
  useEffect(() => {
    if (highlightProductId && filteredProducts.length > 0) {
      // Wait for render
      setTimeout(() => {
        // Find all product cards
        const allCards = document.querySelectorAll('[data-product-id]');
        const targetCard = Array.from(allCards).find(
          (card) => card.getAttribute('data-product-id') === highlightProductId
        );

        if (targetCard) {
          // Scroll to the product card
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [highlightProductId, filteredProducts]);

  // Handle scroll to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        // At top, always show header
        setShowHeader(true);
      } else if (currentScrollY > lastScrollY) {
        // Scrolling down, hide header
        setShowHeader(false);
      } else {
        // Scrolling up, show header
        setShowHeader(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className={`bg-white border-b sticky top-0 z-30 transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-neutral-900">{t('shopping.title')}</h1>
              <p className="text-sm text-neutral-600 mt-0.5">
                {t('shopping.subtitle')}
              </p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input
                type="text"
                placeholder={t('shopping.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter — same options as business add-product */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
              className="min-w-[180px] px-4 py-2.5 border-2 border-green-600 rounded-lg outline-none bg-white text-neutral-900 focus:ring-2 focus:ring-green-200"
            >
              <option value="all">{t('shopping.selectCategory')}</option>
              <option value="seeds">{t('shopping.seeds')}</option>
              <option value="plants">{t('shopping.plants')}</option>
              <option value="trees">{t('shopping.trees')}</option>
              <option value="fertilizers">{t('shopping.fertilizers')}</option>
              <option value="tools">{t('shopping.tools')}</option>
              <option value="equipment">{t('shopping.equipment')}</option>
              <option value="irrigation">{t('shopping.irrigation')}</option>
              <option value="medicament">{t('shopping.medicament')}</option>
              <option value="other">{t('shopping.other')}</option>
            </select>

            {/* Sort */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px] justify-between">
                  <span className="truncate">{getSortLabel(sortBy)}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setSortBy('featured')}>
                  <TrendingUp className="w-4 h-4 mr-2" />
                  {t('shopping.featured')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('best-seller')}>
                  <Award className="w-4 h-4 mr-2" />
                  {t('shopping.bestSellers')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                  <Flame className="w-4 h-4 mr-2" />
                  {t('shopping.mostPopular')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('rating')}>
                  <Star className="w-4 h-4 mr-2" />
                  {t('shopping.highestRated')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  {t('shopping.newest')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-low')}>
                  {t('shopping.priceLowHigh')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-high')}>
                  {t('shopping.priceHighLow')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Advanced Filters Button */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="relative"
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              {t('shopping.filters')}
              {activeFiltersCount > 0 && (
                <Badge
                  variant="default"
                  className="ml-2 bg-green-600 text-white h-5 min-w-5 px-1.5"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* View Mode Toggle */}
            <div className="hidden lg:flex border rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${
                  viewMode === 'grid'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Grid3x3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${
                  viewMode === 'list'
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Business Filter */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">
                      {t('shopping.business')}
                    </label>
                    <select
                      value={selectedBusiness}
                      onChange={(e) => setSelectedBusiness(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">{t('shopping.allBusinesses')}</option>
                      {businesses.map((business) => (
                        <option key={business.id} value={business.id}>
                          {business.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range Filter */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">
                      {t('shopping.priceRange')}
                    </label>
                    <select
                      value={selectedPriceRange}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRangeId)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {priceRangeDefs.map((range) => (
                        <option key={range.id} value={range.id}>
                          {t(range.labelKey)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Filter */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">
                      {t('shopping.availability')}
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-neutral-700">{t('shopping.inStockOnly')}</span>
                    </label>
                  </div>

                  {/* Clear Filters */}
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={clearAllFilters}
                      className="w-full"
                      disabled={activeFiltersCount === 0}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('shopping.clearAll')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>
              {t('shopping.showingOf', { shown: filteredProducts.length, total: backendProducts.length })}
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                {t('shopping.clearFilters')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {productsError && (
          <Card className="mb-4">
            <CardContent className="p-3 text-sm text-yellow-800 bg-yellow-50 border border-yellow-200">
              {productsError}
            </CardContent>
          </Card>
        )}

        {isLoadingProducts ? (
          <Card>
            <CardContent className="p-6 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-green-600 border-t-transparent" />
                <p className="text-sm text-neutral-600">{t('shopping.loadingProducts')}</p>
              </div>
            </CardContent>
          </Card>
        ) : filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-6 sm:p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-neutral-100 rounded-full">
                  <ShoppingBag className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">
                    {backendProducts.length === 0
                      ? t('shopping.noProductsAvailable')
                      : t('shopping.noProducts')}
                  </h3>
                  <p className="text-sm text-neutral-600">
                    {backendProducts.length === 0
                      ? t('shopping.noProductsEmptyBody')
                      : t('shopping.noProductsBody')}
                  </p>
                </div>
                {backendProducts.length === 0 ? (
                  <Button onClick={() => setRetryCount((c) => c + 1)} className="mt-2">
                    {t('shopping.retry')}
                  </Button>
                ) : (
                  <Button onClick={clearAllFilters} className="mt-2">
                    {t('shopping.clearAllFilters')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`overflow-hidden hover:shadow-lg transition-all group cursor-pointer ${
                  highlightProductId === product.id
                    ? 'ring-4 ring-green-500 ring-offset-2'
                    : ''
                }`}
                data-product-id={product.id}
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div
                    className="relative h-48 overflow-hidden bg-neutral-100 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <img
                      src={getImageUrl(product.image) || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'}
                      alt={product.name || 'Product'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.inStock ? (
                      <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                        {t('shopping.inStock')}
                      </Badge>
                    ) : (
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white">
                        {t('shopping.outOfStock')}
                      </Badge>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveProduct(product.id);
                      }}
                      className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur-sm rounded-lg hover:bg-white transition-colors"
                    >
                      <Bookmark
                        className={`w-4 h-4 ${
                          savedItems.some((item) => item.itemId === product.id && item.type === 'product')
                            ? 'fill-green-600 text-green-600'
                            : 'text-neutral-600'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    {/* Business Info */}
                    <div
                      className="flex items-center gap-2 mb-3 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onNavigateToBusiness?.(product.businessId)}
                    >
                      <img
                        src={getImageUrl(product.businessAvatar) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                        alt={product.businessName || 'Business'}
                        className="w-6 h-6 rounded-full object-cover border border-neutral-200"
                      />
                      <span className="text-xs text-neutral-600 font-medium truncate">
                        {product.businessName}
                      </span>
                      {product.businessVerified && (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Product Name - click to view details & rate */}
                    <h3
                      className="text-base font-medium text-neutral-900 mb-2 line-clamp-2 min-h-[3rem] hover:text-green-600 transition-colors cursor-pointer"
                      onClick={() => setSelectedProduct(product)}
                    >
                      {product.name}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>

                    {/* Rating & Category */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-sm font-medium text-neutral-900">
                          {(Number(product.rating) || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-600">
                        {t('shopping.reviews', { count: product.reviewsCount })}
                      </span>
                      <span className="text-xs text-neutral-400">•</span>
                      <Badge variant="secondary" className="text-xs">
                        {product.category}
                      </Badge>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div>
                        <span className="text-2xl font-bold text-green-600">
                          $ {product.price}
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    {isAuthenticated && (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product);
                        }}
                        disabled={!product.inStock}
                        className="w-full mt-3 gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {product.inStock ? t('shopping.addToCart') : t('shopping.outOfStock')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // List View
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {/* Product Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <img
                        src={getImageUrl(product.image) || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'}
                        alt={product.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                      {product.inStock ? (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                          {t('shopping.inStock')}
                        </Badge>
                      ) : (
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white text-xs">
                          {t('shopping.outOfStock')}
                        </Badge>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      {/* Business Info */}
                      <div
                        className="flex items-center gap-2 mb-2 cursor-pointer hover:opacity-80 transition-opacity w-fit"
                        onClick={() => onNavigateToBusiness?.(product.businessId)}
                      >
                        <img
                          src={getImageUrl(product.businessAvatar) || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100'}
                          alt={product.businessName || 'Business'}
                          className="w-5 h-5 rounded-full object-cover border border-neutral-200"
                        />
                        <span className="text-xs text-neutral-600 font-medium">
                          {product.businessName}
                        </span>
                        {product.businessVerified && (
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        )}
                      </div>

                      <h3 className="text-lg font-medium text-neutral-900 mb-2">
                        {product.name}
                      </h3>
                      <p className="text-sm text-neutral-600 mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-medium">{(Number(product.rating) || 0).toFixed(1)}</span>
                          <span className="text-neutral-400">
                            ({product.reviewsCount})
                          </span>
                        </div>
                        <span className="text-neutral-400">•</span>
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-600">{t('shopping.inStockCount', { count: product.stock })}</span>
                      </div>
                    </div>

                    {/* Price & Actions */}
                    <div className="flex flex-col items-end justify-between flex-shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveProduct(product.id);
                        }}
                        className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                        aria-label={t('shopping.saveProduct')}
                      >
                        <Bookmark
                          className={`w-5 h-5 ${
                            savedItems.some((item) => item.itemId === product.id && item.type === 'product')
                              ? 'fill-green-600 text-green-600'
                              : 'text-neutral-600'
                          }`}
                        />
                      </button>

                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-3">
                          $ {product.price}
                        </div>
                        {isAuthenticated && (
                          <Button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(product);
                            }}
                            disabled={!product.inStock}
                            className="gap-2"
                            size="sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            {t('shopping.addToCart')}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isAuthenticated={isAuthenticated}
          onAddToCart={selectedProduct ? () => handleAddToCart(selectedProduct) : undefined}
          onRated={handleProductRated}
        />
      </div>
    </div>
  );
}