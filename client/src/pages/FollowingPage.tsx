import React, { useState } from 'react';
import { Heart, MapPin, Star, ExternalLink, X, Building2, Leaf, HardHat, Shield, Users, MessageCircle, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface FollowingPageProps {
  onViewBusiness: (businessId: string) => void;
  onNavigateToUserProfile: (userId: string) => void;
  followedBusinesses: any[];
  onUnfollowBusiness: (businessId: string) => void;
  onOpenChat?: (userId: string) => void;
}

type RoleFilter = 'all' | 'business' | 'engineer' | 'agronomist' | 'user';

export function FollowingPage({ onViewBusiness, onNavigateToUserProfile, followedBusinesses, onUnfollowBusiness, onOpenChat }: FollowingPageProps) {
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all');
  const [showUnfollowConfirm, setShowUnfollowConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleUnfollow = (businessId: string) => {
    onUnfollowBusiness(businessId);
    setShowUnfollowConfirm(null);
  };

  const filteredEntities = followedBusinesses.filter(entity => {
    // Filter out regular users - only show business, engineer, agronomist
    if (entity.role === 'user') return false;
    
    // Apply role filter
    if (activeFilter !== 'all' && entity.role !== activeFilter) return false;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const name = entity.name.toLowerCase();
      return name.includes(query);
    }
    
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'business': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'agronomist': return <Leaf className="w-4 h-4 text-green-600" />;
      case 'engineer': return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-purple-600" />;
      default: return <Users className="w-4 h-4 text-neutral-600" />;
    }
  };

  const handleViewProfile = (entity: any) => {
    if (entity.role === 'business') {
      onViewBusiness(entity.id);
    } else {
      onNavigateToUserProfile(entity.id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">
            Following
          </h1>
          <p className="text-neutral-600">
            Accounts and businesses you're following for updates
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-2xl border-neutral-200 focus:border-green-600 focus:ring-green-600 bg-white"
            />
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'business', 'engineer', 'agronomist'] as RoleFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeFilter === filter
                  ? 'bg-green-600 border-green-600 text-white shadow-md'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-green-600 hover:text-green-600'
              }`}
            >
              {filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1) + (filter === 'business' ? 'es' : 's')}
            </button>
          ))}
        </div>

        {filteredEntities.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredEntities.map((entity) => (
              <div
                key={entity.id}
                className="bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group border border-neutral-100"
              >
                {/* Enhanced Professional Photo Section */}
                <div className="relative h-80 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-50">
                  <img
                    src={entity.image || entity.avatar || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800'}
                    alt={entity.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    style={{ 
                      objectPosition: 'center 25%',
                      objectFit: 'cover'
                    }}
                  />
                  {/* Enhanced gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                  
                  {/* Action Buttons - Top Right with premium styling */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {/* Chat Button - for Engineers and Agronomists */}
                    {onOpenChat && entity.role !== 'business' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(entity.id);
                        }}
                        className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group/chat border border-white/50"
                        title="Send Message"
                      >
                        <MessageCircle className="w-5 h-5 text-green-600 group-hover/chat:text-green-700 transition-colors" strokeWidth={2.5} />
                      </button>
                    )}
                    
                    {/* Unfollow Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUnfollowConfirm(entity.id);
                      }}
                      className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group/unfollow border border-white/50"
                      title="Unfollow"
                    >
                      <X className="w-5 h-5 text-red-600 group-hover/unfollow:text-red-700 transition-colors" strokeWidth={2.5} />
                    </button>
                  </div>
                  
                  {/* Role Badge - Bottom Left with premium styling */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center border border-white/50">
                      {getRoleIcon(entity.role)}
                    </div>
                    <span className="text-white text-xs font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-xl px-3.5 py-2 rounded-xl shadow-xl border border-white/30">
                      {entity.role}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Content Section */}
                <div className="p-6">
                  {/* Name and Location */}
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2 truncate group-hover:text-green-600 transition-colors">
                      {entity.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{entity.location}</span>
                    </div>
                  </div>
                  
                  {/* Stats Section */}
                  <div className="flex items-center justify-between mb-6 pb-5 border-b border-neutral-100">
                    {entity.role === 'business' ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>
                        <span className="font-bold text-neutral-900 ml-1">{entity.rating}</span>
                        <span className="text-neutral-400 text-xs">({entity.reviews})</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-700">Verified Expert</span>
                      </div>
                    )}
                  </div>

                  {/* Followers Count */}
                  <div className="mb-4 text-center">
                    <div className="text-2xl font-bold text-neutral-900">{entity.followers.toLocaleString()}</div>
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">Followers</div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleViewProfile(entity)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold"
                  >
                    <span>View Profile</span>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-neutral-300">
            <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-neutral-300" />
            </div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">No {activeFilter === 'all' ? 'one' : activeFilter + 's'} found</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {activeFilter === 'all' 
                ? "You haven't followed anyone yet. Start exploring the community!" 
                : `You aren't following any ${activeFilter}s at the moment.`}
            </p>
            {activeFilter !== 'all' && (
              <button 
                onClick={() => setActiveFilter('all')}
                className="mt-6 text-green-600 font-bold hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Unfollow Confirmation Modal */}
      {showUnfollowConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl scale-in-95 animate-in">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <Heart className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowUnfollowConfirm(null)}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-neutral-900 mb-2">Unfollow {followedBusinesses.find(e => e.id === showUnfollowConfirm)?.name}?</h3>
            <p className="text-neutral-600 mb-8 leading-relaxed">
              You will stop receiving updates and posts from this account. You can always follow them again later.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowUnfollowConfirm(null)}
                className="flex-1 border-2 border-neutral-100 text-neutral-600 py-3.5 rounded-2xl font-bold hover:bg-neutral-50 transition-colors"
              >
                Keep Following
              </button>
              <button
                onClick={() => handleUnfollow(showUnfollowConfirm)}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
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