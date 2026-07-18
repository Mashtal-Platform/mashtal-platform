import React, { useState, useEffect, useRef } from 'react';
import { 
  MapPin, Star, Users, MessageCircle, Phone, Mail, Globe, CheckCircle, CheckCircle2, Heart, 
  ShoppingCart, Bookmark, X, Send, ThumbsUp, Reply as ReplyIcon, Edit, 
  FileText, Package, MoreHorizontal, Edit2, Trash2, User, Briefcase, Award, Flag
} from 'lucide-react';
import { CartItem } from '../App';
import { PostModal } from '../components/PostModal';
import { PostsFeed } from '../components/PostsFeed';
import { ShareModal } from '../components/ShareModal';
import { ReportBusinessModal } from '../components/ReportBusinessModal';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { fetchBusinessById, rateBusiness, fetchBusinessReviews, updateBusinessReview } from '../shared/api/users';
import { fetchProducts } from '../shared/api/products';
import { fetchPosts, toggleLikePost, sharePost } from '../shared/api/posts';
import { fetchThreads, toggleLikeThread, shareThread } from '../shared/api/threads';
import { getImageUrl } from '../shared/api/client';
import { ThreadModal, type ThreadModalComment } from '../components/ThreadModal';
import { fetchComments, createComment, toggleLikeComment, deleteComment, type CommentDto } from '../shared/api/comments';
import { InteractiveRating } from '../components/InteractiveRating';
import { ProductDetailModal } from '../components/ProductDetailModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { fetchMyBusinessReport } from '../shared/api/reports';

const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
};

function formatTime(t: string): string {
  if (!t || typeof t !== 'string') return '—';
  const [h, m] = t.split(':').map(Number);
  const h12 = h % 12 || 12;
  const ampm = h < 12 ? 'AM' : 'PM';
  return `${h12}:${String(m ?? 0).padStart(2, '0')} ${ampm}`;
}

