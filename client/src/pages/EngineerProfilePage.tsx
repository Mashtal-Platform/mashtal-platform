import React, { useState, useEffect } from 'react';
import { 
  MapPin, Star, MessageCircle, Mail, CheckCircle, Heart, Bookmark, 
  Calendar, X, Send, Edit, FileText, Briefcase, Award, Phone,
  MoreHorizontal, Edit2, Trash2, User, LogOut, RefreshCw, MoreVertical, ShoppingBag
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { PostModal } from '../components/PostModal';
import { ShareModal } from '../components/ShareModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { InteractiveRating } from '../components/InteractiveRating';
import { SwitchUserModal } from '../components/SwitchUserModal';
import { PurchasesCard } from '../components/PurchasesCard';
import { getImageUrl } from '../shared/api/client';
import { fetchUser } from '../shared/api/users';
import { fetchComments, createComment, toggleLikeComment, deleteComment, type CommentDto } from '../shared/api/comments';
import { toggleLikePost, sharePost } from '../shared/api/posts';
import { toggleLikeThread, shareThread } from '../shared/api/threads';
import { ThreadModal, type ThreadModalComment } from '../components/ThreadModal';

interface EngineerProfilePageProps {
  engineerId: string | null;
  onOpenChat: (engineerId: string) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onNavigate?: (page: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
  userThreads?: any[];
  followedEntities?: any[];
  onFollow: (entity: any) => void;
  onUnfollow: (entityId: string) => void;
  highlightPostId?: string; // Post ID to auto-open
  highlightCommentId?: string; // Comment ID to auto-scroll to
  highlightThreadId?: string; // Thread ID to auto-open
  allPosts?: any[];
  savedItems?: { id: string; type: string; refId?: string; itemId?: string }[];
  onSavePost?: (item: { type: 'post'; refId: string }) => void;
  onSaveThread?: (item: any) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
}

export function EngineerProfilePage({ 
  engineerId, 
  onOpenChat, 
  onNavigateToBusiness, 
  onNavigateToUserProfile, 
  onNavigate, 
  userThreads = [],
  followedEntities = [],
  onFollow,
  onUnfollow,
  highlightPostId,
  highlightCommentId,
  highlightThreadId,
  allPosts = [],
  savedItems = [],
  onSavePost,
  onSaveThread,
  onRemoveSavedItem,
}: EngineerProfilePageProps) {
  const { user: currentUser, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'threads' | 'about'>('posts');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [threadComments, setThreadComments] = useState<Record<string, ThreadModalComment[]>>({});
  const [shareModalThread, setShareModalThread] = useState<any | null>(null);
  const [shareModalPost, setShareModalPost] = useState<any | null>(null);
  const [viewedEngineer, setViewedEngineer] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);

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

  // Fetch viewed engineer when engineerId is set and different from current user
  useEffect(() => {
    if (!engineerId) {
      setProfileLoading(false);
      setViewedEngineer(null);
      return;
    }
    if (currentUser && engineerId === currentUser.id) {
      setProfileLoading(false);
      setViewedEngineer(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setViewedEngineer(null);
    fetchUser(engineerId)
      .then((data: any) => {
        if (cancelled) return;
        setViewedEngineer({ ...data, id: data.id || (data._id && data._id.toString()) || engineerId });
      })
      .catch(() => {
        if (!cancelled) setViewedEngineer(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [engineerId, currentUser?.id]);

  const engineer = (currentUser && engineerId === currentUser.id) ? currentUser : viewedEngineer;

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === engineerId;

  // Check if following
  const isFollowing = (followedEntities || []).some((e: any) => (e?.id || e?._id) === engineer?.id);

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Mock reviews data for the engineer/agronomist
  const engineerReviews = [
    {
      id: 'rev1',
      author: 'Ahmed Al-Saud',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      rating: 5,
      comment: engineer?.role === 'agronomist' 
        ? 'Excellent agricultural consultant! Helped me improve my crop yield by 40%. Very knowledgeable and responsive.'
        : 'Excellent agricultural consultant! Helped me improve my crop yield by 40%. Very knowledgeable and responsive.',
      date: '2 weeks ago',
      helpful: 12
    },
    {
      id: 'rev2',
      author: 'Fatima Mohammed',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      rating: 5,
      comment: engineer?.role === 'agronomist'
        ? 'Professional and reliable. The soil analysis was perfect for my farm.'
        : 'Professional and reliable. The irrigation system design was perfect for my farm.',
      date: '1 month ago',
      helpful: 8
    },
    {
      id: 'rev3',
      author: 'Omar Abdullah',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      rating: 4,
      comment: 'Good advice on soil management. Would recommend!',
      date: '2 months ago',
      helpful: 5
    }
  ];

  const engineerPostsFromThreads = userThreads
    .filter((t) => t.author?.id === engineerId && t.type === 'post')
    .map((t) => ({ ...t, comments: [] }));
  const engineerPostsFromFeed = (allPosts || []).filter(
    (p: any) => p.author?.id === engineerId
  ).map((p: any) => ({ ...p, comments: [] }));
  const engineerPosts = engineerPostsFromFeed.length > 0 ? engineerPostsFromFeed : engineerPostsFromThreads;

  const filteredUserThreads = userThreads.filter(
    (thread) => thread.author?.id === engineerId && thread.type === 'thread',
  );

  const shapePostForModal = (post: any) => ({
    id: post.id,
    image: post.image,
    title: post.title ?? post.content?.slice(0, 50) ?? '',
    content: post.content ?? '',
    likes: post.likes ?? 0,
    isLiked: post.isLiked ?? likedPosts.has(post.id),
    isSaved: post.isSaved ?? savedPosts.has(post.id),
    comments: [] as any[],
    timeAgo: formatTimeAgo(post.timestamp) || '',
    authorName: post.author?.name ?? engineer?.fullName ?? 'Unknown',
    authorAvatar: post.author?.avatar ?? engineer?.avatar,
  });

  // Lock body scroll when post modal is open
  useEffect(() => {
    if (selectedPost) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [selectedPost]);

  // Fetch comments when post modal opens
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

  // Auto-open post when highlightPostId is provided (depend on allPosts/userThreads to avoid infinite loop from engineerPosts new ref each render)
  useEffect(() => {
    if (!highlightPostId || !engineerId) return;
    const fromFeed = (allPosts || []).filter((p: any) => p.author?.id === engineerId).map((p: any) => ({ ...p, comments: [] }));
    const fromThreads = userThreads.filter((t) => t.author?.id === engineerId && t.type === 'post').map((t) => ({ ...t, comments: [] }));
    const posts = fromFeed.length > 0 ? fromFeed : fromThreads;
    const postToOpen = posts.find((p: any) => p.id === highlightPostId);
    if (postToOpen) {
      setActiveTab('posts');
      setSelectedPost(shapePostForModal(postToOpen));
    }
  }, [highlightPostId, engineerId, allPosts, userThreads, engineer]);

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

  // Auto-switch to threads tab when highlightThreadId is provided
  useEffect(() => {
    if (highlightThreadId) {
      setActiveTab('threads');
      // Scroll to the thread if needed
      setTimeout(() => {
        const threadElement = document.getElementById(`thread-${highlightThreadId}`);
        if (threadElement) {
          threadElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          threadElement.classList.add('ring-2', 'ring-green-500');
          setTimeout(() => {
            threadElement.classList.remove('ring-2', 'ring-green-500');
          }, 2000);
        }
      }, 100);
    }
  }, [highlightThreadId]);

  if (profileLoading || (engineerId && engineerId !== currentUser?.id && !viewedEngineer && !engineer)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">{profileLoading ? 'Loading profile...' : 'Engineer not found'}</p>
      </div>
    );
  }
  if (!engineer) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">Engineer not found</p>
      </div>
    );
  }

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
      .catch((err) => console.error('[EngineerProfilePage] like error:', err));
  };

  const getSavedItemId = (postId: string) =>
    savedItems?.find((s) => s.type === 'post' && (s.refId === postId || s.itemId === postId))?.id;

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
    } else if (onSavePost && !isSaved) {
      onSavePost({ type: 'post', refId: postId });
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
          const arr = Array.isArray(list) ? list : [];
          const comments = arr.map((c: any) => mapCommentToModal(c));
          setSelectedPost((prev) => (prev && prev.id === postId ? { ...prev, comments } : prev));
        })
      )
      .catch((err) => console.error('[EngineerProfilePage] comment error:', err));
  };

  const handleDeletePostComment = (commentId: string) => {
    if (!selectedPost?.id || !isAuthenticated) return;
    deleteComment(commentId)
      .then(() => fetchComments('post', selectedPost.id))
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const comments = arr.map((c: any) => mapCommentToModal(c));
        setSelectedPost((prev) => (prev ? { ...prev, comments } : prev));
      })
      .catch((err) => console.error('[EngineerProfilePage] delete comment error:', err));
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
      .catch((err) => console.error('[EngineerProfilePage] share error:', err));
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(shapePostForModal(post));
  };

  const getSavedThreadId = (threadId: string) =>
    savedItems?.find((s) => s.type === 'thread' && (s.itemId === threadId || s.refId === threadId))?.id;

  const handleThreadLike = () => {
    if (!selectedThread?.id || !isAuthenticated) return;
    toggleLikeThread(selectedThread.id)
      .then((updated) => setSelectedThread((prev) => prev ? { ...prev, likes: updated.likes, isLiked: updated.isLiked } : null))
      .catch((err) => console.error('[EngineerProfilePage] toggleLikeThread error:', err));
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
      .catch((err) => console.error('[EngineerProfilePage] thread comment error:', err));
  };

  const handleThreadSave = () => {
    if (!selectedThread?.id || !isAuthenticated) return;
    const savedId = getSavedThreadId(selectedThread.id);
    if (savedId && onRemoveSavedItem) {
      onRemoveSavedItem(savedId);
      setSelectedThread((prev) => prev ? { ...prev, isSaved: false } : null);
    } else if (onSaveThread && !savedId) {
      onSaveThread({
        id: `saved-${selectedThread.id}-${Date.now()}`,
        type: 'thread',
        itemId: selectedThread.id,
        title: selectedThread.title || (selectedThread.content?.slice(0, 50) || '') + (selectedThread.content?.length > 50 ? '...' : ''),
        image: selectedThread.author?.avatar ?? engineer?.avatar,
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
      .catch((err) => console.error('[EngineerProfilePage] shareThread error:', err));
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
      .catch((err) => console.error('[EngineerProfilePage] toggleLikeComment error:', err));
  };

  const handleDeleteThreadComment = (commentId: string) => {
    if (!selectedThread?.id || !isAuthenticated) return;
    deleteComment(commentId)
      .then(() => fetchComments('thread', selectedThread.id))
      .then((list) => {
        const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
      })
      .catch((err) => console.error('[EngineerProfilePage] delete thread comment error:', err));
  };

  const handleSubmitReview = (rating: number, comment: string) => {
    console.log('Review submitted:', { rating, comment, engineerId });
    // In a real app, this would send to backend and add to engineerReviews
  };

  // Dynamic role-based text
  const roleDisplayName = engineer.role === 'agronomist' ? 'Agronomist' : 'Engineer';
  const roleBadgeText = engineer.role === 'agronomist' ? 'Verified Agronomist' : 'Verified Engineer';
  const roleBannerImage = engineer.role === 'agronomist' 
    ? 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200' // Agronomist - crops/plants
    : 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200'; // Engineer - technology

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src={roleBannerImage}
          alt={engineer.fullName}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Header Card */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20">
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={engineer.avatar}
                  alt={engineer.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg bg-neutral-100"
                />
                {engineer.verified && (
                  <div className="absolute bottom-1 right-1 bg-green-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Professional Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-neutral-900">{engineer.fullName}</h1>
                      <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {roleBadgeText}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-neutral-400" />
                        <span>{engineer.role === 'agronomist' ? 'Agricultural Specialist' : 'Agricultural Engineer'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{engineer.location}</span>
                      </div>
                      {engineer.rating && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span>{engineer.rating}</span>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-neutral-700 max-w-2xl leading-relaxed">{engineer.bio}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {isOwnProfile && onNavigate ? (
                      <>
                        <Button
                          onClick={() => onNavigate('profile')}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Edit className="w-5 h-5" />
                          <span>Edit Profile</span>
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              className="px-6 py-2.5 rounded-lg border-neutral-200 hover:border-neutral-300"
                            >
                              <MoreVertical className="w-4 h-4 mr-2" />
                              <span>More</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => onNavigate && onNavigate('purchase-history')}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <ShoppingBag className="w-4 h-4" />
                              <span>Purchase History</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setShowSwitchUserModal(true)}
                              className="flex items-center gap-2 cursor-pointer"
                            >
                              <RefreshCw className="w-4 h-4" />
                              <span>Switch Account</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={handleLogout}
                              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Logout</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      isAuthenticated && (
                        <>
                          <Button
                            onClick={() => {
                              if (isFollowing) {
                                onUnfollow(engineer.id);
                              } else {
                                onFollow({
                                  id: engineer.id,
                                  name: engineer.fullName,
                                  role: 'engineer',
                                  location: engineer.location,
                                  image: engineer.avatar,
                                  followers: engineer.followers || 1000,
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
                            onClick={() => onOpenChat(engineer.id)}
                            variant="outline"
                            className="flex items-center justify-center gap-2 px-6 py-2.5 border-2 border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition-all"
                          >
                            <MessageCircle className="w-5 h-5" />
                            <span>Message</span>
                          </Button>
                        </>
                      )
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{engineer.followers || 245}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Followers</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{engineerPosts.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Posts</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{filteredUserThreads.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Threads</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Purchases Card - Only for own profile */}
        {isOwnProfile && (
          <div className="mt-8">
            <PurchasesCard onClick={() => onNavigate && onNavigate('purchase-history')} />
          </div>
        )}

        {/* Content Tabs Section */}
        <div className="mt-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-2">
              <div className="flex">
                <button
                  onClick={() => setActiveTab('posts')}
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
            <div className="p-8">
              {/* Posts Tab */}
              {activeTab === 'posts' && (
                <div>
                  {engineerPosts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {engineerPosts.map((post) => (
                        <div
                          key={post.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                          onClick={() => handlePostClick(post)}
                        >
                          <img
                            src={getImageUrl(post.image) || post.image}
                            alt={post.title || 'Post'}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                            <div className="flex items-center gap-2">
                              <Heart className="w-5 h-5 fill-current" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 fill-current" />
                              <span>{post.comments || 0}</span>
                            </div>
                          </div>
                          
                          {/* 3-Dots Menu - ONLY IF OWN PROFILE */}
                          {isOwnProfile && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 bg-white/90 rounded-full text-neutral-900 hover:bg-white transition-colors shadow-lg backdrop-blur-sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
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
                  {filteredUserThreads.length > 0 ? (
                    filteredUserThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="group border border-neutral-200 rounded-xl p-6 hover:border-green-200 hover:shadow-md transition-all bg-white relative cursor-pointer"
                        id={`thread-${thread.id}`}
                        onClick={() => setSelectedThread(thread)}
                      >
                        <div className="flex items-start gap-4">
                          <img
                            src={getImageUrl(engineer.avatar) || engineer.avatar}
                            alt={engineer.fullName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-neutral-900 text-sm">{engineer.fullName}</h3>
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

                          {/* 3-Dots Menu - ONLY IF OWN PROFILE */}
                          {isOwnProfile && (
                            <div 
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400">
                                    <MoreHorizontal className="w-5 h-5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-36">
                                  <DropdownMenuItem className="cursor-pointer gap-2">
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                                    <Trash2 className="w-4 h-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          )}
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
                      Professional Biography
                    </h3>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-6 rounded-xl border border-neutral-100 text-sm">
                      {engineer.bio}
                    </p>
                  </section>
                  
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Professional Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Briefcase className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Specialization</div>
                          <div className="text-neutral-900 font-semibold">{engineer.specialization}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Experience</div>
                          <div className="text-neutral-900 font-semibold">{engineer.yearsExperience || 8}+ Years</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Activity Statistics */}
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Activity Summary
                    </h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100 text-center">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">{engineer.consultations || 156}</div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Consults</div>
                      </div>
                      <div className="bg-neutral-50 rounded-xl p-6 border border-neutral-100 text-center">
                        <div className="text-2xl font-bold text-neutral-900 mb-1">{engineerPosts.length}</div>
                        <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest">Posts</div>
                      </div>
                    </div>
                  </section>

                  {/* Custom Fields */}
                  {(engineer as any).customFields && (engineer as any).customFields.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        Additional Details
                      </h3>
                      <div className="space-y-4">
                        {(engineer as any).customFields.map((field: any) => (
                          field.title && field.content && (
                            <div key={field.id} className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:border-green-200 transition-all group">
                              <h4 className="font-bold text-neutral-900 mb-3 flex items-center justify-between">
                                <span>{field.title}</span>
                                <div className="w-8 h-1 bg-green-100 group-hover:bg-green-600 transition-colors rounded-full" />
                              </h4>
                              <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed text-sm">
                                {field.content}
                              </p>
                            </div>
                          )
                        ))}
                      </div>
                    </section>
                  )}

                  {/* Reviews - Interactive Rating */}
                  <section>
                    <InteractiveRating
                      rating={engineer.rating || 4.8}
                      totalReviews={engineer.reviews || 125}
                      reviews={engineerReviews}
                      type="engineer"
                      entityName={engineer.fullName}
                      onSubmitReview={handleSubmitReview}
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
          onNavigateToUserProfile={onNavigateToUserProfile}
          isLiked={selectedPost.isLiked ?? likedPosts.has(selectedPost.id)}
          isSaved={selectedPost.isSaved ?? savedPosts.has(selectedPost.id)}
          highlightCommentId={highlightCommentId}
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
            authorName: selectedThread.author?.name ?? engineer?.fullName,
            authorAvatar: selectedThread.author?.avatar ?? engineer?.avatar,
          }}
          comments={threadComments[selectedThread.id] ?? []}
          isOpen={!!selectedThread}
          onClose={() => setSelectedThread(null)}
          onLike={handleThreadLike}
          onComment={handleThreadComment}
          onLikeComment={handleThreadLikeComment}
          onDeleteComment={handleDeleteThreadComment}
          onNavigateToBusiness={onNavigateToBusiness}
          onNavigateToUserProfile={onNavigateToUserProfile}
          onSave={onSaveThread ? handleThreadSave : undefined}
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

      {/* Switch User Modal */}
      {showSwitchUserModal && (
        <SwitchUserModal onClose={() => setShowSwitchUserModal(false)} />
      )}
    </div>
  );
}