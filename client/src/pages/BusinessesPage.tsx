import React from 'react';
import { otherUsers } from '../data/centralMockData';
import { Building2, MapPin, Star, Users, Package, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { useAuth } from '../contexts/AuthContext';

interface BusinessesPageProps {
  onViewBusiness: (businessId: string) => void;
}

export function BusinessesPage({ onViewBusiness }: BusinessesPageProps) {
  const { isAuthenticated } = useAuth();
  const businesses = otherUsers.filter(u => u.role === 'business');

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
                <img 
                  src={business.avatar} // Using avatar as cover since we don't have separate cover in centralMockData
                  alt={business.fullName}
                  className="w-full h-full object-cover"
                />
                {business.verified && (
                  <div className="absolute top-3 right-3 bg-white rounded-full p-1.5 shadow-md">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Logo & Name */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 border-white shadow-md -mt-12 bg-white">
                    <img 
                      src={business.avatar} 
                      alt={business.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 mt-2">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                      {business.fullName}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-neutral-600">
                      <MapPin className="w-4 h-4" />
                      <span>{business.location}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                  {business.bio}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-neutral-900">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      {business.rating}
                    </div>
                    <p className="text-xs text-neutral-500">{business.reviewsCount} reviews</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-neutral-900">
                      <Users className="w-4 h-4" />
                      {business.followers}
                    </div>
                    <p className="text-xs text-neutral-500">Followers</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-sm font-semibold text-neutral-900">
                      <Package className="w-4 h-4" />
                      12
                    </div>
                    <p className="text-xs text-neutral-500">Products</p>
                  </div>
                </div>

                {/* specialties would be dynamic if we had them in centralMockData */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">Agricultural Supply</span>
                  <span className="text-xs px-2 py-1 bg-green-50 text-green-700 rounded-full">Verified Provider</span>
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