interface BusinessPageProps {
  businessId: string | null;
  onAddToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  onOpenChat: (businessId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  onUnfollowBusiness: (businessId: string) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  businessThreads?: any[];
  savedItems?: { id: string; type: string; refId?: string; itemId?: string }[];
  onSaveItem?: (item: any) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: 'business' | 'visitor';
  verified?: boolean;
}

const mentionableUsers: MentionUser[] = [];

export function BusinessPage({ businessId, onAddToCart, onOpenChat, followedBusinesses, onFollowBusiness, onUnfollowBusiness, onNavigateToBusiness, businessThreads = [], savedItems = [], onSaveItem, onRemoveSavedItem, onNavigateWithParams }: BusinessPageProps) {
  const { user, isAuthenticated } = useAuth();
  const [business, setBusiness] = useState<any | null>(null);
  const [businessPosts, setBusinessPosts] = useState<any[]>([]);
  const [filteredBusinessThreads, setFilteredBusinessThreads] = useState<any[]>([]);
  const [productsList, setProductsList] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'products' | 'posts' | 'threads' | 'about'>('products');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [threadComments, setThreadComments] = useState<Record<string, ThreadModalComment[]>>({});
  const [shareModalPost, setShareModalPost] = useState<any | null>(null);
  const [shareModalThread, setShareModalThread] = useState<any | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [businessReviews, setBusinessReviews] = useState<Array<{ id: string; author: string; avatar: string; rating: number; comment: string; date: string; helpful?: number }>>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [alreadyReported, setAlreadyReported] = useState(false);

  const getSavedProductId = (productId: string) =>
    savedItems?.find((s) => s.type === 'product' && (s.itemId === productId || s.refId === productId))?.id;

  // Sync saved product ids from DB-backed savedItems
  useEffect(() => {
    const next = new Set<string>();
    (savedItems || []).forEach((s: any) => {
      if (s?.type === 'product') {
        const id = String(s.itemId || s.refId || '');
        if (id) next.add(id);
      }
    });
    setSavedProducts(next);
  }, [savedItems]);

  const formatTimeAgo = (timestamp: string | undefined) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const mapCommentToModal = (dto: CommentDto): { id: string; userId: string; userName: string; userAvatar?: string; content: string; timeAgo: string; likes?: number; isLiked?: boolean; replies?: any[] } => ({
    id: dto.id,
    userId: dto.author?.id ?? '',
    userName: dto.author?.name ?? 'Unknown',
    userAvatar: dto.author?.avatar,
    content: dto.content,
    timeAgo: formatTimeAgo(dto.createdAt),
    likes: dto.likes ?? 0,
    isLiked: dto.isLiked ?? false,
    replies: (dto.replies ?? []).map(mapCommentToModal),
  });

  // Load business + related data from backend
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setAlreadyReported(false);
    setShowReportModal(false);

    const load = async () => {
      try {
        const [b, products, posts, threads] = await Promise.all([
          fetchBusinessById(businessId),
          fetchProducts({ businessId }),
          fetchPosts(),
          fetchThreads(),
        ]);
        if (cancelled) return;
        setBusiness(b);
        setProductsList(
          products.map((p) => ({
            ...p,
            // Keep `price` numeric (required by `ProductDetailModal`).
            priceNum: p.price,
            inStock: p.inStock,
          })),
        );
        const filtered = posts
          .filter((p) => p.author?.businessId === b.id || p.author?.id === b.id)
          .map((post) => ({ ...post, comments: [] }));
        setBusinessPosts(filtered);
        setFilteredBusinessThreads(
          threads.filter((t) => t.author?.businessId === b.id || t.author?.id === b.id),
        );
        const liked = new Set<string>();
        const saved = new Set<string>();
        filtered.forEach((p: any) => {
          if (p.isLiked) liked.add(p.id);
          if (p.isSaved) saved.add(p.id);
        });
        setLikedPosts((prev) => (prev.size === 0 && liked.size > 0 ? liked : prev));
        setSavedPosts((prev) => (prev.size === 0 && saved.size > 0 ? saved : prev));
      } catch (err) {
        console.error('[BusinessPage] Failed to load business data from API:', err);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  // Load business reviews from backend (dynamic, not mock)
  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setReviewsLoading(true);
    fetchBusinessReviews(businessId)
      .then((reviews) => {
        if (!cancelled) setBusinessReviews(reviews);
      })
      .catch(() => {
        if (!cancelled) setBusinessReviews([]);
      })
      .finally(() => {
        if (!cancelled) setReviewsLoading(false);
      });
    return () => { cancelled = true; };
  }, [businessId]);

  // Lock body scroll when post or thread modal is open
  useEffect(() => {
    if (selectedPost || selectedThread) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [selectedPost, selectedThread]);

  // Fetch comments when thread modal opens
  useEffect(() => {
    if (!selectedThread?.id) return;
    fetchComments('thread', selectedThread.id)
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const comments = arr.map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
      })
      .catch(() => setThreadComments((prev) => ({ ...prev, [selectedThread.id]: [] })));
  }, [selectedThread?.id]);

  // Fetch comments when post modal opens (must be before early return to keep hook count stable)
  useEffect(() => {
    if (!selectedPost?.id) return;
    fetchComments('post', selectedPost.id)
      .then((list) => {
        const comments = list.map(mapCommentToModal);
        setSelectedPost((prev) => (prev ? { ...prev, comments } : null));
      })
      .catch(() => {
        setSelectedPost((prev) => (prev ? { ...prev, comments: [] } : null));
      });
  }, [selectedPost?.id]);
  
  const isOwnProfile =
    user?.id === business?.id || user?.businessId === business?.id;

