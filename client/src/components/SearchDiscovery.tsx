import React, { useState } from 'react';
import { Leaf, Sprout, Shovel, TreePine, Filter, MapPin, X } from 'lucide-react';
import { otherUsers } from '../data/centralMockData';

interface SearchDiscoveryProps {
  onViewBusiness: (businessId: string) => void;
}

const categories = [
  { id: 'all', name: 'All', icon: Leaf },
  { id: 'nurseries', name: 'Nurseries', icon: Sprout },
  { id: 'tools', name: 'Tools & Equipment', icon: Shovel },
  { id: 'plants', name: 'Trees & Plants', icon: TreePine },
];

export function SearchDiscovery({ onViewBusiness }: SearchDiscoveryProps) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [location, setLocation] = useState('all');

  const businesses = otherUsers.filter(u => u.role === 'business');

  // Filter businesses based on category and advanced filters
  const filteredBusinesses = businesses.filter(business => {
    // Category filter - searching bio for matching terms
    const matchesCategory = selectedCategory === 'all' || 
      business.bio.toLowerCase().includes(selectedCategory.toLowerCase());

    // Rating filter
    const matchesRating = (business.rating || 0) >= minRating;

    // Verified filter
    const matchesVerified = !verifiedOnly || business.verified;

    // Location filter
    const matchesLocation = location === 'all' || business.location.includes(location);

    return matchesCategory && matchesRating && matchesVerified && matchesLocation;
  });

  const resetFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setLocation('all');
    setSelectedCategory('all');
  };

  return (
    <section id="discover" className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-neutral-900 mb-4">
            Discover Agricultural Services
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Browse through verified nurseries, agricultural shops, and service providers
          </p>
        </div>

        {/* Category Filters */}
        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{category.name}</span>
              </button>
            );
          })}
          <button
            onClick={() => setShowMoreFilters(!showMoreFilters)}
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors"
          >
            <Filter className="w-5 h-5" />
            <span>More Filters</span>
          </button>
        </div>

        {/* Advanced Filters Panel */}
        {showMoreFilters && (
          <div className="mb-8 bg-neutral-50 rounded-xl p-6 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg text-neutral-900">Advanced Filters</h3>
              <button onClick={() => setShowMoreFilters(false)} className="p-2 hover:bg-neutral-200 rounded-lg">
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
                className="px-6 py-2 border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-100 transition-colors"
              >
                Reset Filters
              </button>
              <button
                onClick={() => setShowMoreFilters(false)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        )}

        {/* Featured Tag */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-green-600 rounded-full"></div>
            <span className="text-neutral-700">Featured Businesses</span>
          </div>
          <div className="text-sm text-neutral-600">Showing {filteredBusinesses.length} results</div>
        </div>

        {/* Business Cards Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onViewBusiness(business.businessId || business.id)}
            >
              <div className="relative h-48">
                <img
                  src={business.avatar}
                  alt={business.fullName}
                  className="w-full h-full object-cover"
                />
                {business.verified && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                    Verified
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <h3 className="text-xl text-neutral-900 mb-2">{business.fullName}</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{business.location}</span>
                </div>
                <p className="text-neutral-600 mb-4 line-clamp-2">{business.bio}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span className="text-amber-500">★</span>
                    <span className="text-neutral-900">{business.rating}</span>
                    <span className="text-neutral-500 text-sm">({business.reviewsCount})</span>
                  </div>
                  <div className="text-sm text-green-600">{business.followers} followers</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredBusinesses.length === 0 && (
          <div className="text-center py-16">
            <Leaf className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">No businesses found</h3>
            <p className="text-neutral-600 mb-4">Try adjusting your filters</p>
            <button
              onClick={resetFilters}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Load More */}
        {filteredBusinesses.length > 0 && (
          <div className="text-center mt-12">
            <button 
              onClick={() => {
                // In a real app, this would load more businesses from the backend
                // For now, it just shows a message
                alert('Loading more businesses...');
              }}
              className="px-8 py-3 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-colors"
            >
              Load More Businesses
            </button>
          </div>
        )}
      </div>
    </section>
  );
}