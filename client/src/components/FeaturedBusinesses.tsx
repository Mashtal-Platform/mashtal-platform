import React from 'react';
import { TrendingUp, Star, MapPin } from 'lucide-react';

interface FeaturedBusinessesProps {
  onViewBusiness: (businessId: string) => void;
  onViewAll: () => void;
}

export function FeaturedBusinesses({ onViewBusiness, onViewAll }: FeaturedBusinessesProps) {
  return (
    <section id="businesses" className="py-16 bg-gradient-to-br from-green-50 to-neutral-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-6 h-6 text-green-600" />
              <span className="text-green-600">Top Rated</span>
            </div>
            <h2 className="text-neutral-900">
              Most Trusted Providers
            </h2>
            <p className="text-neutral-600 mt-2">
              Verified businesses with excellent customer ratings
            </p>
          </div>
          <button 
            onClick={onViewAll}
            className="hidden md:block text-green-600 hover:text-green-700 transition-colors"
          >
            View All →
          </button>
        </div>

        {/* Featured Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {featuredBusinesses.map((business) => (
            <div
              key={business.id}
              className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => onViewBusiness(business.id)}
            >
              <div className="flex flex-col sm:flex-row">
                {/* Image */}
                <div className="sm:w-1/3 h-48 sm:h-auto relative">
                  <img
                    src={business.image}
                    alt={business.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{business.rating}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-xl text-neutral-900 mb-1">{business.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-neutral-600">
                        <MapPin className="w-4 h-4" />
                        <span>{business.location}</span>
                      </div>
                    </div>
                    {business.verified && (
                      <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">
                        Verified
                      </div>
                    )}
                  </div>

                  <p className="text-neutral-600 mb-4">{business.description}</p>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-neutral-600">
                      <span className="text-neutral-900">{business.products}</span> Products
                    </div>
                    <div className="text-neutral-600">
                      <span className="text-neutral-900">{business.reviews}</span> Reviews
                    </div>
                    <div className="text-green-600">
                      {business.followers} followers
                    </div>
                  </div>

                  {/* Specialties */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    {business.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 md:hidden text-center">
          <button 
            onClick={onViewAll}
            className="text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            View All Businesses →
          </button>
        </div>
      </div>
    </section>
  );
}

const featuredBusinesses = [
  {
    id: '1',
    name: 'Green Valley Nursery',
    location: 'Riyadh, Saudi Arabia',
    description: 'Leading provider of organic plants with 15+ years of expertise in sustainable agriculture.',
    image: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 124,
    followers: 1250,
    products: 450,
    verified: true,
    specialties: ['Organic Plants', 'Native Species', 'Consultation'],
  },
  {
    id: '5',
    name: 'Eco Farm Solutions',
    location: 'Mecca, Saudi Arabia',
    description: 'Complete agricultural solutions with cutting-edge technology and sustainable practices.',
    image: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 203,
    followers: 3400,
    products: 680,
    verified: true,
    specialties: ['Smart Farming', 'Irrigation', 'Equipment'],
  },
];