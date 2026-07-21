import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Building2, User, Shield, ArrowRight } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { VerifiedBadge } from './VerifiedBadge';
import { SavedItem } from '../App';
import { fetchPosts, toggleLikePost, sharePost, PostDto } from '../shared/api/posts';
import { fetchThreads, toggleLikeThread, shareThread, ThreadDto } from '../shared/api/threads';
import { getImageUrl, getAvatarUrl } from '../shared/api/client';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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

  const postItems = displayItems.filter((i) => i.type === 'post');
  const threadItems = displayItems.filter((i) => i.type === 'thread');
  const useDiscoverLayout = typeof maxPosts === 'number' || typeof maxThreads === 'number';

  const renderCompactCard = (item: FeedItem) => {
    const isPost = item.type === 'post';
    return (
      <article
        key={`${item.type}-${item.id}`}
        onClick={() => handleItemClick(item)}
        className={`group relative bg-white rounded-2xl border overflow-hidden cursor-pointer flex flex-col h-full transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] ${
          isPost
            ? 'border-neutral-100 shadow-sm hover:border-green-300 hover:shadow-xl hover:shadow-green-600/15'
            : 'border-neutral-100 shadow-sm hover:border-purple-300 hover:shadow-xl hover:shadow-purple-600/15'
        }`}
      >
        <div className="relative aspect-[16/11] bg-neutral-100 overflow-hidden">
          {item.image ? (
            <img
              src={getImageUrl(item.image)}
              alt={item.title}
              draggable="false"
              className="w-full h-full object-cover select-none transition-transform duration-700 ease-out group-hover:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div
              className={`w-full h-full flex items-center justify-center transition-transform duration-700 group-hover:scale-105 ${
                isPost
                  ? 'bg-gradient-to-br from-green-50 to-emerald-100'
                  : 'bg-gradient-to-br from-violet-50 to-purple-100'
              }`}
            >
              <MessageCircle
                className={`w-12 h-12 transition-all duration-300 group-hover:scale-125 ${
                  isPost
                    ? 'text-green-300 group-hover:text-green-500'
                    : 'text-purple-300 group-hover:text-purple-500'
                }`}
              />
            </div>
          )}
          {/* Soft tint overlay on hover */}
          <div
            className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
              isPost
                ? 'bg-gradient-to-t from-green-900/25 via-transparent to-transparent'
                : 'bg-gradient-to-t from-purple-900/25 via-transparent to-transparent'
            }`}
          />
          <span
            className={`absolute top-3.5 start-3.5 px-3 py-1 rounded-full text-xs font-semibold shadow-sm backdrop-blur-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md ${
              isPost
                ? 'bg-white/95 text-green-700 group-hover:bg-green-600 group-hover:text-white'
                : 'bg-white/95 text-purple-700 group-hover:bg-purple-600 group-hover:text-white'
            }`}
          >
            {isPost ? 'Post' : 'Thread'}
          </span>
        </div>

        <div className="p-5 flex flex-col flex-1 gap-3.5">
          <div className="flex items-center gap-3">
            <img
              src={getAvatarUrl(item.author.avatar, item.author.name)}
              alt={item.author.name}
              onClick={(e) => handleAuthorClick(item, e)}
              draggable="false"
              className={`w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm cursor-pointer select-none transition-all duration-300 group-hover:scale-105 ${
                isPost ? 'group-hover:ring-green-400' : 'group-hover:ring-purple-400'
              }`}
            />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <span
                  onClick={(e) => handleAuthorClick(item, e)}
                  className={`text-[15px] font-semibold text-neutral-900 truncate cursor-pointer transition-colors ${
                    isPost ? 'group-hover:text-green-700' : 'group-hover:text-purple-700'
                  }`}
                >
                  {item.author.name}
                </span>
                {item.author.verified && <VerifiedBadge />}
              </div>
              <p className="text-xs text-neutral-400">{item.timeAgo}</p>
            </div>
          </div>

          <div className="flex-1">
            <h3
              className={`text-base font-semibold text-neutral-900 leading-snug line-clamp-2 mb-2 transition-colors duration-300 ${
                isPost ? 'group-hover:text-green-800' : 'group-hover:text-purple-800'
              }`}
            >
              {item.title}
            </h3>
            <p className="text-[15px] text-neutral-500 leading-relaxed line-clamp-3 transition-colors duration-300 group-hover:text-neutral-600">
              {truncateText(item.content, 140)}
            </p>
          </div>

          <div
            className={`pt-3.5 border-t border-neutral-100 flex items-center gap-5 text-neutral-500 text-sm transition-colors duration-300 ${
              isPost ? 'group-hover:border-green-100 group-hover:text-green-700' : 'group-hover:border-purple-100 group-hover:text-purple-700'
            }`}
          >
            <span className="inline-flex items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
              <Heart className={`w-4 h-4 ${item.isLiked ? 'fill-red-500 text-red-500' : ''}`} />
              {item.likes}
            </span>
            <span className="inline-flex items-center gap-1.5 transition-transform duration-300 group-hover:scale-105">
              <MessageCircle className="w-4 h-4" />
              {item.comments}
            </span>
          </div>
        </div>
      </article>
    );
  };

  const renderShowMoreCard = (
    accent: 'green' | 'purple',
    onClick?: () => void,
    label: string,
    subtitle: string
  ) => {
    if (!onClick) return null;
    const isGreen = accent === 'green';
    return (
      <button
        type="button"
        onClick={onClick}
        className={`group relative flex h-full min-h-[300px] w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-all duration-300 ease-out hover:-translate-y-1.5 hover:scale-[1.015] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
          isGreen
            ? 'border-green-200 bg-gradient-to-br from-green-50 via-white to-emerald-50 hover:border-green-400 hover:shadow-xl hover:shadow-green-600/15 focus-visible:ring-green-500'
            : 'border-purple-200 bg-gradient-to-br from-violet-50 via-white to-purple-50 hover:border-purple-400 hover:shadow-xl hover:shadow-purple-600/15 focus-visible:ring-purple-500'
        }`}
      >
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-full text-white shadow-lg transition-transform duration-300 group-hover:scale-125 group-hover:-translate-x-0.5 ${
            isGreen
              ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-600/25 group-hover:shadow-green-600/40'
              : 'bg-gradient-to-br from-violet-500 to-purple-600 shadow-purple-600/25 group-hover:shadow-purple-600/40'
          }`}
        >
          <ArrowRight className="h-7 w-7 transition-transform duration-300 group-hover:translate-x-0.5" />
        </div>
        <div>
          <p
            className={`text-lg font-semibold ${
              isGreen ? 'text-green-800' : 'text-purple-800'
            }`}
          >
            {label}
          </p>
          <p
            className={`mt-1.5 text-[15px] ${
              isGreen ? 'text-green-700/70' : 'text-purple-700/70'
            }`}
          >
            {subtitle}
          </p>
        </div>
      </button>
    );
  };

  const renderDiscoverSection = (
    title: string,
    itemsForSection: FeedItem[],
    emptyLabel: string,
    accent: 'green' | 'purple',
    onShowMore?: () => void,
    showMoreLabel?: string,
    showMoreSubtitle?: string
  ) => (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-neutral-900">{title}</h3>
          <div
            className={`mt-1 h-1 w-10 rounded-full ${
              accent === 'green' ? 'bg-green-500' : 'bg-purple-500'
            }`}
          />
        </div>
      </div>
      {itemsForSection.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-1">
          <p className="sm:col-span-2 lg:col-span-3 text-sm text-neutral-500 py-8 text-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50">
            {emptyLabel}
          </p>
          {renderShowMoreCard(
            accent,
            onShowMore,
            showMoreLabel || t('common.viewAll'),
            showMoreSubtitle || ''
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 py-1">
          {itemsForSection.map(renderCompactCard)}
          {renderShowMoreCard(
            accent,
            onShowMore,
            showMoreLabel || t('common.viewAll'),
            showMoreSubtitle || ''
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      {items.length === 0 ? (
        <div className="text-center py-12">
          <MessageCircle className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
          <h3 className="text-xl text-neutral-900 mb-2">No updates yet</h3>
          <p className="text-neutral-600">Be the first to share something with the community!</p>
        </div>
      ) : useDiscoverLayout ? (
        <>
          {renderDiscoverSection(
            t('posts.title', { defaultValue: 'Posts' }),
            postItems,
            t('posts.noPostsYet', { defaultValue: 'No posts yet' }),
            'green',
            onNavigateToPosts,
            t('home.showMorePosts', { defaultValue: 'Show more' }),
            t('home.viewAllPosts', { defaultValue: 'View all posts' })
          )}
          {renderDiscoverSection(
            t('threads.title', { defaultValue: 'Threads' }),
            threadItems,
            t('threads.noThreadsYet', { defaultValue: 'No threads yet' }),
            'purple',
            onNavigateToThreads,
            t('home.showMoreThreads', { defaultValue: 'Show more' }),
            t('home.viewAllThreads', { defaultValue: 'View all threads' })
          )}
        </>
      ) : (
        <div className="space-y-6">{displayItems.map(renderCompactCard)}</div>
      )}

      {shareModalItem && (
        <ShareModal
          isOpen={!!shareModalItem}
          onClose={() => setShareModalItem(null)}
          postId={shareModalItem.id}
          postUrl={`${window.location.origin}/${shareModalItem.type === 'post' ? 'post' : 'thread'}/${shareModalItem.id}`}
          postTitle={shareModalItem.title}
          postImage={(shareModalItem?.image || (shareModalItem as any)?.images?.[0]) ? getImageUrl(shareModalItem?.image || (shareModalItem as any)?.images?.[0]) : undefined}
          postOwnerName={shareModalItem.author?.name || (shareModalItem.author as any)?.fullName}
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