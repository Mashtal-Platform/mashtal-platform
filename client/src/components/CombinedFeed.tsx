import React, { useState, useMemo } from 'react';
import { Heart, MessageCircle, Clock, Bookmark, Send, CheckCircle2, UserPlus, Check, Building2, HardHat, User, Leaf, Shield } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { mockPosts, mockThreads, currentUser, otherUsers } from '../data/centralMockData';
import { VerifiedBadge } from './VerifiedBadge';
import { SavedItem } from '../App';

interface CombinedFeedProps {
  onSaveItem?: (item: any) => void;
  savedItems?: SavedItem[];
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onNavigateToPosts?: () => void;
  onNavigateToThreads?: () => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  maxItems?: number;
}

type FeedItem = {
  id: string;
  type: 'post' | 'thread';
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar: string;
    verified: boolean;
    type: 'business' | 'engineer' | 'user' | 'agronomist';
    businessId?: string;
  };
  timeAgo: string;
  likes: number;
  comments: number;
  shares: number;
  image?: string;
  tags?: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  timestamp?: Date;
};

export function CombinedFeed({ 
  onSaveItem, 
  savedItems,
  onNavigateToBusiness, 
  onNavigateToUserProfile,
  onNavigateToPosts,
  onNavigateToThreads,
  followedBusinesses, 
  onFollowBusiness,
  maxItems = 10
}: CombinedFeedProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Combine and sort posts and threads by timestamp
  const combinedItems = useMemo(() => {
    console.log('CombinedFeed: mockPosts count:', mockPosts.length);
    console.log('CombinedFeed: mockThreads count:', mockThreads.length);
    
    const posts: FeedItem[] = mockPosts.slice(0, 5).map(post => {
      const author = post.authorId === 'me' ? currentUser : otherUsers.find(u => u.id === post.authorId) || currentUser;
      return {
        ...post,
        type: 'post' as const,
        comments: post.commentsCount,
        author: {
          id: author.id,
          name: author.fullName,
          avatar: author.avatar,
          verified: author.verified,
          type: author.role as any,
          businessId: author.businessId
        }
      };
    });
    
    const threads: FeedItem[] = mockThreads.slice(0, 5).map(thread => {
      const author = thread.authorId === 'me' ? currentUser : otherUsers.find(u => u.id === thread.authorId) || currentUser;
      return {
        ...thread,
        type: 'thread' as const,
        comments: thread.commentsCount,
        author: {
          id: author.id,
          name: author.fullName,
          avatar: author.avatar,
          verified: author.verified,
          type: author.role as any,
          businessId: author.businessId
        }
      };
    });
    
    // Combine and shuffle for variety
    const combined = [...posts, ...threads];
    
    // Sort by a pseudo-timestamp (using id as proxy for recency)
    return combined
      .sort((a, b) => {
        // Mix posts and threads together, alternating when possible
        const aNum = a.id.replace(/\D/g, '');
        const bNum = b.id.replace(/\D/g, '');
        return parseInt(bNum || '0') - parseInt(aNum || '0');
      })
      .slice(0, maxItems);
  }, [maxItems]);
  
  const [items, setItems] = useState<FeedItem[]>(combinedItems);
  const [shareModalItem, setShareModalItem] = useState<FeedItem | null>(null);

  const isFollowingBusiness = (businessId: string) => {
    return followedBusinesses.some(b => b.id === businessId);
  };

  const handleLike = (itemId: string) => {
    if (!isAuthenticated) return;

    setItems(items.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          isLiked: !item.isLiked,
          likes: item.isLiked ? item.likes - 1 : item.likes + 1,
        };
      }
      return item;
    }));
  };

  const handleSave = (item: FeedItem) => {
    if (!isAuthenticated) return;

    setItems(items.map(i => {
      if (i.id === item.id) {
        return { ...i, isSaved: !i.isSaved };
      }
      return i;
    }));

    if (onSaveItem && !item.isSaved) {
      onSaveItem({
        id: Date.now().toString(),
        type: item.type,
        itemId: item.id,
        title: item.title,
        image: item.image || item.author.avatar,
        description: item.content,
        savedAt: new Date(),
      });
    }
  };

  const handleItemClick = (item: FeedItem) => {
    if (item.type === 'post' && onNavigateToPosts) {
      onNavigateToPosts();
    } else if (item.type === 'thread' && onNavigateToThreads) {
      onNavigateToThreads();
    }
  };

  const handleAuthorClick = (item: FeedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Navigate based on author type
    if (item.author.type === 'business' && item.author.businessId && onNavigateToBusiness) {
      onNavigateToBusiness(item.author.businessId);
    } else if ((item.author.type === 'engineer' || item.author.type === 'agronomist') && item.author.id && onNavigateToBusiness) {
      // Engineers and agronomists also have business-style pages
      onNavigateToBusiness(item.author.id);
    } else if (item.author.id && onNavigateToUserProfile) {
      onNavigateToUserProfile(item.author.id);
    }
  };

  const handleFollow = (item: FeedItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) return;

    onFollowBusiness({
      id: item.author.id,
      name: item.author.name,
      role: item.author.type,
      location: 'Saudi Arabia',
      image: item.author.avatar,
      rating: 4.8,
      reviews: 100,
      followers: 1000,
    });
  };

  const getRoleIcon = (type: 'business' | 'agronomist' | 'engineer' | 'admin' | 'user') => {
    switch (type) {
      case 'business':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'agronomist':
        return <Leaf className="w-4 h-4 text-green-600" />;
      case 'engineer':
        return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-neutral-500" />;
    }
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength) + '...';
  };

  return (
    <div className="space-y-6">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl text-neutral-900 mb-2">No updates yet</h3>
          <p className="text-neutral-600">Be the first to share something with the community!</p>
        </div>
      ) : (
        items.map((item) => {
          const isFollowing = isFollowingBusiness(item.author.id);
          const isOwnBusiness = user?.businessId === item.author.id;

          return (
            <article 
              key={`${item.type}-${item.id}`}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Item Header */}
              <div className="p-6 pb-4">
                <div className="flex items-center gap-4 mb-4">
                  {/* Profile picture with role icon at bottom-right */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={item.author.avatar}
                      alt={item.author.name}
                      onClick={(e) => handleAuthorClick(item, e)}
                      draggable="false"
                      className="w-14 h-14 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-green-500 transition-all select-none"
                    />
                    <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md">
                      {getRoleIcon(item.author.type)}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex flex-col">
                        <span 
                          onClick={(e) => handleAuthorClick(item, e)}
                          className="font-medium text-neutral-900 hover:text-green-600 cursor-pointer transition-colors"
                        >
                          {item.author.name}
                        </span>
                        {/* Role name under username */}
                        <span className="text-xs text-neutral-500 capitalize">
                          {item.author.type === 'business' ? 'Business' : 
                           item.author.type === 'engineer' ? 'Engineer' : 
                           item.author.type === 'agronomist' ? 'Agronomist' :
                           item.author.type === 'admin' ? 'Administrator' : 'User'}
                        </span>
                      </div>
                      {item.author.verified && (
                        <VerifiedBadge />
                      )}
                      {/* Type Badge */}
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'post' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {item.type === 'post' ? 'Post' : 'Thread'}
                      </span>
                      {/* Follow Button */}
                      {(item.author.type === 'engineer' || item.author.type === 'business') && !isOwnBusiness && isAuthenticated && !isFollowing && (
                        <button
                          onClick={(e) => handleFollow(item, e)}
                          className="ml-2 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          Follow
                        </button>
                      )}
                      {(item.author.type === 'engineer' || item.author.type === 'business') && isFollowing && (
                        <span className="ml-2 flex items-center gap-1 text-xs text-neutral-500">
                          <Check className="w-3 h-3" />
                          Following
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <Clock className="w-4 h-4" />
                      <span>{item.timeAgo}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSave(item);
                    }}
                    disabled={!isAuthenticated}
                    className={`transition-colors ${
                      !isAuthenticated
                        ? 'cursor-not-allowed opacity-50'
                        : item.isSaved 
                        ? 'text-green-600' 
                        : 'text-neutral-400 hover:text-neutral-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to save' : ''}
                  >
                    <Bookmark className={`w-5 h-5 ${item.isSaved ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Item Content */}
                <div onClick={() => handleItemClick(item)}>
                  <h3 className="text-xl text-neutral-900 mb-3">{item.title}</h3>
                  <p className="text-neutral-600 mb-4">
                    {truncateText(item.content, 150)}
                  </p>

                  {/* Tags */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-neutral-500 text-sm">
                          +{item.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Item Image */}
              {item.image && (
                <div 
                  className="relative h-80 overflow-hidden cursor-pointer"
                  onClick={() => handleItemClick(item)}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    draggable="false"
                    className="w-full h-full object-cover select-none transition-transform hover:scale-105"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleLike(item.id);
                    }}
                  />
                </div>
              )}

              {/* Item Actions */}
              <div className="p-6 pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(item.id);
                    }}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 transition-colors ${
                      !isAuthenticated
                        ? 'cursor-not-allowed opacity-50'
                        : item.isLiked 
                        ? 'text-red-600' 
                        : 'text-neutral-600 hover:text-red-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to like' : ''}
                  >
                    <Heart className={`w-5 h-5 ${item.isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">{item.likes}</span>
                  </button>
                  <button
                    onClick={() => handleItemClick(item)}
                    className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="font-medium">{item.comments}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShareModalItem(item);
                    }}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 transition-colors ${
                      !isAuthenticated 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'text-neutral-600 hover:text-blue-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to share' : 'Share'}
                  >
                    <Send className="w-5 h-5" />
                    <span className="font-medium">{item.shares}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })
      )}

      {/* Share Modal */}
      {shareModalItem && (
        <ShareModal
          isOpen={!!shareModalItem}
          onClose={() => setShareModalItem(null)}
          postUrl={`${window.location.origin}/${shareModalItem.type}s/${shareModalItem.id}`}
          postTitle={shareModalItem.title}
          postImage={shareModalItem.image}
        />
      )}
    </div>
  );
}