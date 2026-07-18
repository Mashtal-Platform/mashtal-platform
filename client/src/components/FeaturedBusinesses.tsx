import React, { useState, useEffect } from 'react';
import { TrendingUp, Star, MapPin, Sparkles } from 'lucide-react';
import { fetchBusinesses } from '../shared/api/users';
import { getImageUrl } from '../shared/api/client';
import { rankHomeBusinessSpotlights } from '../shared/utils/businessRanking';

interface FeaturedBusinessesProps {
  onViewBusiness: (businessId: string) => void;
  onViewAll: () => void;
}

interface BusinessCard {
  id: string;
  name: string;
  location: string;
  image: string;
  rating: number;
  reviews: number;
  followers: number;
  verified: boolean;
}

const FEATURED_LIMIT = 8;
const TRUSTED_LIMIT = 2;

function toCard(b: any): BusinessCard {
  return {
    id: String(b.id),
    name: b.fullName || b.companyName || b.name || 'Business',
    location: b.location || '—',
    image:
      getImageUrl(b.avatar) ||
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800',
    rating: typeof b.rating === 'number' ? b.rating : Number(b.rating) || 0,
    reviews: b.reviewsCount ?? 0,
    followers: b.followersCount ?? 0,
    verified: !!b.verified,
  };
}

function BusinessCardButton({
  business,
  onViewBusiness,
}: {
  business: BusinessCard;
  onViewBusiness: (id: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onViewBusiness(business.id)}
      className="text-left bg-white rounded-xl overflow-hidden border border-neutral-200 hover:border-green-300 hover:shadow-md transition-all w-full"
    >
      <div className="relative aspect-[4/3] bg-neutral-100">
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-md text-sm font-medium flex items-center gap-1">
          <Star className="w-4 h-4 fill-current" />
          <span>{business.rating.toFixed(1)}</span>
        </div>
        {business.verified && (
          <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-md text-xs font-medium">
            Verified
          </div>
        )}
      </div>
      <div className="p-3 sm:p-4">
        <h3 className="text-base sm:text-lg font-semibold text-neutral-900 truncate">
          {business.name}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{business.location}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-sm text-neutral-600">
          <span>{business.reviews} reviews</span>
          <span className="text-green-600 font-medium truncate">
            {business.followers.toLocaleString()} followers
          </span>
        </div>
      </div>
    </button>
  );
}

function FeaturedGrid({
  businesses,
  loading,
  onViewBusiness,
  emptyMessage,
  onViewAll,
}: {
  businesses: BusinessCard[];
  loading: boolean;
  onViewBusiness: (id: string) => void;
  emptyMessage: string;
  onViewAll: () => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: FEATURED_LIMIT }, (_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl overflow-hidden border border-neutral-200 animate-pulse"
          >
            <div className="aspect-[4/3] bg-neutral-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-neutral-100 rounded w-3/4" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-10 text-neutral-500">
        <p className="text-base">{emptyMessage}</p>
        <button
          onClick={onViewAll}
          className="mt-4 text-green-600 hover:text-green-700 font-medium text-base"
        >
          View all businesses →
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {businesses.map((business) => (
        <BusinessCardButton
          key={business.id}
          business={business}
          onViewBusiness={onViewBusiness}
        />
      ))}
    </div>
  );
}

/** Trusted: exactly up to 2 compact cards, not stretched full width. */
function TrustedGrid({
  businesses,
  loading,
  onViewBusiness,
  emptyMessage,
  onViewAll,
}: {
  businesses: BusinessCard[];
  loading: boolean;
  onViewBusiness: (id: string) => void;
  emptyMessage: string;
  onViewAll: () => void;
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl overflow-hidden border border-neutral-200 animate-pulse"
          >
            <div className="aspect-[4/3] bg-neutral-100" />
            <div className="p-4 space-y-2">
              <div className="h-4 bg-neutral-100 rounded w-3/4" />
              <div className="h-3 bg-neutral-100 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-10 text-neutral-500">
        <p className="text-base">{emptyMessage}</p>
        <button
          onClick={onViewAll}
          className="mt-4 text-green-600 hover:text-green-700 font-medium text-base"
        >
          View all businesses →
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
      {businesses.map((business) => (
        <BusinessCardButton
          key={business.id}
          business={business}
          onViewBusiness={onViewBusiness}
        />
      ))}
    </div>
  );
}

export function FeaturedBusinesses({ onViewBusiness, onViewAll }: FeaturedBusinessesProps) {
  const [featured, setFeatured] = useState<BusinessCard[]>([]);
  const [trusted, setTrusted] = useState<BusinessCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBusinesses()
      .then((list) => {
        const { featured: featuredRanked, trusted: trustedRanked } = rankHomeBusinessSpotlights(
          list as any[],
          FEATURED_LIMIT,
          TRUSTED_LIMIT
        );
        setFeatured(featuredRanked.map(toCard));
        setTrusted(trustedRanked.map(toCard));
      })
      .catch(() => {
        setTrusted([]);
        setFeatured([]);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <section id="featured-businesses" className="py-10 sm:py-14 bg-white scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-green-600" />
                <span className="text-base text-green-600 font-medium">Spotlight</span>
              </div>
              <h2 className="text-2xl sm:text-3xl text-neutral-900">Featured Businesses</h2>
              <p className="text-base text-neutral-600 mt-2">
                Popular providers with strong community followings
              </p>
            </div>
            <button
              onClick={onViewAll}
              className="hidden md:block text-base text-green-600 hover:text-green-700 transition-colors font-medium"
            >
              View All →
            </button>
          </div>

          <FeaturedGrid
            businesses={featured}
            loading={loading}
            onViewBusiness={onViewBusiness}
            emptyMessage="No featured businesses yet."
            onViewAll={onViewAll}
          />

          {featured.length > 0 && (
            <div className="mt-6 md:hidden text-center">
              <button
                onClick={onViewAll}
                className="text-base text-green-600 hover:text-green-700 font-medium"
              >
                View All Businesses →
              </button>
            </div>
          )}
        </div>
      </section>

      <section id="businesses" className="py-10 sm:py-14 bg-gradient-to-br from-green-50 to-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <span className="text-base text-green-600 font-medium">Top Rated</span>
              </div>
              <h2 className="text-2xl sm:text-3xl text-neutral-900">Most Trusted Providers</h2>
              <p className="text-base text-neutral-600 mt-2">
                Proven ratings across many reviews
              </p>
            </div>
            <button
              onClick={onViewAll}
              className="hidden md:block text-base text-green-600 hover:text-green-700 transition-colors font-medium"
            >
              View All →
            </button>
          </div>

          <TrustedGrid
            businesses={trusted}
            loading={loading}
            onViewBusiness={onViewBusiness}
            emptyMessage="No trusted businesses yet."
            onViewAll={onViewAll}
          />

          {trusted.length > 0 && (
            <div className="mt-6 md:hidden text-center">
              <button
                onClick={onViewAll}
                className="text-base text-green-600 hover:text-green-700 font-medium"
              >
                View All Businesses →
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
