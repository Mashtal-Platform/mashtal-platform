import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, MapPin } from 'lucide-react';
import { fetchBusinesses } from '../shared/api/users';
import { getImageUrl } from '../shared/api/client';

interface FeaturedBusinessesProps {
  onViewBusiness: (businessId: string) => void;
  onViewAll: () => void;
}

interface BusinessCard {
  id: string;
  name: string;
  location: string;
  description: string;
  image: string;
  rating: number;
  reviews: number;
  followers: number;
  products: number | string;
  verified: boolean;
  specialties: string[];
}

export function FeaturedBusinesses({ onViewBusiness, onViewAll }: FeaturedBusinessesProps) {
  const [businesses, setBusinesses] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses()
      .then((list) => {
        // Verified only, then sort by rating descending (biggest first), take top 2
        const verified = (list as any[]).filter((b) => b.verified);
        const rating = (b: any) => Number(b.rating) || 0;
        const topTwoByRating = [...verified].sort((a, b) => rating(b) - rating(a)).slice(0, 2);
        setBusinesses(
          topTwoByRating.map((b) => ({
            id: b.id,
            name: b.fullName || b.companyName || 'Business',
            location: b.location || '—',
            description: b.bio || 'No description',
            image: getImageUrl(b.avatar) || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
            rating: typeof b.rating === 'number' ? b.rating : 0,
            reviews: b.reviewsCount ?? 0,
            followers: b.followersCount ?? 0,
            products: '—',
            verified: !!b.verified,
            specialties: Array.isArray(b.specialties) ? b.specialties : [],
          }))
        );
      })
      .catch(() => setBusinesses([]))
      .finally(() => setLoading(false));
  }, []);

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
            className="hidden md:block text-green-600 hover:text-green-700 transition-colors font-medium"
          >
            View All →
          </button>
        </div>

        {/* Featured Grid - verified businesses with highest rating from API */}
        {loading ? (
          <div className="grid md:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl overflow-hidden border border-neutral-200 animate-pulse h-48 sm:h-40" />
            ))}
          </div>
        ) : businesses.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-6">
            {businesses.map((business) => (
              <div
                key={business.id}
                className="bg-white rounded-xl overflow-hidden border border-neutral-200 hover:shadow-xl transition-shadow cursor-pointer"
                onClick={() => onViewBusiness(business.id)}
              >
                <div className="flex flex-col sm:flex-row">
                  {/* Image */}
                  <div className="sm:w-1/3 h-48 sm:h-auto relative min-h-[12rem]">
                    <img
                      src={business.image}
                      alt={business.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-amber-500 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Star className="w-4 h-4 fill-current" />
                      <span>{business.rating.toFixed(1)}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="text-xl text-neutral-900 mb-1">{business.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-600">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{business.location}</span>
                        </div>
                      </div>
                      {business.verified && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                          Verified
                        </div>
                      )}
                    </div>

                    <p className="text-neutral-600 mb-4 line-clamp-2">{business.description}</p>

                    <div className="flex items-center gap-6 text-sm">
                      {business.products !== '—' && (
                        <div className="text-neutral-600">
                          <span className="text-neutral-900">{business.products}</span> Products
                        </div>
                      )}
                      <div className="text-neutral-600">
                        <span className="text-neutral-900">{business.reviews}</span> Reviews
                      </div>
                      <div className="text-green-600">
                        {business.followers.toLocaleString()} followers
                      </div>
                    </div>

                    {business.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-4">
                        {business.specialties.slice(0, 5).map((specialty, index) => (
                          <span
                            key={index}
                            className="bg-neutral-100 text-neutral-700 px-3 py-1 rounded-full text-sm"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-neutral-500">
            <p>No verified top-rated businesses yet.</p>
            <button
              onClick={onViewAll}
              className="mt-4 text-green-600 hover:text-green-700 font-medium"
            >
              View all businesses →
            </button>
          </div>
        )}

        {/* Mobile View All Button */}
        {businesses.length > 0 && (
          <div className="mt-8 md:hidden text-center">
            <button
              onClick={onViewAll}
              className="text-green-600 hover:text-green-700 transition-colors font-medium"
            >
              View All Businesses →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