  useEffect(() => {
    if (!businessId || !isAuthenticated || isOwnProfile) {
      setAlreadyReported(false);
      return;
    }
    let cancelled = false;
    fetchMyBusinessReport(businessId)
      .then((res) => {
        if (!cancelled) setAlreadyReported(!!res.reported);
      })
      .catch(() => {
        if (!cancelled) setAlreadyReported(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, isAuthenticated, isOwnProfile]);
  
  // Check if business is followed
  const isFollowing = (followedBusinesses || []).some(b => b?.id === business?.id);

  if (!business) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">Loading business...</p>
      </div>
    );
  }

  const handleSubmitReview = async (rating: number, comment: string) => {
    if (!businessId || !business?.id) return;
    try {
      const res = await rateBusiness(business.id, rating, comment || undefined);
      setBusiness((prev) => prev ? { ...prev, rating: res.businessRating, reviewsCount: res.businessReviewsCount } : null);
      const reviews = await fetchBusinessReviews(business.id);
      setBusinessReviews(reviews);
    } catch (err) {
      console.error('[BusinessPage] Failed to submit rating:', err);
    }
  };

  const handleEditReview = async (reviewId: string, data: { rating: number; comment: string }) => {
    if (!business?.id) return;
    try {
      const res = await updateBusinessReview(business.id, reviewId, data);
      setBusiness((prev) => prev ? { ...prev, rating: res.businessRating, reviewsCount: res.businessReviewsCount } : null);
      const reviews = await fetchBusinessReviews(business.id);
      setBusinessReviews(reviews);
    } catch (err) {
      console.error('[BusinessPage] Failed to edit review:', err);
    }
  };

  const handleAddToCart = (product: any) => {
    onAddToCart({
      productId: product.id,
      productName: product.name,
      price: product.priceNum ?? product.price,
      image: product.image,
      businessName: displayName,
    });
  };

  const handleProductRated = (productId: string, averageRating: number, reviewsCount: number) => {
    setProductsList((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, rating: averageRating, reviewsCount } : p)),
    );
  };

  const handleLikePost = (postId: string) => {
    if (!isAuthenticated) return;
    toggleLikePost(postId)
      .then((updated) => {
        setLikedPosts((prev) => {
          const next = new Set(prev);
          if (updated.isLiked) next.add(postId);
          else next.delete(postId);
          return next;
        });
        setSelectedPost((prev) =>
          prev && prev.id === postId ? { ...prev, likes: updated.likes, isLiked: updated.isLiked } : prev
        );
      })
      .catch((err) => console.error('[BusinessPage] like error:', err));
  };

  const handleSavePost = (postId: string) => {
    if (!isAuthenticated) return;
    const isSaved = savedPosts.has(postId) || !!getSavedItemId(postId);
    if (isSaved && onRemoveSavedItem) {
      const savedId = getSavedItemId(postId);
      if (savedId) {
        onRemoveSavedItem(savedId);
        setSavedPosts((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
        setSelectedPost((prev) => (prev && prev.id === postId ? { ...prev, isSaved: false } : prev));
      }
    } else if (onSaveItem && !isSaved) {
      onSaveItem({ type: 'post', refId: postId });
      setSavedPosts((prev) => new Set(prev).add(postId));
      setSelectedPost((prev) => (prev && prev.id === postId ? { ...prev, isSaved: true } : prev));
    }
  };

  const handleCommentPost = (postId: string, text: string, parentId?: string) => {
    if (!isAuthenticated || !text?.trim()) return;
    createComment({
      targetType: 'post',
      targetId: postId,
      content: text.trim(),
      parentCommentId: parentId,
    })
      .then(() =>
        fetchComments('post', postId).then((list) => {
          const comments = list.map(mapCommentToModal);
          setSelectedPost((prev) => (prev && prev.id === postId ? { ...prev, comments } : prev));
        })
      )
      .catch((err) => console.error('[BusinessPage] comment error:', err));
  };

  const handleDeletePostComment = (commentId: string) => {
    if (!selectedPost?.id || !isAuthenticated) return;
    deleteComment(commentId)
      .then(() => fetchComments('post', selectedPost.id))
      .then((list) => {
        const comments = (Array.isArray(list) ? list : []).map(mapCommentToModal);
        setSelectedPost((prev) => (prev ? { ...prev, comments } : prev));
      })
      .catch((err) => console.error('[BusinessPage] delete comment error:', err));
  };

  const handleSharePost = () => {
    if (selectedPost) setShareModalPost(selectedPost);
  };

  const handleShareAction = () => {
    if (!shareModalPost?.id) return;
    sharePost(shareModalPost.id)
      .then((updated) => {
        setSelectedPost((prev) =>
          prev && prev.id === shareModalPost.id ? { ...prev, shares: updated.shares } : prev
        );
        setShareModalPost(null);
      })
      .catch((err) => console.error('[BusinessPage] share error:', err));
  };

  const handleSaveProduct = (product: any) => {
    if (!isAuthenticated) return;
    const savedId = getSavedProductId(product.id);
    if (savedId && onRemoveSavedItem) {
      onRemoveSavedItem(savedId);
      setSavedProducts((prev) => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
      return;
    }

    if (!savedId && onSaveItem) {
      onSaveItem({
        id: `saved-product-${product.id}-${Date.now()}`,
        type: 'product',
        itemId: product.id,
        businessId: business.id,
        title: product.name,
        image: product.image,
        description: product.description,
        price: product.price,
        savedAt: new Date(),
      });
      setSavedProducts((prev) => new Set(prev).add(product.id));
    }
  };

  const displayName = business.fullName || business.companyName || 'Business';

  const shapePostForModal = (post: any) => ({
    id: post.id,
    image: post.image,
    title: post.title ?? '',
    content: post.content ?? '',
    likes: post.likes ?? 0,
    isLiked: post.isLiked ?? likedPosts.has(post.id),
    isSaved: post.isSaved ?? savedPosts.has(post.id),
    comments: [] as any[],
    timeAgo: formatTimeAgo(post.timestamp) || '',
    authorName: post.author?.name ?? displayName,
    authorAvatar: post.author?.avatar ?? business.avatar,
  });

  const handlePostClick = (post: any) => {
    setSelectedPost(shapePostForModal(post));
  };

  const getSavedItemId = (postId: string) =>
    savedItems?.find((s) => s.type === 'post' && (s.refId === postId || s.itemId === postId))?.id;
  const getSavedThreadId = (threadId: string) =>
    savedItems?.find((s) => s.type === 'thread' && (s.itemId === threadId || s.refId === threadId))?.id;

  const handleThreadLike = () => {
    if (!selectedThread?.id || !isAuthenticated) return;
    toggleLikeThread(selectedThread.id)
      .then((updated) => setSelectedThread((prev) => prev ? { ...prev, likes: updated.likes, isLiked: updated.isLiked } : null))
      .catch((err) => console.error('[BusinessPage] toggleLikeThread error:', err));
  };

  const handleThreadComment = (text: string, parentId?: string) => {
    if (!selectedThread?.id || !isAuthenticated || !text?.trim()) return;
    createComment({ targetType: 'thread', targetId: selectedThread.id, content: text.trim(), parentCommentId: parentId })
      .then(() =>
        fetchComments('thread', selectedThread.id).then((list) => {
          const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
          setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
        })
      )
      .catch((err) => console.error('[BusinessPage] thread comment error:', err));
  };

  const handleThreadSave = () => {
    if (!selectedThread?.id || !isAuthenticated) return;
    const savedId = getSavedThreadId(selectedThread.id);
    if (savedId && onRemoveSavedItem) {
      onRemoveSavedItem(savedId);
      setSelectedThread((prev) => prev ? { ...prev, isSaved: false } : null);
    } else if (onSaveItem && !savedId) {
      onSaveItem({
        id: `saved-${selectedThread.id}-${Date.now()}`,
        type: 'thread',
        itemId: selectedThread.id,
        title: selectedThread.title || (selectedThread.content?.slice(0, 50) || '') + (selectedThread.content?.length > 50 ? '...' : ''),
        image: selectedThread.author?.avatar ?? business?.avatar,
        description: selectedThread.content,
        savedAt: new Date(),
      });
      setSelectedThread((prev) => prev ? { ...prev, isSaved: true } : null);
    }
  };

  const handleThreadShare = () => {
    if (selectedThread) setShareModalThread(selectedThread);
  };

  const handleThreadShareAction = () => {
    if (!shareModalThread?.id) return;
    shareThread(shareModalThread.id)
      .then((updated) => {
        setSelectedThread((prev) => (prev && prev.id === shareModalThread.id ? { ...prev, shares: updated.shares } : prev));
        setShareModalThread(null);
      })
      .catch((err) => console.error('[BusinessPage] shareThread error:', err));
  };

  const handleThreadLikeComment = (commentId: string) => {
    if (!selectedThread?.id || !isAuthenticated) return;
    toggleLikeComment(commentId)
      .then((updated) => {
        setThreadComments((prev) => {
          const list = prev[selectedThread.id] || [];
          const updateOne = (arr: ThreadModalComment[]): ThreadModalComment[] =>
            arr.map((c) =>
              c.id === commentId
                ? { ...c, likes: updated.likes ?? c.likes, isLiked: updated.isLiked ?? !c.isLiked }
                : { ...c, replies: c.replies?.length ? updateOne(c.replies) : c.replies },
            );
          return { ...prev, [selectedThread.id]: updateOne(list) };
        });
      })
      .catch((err) => console.error('[BusinessPage] toggleLikeComment error:', err));
  };

  const handleDeleteThreadComment = (commentId: string) => {
    if (!selectedThread?.id || !isAuthenticated) return;
    deleteComment(commentId)
      .then(() => fetchComments('thread', selectedThread.id))
      .then((list) => {
        const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
      })
      .catch((err) => console.error('[BusinessPage] delete thread comment error:', err));
  };

  const followersCount = business.followersCount ?? (Array.isArray(business.followers) ? business.followers.length : 0);

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700 bg-neutral-200">
        {(getImageUrl(business.coverImage) || business.coverImage) ? (
          <img
            src={getImageUrl(business.coverImage) || business.coverImage}
            alt={`${displayName} cover`}
            className="w-full h-full object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Header Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20">
          <div className="bg-white rounded-xl shadow-xl p-4 sm:p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
              {/* Profile Image */}
              <div className="relative">
                {getImageUrl(business.avatar) ? (
                  <img
                    src={getImageUrl(business.avatar)}
                    alt={displayName}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-neutral-100"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-neutral-200 flex items-center justify-center">
                    <Briefcase className="w-16 h-16 text-neutral-400" />
                  </div>
                )}
                {business.verified && (
                  <div className="absolute bottom-1 right-1 bg-green-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Business Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">{displayName}</h1>
                      <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified Business
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{business.location || '—'}</span>
                      </div>
                      {(business.rating != null && business.rating > 0) && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span>{Number(business.rating).toFixed(1)}</span>
                          {business.reviewsCount != null && business.reviewsCount > 0 && (
                            <span className="text-neutral-500 text-sm">({business.reviewsCount} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-neutral-700 max-w-2xl leading-relaxed">{business.bio}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {isAuthenticated && !isOwnProfile && (
                      <>
                        <Button
                          onClick={() => {
                            if (isFollowing) {
                              onUnfollowBusiness(business.id);
                            } else {
                              onFollowBusiness({
                                id: business.id,
                                name: displayName,
                                role: 'business',
                                location: business.location,
                                image: business.avatar,
                                rating: business.rating,
                                reviews: business.reviewsCount,
                                followers: followersCount,
                              });
                            }
                          }}
                          variant={isFollowing ? "outline" : "default"}
                          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                            isFollowing ? 'border-neutral-200 text-neutral-700' : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${isFollowing ? 'fill-current' : ''}`} />
                          <span>{isFollowing ? 'Following' : 'Follow'}</span>
                        </Button>
                        <Button 
                          onClick={() => onOpenChat(business.id)}
                          variant="outline"
                          className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span>Message</span>
                        </Button>
                        <Button
                          onClick={() => !alreadyReported && setShowReportModal(true)}
                          variant="outline"
                          disabled={alreadyReported}
                          className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                            alreadyReported
                              ? 'border-neutral-200 text-neutral-400 cursor-not-allowed'
                              : 'border-red-200 text-red-600 hover:bg-red-50'
                          }`}
                          title={alreadyReported ? 'You already reported this business' : 'Report this business'}
                        >
                          <Flag className="w-5 h-5" />
                          <span>{alreadyReported ? 'Reported' : 'Report'}</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 sm:gap-8 mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{followersCount.toLocaleString()}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Followers</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{businessPosts.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Posts</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{filteredBusinessThreads.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Threads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs Section */}
        <div className="mt-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-2">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('products')}
                  data-tab="products"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'products' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Products</span>
                  </div>
                  {activeTab === 'products' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('posts')}
                  data-tab="posts"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'posts' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Posts</span>
                  </div>
                  {activeTab === 'posts' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('threads')}
                  data-tab="threads"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'threads' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Threads</span>
                  </div>
                  {activeTab === 'threads' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
                <button
                  onClick={() => setActiveTab('about')}
                  data-tab="about"
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'about' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>About</span>
                  </div>
                  {activeTab === 'about' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-8">
              {/* Products Tab */}
              {activeTab === 'products' && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {productsList.map((product) => (
                    <div
                      key={product.id}
                      id={`product-${product.id}`}
                      onClick={() => {
                        if (isOwnProfile && onNavigateWithParams) {
                          onNavigateWithParams('dashboard', { productId: product.id });
                        }
                      }}
                      className={`group bg-white border border-neutral-200 rounded-lg overflow-hidden transition-all ${
                        isOwnProfile ? 'cursor-pointer hover:shadow-xl hover:border-green-500 hover:-translate-y-1' : 'hover:shadow-lg'
                      }`}
                    >
                      <div className="relative h-48 bg-neutral-100">
                        {getImageUrl(product.image) ? (
                          <img
                            src={getImageUrl(product.image)}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                        {product.inStock ? (
                          <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs">
                            In Stock
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 bg-red-600 text-white px-2 py-1 rounded text-xs">
                            Out of Stock
                          </div>
                        )}
                        {isOwnProfile && (
                          <div className="absolute bottom-3 left-3 right-3 bg-green-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to manage
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3
                          className="text-lg text-neutral-900 mb-2 line-clamp-2 min-h-[3rem] hover:text-green-600 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                        >
                          {product.name}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{product.description}</p>

                        {/* Rating */}
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-sm font-medium text-neutral-900">
                              {(Number(product.rating) || 0).toFixed(1)}
                            </span>
                          </div>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs text-neutral-600">
                            {Number(product.reviewsCount) || 0} reviews
                          </span>
                          <span className="text-xs text-neutral-400">•</span>
                          <span className="text-xs bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded">
                            {product.category}
                          </span>
                        </div>

                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xl font-bold text-green-600">
                            $ {product.priceNum ?? product.price}
                          </span>
                          {!isOwnProfile && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveProduct(product);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                savedProducts.has(product.id)
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }`}
                            >
                              <Bookmark className={`w-5 h-5 ${savedProducts.has(product.id) ? 'fill-current' : ''}`} />
                            </button>
                          )}
                        </div>
                        {isAuthenticated && !isOwnProfile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!product.inStock) return;
                              handleAddToCart(product);
                            }}
                            disabled={!product.inStock}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
                              product.inStock
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-neutral-100 text-neutral-500 cursor-not-allowed'
                            }`}
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span className="text-sm font-medium">
                              {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                            </span>
                          </button>
                        )}
                        {isOwnProfile && (
                          <div className="text-center py-2.5 px-4 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm font-medium text-green-700">📊 Manage Product</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div>
                  {businessPosts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {businessPosts.map((post) => (
                        <div
                          key={post.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                          onClick={() => handlePostClick(post)}
                        >
                          {getImageUrl(post.image) ? (
                            <img
                              src={getImageUrl(post.image)}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <FileText className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                            <div className="flex items-center gap-2">
                              <Heart className="w-5 h-5 fill-current" />
                              <span>{post.likes ?? 0}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 fill-current" />
                              <span>{post.commentsCount ?? post.comments ?? 0}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <FileText className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">No posts yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* Threads Tab */}
              {activeTab === 'threads' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {filteredBusinessThreads.length > 0 ? (
                    filteredBusinessThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="group border border-neutral-200 rounded-xl p-4 sm:p-6 hover:border-green-200 hover:shadow-md transition-all bg-white relative cursor-pointer"
                        onClick={() => setSelectedThread(thread)}
                      >
                        <div className="flex items-start gap-4">
                          {getImageUrl(business.avatar) ? (
                            <img
                              src={getImageUrl(business.avatar)}
                              alt={displayName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                              <User className="w-6 h-6 text-neutral-500" />
                            </div>
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-neutral-900 text-sm">{displayName}</h3>
                              <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">{thread.timeAgo}</span>
                            </div>
                            <p className="text-neutral-700 mb-4 line-clamp-3 leading-relaxed text-sm">
                              {thread.content}
                            </p>
                            <div className="flex items-center gap-6 text-sm text-neutral-400">
                              <div className={`flex items-center gap-1.5 transition-colors ${thread.isLiked ? 'text-red-600' : ''}`}>
                                <Heart className={`w-4 h-4 ${thread.isLiked ? 'fill-current' : ''}`} />
                                <span className="font-medium">{thread.likes ?? 0}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">{thread.commentsCount ?? thread.comments ?? 0}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                      <p className="text-neutral-500 font-medium">No threads yet</p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === 'about' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      About {displayName}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-4 sm:p-6 rounded-xl border border-neutral-100 text-sm">
                      {business.bio}
                    </p>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Phone</div>
                          <div className="text-neutral-900 font-semibold">{business.phone}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Email</div>
                          <div className="text-neutral-900 font-semibold">{business.email}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Globe className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Website</div>
                          <a href="#" className="text-green-600 font-semibold hover:underline">www.{business.fullName.toLowerCase().replace(/\s/g, '')}.sa</a>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Location</div>
                          <div className="text-neutral-900 font-semibold">{business.location || '—'}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* More information (custom about fields) */}
                  {business.about && typeof business.about === 'object' && Object.keys(business.about).length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        More information
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(business.about).map(([title, content]) => (
                          title && (
                            <div key={title} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                              <div className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2">{title}</div>
                              <div className="text-neutral-800 whitespace-pre-wrap">{String(content || '—')}</div>
                            </div>
                          )
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Business Hours - same design as owner profile (BusinessProfileView) */}
                  {(business.hours && business.hours.length > 0) && (
                    <section>
                      <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        Business Hours
                      </h3>
                      <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-4 sm:p-6">
                        <div className="space-y-3">
                          {(business.hours || []).map((h: any, index: number) => {
                            const dayLabel = DAY_LABELS[(h.day || '').toLowerCase()] || (h.day || '');
                            const timeStr = h.closed
                              ? 'Closed'
                              : h.open?.length && h.open[0]?.from && h.open[0]?.to
                                ? `${formatTime(h.open[0].from)} – ${formatTime(h.open[0].to)}`
                                : '—';
                            return (
                              <div
                                key={h.day || dayLabel || index}
                                className="flex items-center justify-between py-2 border-b border-neutral-200 last:border-0"
                              >
                                <span className="text-neutral-700 font-medium">{dayLabel}</span>
                                <span className="text-neutral-900 font-semibold">{timeStr}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </section>
                  )}

                  {/* Specialties */}
                  {(business.specialties && business.specialties.length > 0) && (
                    <section>
                      <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        Specialties
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {(business.specialties || []).map((specialty: string, index: number) => (
                          <span
                            key={index}
                            className="bg-green-100 text-green-700 px-4 py-2 rounded-lg text-sm font-medium"
                          >
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Reviews - Interactive Rating (backend: one rating per user, re-rate updates) */}
                  <section>
                    <InteractiveRating
                      rating={typeof business.rating === 'number' ? business.rating : 0}
                      totalReviews={typeof business.reviewsCount === 'number' ? business.reviewsCount : 0}
                      reviews={businessReviews}
                      type="business"
                      entityName={displayName}
                      businessId={businessId ?? undefined}
                      onSubmitReview={handleSubmitReview}
                      onEditReview={handleEditReview}
                    />
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLikePost(selectedPost.id)}
          onComment={(text, parentId) => handleCommentPost(selectedPost.id, text, parentId)}
          onDeleteComment={handleDeletePostComment}
          onShare={handleSharePost}
          onSave={() => handleSavePost(selectedPost.id)}
          onNavigateToBusiness={onNavigateToBusiness}
          onNavigateToUserProfile={(userId) => onNavigateWithParams?.('user-profile', { userId })}
          isLiked={selectedPost.isLiked ?? likedPosts.has(selectedPost.id)}
          isSaved={selectedPost.isSaved ?? savedPosts.has(selectedPost.id)}
        />
      )}

      {/* Share Modal (post) */}
      <ShareModal
        isOpen={!!shareModalPost}
        onClose={() => setShareModalPost(null)}
        postId={shareModalPost?.id}
        postUrl={shareModalPost ? `${typeof window !== 'undefined' ? window.location.origin : ''}/post/${shareModalPost.id}` : ''}
        postTitle={shareModalPost?.title}
        postImage={shareModalPost?.image ? getImageUrl(shareModalPost.image) : undefined}
        postOwnerName={shareModalPost?.author?.name ?? shareModalPost?.authorName}
        postOwnerAvatar={shareModalPost?.author?.avatar ? getImageUrl(shareModalPost.author.avatar) : shareModalPost?.authorAvatar ? getImageUrl(shareModalPost.authorAvatar) : undefined}
        onShare={handleShareAction}
      />

      {/* Thread Modal */}
      {selectedThread && (
        <ThreadModal
          thread={{
            id: selectedThread.id,
            title: selectedThread.title,
            content: selectedThread.content ?? '',
            tags: selectedThread.tags,
            likes: selectedThread.likes ?? 0,
            isLiked: selectedThread.isLiked,
            commentsCount: selectedThread.commentsCount ?? selectedThread.comments,
            shares: selectedThread.shares ?? 0,
            timeAgo: selectedThread.timeAgo,
            timestamp: selectedThread.timestamp,
            author: selectedThread.author,
            authorName: selectedThread.author?.name ?? displayName,
            authorAvatar: selectedThread.author?.avatar ?? business?.avatar,
          }}
          comments={threadComments[selectedThread.id] ?? []}
          isOpen={!!selectedThread}
          onClose={() => setSelectedThread(null)}
          onLike={handleThreadLike}
          onComment={handleThreadComment}
          onLikeComment={handleThreadLikeComment}
          onDeleteComment={handleDeleteThreadComment}
          onNavigateToBusiness={onNavigateToBusiness}
          onNavigateToUserProfile={(userId) => onNavigateWithParams?.('user-profile', { userId })}
          onSave={onSaveItem ? handleThreadSave : undefined}
          onShare={handleThreadShare}
          isLiked={selectedThread.isLiked ?? false}
          isSaved={selectedThread.isSaved ?? !!getSavedThreadId(selectedThread.id)}
        />
      )}

      {/* Thread Share Modal */}
      <ShareModal
        isOpen={!!shareModalThread}
        onClose={() => setShareModalThread(null)}
        postId={shareModalThread?.id}
        postUrl={shareModalThread ? `${typeof window !== 'undefined' ? window.location.origin : ''}/threads` : ''}
        postTitle={shareModalThread?.title || (shareModalThread?.content?.slice(0, 50) ?? '') + (shareModalThread?.content?.length > 50 ? '...' : '')}
        postImage={shareModalThread?.author?.avatar ? getImageUrl(shareModalThread.author.avatar) : undefined}
        postOwnerName={shareModalThread?.author?.name}
        postOwnerAvatar={shareModalThread?.author?.avatar ? getImageUrl(shareModalThread.author.avatar) : undefined}
        onShare={handleThreadShareAction}
      />

      {/* Product Details / Product Reviews Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          isAuthenticated={isAuthenticated}
          onAddToCart={selectedProduct ? () => handleAddToCart(selectedProduct) : undefined}
          onRated={handleProductRated}
        />
      )}

      <ReportBusinessModal
        open={showReportModal}
        businessId={business.id}
        businessName={displayName}
        onClose={() => setShowReportModal(false)}
        onReported={() => setAlreadyReported(true)}
      />
    </div>
  );
}