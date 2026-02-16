import React, { useState, useMemo } from 'react';
import { Search, Filter, MapPin, Star, X, CheckCircle, Package, FileText, MessageCircle, Building2, Award } from 'lucide-react';
import { otherUsers, mockPosts, mockThreads, mockProducts } from '../data/centralMockData';
import { useAuth } from '../contexts/AuthContext';

// Unified search result type
interface SearchResult {
  id: string;
  type: 'business' | 'engineer' | 'agronomist' | 'product' | 'post' | 'thread';
  title: string;
  subtitle?: string;
  description: string;
  image: string;
  verified?: boolean;
  rating?: number;
  location?: string;
  authorName?: string;
  authorImage?: string;
  price?: number;
  data: any; // Original data object
}

interface SearchPageProps {
  onViewBusiness: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onNavigate?: (page: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
}

export function SearchPage({ onViewBusiness, onNavigateToUserProfile, onNavigate, onNavigateWithParams }: SearchPageProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [location, setLocation] = useState('all');

  // Build unified search results
  const allResults: SearchResult[] = useMemo(() => {
    const results: SearchResult[] = [];

    // Add businesses
    otherUsers
      .filter(u => u.role === 'business')
      .forEach(business => {
        results.push({
          id: business.id,
          type: 'business',
          title: business.fullName,
          description: business.bio,
          image: business.avatar,
          verified: business.verified,
          rating: business.rating,
          location: business.location,
          data: business
        });
      });

    // Add engineers
    otherUsers
      .filter(u => u.role === 'engineer')
      .forEach(engineer => {
        results.push({
          id: engineer.id,
          type: 'engineer',
          title: engineer.fullName,
          subtitle: engineer.title || 'Agricultural Engineer',
          description: engineer.bio,
          image: engineer.avatar,
          verified: engineer.verified,
          location: engineer.location,
          data: engineer
        });
      });

    // Add agronomists
    otherUsers
      .filter(u => u.role === 'agronomist')
      .forEach(agronomist => {
        results.push({
          id: agronomist.id,
          type: 'agronomist',
          title: agronomist.fullName,
          subtitle: 'Agricultural Expert',
          description: agronomist.bio,
          image: agronomist.avatar,
          verified: agronomist.verified,
          location: agronomist.location,
          data: agronomist
        });
      });

    // Add products
    mockProducts.forEach(product => {
      const business = otherUsers.find(u => u.id === product.businessId || u.businessId === product.businessId);
      results.push({
        id: product.id,
        type: 'product',
        title: product.name,
        description: product.description,
        image: product.image,
        price: product.price,
        authorName: business?.fullName || business?.name || 'Unknown Business',
        authorImage: business?.avatar || business?.logo,
        rating: product.rating,
        data: product
      });
    });

    // Add posts
    mockPosts.forEach(post => {
      const author = otherUsers.find(u => u.id === post.authorId);
      results.push({
        id: post.id,
        type: 'post',
        title: post.title || 'Post',
        subtitle: author?.fullName || author?.name || 'User',
        description: post.content,
        image: post.image,
        authorName: author?.fullName || author?.name,
        authorImage: author?.avatar || author?.logo,
        verified: author?.verified,
        data: post
      });
    });

    // Add threads
    mockThreads.forEach(thread => {
      const author = otherUsers.find(u => u.id === thread.authorId);
      results.push({
        id: thread.id,
        type: 'thread',
        title: thread.title || 'Thread',
        subtitle: author?.fullName || author?.name || 'User',
        description: thread.content,
        image: author?.avatar || author?.logo || 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400',
        authorName: author?.fullName || author?.name,
        authorImage: author?.avatar || author?.logo,
        verified: author?.verified,
        data: thread
      });
    });

    return results;
  }, []);

  // Apply all filters
  const filteredResults = useMemo(() => {
    return allResults.filter(result => {
      // Search query filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = searchQuery.length === 0 ||
        result.title.toLowerCase().includes(searchLower) ||
        result.description.toLowerCase().includes(searchLower) ||
        result.subtitle?.toLowerCase().includes(searchLower) ||
        result.authorName?.toLowerCase().includes(searchLower) ||
        result.location?.toLowerCase().includes(searchLower);

      // Category filter
      const matchesCategory = selectedCategory === 'all' || result.type === selectedCategory;

      // Rating filter (only applies to businesses, products, engineers with ratings)
      const matchesRating = !result.rating || result.rating >= minRating;

      // Verified filter
      const matchesVerified = !verifiedOnly || result.verified;

      // Location filter
      const matchesLocation = location === 'all' || result.location?.includes(location);

      return matchesSearch && matchesCategory && matchesRating && matchesVerified && matchesLocation;
    });
  }, [allResults, searchQuery, selectedCategory, minRating, verifiedOnly, location]);

  const resetFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setLocation('all');
    setSelectedCategory('all');
  };

