import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Clock, Bookmark, Send, CheckCircle2, UserPlus, Check, Building2, User, Shield } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { VerifiedBadge } from './VerifiedBadge';
import { SavedItem } from '../App';
import { fetchPosts, toggleLikePost, sharePost, PostDto } from '../shared/api/posts';
import { fetchThreads, toggleLikeThread, shareThread, ThreadDto } from '../shared/api/threads';
import { getImageUrl, getAvatarUrl } from '../shared/api/client';

interface CombinedFeedProps {
  onSaveItem?: (item: any) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
  savedItems?: SavedItem[];
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onNavigateToPosts?: () => void;
  onNavigateToThreads?: () => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  // For "Latest Updates": fetch newest posts/threads and interlace them.
  maxPosts?: number;
  maxThreads?: number;
  // Legacy: if maxPosts/maxThreads are not provided, fall back to maxItems.
  maxItems?: number;
  feedVersion?: number;
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
    type: 'business' | 'visitor' | 'admin';
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
  timestamp?: string;
};

export function CombinedFeed({ 
  onSaveItem, 
  onRemoveSavedItem,
  savedItems = [],
  onNavigateToBusiness, 
  onNavigateToUserProfile,
  onNavigateToPosts,
  onNavigateToThreads,
  followedBusinesses, 
  onFollowBusiness,
  maxPosts,
  maxThreads,
  maxItems = 10,
  feedVersion = 0,
}: CombinedFeedProps) {
  const { user, isAuthenticated } = useAuth();
  const [combinedItems, setCombinedItems] = useState<FeedItem[]>([]);

  const formatTimeAgo = (timestamp?: string): string => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return d.toLocaleDateString();
  };

  const safeTimeMs = (timestamp?: string) => {
    if (!timestamp) return 0;
    const t = new Date(timestamp).getTime();
    return Number.isFinite(t) ? t : 0;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const postsWanted = typeof maxPosts === 'number' ? maxPosts : null;
        const threadsWanted = typeof maxThreads === 'number' ? maxThreads : null;

        // If interlacing is requested, fetch more than we need because we filter to verified authors.
        // Backend caps limit at 100, so aim for ~100 when we need 8+8.
        const postFetchLimit = postsWanted != null ? Math.min(100, Math.max(20, postsWanted * 15)) : undefined;
        const threadFetchLimit = threadsWanted != null ? Math.min(100, Math.max(20, threadsWanted * 15)) : undefined;

        const [posts, threads] = await Promise.all([
          fetchPosts(postFetchLimit != null ? { limit: postFetchLimit, skip: 0 } : undefined).catch(() => []),
          fetchThreads(threadFetchLimit != null ? { limit: threadFetchLimit, skip: 0 } : undefined).catch(() => []),
        ]);

        const verifiedPostsAll = (posts as PostDto[])
          .filter((p) => p?.author?.verified === true)
          .sort((a, b) => safeTimeMs(b.timestamp) - safeTimeMs(a.timestamp));

        const verifiedPosts = postsWanted != null ? verifiedPostsAll.slice(0, postsWanted) : verifiedPostsAll;

        const verifiedThreadsAll = (threads as ThreadDto[])
          .filter((t) => t?.author?.verified === true)
          .sort((a, b) => safeTimeMs(b.timestamp) - safeTimeMs(a.timestamp));

        const verifiedThreads = threadsWanted != null ? verifiedThreadsAll.slice(0, threadsWanted) : verifiedThreadsAll;

        let interlaced: FeedItem[] = [];

        // Interlaced 8-8 mode
        if (postsWanted != null && threadsWanted != null) {
          const postsLimit = Math.max(0, postsWanted);
          const threadsLimit = Math.max(0, threadsWanted);

          const maxLen = Math.max(postsLimit, threadsLimit);
          for (let i = 0; i < maxLen; i++) {
            if (i < postsLimit && verifiedPosts[i]) {
              const post = verifiedPosts[i];
              interlaced.push({
                ...post,
                type: 'post' as const,
                comments: post.commentsCount,
                author: post.author,
                timeAgo: formatTimeAgo(post.timestamp),
              });
            }
            if (i < threadsLimit && verifiedThreads[i]) {
              const thread = verifiedThreads[i];
              interlaced.push({
                ...thread,
                type: 'thread' as const,
                comments: thread.commentsCount,
                author: thread.author,
                timeAgo: formatTimeAgo(thread.timestamp),
              });
            }
          }

          setCombinedItems(interlaced);
        } else {
          // Legacy mode: simple unified feed slice.
          const postItems: FeedItem[] = (posts as PostDto[]).map((post) => ({
            ...post,
            type: 'post' as const,
            comments: post.commentsCount,
            author: post.author,
            timeAgo: formatTimeAgo(post.timestamp),
          }));

          const threadItems: FeedItem[] = (threads as ThreadDto[]).map((thread) => ({
            ...thread,
            type: 'thread' as const,
            comments: thread.commentsCount,
            author: thread.author,
            timeAgo: formatTimeAgo(thread.timestamp),
          }));

          const combined = [...postItems, ...threadItems]
            .filter((x) => x?.author?.verified === true)
            .sort((a, b) => safeTimeMs(b.timestamp) - safeTimeMs(a.timestamp));

          setCombinedItems(combined.slice(0, maxItems));
        }
      } catch (err) {
        console.error('[CombinedFeed] Failed to load combined feed from backend:', err);
        setCombinedItems([]);
      }
    };
    load();
  }, [maxItems, maxPosts, maxThreads, feedVersion]);
  
  const [items, setItems] = useState<FeedItem[]>(combinedItems);

  useEffect(() => {
    setItems(combinedItems);
  }, [combinedItems]);

  const displayItems = React.useMemo(
    () =>
      items.map((item) => ({
        ...item,
        isSaved: savedItems.some(
          (i) => i.type === item.type && (i.itemId || (i as any).refId) === item.id
        ),
      })),
    [items, savedItems]
  );

  const getSavedItemId = (type: string, itemId: string) =>
    savedItems.find(
      (i) => i.type === type && (i.itemId || (i as any).refId) === itemId
    )?.id;

  const [shareModalItem, setShareModalItem] = useState<FeedItem | null>(null);

  const isFollowingBusiness = (businessId: string) => {
    return followedBusinesses.some(b => b.id === businessId);
  };

  const handleLike = (item: FeedItem) => {
    if (!isAuthenticated) return;
    const toggle = item.type === 'post' ? toggleLikePost(item.id) : toggleLikeThread(item.id);
    toggle
      .then((updated: any) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === item.id ? { ...i, likes: updated.likes, isLiked: updated.isLiked } : i
          )
        );
      })
      .catch((err) => console.error('[CombinedFeed] toggleLike error:', err));
  };

  const handleSave = (item: FeedItem) => {
    if (!isAuthenticated) return;
    const isSaved = displayItems.find((i) => i.id === item.id && i.type === item.type)?.isSaved;
    if (isSaved && onRemoveSavedItem) {
      const savedId = getSavedItemId(item.type, item.id);
      if (savedId) onRemoveSavedItem(savedId);
    } else if (onSaveItem && !isSaved) {
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

  const handleShareAction = () => {
    if (!shareModalItem) return;
    const share = shareModalItem.type === 'post'
      ? sharePost(shareModalItem.id)
      : shareThread(shareModalItem.id);
    share
      .then((updated: any) => {
        setItems((prev) =>
          prev.map((i) =>
            i.id === shareModalItem.id && i.type === shareModalItem.type
              ? { ...i, shares: updated.shares }
              : i
          )
        );
      })
      .catch((err) => console.error('[CombinedFeed] share error:', err));
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

  const getRoleIcon = (type: 'business' | 'admin' | 'visitor') => {
    switch (type) {
      case 'business':
        return <Building2 className="w-4 h-4 text-blue-600" />;
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
        displayItems.map((item) => {
          const isFollowing = isFollowingBusiness(item.author.id);
          const currentBusinessId = user?.businessId || user?.id;
          const authorBusinessId =
            item.author.type === 'business'
              ? item.author.businessId || item.author.id
              : item.author.id || item.author.businessId;

          const isOwnBusiness = Boolean(currentBusinessId) && authorBusinessId === currentBusinessId;

          return (
            <article 
              key={`${item.type}-${item.id}`}
              className="bg-white rounded-xl border border-neutral-200 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Item Header */}
              <div className="p-4 pb-3 sm:p-6 sm:pb-4">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {/* Profile picture with role icon at bottom-right */}
                  <div className="relative flex-shrink-0">
                    <img
                      src={getAvatarUrl(item.author.avatar, item.author.name)}
                      alt={item.author.name}
                      onClick={(e) => handleAuthorClick(item, e)}
                      draggable="false"
                      className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-green-500 transition-all select-none"
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
                           item.author.type === 'admin' ? 'Administrator' : 'Visitor'}
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
                      {item.author.type === 'business' && !isOwnBusiness && isAuthenticated && !isFollowing && (
                        <button
                          onClick={(e) => handleFollow(item, e)}
                          className="ml-2 flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          <UserPlus className="w-3 h-3" />
                          Follow
                        </button>
                      )}
                      {item.author.type === 'business' && isFollowing && (
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
                  <h3 className="text-lg sm:text-xl text-neutral-900 mb-2 sm:mb-3">{item.title}</h3>
                  <p className="text-sm sm:text-base text-neutral-600 mb-3 sm:mb-4">
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
                  className="relative h-52 sm:h-80 overflow-hidden cursor-pointer bg-neutral-100"
                  onClick={() => handleItemClick(item)}
                >
                  <img
                    src={getImageUrl(item.image)}
                    alt={item.title}
                    draggable="false"
                    className="w-full h-full object-cover select-none transition-transform hover:scale-105"
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      handleLike(item.id);
                    }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Item Actions */}
              <div className="p-4 pt-3 sm:p-6 sm:pt-4 border-t border-neutral-100">
                <div className="flex items-center gap-4 sm:gap-6">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLike(item);
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
          postId={shareModalItem.id}
          postUrl={`${window.location.origin}/${shareModalItem.type === 'post' ? 'post' : 'thread'}/${shareModalItem.id}`}
          postTitle={shareModalItem.title}
          postImage={(shareModalItem?.image || shareModalItem?.images?.[0]) ? getImageUrl(shareModalItem?.image || shareModalItem?.images?.[0]) : undefined}
          postOwnerName={shareModalItem.author?.name || shareModalItem.author?.fullName}
          postOwnerAvatar={
          shareModalItem.author?.avatar
            ? getAvatarUrl(shareModalItem.author.avatar, shareModalItem.author.name)
            : getAvatarUrl(null, shareModalItem.author?.name)
        }
          onShare={handleShareAction}
        />
      )}
    </div>
  );
}