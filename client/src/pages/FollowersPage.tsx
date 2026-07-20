import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, MapPin, Star, ExternalLink, X, Building2, Shield, Users, MessageCircle, Search } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { getImageUrl } from '../shared/api/client';

interface FollowersPageProps {
  onViewBusiness: (businessId: string) => void;
  onNavigateToUserProfile: (userId: string) => void;
  followers: any[];
  onRemoveFollower?: (followerId: string) => void;
  onOpenChat?: (userId: string) => void;
}

type RoleFilter = 'all' | 'business' | 'visitor';

export function FollowersPage({ 
  onViewBusiness, 
  onNavigateToUserProfile, 
  followers, 
  onRemoveFollower,
  onOpenChat 
}: FollowersPageProps) {
  const { t } = useTranslation();
  const [activeFilter, setActiveFilter] = useState<RoleFilter>('all');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleRemove = (followerId: string) => {
    if (onRemoveFollower) {
      onRemoveFollower(followerId);
    }
    setShowRemoveConfirm(null);
  };

  const filteredFollowers = followers.filter(follower => {
    // Apply role filter
    if (activeFilter !== 'all' && follower.role !== activeFilter) return false;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const name = (follower.name || follower.fullName || '').toLowerCase();
      return name.includes(query);
    }
    
    return true;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'business': return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'admin': return <Shield className="w-4 h-4 text-purple-600" />;
      default: return <Users className="w-4 h-4 text-neutral-600" />;
    }
  };

  const handleViewProfile = (follower: any) => {
    if (follower.role === 'business') {
      onViewBusiness(follower.id);
    } else {
      onNavigateToUserProfile(follower.id);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t('profile.followersTitle')}</h1>
          <p className="text-neutral-600">
            {t('profile.followersSubtitle')}
          </p>
        </div>

        {/* Search Input */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <Input
              type="text"
              placeholder={t('profile.searchByName')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-4 py-6 rounded-2xl border-neutral-200 focus:border-green-600 focus:ring-green-600 bg-white"
            />
          </div>
        </div>

        {/* Role Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['all', 'visitor', 'business'] as RoleFilter[]).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all border ${
                activeFilter === filter
                  ? 'bg-green-600 border-green-600 text-white shadow-md'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:border-green-600 hover:text-green-600'
              }`}
            >
              {filter === 'all' ? t('common.all') : filter === 'business' ? t('profile.businesses') : t('profile.visitors')}
            </button>
          ))}
        </div>

        {filteredFollowers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredFollowers.map((follower) => (
              <div
                key={follower.id}
                className="bg-white rounded-3xl overflow-hidden hover:shadow-2xl transition-all duration-500 group border border-neutral-100"
              >
                {/* Enhanced Professional Photo Section */}
                <div className="relative h-80 overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-50">
                  <img
                    src={getImageUrl(follower.avatar || follower.image) || follower.avatar || follower.image || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=800'}
                    alt={follower.name || follower.fullName || 'Profile'}
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
                    {/* Chat Button - only for non-visitor roles */}
                    {onOpenChat && follower.role !== 'visitor' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenChat(follower.id);
                        }}
                        className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group/chat border border-white/50"
                        title={t('common.message')}
                      >
                        <MessageCircle className="w-5 h-5 text-green-600 group-hover/chat:text-green-700 transition-colors" strokeWidth={2.5} />
                      </button>
                    )}
                    
                    {/* Remove Follower Button */}
                    {onRemoveFollower && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRemoveConfirm(follower.id);
                        }}
                        className="w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 flex items-center justify-center group/remove border border-white/50"
                        title={t('profile.removeFollower')}
                      >
                        <X className="w-5 h-5 text-red-600 group-hover/remove:text-red-700 transition-colors" strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                  
                  {/* Role Badge - Bottom Left with premium styling */}
                  <div className="absolute bottom-4 left-4 flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-white/95 backdrop-blur-md rounded-full shadow-xl flex items-center justify-center border border-white/50">
                      {getRoleIcon(follower.role)}
                    </div>
                    <span className="text-white text-xs font-extrabold uppercase tracking-widest bg-white/20 backdrop-blur-xl px-3.5 py-2 rounded-xl shadow-xl border border-white/30">
                      {follower.role}
                    </span>
                  </div>
                </div>
                
                {/* Enhanced Content Section */}
                <div className="p-6">
                  {/* Name and Location */}
                  <div className="mb-5">
                    <h3 className="text-xl font-bold text-neutral-900 mb-2 truncate group-hover:text-green-600 transition-colors">
                      {follower.name || follower.fullName}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{follower.location}</span>
                    </div>
                  </div>
                  
                  {/* Stats Section */}
                  <div className="flex items-center justify-between mb-6 pb-5 border-b border-neutral-100">
                    {follower.role === 'business' ? (
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>
                        <span className="font-bold text-neutral-900 ml-1">{follower.rating}</span>
                        <span className="text-neutral-400 text-xs">({follower.reviews})</span>
                      </div>
                    ) : follower.role !== 'visitor' ? (
                      <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1.5 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs font-bold text-green-700">{t('profile.verifiedExpert')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-neutral-50 px-3 py-1.5 rounded-lg">
                        <Users className="w-3.5 h-3.5 text-neutral-500" />
                        <span className="text-xs font-bold text-neutral-600">{t('profile.member')}</span>
                      </div>
                    )}
                  </div>

                  {/* Following Since */}
                  <div className="mb-4 text-center">
                    <div className="text-sm font-bold text-neutral-900">{t('profile.followingSince')}</div>
                    <div className="text-xs font-semibold text-neutral-400 uppercase tracking-wide mt-1">
                      {follower.followingSince || t('profile.recently')}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    onClick={() => handleViewProfile(follower)}
                    className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white py-3 rounded-xl transition-all shadow-lg hover:shadow-xl font-semibold"
                  >
                    <span>{t('profile.viewProfile')}</span>
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
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">{activeFilter === 'all' ? t('profile.noFollowersYet') : t('profile.noFollowersFilter', { filter: activeFilter === 'business' ? t('profile.businesses') : t('profile.visitors') })}</h3>
            <p className="text-neutral-500 max-w-sm mx-auto">
              {activeFilter === 'all' ? t('profile.emptyFollowersAll') : t('profile.emptyFollowersFilter', { filter: activeFilter === 'business' ? t('profile.businesses') : t('profile.visitors') })}
            </p>
            {activeFilter !== 'all' && (
              <button 
                onClick={() => setActiveFilter('all')}
                className="mt-6 text-green-600 font-bold hover:underline"
              >
                {t('profile.clearFilters')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Remove Follower Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 shadow-2xl scale-in-95 animate-in">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center text-red-600">
                <X className="w-6 h-6" />
              </div>
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="p-2 hover:bg-neutral-100 rounded-xl transition-colors text-neutral-400"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <h3 className="text-2xl font-bold text-neutral-900 mb-2">{t('profile.removeNamed', { name: followers.find(f => f.id === showRemoveConfirm)?.name || followers.find(f => f.id === showRemoveConfirm)?.fullName })}</h3>
            <p className="text-neutral-600 mb-8 leading-relaxed">
              {t('profile.removeFollowerBody')}
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="flex-1 border-2 border-neutral-100 text-neutral-600 py-3.5 rounded-2xl font-bold hover:bg-neutral-50 transition-colors"
              >{t('common.cancel')}</button>
              <button
                onClick={() => handleRemove(showRemoveConfirm)}
                className="flex-1 bg-red-600 text-white py-3.5 rounded-2xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-200"
              >{t('profile.remove')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}