  const handleResultClick = (result: SearchResult) => {
    switch (result.type) {
      case 'business':
        onViewBusiness(result.id);
        break;
      case 'engineer':
      case 'agronomist':
        if (onNavigateToUserProfile) {
          onNavigateToUserProfile(result.id);
        }
        break;
      case 'product':
        // Navigate to shopping page with product highlight
        if (onNavigateWithParams) {
          onNavigateWithParams('shopping', { productId: result.id });
        } else if (onNavigate) {
          onNavigate('shopping');
        }
        break;
      case 'post':
        // Navigate to posts page with highlight
        if (onNavigateWithParams) {
          onNavigateWithParams('posts', { highlightPostId: result.id });
        } else if (onNavigate) {
          onNavigate('posts');
        }
        break;
      case 'thread':
        // Navigate to threads page with highlight
        if (onNavigateWithParams) {
          onNavigateWithParams('threads', { highlightThreadId: result.id });
        } else if (onNavigate) {
          onNavigate('threads');
        }
        break;
    }
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'business':
        return <Building2 className="w-5 h-5 text-green-600" />;
      case 'engineer':
      case 'agronomist':
        return <Award className="w-5 h-5 text-blue-600" />;
      case 'product':
        return <Package className="w-5 h-5 text-purple-600" />;
      case 'post':
        return <FileText className="w-5 h-5 text-orange-600" />;
      case 'thread':
        return <MessageCircle className="w-5 h-5 text-teal-600" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'business':
        return 'Business';
      case 'engineer':
        return 'Engineer';
      case 'agronomist':
        return 'Agronomist';
      case 'product':
        return 'Product';
      case 'post':
        return 'Post';
      case 'thread':
        return 'Thread';
      default:
        return type;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-6">Search</h1>
          
          {/* Search Bar */}
          <div className="bg-white rounded-xl shadow-lg p-3 flex items-center gap-3 mb-6">
            <Search className="w-5 h-5 text-neutral-400 ml-2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for businesses, experts, products, posts, threads..."
              className="flex-1 outline-none text-neutral-700 placeholder:text-neutral-400"
            />
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              Search
            </button>
          </div>

          {/* Category Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                {category.name}
              </button>
            ))}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg text-neutral-700 hover:bg-neutral-100 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span>More Filters</span>
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 bg-white rounded-xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg text-neutral-900">Advanced Filters</h3>
                <button onClick={() => setShowFilters(false)} className="p-2 hover:bg-neutral-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm text-neutral-700 mb-2">Minimum Rating</label>
                  <select
                    value={minRating}
                    onChange={(e) => setMinRating(Number(e.target.value))}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  >
                    <option value={0}>All ratings</option>
                    <option value={3}>3+ stars</option>
                    <option value={4}>4+ stars</option>
                    <option value={4.5}>4.5+ stars</option>
                  </select>
                </div>

                {/* Location Filter */}
                <div>
                  <label className="block text-sm text-neutral-700 mb-2">Location</label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-4 py-2 border border-neutral-200 rounded-lg outline-none focus:border-green-600"
                  >
                    <option value="all">All locations</option>
                    <option value="Riyadh">Riyadh</option>
                    <option value="Jeddah">Jeddah</option>
                    <option value="Dammam">Dammam</option>
                    <option value="Mecca">Mecca</option>
                  </select>
                </div>

                {/* Verified Filter */}
                <div>
                  <label className="block text-sm text-neutral-700 mb-2">Verification</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={verifiedOnly}
                      onChange={(e) => setVerifiedOnly(e.target.checked)}
                      className="w-5 h-5 text-green-600 border-neutral-300 rounded focus:ring-green-600"
                    />
                    <span className="text-neutral-700">Verified only</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={resetFilters}
                  className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  Reset Filters
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-neutral-600">
            {filteredResults.length} results found
          </p>
        </div>

        {/* Unified Results List */}
        <div className="space-y-4">
          {filteredResults.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="bg-white border border-neutral-200 rounded-xl p-4 hover:shadow-lg hover:border-green-300 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                {/* Image/Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  {result.verified && (
                    <div className="absolute -top-1 -right-1 bg-green-600 text-white p-1 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      {/* Type Badge */}
                      <div className="flex items-center gap-2 mb-1">
                        {getResultIcon(result.type)}
                        <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                          {getTypeLabel(result.type)}
                        </span>
                      </div>
                      
                      {/* Title */}
                      <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                        {result.title}
                      </h3>

                      {/* Subtitle (for posts, threads, engineers) */}
                      {result.subtitle && (
                        <p className="text-sm text-neutral-600 mb-1">
                          {result.subtitle}
                        </p>
                      )}

                      {/* Author info (for products, posts, threads) */}
                      {result.authorName && ['product', 'post', 'thread'].includes(result.type) && (
                        <div className="flex items-center gap-2 mb-2">
                          {result.authorImage && (
                            <img
                              src={result.authorImage}
                              alt={result.authorName}
                              className="w-5 h-5 rounded-full object-cover"
                            />
                          )}
                          <span className="text-sm text-neutral-500">
                            {result.type === 'product' ? 'Sold by ' : 'Posted by '}
                            <span className="font-medium text-neutral-700">{result.authorName}</span>
                          </span>
                        </div>
                      )}

                      {/* Description */}
                      <p className="text-sm text-neutral-600 line-clamp-2 mb-2">
                        {result.description}
                      </p>

                      {/* Meta information */}
                      <div className="flex items-center gap-4 text-sm text-neutral-500">
                        {result.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{result.location}</span>
                          </div>
                        )}
                        {result.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500 fill-current" />
                            <span className="text-neutral-900 font-medium">{result.rating}</span>
                          </div>
                        )}
                        {result.price && (
                          <div className="text-green-600 font-semibold">
                            SR {result.price}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {filteredResults.length === 0 && (
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">No results found</h3>
            <p className="text-neutral-600 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const categories = [
  { id: 'all', name: 'All' },
  { id: 'business', name: 'Businesses' },
  { id: 'engineer', name: 'Engineers' },
  { id: 'agronomist', name: 'Agronomists' },
  { id: 'product', name: 'Products' },
  { id: 'post', name: 'Posts' },
  { id: 'thread', name: 'Threads' },
];