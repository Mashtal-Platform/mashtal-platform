import React, { useState } from 'react';
import { Heart, MapPin, Star, ExternalLink, X } from 'lucide-react';

interface FollowingPageProps {
  onViewBusiness: (businessId: string) => void;
}

export function FollowingPage({ onViewBusiness }: FollowingPageProps) {
  const [businesses, setBusinesses] = useState(followingBusinesses);
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState<string | null>(null);

  const handleUnfollow = (businessId: string) => {
    setBusinesses(businesses.filter(b => b.id !== businessId));
    setShowUnfollowConfirm(null);
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl text-neutral-900 mb-2">
            Following
          </h1>
          <p className="text-neutral-600">
            Businesses and nurseries you're following
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <div
              key={business.id}
              className="bg-white border border-neutral-200 rounded-xl overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="relative h-48">
                <img
                  src={business.image}
                  alt={business.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setShowUnfollowConfirm(business.id)}
                  className="absolute top-3 right-3 bg-white p-2 rounded-full shadow-lg hover:bg-neutral-50 transition-colors"
                >
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                </button>
              </div>
              
              <div className="p-5">
                <h3 className="text-xl text-neutral-900 mb-2">{business.name}</h3>
                <div className="flex items-center gap-2 text-sm text-neutral-600 mb-3">
                  <MapPin className="w-4 h-4" />
                  <span>{business.location}</span>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-current" />
                    <span className="text-neutral-900">{business.rating}</span>
                    <span className="text-neutral-500 text-sm">({business.reviews})</span>
                  </div>
                  <div className="text-sm text-neutral-600">{business.followers} followers</div>
                </div>

                <button
                  onClick={() => onViewBusiness(business.id)}
                  className="w-full flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>View Profile</span>
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {businesses.length === 0 && (
          <div className="text-center py-16">
            <Heart className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">No followed businesses yet</h3>
            <p className="text-neutral-600">Start following businesses to see them here</p>
          </div>
        )}
      </div>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl text-neutral-900">Unfollow Business?</h3>
              <button
                onClick={() => setShowUnfollowConfirm(null)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-neutral-600 mb-6">
              Are you sure you want to unfollow <strong>{businesses.find(b => b.id === showUnfollowConfirm)?.name}</strong>? You won't receive updates from this business anymore.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfollowConfirm(null)}
                className="flex-1 border-2 border-neutral-200 text-neutral-700 py-3 rounded-lg hover:border-green-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnfollow(showUnfollowConfirm)}
                className="flex-1 bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors"
              >
                Unfollow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const followingBusinesses = [
  {
    id: '1',
    name: 'Green Valley Nursery',
    location: 'Riyadh, Saudi Arabia',
    image: 'https://images.unsplash.com/photo-1619077130450-baea09efa355?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFudCUyMG51cnNlcnklMjBncmVlbmhvdXNlfGVufDF8fHx8MTc2NTc0MjUzNHww&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.8,
    reviews: 124,
    followers: 1250,
  },
  {
    id: '5',
    name: 'Eco Farm Solutions',
    location: 'Mecca, Saudi Arabia',
    image: 'https://images.unsplash.com/photo-1636089167961-4964523e6c3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtaW5nJTIwc3Vuc2V0JTIwbGFuZHNjYXBlfGVufDF8fHx8MTc2NTc0MjUzNnww&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.9,
    reviews: 203,
    followers: 3400,
  },
  {
    id: '3',
    name: 'Fresh Harvest Farm',
    location: 'Dammam, Saudi Arabia',
    image: 'https://images.unsplash.com/photo-1631337902392-b4bb679fbfdb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvcmdhbmljJTIwdmVnZXRhYmxlcyUyMGZhcm1pbmd8ZW58MXx8fHwxNzY1NzQyNTM0fDA&ixlib=rb-4.1.0&q=80&w=1080',
    rating: 4.7,
    reviews: 156,
    followers: 2100,
  },
];
