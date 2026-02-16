import React, { useState, useMemo, useEffect, useRef } from 'react';
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
import {
  shoppingProducts,
  getUniqueBusinesses,
  priceRanges,
  ProductCategory,
  PriceRangeId,
  ShoppingProduct,
} from '../data/shoppingData';
import { SavedItem } from '../App';

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

  const businesses = getUniqueBusinesses();

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    let filtered = [...shoppingProducts];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.businessName.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
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
      const range = priceRanges.find((r) => r.id === selectedPriceRange);
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
  ]);

  const handleSaveProduct = (productId: string) => {
    const product = shoppingProducts.find((p) => p.id === productId);
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
      });
    }
  };

  const getSortLabel = (option: SortOption) => {
    switch (option) {
      case 'featured':
        return 'Featured';
      case 'price-low':
        return 'Price: Low to High';
      case 'price-high':
        return 'Price: High to Low';
      case 'rating':
        return 'Highest Rated';
      case 'newest':
        return 'Newest';
      case 'popular':
        return 'Most Popular';
      case 'best-seller':
        return 'Best Sellers';
      default:
        return 'Sort By';
    }
  };

  const getCategoryLabel = (category: ProductCategory) => {
    switch (category) {
      case 'all':
        return 'All Categories';
      case 'seeds':
        return 'Seeds';
      case 'tools':
        return 'Tools';
      case 'fertilizers':
        return 'Fertilizers';
      case 'plants':
        return 'Plants';
      case 'irrigation':
        return 'Irrigation';
      default:
        return 'Category';
    }
  };

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-lg">
              <ShoppingBag className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-neutral-900">Shop Products</h1>
              <p className="text-sm text-neutral-600 mt-0.5">
                Browse agricultural products from verified businesses
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
                placeholder="Search products, businesses, categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="min-w-[180px] justify-between">
                  <span className="truncate">{getCategoryLabel(selectedCategory)}</span>
                  <ChevronDown className="w-4 h-4 ml-2 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px]">
                <DropdownMenuItem onClick={() => setSelectedCategory('all')}>
                  All Categories
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedCategory('plants')}>
                  🌱 Plants
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedCategory('seeds')}>
                  🌾 Seeds
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedCategory('tools')}>
                  🔧 Tools
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedCategory('fertilizers')}>
                  💊 Fertilizers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSelectedCategory('irrigation')}>
                  💧 Irrigation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
                  Featured
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('best-seller')}>
                  <Award className="w-4 h-4 mr-2" />
                  Best Sellers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('popular')}>
                  <Flame className="w-4 h-4 mr-2" />
                  Most Popular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('rating')}>
                  <Star className="w-4 h-4 mr-2" />
                  Highest Rated
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('newest')}>
                  Newest
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-low')}>
                  Price: Low to High
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortBy('price-high')}>
                  Price: High to Low
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
              Filters
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
                      Business
                    </label>
                    <select
                      value={selectedBusiness}
                      onChange={(e) => setSelectedBusiness(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value="all">All Businesses</option>
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
                      Price Range
                    </label>
                    <select
                      value={selectedPriceRange}
                      onChange={(e) => setSelectedPriceRange(e.target.value as PriceRangeId)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      {priceRanges.map((range) => (
                        <option key={range.id} value={range.id}>
                          {range.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Stock Filter */}
                  <div>
                    <label className="text-sm font-medium text-neutral-700 mb-2 block">
                      Availability
                    </label>
                    <label className="flex items-center gap-2 px-3 py-2 border border-neutral-200 rounded-lg cursor-pointer hover:bg-neutral-50">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                      <span className="text-sm text-neutral-700">In Stock Only</span>
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
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-neutral-600">
            <span>
              Showing {filteredProducts.length} of {shoppingProducts.length} products
            </span>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {filteredProducts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="p-4 bg-neutral-100 rounded-full">
                  <ShoppingBag className="w-8 h-8 text-neutral-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-neutral-900 mb-1">
                    No Products Found
                  </h3>
                  <p className="text-sm text-neutral-600">
                    Try adjusting your filters or search query
                  </p>
                </div>
                <Button onClick={clearAllFilters} className="mt-2">
                  Clear All Filters
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className={`overflow-hidden hover:shadow-lg transition-all group ${
                  highlightProductId === product.id
                    ? 'ring-4 ring-green-500 ring-offset-2'
                    : ''
                }`}
                data-product-id={product.id}
              >
                <CardContent className="p-0">
                  {/* Product Image */}
                  <div className="relative h-48 overflow-hidden bg-neutral-100">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {product.inStock ? (
                      <Badge className="absolute top-3 right-3 bg-green-600 text-white">
                        In Stock
                      </Badge>
                    ) : (
                      <Badge className="absolute top-3 right-3 bg-red-600 text-white">
                        Out of Stock
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
                        src={product.businessAvatar}
                        alt={product.businessName}
                        className="w-6 h-6 rounded-full object-cover border border-neutral-200"
                      />
                      <span className="text-xs text-neutral-600 font-medium truncate">
                        {product.businessName}
                      </span>
                      {product.businessVerified && (
                        <CheckCircle className="w-3 h-3 text-green-600 flex-shrink-0" />
                      )}
                    </div>

                    {/* Product Name */}
                    <h3 className="text-base font-medium text-neutral-900 mb-2 line-clamp-2 min-h-[3rem]">
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
                          {product.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">•</span>
                      <span className="text-xs text-neutral-600">
                        {product.reviewsCount} reviews
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
                          SR {product.price}
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    {isAuthenticated && (
                      <Button
                        onClick={() => handleAddToCart(product)}
                        disabled={!product.inStock}
                        className="w-full mt-3 gap-2"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
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
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-all">
                <CardContent className="p-0">
                  <div className="flex gap-4 p-4">
                    {/* Product Image */}
                    <div className="relative w-32 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      {product.inStock ? (
                        <Badge className="absolute top-2 right-2 bg-green-600 text-white text-xs">
                          In Stock
                        </Badge>
                      ) : (
                        <Badge className="absolute top-2 right-2 bg-red-600 text-white text-xs">
                          Out of Stock
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
                          src={product.businessAvatar}
                          alt={product.businessName}
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
                          <span className="font-medium">{product.rating.toFixed(1)}</span>
                          <span className="text-neutral-400">
                            ({product.reviewsCount})
                          </span>
                        </div>
                        <span className="text-neutral-400">•</span>
                        <Badge variant="secondary" className="text-xs">
                          {product.category}
                        </Badge>
                        <span className="text-neutral-400">•</span>
                        <span className="text-neutral-600">{product.stock} in stock</span>
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
                          SR {product.price}
                        </div>
                        {isAuthenticated && (
                          <Button
                            onClick={() => handleAddToCart(product)}
                            disabled={!product.inStock}
                            className="gap-2"
                            size="sm"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Add to Cart
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
      </div>
    </div>
  );
}