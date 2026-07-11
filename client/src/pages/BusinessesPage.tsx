import React, { useEffect, useState } from 'react';
import { Building2, MapPin, Star, Users, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { fetchBusinesses, UserDto } from '../shared/api/users';
import { getImageUrl } from '../shared/api/client';

interface BusinessesPageProps {
  onViewBusiness: (businessId: string) => void;
}

export function BusinessesPage({ onViewBusiness }: BusinessesPageProps) {
  const [businesses, setBusinesses] = useState<UserDto[]>([]);

  useEffect(() => {
    fetchBusinesses()
      .then(setBusinesses)
      .catch((err) => {
        console.error('[BusinessesPage] Failed to load businesses from API:', err);
      });
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">All Businesses</h1>
          <p className="text-neutral-600">
            Discover {businesses.length} verified agricultural businesses on Mashtal
          </p>
        </div>

        {/* Businesses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Card key={business.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              {/* Cover Image */}
              <div className="relative h-48 bg-gradient-to-br from-green-100 to-green-200">
                {business.avatar ? (
                  <img
                    src={getImageUrl(business.avatar)}
                    alt={business.companyName || business.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-neutral-400">
                    <Building2 className="w-14 h-14" />
                  </div>
                )}
                {business.verified && (
                  <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                  {business.companyName || business.fullName}
                </h3>
                <div className="flex items-center gap-1 text-sm text-neutral-600 mb-4">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{business.location || '—'}</span>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                  {business.bio}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-neutral-900">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {typeof business.rating === 'number' ? business.rating.toFixed(1) : (business.rating ?? 0)}
                    </div>
                    <p className="text-xs text-neutral-500">{business.reviewsCount ?? 0} reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-neutral-900">
                      <Users className="w-4 h-4" />
                      {business.followersCount ?? business.followers ?? 0}
                    </div>
                    <p className="text-xs text-neutral-500">Followers</p>
                  </div>
                </div>

                {/* Specialties/Tags (from DB) */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {business.verified && (
                    <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                      Verified
                    </span>
                  )}
                  {(business.specialties || []).slice(0, 4).map((s) => (
                    <span key={s} className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">
                      {s}
                    </span>
                  ))}
                  {(!business.specialties || business.specialties.length === 0) && !business.verified && (
                    <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded-full">
                      No tags
                    </span>
                  )}
                </div>

                {/* View Button */}
                <Button 
                  onClick={() => onViewBusiness(business.businessId || business.id)}
                  className="w-full"
                >
                  View Business
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
