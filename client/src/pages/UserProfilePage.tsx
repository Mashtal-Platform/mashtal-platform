import React, { useState, useEffect } from "react";
import {
  MapPin,
  MessageCircle,
  Mail,
  Heart,
  Bookmark,
  Calendar,
  X,
  Send,
  Edit,
  FileText,
  User,
  CheckCircle2,
  MoreHorizontal,
  Edit2,
  Trash2,
  LogOut,
  RefreshCw,
  MoreVertical,
  ShoppingBag,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { PostModal } from "../components/PostModal";
import { PurchasesCard } from "../components/PurchasesCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { SwitchUserModal } from "../components/SwitchUserModal";
import { ShareModal } from "../components/ShareModal";
import { fetchUser } from "../shared/api/users";
import { getImageUrl } from "../shared/api/client";
import { fetchComments, createComment, deleteComment, type CommentDto } from "../shared/api/comments";
import { toggleLikePost, sharePost } from "../shared/api/posts";
import { toggleLikeThread, shareThread } from "../shared/api/threads";
import { toggleLikeComment } from "../shared/api/comments";
import { ThreadModal, type ThreadModalComment } from "../components/ThreadModal";

interface UserProfilePageProps {
  userId: string | null;
  onOpenChat: (userId: string) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onNavigate?: (page: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
  userThreads?: any[];
  allPosts?: any[];
  allThreads?: any[];
  followedEntities: any[];
  onFollow: (entity: any) => void;
  onUnfollow: (entityId: string) => void;
  highlightPostId?: string; // Post ID to auto-open
  highlightCommentId?: string; // Comment ID to auto-scroll to
  highlightThreadId?: string; // Thread ID to auto-open
  savedItems?: { id: string; type: string; refId?: string; itemId?: string }[];
  onSavePost?: (item: { type: 'post'; refId: string }) => void;
  onSaveThread?: (item: any) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
}

export function UserProfilePage({
  userId,
  onOpenChat,
  onNavigateToBusiness,
  onNavigateToUserProfile,
  onNavigate,
  onNavigateWithParams,
  userThreads = [],
  allPosts = [],
  allThreads = [],
  followedEntities = [],
  onFollow,
  onUnfollow,
  highlightPostId,
  highlightCommentId,
  highlightThreadId,
  savedItems = [],
  onSavePost,
  onSaveThread,
  onRemoveSavedItem,
}: UserProfilePageProps) {
  const { user: currentUser, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "posts" | "threads" | "about"
  >("posts");
  const [selectedPost, setSelectedPost] = useState<any | null>(
    null,
  );
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [threadComments, setThreadComments] = useState<Record<string, ThreadModalComment[]>>({});
  const [shareModalPost, setShareModalPost] = useState<any | null>(null);
  const [shareModalThread, setShareModalThread] = useState<any | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(),
  );
  const [savedPosts, setSavedPosts] = useState<Set<string>>(
    new Set(),
  );
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);
  const [viewedUser, setViewedUser] = useState<any | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

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

  const shapePostForModal = (post: any, profileUser: any) => {
    const author = post.author ?? profileUser;
    return {
      id: post.id,
      image: post.image,
      title: post.title ?? '',
      content: post.content ?? '',
      likes: post.likes ?? 0,
      isLiked: post.isLiked ?? likedPosts.has(post.id),
      isSaved: post.isSaved ?? savedPosts.has(post.id),
      comments: [],
      timeAgo: formatTimeAgo(post.timestamp) || '',
      authorName: author?.name ?? author?.fullName ?? profileUser?.fullName ?? 'Unknown',
      authorAvatar: author?.avatar ?? profileUser?.avatar,
    };
  };

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Fetch viewed user when userId is set and different from current user
  useEffect(() => {
    if (!userId) {
      setProfileLoading(false);
      setViewedUser(null);
      return;
    }
    if (currentUser && userId === currentUser.id) {
      setProfileLoading(false);
      setViewedUser(null);
      return;
    }
    let cancelled = false;
    setProfileLoading(true);
    setViewedUser(null);
    fetchUser(userId)
      .then((data: any) => {
        if (cancelled) return;
        const u = { ...data, id: data.id || (data._id && data._id.toString()) || userId };
        if (data.role === 'business' && onNavigateToBusiness) {
          onNavigateToBusiness(u.id);
          return;
        }
        setViewedUser(u);
      })
      .catch(() => {
        if (!cancelled) setViewedUser(null);
      })
      .finally(() => {
        if (!cancelled) setProfileLoading(false);
      });
    return () => { cancelled = true; };
  }, [userId, currentUser?.id, onNavigateToBusiness]);

  // Function to count all comments including nested replies
  const getTotalCommentCount = (post: any): number => {
    if (!post.comments) return 0;

    const countReplies = (comments: any[]): number =>
      comments.reduce(
        (sum, c) => sum + 1 + countReplies(c.replies || []),
        0,
      );

    return countReplies(post.comments);
  };

  const user = (userId && currentUser && userId === currentUser.id) ? currentUser : viewedUser;

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId;

  const uid = user?.id || (user as any)?._id?.toString?.();
  const isFollowing = !!uid && (followedEntities || []).some(
    (e) => (e?.id || (e as any)?._id?.toString?.()) === uid,
  );

  const authorIdMatch = (author: any, id: string | null) =>
    id && (author?.id || author?._id?.toString?.()) === id;

  const userPosts = (allPosts || []).filter((p) => authorIdMatch(p.author, userId)).map((p) => ({ ...p, comments: [] }));
  const filteredUserThreads = (allThreads || []).filter((thread: any) => authorIdMatch(thread.author, userId));

  // Sync liked/saved state from API data
  useEffect(() => {
    if (!allPosts?.length) return;
    const liked = new Set<string>();
    const saved = new Set<string>();
    allPosts.forEach((p: any) => {
      if (p.isLiked) liked.add(p.id);
      if (p.isSaved) saved.add(p.id);
    });
    savedItems?.forEach((s) => {
      if (s.type === 'post' && (s.refId || s.itemId)) saved.add(s.refId || s.itemId!);
    });
    setLikedPosts((prev) => (prev.size === 0 && liked.size > 0 ? liked : prev));
    setSavedPosts((prev) => (prev.size === 0 && saved.size > 0 ? saved : prev));
  }, [allPosts, savedItems]);

  // Lock body scroll when post or thread modal is open
  useEffect(() => {
    if (selectedPost || selectedThread) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [selectedPost, selectedThread]);

  // Fetch comments when post modal opens
  useEffect(() => {
    if (!selectedPost?.id) return;
    fetchComments('post', selectedPost.id)
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const comments = arr.map((c: any) => mapCommentToModal(c));
        setSelectedPost((prev) => (prev ? { ...prev, comments } : null));
      })
      .catch(() => {
        setSelectedPost((prev) => (prev ? { ...prev, comments: [] } : null));
      });
  }, [selectedPost?.id]);

  // Auto-open post when highlightPostId is provided (depend on allPosts/user to avoid infinite loop from userPosts new ref each render)
  useEffect(() => {
    if (!highlightPostId || !user) return;
    const posts = (allPosts || []).filter((p) => authorIdMatch(p.author, userId)).map((p) => ({ ...p, comments: [] }));
    const postToOpen = posts.find((post) => post.id === highlightPostId);
    if (postToOpen) {
      setActiveTab("posts");
      setSelectedPost(shapePostForModal(postToOpen, user));
    }
  }, [highlightPostId, userId, allPosts, user]);

  // Fetch comments when thread modal opens
  useEffect(() => {
    if (!selectedThread?.id) return;
    fetchComments('thread', selectedThread.id)
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const comments = arr.map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
      })
      .catch(() => {
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: [] }));
      });
  }, [selectedThread?.id]);

  // Auto-switch to threads tab when highlightThreadId is provided
  useEffect(() => {
    if (highlightThreadId) {
      setActiveTab("threads");
      setTimeout(() => {
        const threadElement = document.getElementById(
          `thread-${highlightThreadId}`,
        );
        if (threadElement) {
          threadElement.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
          threadElement.classList.add(
            "ring-2",
            "ring-green-500",
          );
          setTimeout(() => {
            threadElement.classList.remove(
              "ring-2",
              "ring-green-500",
            );
          }, 2000);
        }
      }, 100);
    }
  }, [highlightThreadId]);

  if (profileLoading || (userId && userId !== currentUser?.id && !viewedUser && !user)) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">{profileLoading ? 'Loading profile...' : 'User not found'}</p>
      </div>
    );
  }
  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">User not found</p>
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
      .catch((err) => console.error('[UserProfilePage] like error:', err));
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
          const comments = list.map(mapCommentToModal);
          setSelectedPost((prev) => (prev && prev.id === postId ? { ...prev, comments } : prev));
        })
      )
      .catch((err) => console.error('[UserProfilePage] comment error:', err));
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
      .catch((err) => console.error('[UserProfilePage] delete comment error:', err));
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
      .catch((err) => console.error('[UserProfilePage] share error:', err));
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(shapePostForModal(post, user));
  };

  const getSavedThreadId = (threadId: string) =>
    savedItems?.find((s) => s.type === 'thread' && (s.itemId === threadId || s.refId === threadId))?.id;

  const handleThreadLike = () => {
    if (!selectedThread?.id || !isAuthenticated) return;
    toggleLikeThread(selectedThread.id)
      .then((updated) => {
        setSelectedThread((prev) => prev ? { ...prev, likes: updated.likes, isLiked: updated.isLiked } : null);
      })
      .catch((err) => console.error('[UserProfilePage] toggleLikeThread error:', err));
  };

  const handleThreadComment = (text: string, parentId?: string) => {
    if (!selectedThread?.id || !isAuthenticated || !text?.trim()) return;
    createComment({
      targetType: 'thread',
      targetId: selectedThread.id,
      content: text.trim(),
      parentCommentId: parentId,
    })
      .then(() =>
        fetchComments('thread', selectedThread.id).then((list) => {
          const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
          setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
        })
      )
      .catch((err) => console.error('[UserProfilePage] thread comment error:', err));
  };

  const handleThreadSave = () => {
    if (!selectedThread?.id || !isAuthenticated) return;
    const savedId = getSavedThreadId(selectedThread.id);
    const isSaved = !!savedId;
    if (isSaved && onRemoveSavedItem && savedId) {
      onRemoveSavedItem(savedId);
      setSelectedThread((prev) => prev ? { ...prev, isSaved: false } : null);
    } else if (onSaveThread && !isSaved) {
      onSaveThread({
        id: `saved-${selectedThread.id}-${Date.now()}`,
        type: 'thread',
        itemId: selectedThread.id,
        title: selectedThread.title || (selectedThread.content?.slice(0, 50) || '') + (selectedThread.content?.length > 50 ? '...' : ''),
        image: selectedThread.author?.avatar ?? user?.avatar,
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
        setSelectedThread((prev) => prev && prev.id === shareModalThread.id ? { ...prev, shares: updated.shares } : prev);
        setShareModalThread(null);
      })
      .catch((err) => console.error('[UserProfilePage] shareThread error:', err));
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
                : { ...c, replies: c.replies?.length ? updateOne(c.replies) : c.replies }
            );
          return { ...prev, [selectedThread.id]: updateOne(list) };
        });
      })
      .catch((err) => console.error('[UserProfilePage] toggleLikeComment error:', err));
  };

  const handleDeleteThreadComment = (commentId: string) => {
    if (!selectedThread?.id || !isAuthenticated) return;
    deleteComment(commentId)
      .then(() => fetchComments('thread', selectedThread.id))
      .then((list) => {
        const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c)) as ThreadModalComment[];
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: comments }));
      })
      .catch((err) => console.error('[UserProfilePage] delete thread comment error:', err));
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src={getImageUrl(user?.avatar) || user?.avatar || ''}
          alt={user?.fullName || user?.name || 'Profile'}
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
      </div>

      {/* Profile Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-20">
          <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Image */}
              <div className="relative">
                <img
                  src={getImageUrl(user?.avatar) || user?.avatar || ''}
                  alt={user?.fullName || user?.name || 'Profile'}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                      {user?.fullName || user?.name || 'User'}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{user?.location ?? '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>Joined {user?.joinDate || (user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '')}</span>
                      </div>
                    </div>
                    <p className="text-neutral-700 max-w-2xl leading-relaxed">
                      {user?.bio ?? '—'}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {isOwnProfile && onNavigate ? (
                      <Button
                        onClick={() => onNavigate("profile")}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Edit className="w-5 h-5" />
                        <span>Edit Profile</span>
                      </Button>
                    ) : !isOwnProfile && (onFollow || onUnfollow) && user?.role === 'business' ? (
                      isFollowing ? (
                        <Button
                          onClick={() => user?.id && onUnfollow(user.id)}
                          variant="outline"
                          className="flex items-center justify-center gap-2 border-green-600 text-green-600 hover:bg-green-50 px-6 py-2.5 rounded-lg"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Following</span>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => user && onFollow(user)}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg"
                        >
                          <User className="w-5 h-5" />
                          <span>Follow</span>
                        </Button>
                      )
                    ) : null}
                  </div>
                </div>

                {/* Stats - user profile: only Posts and Threads (no followers/following) */}
                <div className="grid grid-cols-2 gap-6 mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">
                      {userPosts.length}
                    </div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                      Posts
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">
                      {filteredUserThreads.length}
                    </div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                      Threads
                    </div>
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

        {/* Content Tabs */}
        <div className="mt-8 mb-16">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-2">
              <div className="flex">
                <button
                  onClick={() => setActiveTab("posts")}
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === "posts"
                      ? "text-green-600"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Posts</span>
                  </div>
                  {activeTab === "posts" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("threads")}
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === "threads"
                      ? "text-green-600"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>Threads</span>
                  </div>
                  {activeTab === "threads" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab("about")}
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === "about"
                      ? "text-green-600"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>About</span>
                  </div>
                  {activeTab === "about" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
                  )}
                </button>
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-8">
              {/* Posts Tab */}
              {activeTab === "posts" && (
                <div>
                  {userPosts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userPosts.map((post) => (
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
                              <span>
                                {getTotalCommentCount(post)}
                              </span>
                            </div>
                          </div>

                          {/* 3-Dots Menu - ONLY IF OWN PROFILE */}
                          {isOwnProfile && (
                            <div
                              className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                              onClick={(e) =>
                                e.stopPropagation()
                              }
                            >
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="p-1.5 bg-white/90 rounded-full text-neutral-900 hover:bg-white transition-colors shadow-lg backdrop-blur-sm">
                                    <MoreHorizontal className="w-4 h-4" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-36"
                                >
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
                      <p className="text-neutral-500 font-medium">
                        No posts yet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Threads Tab */}
              {activeTab === "threads" && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {filteredUserThreads.length > 0 ? (
                    filteredUserThreads.map((thread) => (
                      <div
                        key={thread.id}
                        className="group border border-neutral-200 rounded-xl p-6 hover:border-green-200 hover:shadow-md transition-all bg-white relative cursor-pointer"
                        id={`thread-${thread.id}`}
                        onClick={() => setSelectedThread(thread)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border border-neutral-100">
                                <img
                                  src={getImageUrl(user?.avatar) || user?.avatar || ''}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-bold text-neutral-900 text-sm leading-tight">
                                  {user.fullName || user.name}
                                </h4>
                                <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                                  {thread.timeAgo || (thread.timestamp ? new Date(thread.timestamp).toLocaleDateString() : '')}
                                </p>
                              </div>
                            </div>
                            <h3 className="text-lg font-bold text-neutral-900 mb-2 leading-snug">
                              {thread.title}
                            </h3>
                            <p className="text-neutral-700 mb-4 line-clamp-3 leading-relaxed text-sm">
                              {thread.content}
                            </p>
                            <div className="flex items-center gap-6 text-sm text-neutral-400">
                              <div className={`flex items-center gap-1.5 transition-colors ${thread.isLiked ? 'text-red-600' : ''}`}>
                                <Heart className={`w-4 h-4 ${thread.isLiked ? 'fill-current' : ''}`} />
                                <span className="font-medium">
                                  {thread.likes ?? 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">
                                  {thread.commentsCount ?? thread.comments ?? 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-green-600 transition-colors">
                                <Send className="w-4 h-4" />
                                <span className="font-medium">
                                  {thread.shares || 0}
                                </span>
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
                                <DropdownMenuContent
                                  align="end"
                                  className="w-36"
                                >
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
                      <p className="text-neutral-500 font-medium">
                        No threads yet
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* About Tab */}
              {activeTab === "about" && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      About
                    </h3>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-6 rounded-xl border border-neutral-100 text-sm">
                      {user?.bio ?? '—'}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Details
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <MapPin className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                            Location
                          </div>
                          <div className="text-neutral-900 font-semibold">
                            {user?.location ?? '—'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                            Joined
                          </div>
                          <div className="text-neutral-900 font-semibold">
                            {user?.joinDate ?? '—'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Custom Fields */}
                  {(user as any).customFields &&
                    (user as any).customFields.length > 0 && (
                      <section>
                        <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                          <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                          Additional Details
                        </h3>
                        <div className="space-y-4">
                          {(user as any).customFields.map(
                            (field: any) =>
                              field.title &&
                              field.content && (
                                <div
                                  key={field.id}
                                  className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm hover:border-green-200 transition-all group"
                                >
                                  <h4 className="font-bold text-neutral-900 mb-3 flex items-center justify-between">
                                    <span>{field.title}</span>
                                    <div className="w-8 h-1 bg-green-100 group-hover:bg-green-600 transition-colors rounded-full" />
                                  </h4>
                                  <p className="text-neutral-700 whitespace-pre-wrap leading-relaxed text-sm">
                                    {field.content}
                                  </p>
                                </div>
                              ),
                          )}
                        </div>
                      </section>
                    )}
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

      {/* Post Share Modal */}
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
            authorName: selectedThread.author?.name ?? user?.fullName ?? user?.name,
            authorAvatar: selectedThread.author?.avatar ?? user?.avatar,
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