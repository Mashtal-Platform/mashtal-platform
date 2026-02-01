import React, { useState } from 'react';
import { Search, Filter, MapPin, Star, X } from 'lucide-react';
import { businesses } from '../data/businessData';

interface SearchPageProps {
  onViewBusiness: (businessId: string) => void;
}

export function SearchPage({ onViewBusiness }: SearchPageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [location, setLocation] = useState('all');

  // Apply all filters
  const filteredResults = businesses.filter(business => {
    // Search query filter
    const matchesSearch = searchQuery.length === 0 ||
      business.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      business.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));

    // Category filter
    const matchesCategory = selectedCategory === 'all' || 
      business.specialties.some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()));

    // Rating filter
    const matchesRating = business.rating >= minRating;

    // Verified filter
    const matchesVerified = !verifiedOnly || business.verified;

    // Location filter
    const matchesLocation = location === 'all' || business.location.includes(location);

    return matchesSearch && matchesCategory && matchesRating && matchesVerified && matchesLocation;
  });

  const resetFilters = () => {
    setMinRating(0);
    setVerifiedOnly(false);
    setLocation('all');
    setSelectedCategory('all');
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
              placeholder="Search for nurseries, plants, tools, services..."
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

        {/* Results */}
        <div className="mb-6">
          <p className="text-neutral-600">
            {filteredResults.length} results found
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onViewBusiness(item.id)}
            >
              <div className="relative h-48">
                <img
                  src={item.logo}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {item.verified && (
                  <div className="absolute top-3 right-3 bg-green-600 text-white px-3 py-1 rounded-full text-sm">
                    Verified
                  </div>
                )}
              </div>
              
              <div className="p-5">
                <h3 className="text-xl text-neutral-900 mb-2">{item.name}</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{item.location}</span>
                </div>
                <p className="text-neutral-600 mb-4 line-clamp-2">{item.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-neutral-900">{item.rating}</span>
                    <span className="text-neutral-500 text-sm">({item.reviews})</span>
                  </div>
                  <div className="text-sm text-green-600">{item.followers} followers</div>
                </div>
              </div>
            </div>
          ))}
        </div>

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
  { id: 'nurseries', name: 'Nurseries' },
  { id: 'tools', name: 'Tools' },
  { id: 'plants', name: 'Plants' },
  { id: 'organic', name: 'Organic' },
];