import React, { useState, useEffect } from "react";
import { Card } from "./ui/card";
import { PostModal } from "./PostModal";
import { EditPostModal } from "./EditPostModal";
import { EditThreadModal } from "./EditThreadModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { PurchasesCard } from "./PurchasesCard";
import { fetchProducts } from "../shared/api/products";
import { getImageUrl } from "../shared/api/client";
import { filterOutOrphanSavedItems } from "../shared/utils/saved";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

import { Button } from './ui/button';
import {
  Heart,
  MapPin,
  Star,
  ExternalLink,
  Building2,
  Users,
  Camera,
  CheckCircle,
  Settings,
  MessageCircle,
  Bookmark,
  Package,
  ArrowUpRight,
  FileText,
  BarChart3,
  User,
  Phone,
  Mail,
  Globe,
  MoreHorizontal,
  Edit2,
  Trash2,
  DollarSign,
  ShoppingBag,
  Eye,
  LogOut,
  RefreshCw,
  MoreVertical,
  Plus,
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { SwitchUserModal } from './SwitchUserModal';
import { ThreadModal, type ThreadModalComment } from './ThreadModal';
import {
  fetchComments,
  createComment,
  deleteComment,
  updateComment,
  toggleLikeComment,
  type CommentDto,
} from '../shared/api/comments';
import {
  fetchPostById,
  toggleLikePost,
  sharePost,
} from '../shared/api/posts';
import {
  fetchThreadById,
  toggleLikeThread,
  shareThread,
} from '../shared/api/threads';



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

function formatTimeAgo(timestamp?: string): string {
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
}

const mapCommentToModal = (dto: CommentDto): ThreadModalComment | any => ({
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

interface UserProfile {
  avatar?: string;
  companyName?: string;
  fullName?: string;
  location?: string;
  bio?: string;
  phone?: string;
  email?: string;
  verified?: boolean;
  rating?: number;
  reviewsCount?: number;
  hours?: Array<{ day?: string; closed?: boolean; open?: Array<{ from?: string; to?: string }> }>;
  about?: Record<string, string>;
}

interface BusinessProfileViewProps {
  userProfile: UserProfile;
  userPosts?: any[];
  userThreads?: any[];
  isOwnProfile: boolean;
  followersCount?: number;
  followingCount?: number;
  onEditProfile: () => void;
  onPostClick?: (post: any) => void;
  onThreadClick?: (thread: any) => void;
  onDeletePost?: (postId: string, e?: React.MouseEvent) => void;
  onEditPost?: (post: any, e?: React.MouseEvent) => void;
  onUpdatePost?: (postId: string, updatedData: any) => void;
  onDeleteThread?: (
    threadId: string,
    e?: React.MouseEvent,
  ) => void;
  onEditThread?: (thread: any, e?: React.MouseEvent) => void;
  onUpdateThread?: (threadId: string, updatedData: any) => void;
  onAvatarChange?: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void;
  avatarFileInputRef?: React.RefObject<HTMLInputElement>;
  onNavigate?: (page: string) => void;
  onNavigateToDashboard?: (targetSection?: 'analytics' | 'products') => void;
  savedItems?: any[];
  onRemoveSavedItem?: (itemId: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
}

export function BusinessProfileView({
  userProfile,
  userPosts = [],
  userThreads = [],
  isOwnProfile,
  followersCount = 0,
  followingCount = 0,
  onEditProfile,
  onPostClick,
  onThreadClick,
  onDeletePost,
  onEditPost,
  onUpdatePost,
  onDeleteThread,
  onEditThread,
  onUpdateThread,
  onAvatarChange,
  avatarFileInputRef,
  onNavigate,
  onNavigateToDashboard,
  savedItems = [],
  onRemoveSavedItem,
  onNavigateWithParams,
}: BusinessProfileViewProps) {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState<
    | "products"
    | "posts"
    | "threads"
    | "dashboard"
    | "about"
    | "saved"
  >("products");
  const [savedItemsFilter, setSavedItemsFilter] = useState<'all' | 'product' | 'post' | 'thread' | 'business'>('all');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(),
  );
  const [selectedPost, setSelectedPost] = useState<any | null>(
    null,
  );
  const [selectedThread, setSelectedThread] = useState<any | null>(null);
  const [threadComments, setThreadComments] = useState<
    Record<string, ThreadModalComment[]>
  >({});
  const [showEditPostModal, setShowEditPostModal] =
    useState(false);
  const [productRefreshKey, setProductRefreshKey] = useState(0);
  const [postToEdit, setPostToEdit] = useState<any | null>(
    null,
  );
  const [showEditThreadModal, setShowEditThreadModal] =
    useState(false);
  const [threadToEdit, setThreadToEdit] = useState<any | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "post" | "thread";
    id: string;
  } | null>(null);
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);

  // Listen for localStorage changes to refresh products
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      const storageKey = `business_products_${user?.businessId || user?.id}`;
      if (e.key === storageKey) {
        setProductRefreshKey(prev => prev + 1);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('home');
    }
  };

  const [businessProducts, setBusinessProducts] = useState<any[]>([]);

  useEffect(() => {
    const bid = user?.businessId || user?.id;
    if (!bid) return;
    fetchProducts({ businessId: bid })
      .then(setBusinessProducts)
      .catch(() => setBusinessProducts([]));
  }, [user?.businessId, user?.id, productRefreshKey]);

  // Fetch post comments whenever a post modal is opened.
  useEffect(() => {
    if (!selectedPost?.id) return;
    fetchComments('post', selectedPost.id)
      .then((list) => {
        const mapped = (Array.isArray(list) ? list : []).map(mapCommentToModal);
        setSelectedPost((prev) => (prev ? { ...prev, comments: mapped } : prev));
      })
      .catch(() => {
        setSelectedPost((prev) => (prev ? { ...prev, comments: [] } : prev));
      });
  }, [selectedPost?.id]);

  // Fetch thread comments whenever a thread modal is opened.
  useEffect(() => {
    if (!selectedThread?.id) return;
    fetchComments('thread', selectedThread.id)
      .then((list) => {
        const mapped = (Array.isArray(list) ? list : []).map(mapCommentToModal) as ThreadModalComment[];
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: mapped }));
      })
      .catch(() => {
        setThreadComments((prev) => ({ ...prev, [selectedThread.id]: [] }));
      });
  }, [selectedThread?.id]);

  // Lock body scroll while modals are open.
  useEffect(() => {
    if (selectedPost || selectedThread) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
    return;
  }, [selectedPost, selectedThread]);

  const displayProducts = (Array.isArray(businessProducts) ? businessProducts : []).map((product: any) => ({
    id: product.id ?? '',
    name: product.name ?? '',
    price: `$${Number(product.price) || 0}`,
    priceNum: Number(product.price) || 0,
    description: product.description ?? '',
    image: product.image ?? '',
    inStock: (product.stock ?? 0) > 0,
    stock: Number(product.stock) ?? 0,
    category: product.category ?? '',
  }));

  // Mock products data
  const mockProducts = [
    {
      id: "1",
      name: "Date Palm Seedlings",
      price: "$150",
      priceNum: 150,
      description: "Premium quality date palm seedlings",
      image:
        "https://images.unsplash.com/photo-1591868353650-42c41f88e81a?w=400",
      inStock: true,
    },
    {
      id: "2",
      name: "Organic Fertilizer 25kg",
      price: "$85",
      priceNum: 85,
      description: "High-quality organic fertilizer",
      image:
        "https://images.unsplash.com/photo-1592838064575-70ed626d3a0e?w=400",
      inStock: true,
    },
    {
      id: "3",
      name: "Professional Garden Tool Set",
      price: "$220",
      priceNum: 220,
      description: "Complete professional garden tool set",
      image:
        "https://images.unsplash.com/photo-1617576683096-00fc8eecb3af?w=400",
      inStock: true,
    },
  ];

  // Mock dashboard data
  const dashboardStats = [
    {
      label: "Total Revenue",
      value: "$59,730",
      change: "+22.1%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      label: "Total Sales",
      value: "511",
      change: "+15.2%",
      icon: ShoppingBag,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      label: "Profile Views",
      value: "4,194",
      change: "+12.5%",
      icon: Eye,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      label: "Followers",
      value: "1,243",
      change: "+8.3%",
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  const topProducts = [
    {
      name: "Date Palm Seedlings",
      sold: 89,
      revenue: "$13,350",
    },
    {
      name: "Organic Fertilizer 25kg",
      sold: 156,
      revenue: "$13,260",
    },
    {
      name: "Premium Wheat Seeds",
      sold: 198,
      revenue: "$12,870",
    },
  ];

  const handleAvatarClick = () => {
    if (avatarFileInputRef?.current) {
      avatarFileInputRef.current.click();
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!user) return;
    try {
      const updated = await toggleLikePost(postId);
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (updated.isLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setSelectedPost((prev) => {
        if (!prev || prev.id !== postId) return prev;
        return { ...prev, likes: updated.likes, isLiked: updated.isLiked };
      });
    } catch (err) {
      console.error('[BusinessProfileView] toggleLikePost failed:', err);
    }
  };

  const handleSharePost = async (postId: string) => {
    try {
      const updated = await sharePost(postId);
      setSelectedPost((prev) => {
        if (!prev || prev.id !== postId) return prev;
        return { ...prev, shares: updated.shares };
      });
    } catch (err) {
      console.error('[BusinessProfileView] sharePost failed:', err);
    }
  };

  const handleSavePost = async (postId: string) => {
    // Saved-view: allow removing from saved (adding requires another callback).
    if (!onRemoveSavedItem) return;
    const savedId = savedItems?.find((s: any) => s.type === 'post' && (s.itemId === postId || s.refId === postId))?.id;
    if (!savedId) return;

    try {
      onRemoveSavedItem(savedId);
      setSelectedPost((prev) => {
        if (!prev || prev.id !== postId) return prev;
        return { ...prev, isSaved: false };
      });
    } catch (err) {
      console.error('[BusinessProfileView] remove saved post failed:', err);
    }
  };

  const handleCommentPost = async (postId: string, text: string, parentId?: string) => {
    if (!user) return;
    try {
      await createComment({
        targetType: 'post',
        targetId: postId,
        content: text.trim(),
        parentCommentId: parentId,
      });

      const list = await fetchComments('post', postId);
      const comments = (Array.isArray(list) ? list : []).map((c: any) =>
        mapCommentToModal(c),
      );
      setSelectedPost((prev) => (prev ? { ...prev, comments } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] comment on post failed:', err);
    }
  };

  const handleDeletePostComment = async (commentId: string) => {
    if (!selectedPost?.id) return;
    if (!user) return;
    try {
      await deleteComment(commentId);
      const list = await fetchComments('post', selectedPost.id);
      const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c));
      setSelectedPost((prev) => (prev ? { ...prev, comments } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] delete post comment failed:', err);
    }
  };

  const handleLikePostComment = async (commentId: string) => {
    if (!selectedPost?.id) return;
    if (!user) return;
    try {
      await toggleLikeComment(commentId);
      const list = await fetchComments('post', selectedPost.id);
      const comments = (Array.isArray(list) ? list : []).map((c: any) =>
        mapCommentToModal(c),
      );
      setSelectedPost((prev) => (prev ? { ...prev, comments } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] like post comment failed:', err);
    }
  };

  const handleEditPostComment = async (commentId: string, content: string) => {
    if (!user) return;
    if (!selectedPost?.id) return;
    try {
      await updateComment(commentId, content);
      const list = await fetchComments('post', selectedPost.id);
      const comments = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c));
      setSelectedPost((prev) => (prev ? { ...prev, comments } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] edit post comment failed:', err);
    }
  };

  const handleThreadLike = async () => {
    if (!selectedThread?.id) return;
    if (!user) return;
    const threadId = selectedThread.id;
    try {
      const updated = await toggleLikeThread(threadId);
      setSelectedThread((prev) => (prev ? { ...prev, likes: updated.likes, isLiked: updated.isLiked } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] toggleLikeThread failed:', err);
    }
  };

  const handleThreadComment = async (text: string, parentId?: string) => {
    if (!selectedThread?.id) return;
    if (!user) return;
    try {
      await createComment({
        targetType: 'thread',
        targetId: selectedThread.id,
        content: text.trim(),
        parentCommentId: parentId,
      });

      const list = await fetchComments('thread', selectedThread.id);
      const mapped = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c));
      setThreadComments((prev) => ({ ...prev, [selectedThread.id]: mapped }));
    } catch (err) {
      console.error('[BusinessProfileView] comment on thread failed:', err);
    }
  };

  const handleThreadLikeComment = async (commentId: string) => {
    if (!selectedThread?.id) return;
    if (!user) return;
    try {
      await toggleLikeComment(commentId);
      const list = await fetchComments('thread', selectedThread.id);
      const mapped = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c));
      setThreadComments((prev) => ({ ...prev, [selectedThread.id]: mapped }));
    } catch (err) {
      console.error('[BusinessProfileView] like thread comment failed:', err);
    }
  };

  const handleDeleteThreadComment = async (commentId: string) => {
    if (!selectedThread?.id) return;
    if (!user) return;
    try {
      await deleteComment(commentId);
      const list = await fetchComments('thread', selectedThread.id);
      const mapped = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c));
      setThreadComments((prev) => ({ ...prev, [selectedThread.id]: mapped }));
    } catch (err) {
      console.error('[BusinessProfileView] delete thread comment failed:', err);
    }
  };

  const handleEditThreadComment = async (commentId: string, content: string) => {
    if (!user) return;
    if (!selectedThread?.id) return;
    try {
      await updateComment(commentId, content);
      const list = await fetchComments('thread', selectedThread.id);
      const mapped = (Array.isArray(list) ? list : []).map((c: any) => mapCommentToModal(c));
      setThreadComments((prev) => ({ ...prev, [selectedThread.id]: mapped }));
    } catch (err) {
      console.error('[BusinessProfileView] edit thread comment failed:', err);
    }
  };

  const handleThreadSave = async () => {
    if (!selectedThread?.id || !onRemoveSavedItem) return;
    const threadId = selectedThread.id;
    const savedId = savedItems?.find((s: any) => s.type === 'thread' && (s.itemId === threadId || s.refId === threadId))?.id;
    if (!savedId) return;

    try {
      onRemoveSavedItem(savedId);
      setSelectedThread((prev) => (prev ? { ...prev, isSaved: false } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] remove saved thread failed:', err);
    }
  };

  const handleThreadShare = async () => {
    if (!selectedThread?.id) return;
    try {
      const updated = await shareThread(selectedThread.id);
      setSelectedThread((prev) => (prev ? { ...prev, shares: updated.shares } : prev));
    } catch (err) {
      console.error('[BusinessProfileView] share thread failed:', err);
    }
  };

  const handlePostClick = (post: any) => {
    setSelectedPost(post);
  };

  const handleEditPost = (post: any) => {
    setPostToEdit(post);
    setShowEditPostModal(true);
  };

  const handleEditThread = (thread: any) => {
    setThreadToEdit(thread);
    setShowEditThreadModal(true);
  };

  const handleDeletePost = (postId: string) => {
    setDeleteTarget({ type: "post", id: postId });
    setShowDeleteModal(true);
  };

  const handleDeleteThread = (threadId: string) => {
    setDeleteTarget({ type: "thread", id: threadId });
    setShowDeleteModal(true);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src="https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=1200"
          alt="Business Banner"
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
                <div
                  className={`relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden bg-neutral-100 ${isOwnProfile ? "cursor-pointer group" : ""}`}
                  onClick={
                    isOwnProfile ? handleAvatarClick : undefined
                  }
                >
                  {userProfile.avatar ? (
                    <img
                      src={getImageUrl(userProfile.avatar)}
                      alt={
                        userProfile.companyName ||
                        userProfile.fullName
                      }
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-50">
                      <Building2 className="w-16 h-16 text-green-600" />
                    </div>
                  )}
                  {isOwnProfile && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                      <Camera className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                {isOwnProfile && avatarFileInputRef && (
                  <input
                    ref={avatarFileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={onAvatarChange}
                    className="hidden"
                  />
                )}
                {/* Verified Badge */}
                {userProfile.verified && (
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
                      <h1 className="text-3xl font-bold text-neutral-900">
                        {userProfile.companyName ||
                          userProfile.fullName}
                      </h1>
                      <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3" />
                        Verified Business
                      </span>
                    </div>

                      <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-4">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>
                          {userProfile.location ||
                            "Location not set"}
                        </span>
                      </div>
                      {(typeof userProfile.rating === 'number' || userProfile.reviewsCount != null) && (
                        <div className="flex items-center gap-1.5">
                          <Star className="w-4 h-4 text-amber-500 fill-current" />
                          <span>{typeof userProfile.rating === 'number' ? userProfile.rating.toFixed(1) : '—'}</span>
                          {userProfile.reviewsCount != null && userProfile.reviewsCount > 0 && (
                            <span className="text-neutral-500 text-sm">({userProfile.reviewsCount} reviews)</span>
                          )}
                        </div>
                      )}
                    </div>

                    <p className="text-neutral-700 max-w-2xl leading-relaxed">
                      {userProfile.bio ||
                        "No description available"}
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2 min-w-[160px]">
                    {isOwnProfile ? (
                      <>
                        <Button
                          onClick={onEditProfile}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Edit Profile</span>
                        </Button>
                      
                      </>
                    ) : (
                      <>
                        <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                          <Heart className="w-5 h-5 mr-2" />
                          Follow
                        </Button>
                        <Button
                          variant="outline"
                          className="border-2 border-green-600 text-green-600"
                        >
                          <MessageCircle className="w-5 h-5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">
                      {followersCount.toLocaleString()}
                    </div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                      Followers
                    </div>
                  </div>
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
                      {userThreads.length}
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

        {/* NEW SECTION: Following, Followers, Saved, Products & Purchases Management Cards - Only for own profile */}
        {isOwnProfile && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            {/* Following Card */}
            <div
              className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                onNavigate && onNavigate("following")
              }
            >
              <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-neutral-900">
                      Following
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {followingCount.toLocaleString()} accounts
                    </p>
                  </div>
                </div>
                <div className="text-neutral-400">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Followers Card */}
            <div 
              className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onNavigate && onNavigate('followers')}
            >
              <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-neutral-900">
                      Followers
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {followersCount.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <div className="text-neutral-400">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Saved Items Card */}
            <div
              className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => {
                setActiveTab("saved");
                document
                  .getElementById("business-content-tabs")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                    <Bookmark className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-neutral-900">
                      Saved
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {savedItems.length} items
                    </p>
                  </div>
                </div>
                <div className="text-neutral-400">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Products Management Card */}
            <div
              className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() =>
                onNavigateToDashboard && onNavigateToDashboard('products')
              }
            >
              <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                    <Package className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-neutral-900">
                      Products
                    </h3>
                    <p className="text-sm text-neutral-500">
                      {displayProducts.length} {displayProducts.length === 1 ? 'product' : 'products'}
                    </p>
                  </div>
                </div>
                <div className="text-neutral-400">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Purchases Card */}
            <PurchasesCard onClick={() => onNavigate && onNavigate('purchase-history')} />
          </div>
        )}

        {/* Content Tabs Section */}
        <div className="mt-8 mb-16" id="business-content-tabs">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-2 overflow-x-auto">
              <div className="flex min-w-max">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === "products"
                      ? "text-green-600"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    <span>Products</span>
                  </div>
                  {activeTab === "products" && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
                  )}
                </button>
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
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab("saved")}
                    className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                      activeTab === "saved"
                        ? "text-green-600"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bookmark className="w-4 h-4" />
                      <span>Saved</span>
                    </div>
                    {activeTab === "saved" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
                    )}
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                      activeTab === "dashboard"
                        ? "text-green-600"
                        : "text-neutral-500 hover:text-neutral-800"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      <span>Dashboard</span>
                    </div>
                    {activeTab === "dashboard" && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />
                    )}
                  </button>
                )}
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
              {/* Products Tab */}
              {activeTab === "products" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {displayProducts.length > 0 ? (
                    displayProducts.map((product) => (
                    <div
                      key={product.id}
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
                            <Package className="w-16 h-16" />
                          </div>
                        )}
                        {product.inStock && (
                          <div className="absolute top-3 right-3 bg-green-600 text-white px-2 py-1 rounded text-xs">
                            In Stock
                          </div>
                        )}
                        {isOwnProfile && (
                          <div className="absolute bottom-3 left-3 right-3 bg-green-600/90 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-xs font-medium text-center opacity-0 group-hover:opacity-100 transition-opacity">
                            Click to manage
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg text-neutral-900 mb-2">
                          {product.name}
                        </h3>
                        <p className="text-neutral-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl text-green-600">
                            {product.price}
                          </span>
                          {!isOwnProfile && (
                            <button className="p-2 rounded-lg bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors">
                              <Bookmark className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        {isOwnProfile && (
                          <div className="text-center py-2.5 px-4 mt-3 bg-green-50 rounded-lg border border-green-200">
                            <span className="text-sm font-medium text-green-700">📊 Manage Product</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                  ) : (
                    <div className="text-center py-12">
                      <Package className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                        No Products Yet
                      </h3>
                      <p className="text-neutral-600 mb-4">
                        {isOwnProfile 
                          ? "Start adding products to showcase your offerings"
                          : "This business hasn't added any products yet"}
                      </p>
                      {isOwnProfile && (
                        <Button
                          onClick={() => onNavigateToDashboard && onNavigateToDashboard('products')}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Products
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Posts Tab */}
              {activeTab === "posts" && (
                <div>
                  {userPosts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userPosts.map((post) => (
                        <div
                          key={post.id}
                          className="group relative aspect-square rounded-lg overflow-hidden bg-neutral-200 cursor-pointer shadow-sm hover:shadow-md transition-all"
                          onClick={() =>
                            onPostClick && onPostClick(post)
                          }
                        >
                          {getImageUrl(post.image) ? (
                            <img
                              src={getImageUrl(post.image)}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <Camera className="w-12 h-12" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-6 text-white font-bold">
                            <div className="flex items-center gap-2">
                              <Heart className="w-5 h-5 fill-current" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MessageCircle className="w-5 h-5 fill-current" />
                              <span>{post.commentsCount ?? post.comments ?? 0}</span>
                            </div>
                          </div>
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
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditPost(post);
                                    }}
                                    className="cursor-pointer gap-2"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                    <span>Edit Post</span>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeletePost(post.id);
                                    }}
                                    className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                                  >
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
                <div>
                  {userThreads.length > 0 ? (
                    <div className="space-y-4">
                      {userThreads.map((thread) => (
                        <div
                          key={thread.id}
                          className="group bg-white border border-neutral-200 rounded-xl p-6 hover:shadow-md transition-shadow cursor-pointer relative"
                          onClick={() =>
                            onThreadClick &&
                            onThreadClick(thread)
                          }
                        >
                          <div className="flex items-start gap-4">
                            {getImageUrl(userProfile.avatar) ? (
                              <img
                                src={getImageUrl(userProfile.avatar)}
                                alt={userProfile.companyName || userProfile.fullName || ''}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center flex-shrink-0">
                                <User className="w-6 h-6 text-neutral-500" />
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-bold text-neutral-900 text-sm">
                                  {userProfile.companyName ||
                                    userProfile.fullName}
                                </h3>
                                <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                                  {thread.timeAgo}
                                </span>
                              </div>
                              <p className="text-neutral-700 mb-4 line-clamp-3 leading-relaxed text-sm">
                                {thread.content}
                              </p>
                              <div className="flex items-center gap-6 text-sm text-neutral-400">
                                <div className="flex items-center gap-1.5">
                                  <Heart className="w-4 h-4" />
                                  <span className="font-medium">
                                    {thread.likes || 0}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <MessageCircle className="w-4 h-4" />
                                  <span className="font-medium">
                                    {thread.comments || 0}
                                  </span>
                                </div>
                              </div>
                            </div>
                            {/* Edit/Delete Menu - Only for own profile */}
                            {isOwnProfile && (
                              <div
                                className="opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                onClick={(e) =>
                                  e.stopPropagation()
                                }
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
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditThread(thread);
                                      }}
                                      className="cursor-pointer gap-2"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                      <span>Edit Thread</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteThread(thread.id);
                                      }}
                                      className="cursor-pointer gap-2 text-red-600 focus:text-red-600"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
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

              {/* Dashboard Tab - Only visible for own profile */}
              {activeTab === "dashboard" && isOwnProfile && (
                <div className="space-y-6">
                  {/* Redirect to full dashboard with preview */}
                  <div className="p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border-2 border-green-200">
                    <div className="text-center max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                        <BarChart3 className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                        Your Business Dashboard
                      </h3>
                      <p className="text-neutral-700 mb-6 leading-relaxed">
                        View comprehensive analytics, manage
                        products, track sales performance, and
                        monitor your business growth metrics.
                      </p>
                      <button
                        onClick={() =>
                          onNavigate && onNavigate("dashboard")
                        }
                        className="inline-flex items-center gap-3 bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                      >
                        <BarChart3 className="w-5 h-5" />
                        <span className="font-semibold">
                          Open Full Dashboard
                        </span>
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Quick Stats Preview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-neutral-900">
                          $59,730
                        </div>
                        <div className="text-xs text-neutral-500">
                          Total Revenue
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <ShoppingBag className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-neutral-900">
                          511
                        </div>
                        <div className="text-xs text-neutral-500">
                          Products Sold
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <Eye className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-neutral-900">
                          4,194
                        </div>
                        <div className="text-xs text-neutral-500">
                          Profile Views
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 text-center shadow-sm">
                        <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                        <div className="text-xl font-bold text-neutral-900">
                          1,243
                        </div>
                        <div className="text-xs text-neutral-500">
                          Followers
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* About Tab */}
              {activeTab === "about" && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      About{" "}
                      {userProfile.companyName ||
                        userProfile.fullName}
                    </h3>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-6 rounded-xl border border-neutral-100 text-sm">
                      {userProfile.bio ||
                        "No description available"}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Contact Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {userProfile.phone && (
                        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                              Phone
                            </div>
                            <div className="text-neutral-900 font-semibold">
                              {userProfile.phone}
                            </div>
                          </div>
                        </div>
                      )}
                      {userProfile.email && (
                        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm">
                            <Mail className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                              Email
                            </div>
                            <div className="text-neutral-900 font-semibold">
                              {userProfile.email}
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Globe className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                            Website
                          </div>
                          <a
                            href="#"
                            className="text-green-600 font-semibold hover:underline"
                          >
                            {userProfile.companyName
                              ? `www.${userProfile.companyName.toLowerCase().replace(/\\s+/g, "")}.com`
                              : "No website"}
                          </a>
                        </div>
                      </div>
                      {userProfile.location && (
                        <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                          <div className="p-2.5 bg-white rounded-lg shadow-sm">
                            <MapPin className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">
                              Location
                            </div>
                            <div className="text-neutral-900 font-semibold">
                              {userProfile.location}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>

                  {/* Business Hours */}
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      Business Hours
                    </h3>
                    <div className="bg-neutral-50 rounded-xl border border-neutral-100 p-6">
                      <div className="space-y-3">
                        {(
                          userProfile.hours && userProfile.hours.length > 0
                            ? userProfile.hours
                            : [
                                { day: 'monday', closed: false, open: [{ from: '08:00', to: '18:00' }] },
                                { day: 'tuesday', closed: false, open: [{ from: '08:00', to: '18:00' }] },
                                { day: 'wednesday', closed: false, open: [{ from: '08:00', to: '18:00' }] },
                                { day: 'thursday', closed: false, open: [{ from: '08:00', to: '18:00' }] },
                                { day: 'friday', closed: false, open: [{ from: '08:00', to: '18:00' }] },
                                { day: 'saturday', closed: false, open: [{ from: '09:00', to: '14:00' }] },
                                { day: 'sunday', closed: true, open: [] },
                              ]
                        ).map((h: any) => {
                          const dayLabel = DAY_LABELS[(h.day || '').toLowerCase()] || (h.day || '');
                          const timeStr = h.closed
                            ? 'Closed'
                            : h.open?.length && h.open[0]?.from && h.open[0]?.to
                              ? `${formatTime(h.open[0].from)} – ${formatTime(h.open[0].to)}`
                              : '—';
                          return (
                            <div
                              key={h.day || dayLabel}
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

                  {/* Custom about fields - from Edit profile → About section */}
                  {userProfile.about &&
                    typeof userProfile.about === 'object' &&
                    Object.keys(userProfile.about).length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        More information
                      </h3>
                      <div className="space-y-4">
                        {Object.entries(userProfile.about).map(
                          ([title, content]) =>
                            title && (
                              <div
                                key={title}
                                className="p-5 bg-white rounded-xl border border-neutral-200 shadow-sm"
                              >
                                <div className="text-xs font-bold uppercase tracking-wider text-green-700 mb-2">
                                  {title}
                                </div>
                                <div className="text-neutral-800 whitespace-pre-wrap leading-relaxed">
                                  {content || '—'}
                                </div>
                              </div>
                            )
                        )}
                      </div>
                    </section>
                  )}
                </div>
              )}

              {/* Saved Tab - Only visible for own profile */}
              {activeTab === "saved" && isOwnProfile && (() => {
                const validItems = filterOutOrphanSavedItems(savedItems);
                const filteredItems = savedItemsFilter === 'all' 
                  ? validItems 
                  : validItems.filter(item => item.type === savedItemsFilter);

                return (
                  <div className="p-6">
                    {/* Saved Items Filter */}
                    <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                      {(['all', 'product', 'post', 'thread', 'business'] as const).map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setSavedItemsFilter(filter)}
                          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
                            savedItemsFilter === filter
                              ? 'bg-green-600 text-white shadow-md shadow-green-200'
                              : 'bg-white text-neutral-600 hover:bg-green-50 hover:text-green-600 border border-neutral-200'
                          }`}
                        >
                          {filter === 'all' ? 'All Items' : 
                           filter === 'post' ? 'Posts' : 
                           filter === 'thread' ? 'Threads' :
                           filter === 'product' ? 'Products' : 'Businesses'}
                        </button>
                      ))}
                    </div>

                    {filteredItems.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map((item) => (
                          <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                            <div className="relative h-48 bg-gradient-to-br from-neutral-50 to-neutral-100">
                              {getImageUrl(item.image) ? (
                                <img src={getImageUrl(item.image)} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                  {item.type === 'thread' ? <MessageCircle className="w-16 h-16" /> : 
                                   item.type === 'business' ? <Building2 className="w-16 h-16" /> :
                                   <FileText className="w-16 h-16" />}
                                </div>
                              )}
                              <div className="absolute top-3 left-3">
                                <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm ${
                                  item.type === 'product' ? 'bg-blue-600/90 text-white' :
                                  item.type === 'thread' ? 'bg-purple-600/90 text-white' :
                                  item.type === 'business' ? 'bg-orange-600/90 text-white' :
                                  'bg-green-600/90 text-white'
                                }`}>
                                  {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                                </span>
                              </div>
                              <button
                                onClick={() => onRemoveSavedItem?.(item.id)}
                                className="absolute top-3 right-3 p-2 bg-white/95 backdrop-blur-sm rounded-full shadow-lg hover:bg-red-50 transition-all duration-200 group/btn"
                                title="Remove from saved"
                              >
                                <Bookmark className="w-5 h-5 text-red-500 fill-current group-hover/btn:scale-110 transition-transform" />
                              </button>
                            </div>
                            <div className="p-5">
                              <h3 className="font-bold text-neutral-900 mb-2 line-clamp-2 group-hover:text-green-600 transition-colors text-lg">
                                {item.title || 'Untitled'}
                              </h3>
                              <p className="text-neutral-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                                {item.description || 'No description'}
                              </p>
                              <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <span className="text-xs font-medium text-neutral-500">
                                    {new Date(item.savedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                  </span>
                                </div>
                                <button 
                                  className="text-xs font-semibold text-green-600 hover:text-green-700 hover:underline transition-colors"
                                  onClick={() => {
                                    // Navigate to item based on type
                                    if (item.type === 'post' && item.itemId) {
                                      void (async () => {
                                        try {
                                          const post = await fetchPostById(item.itemId);
                                          setSelectedPost({
                                            id: post.id,
                                            image: post.image || '',
                                            title: post.title || 'Untitled',
                                            content: post.content || '',
                                            likes: post.likes ?? 0,
                                            comments: [],
                                            timeAgo: formatTimeAgo(post.timestamp),
                                            authorName: post.author?.name ?? 'Unknown',
                                            authorAvatar: post.author?.avatar ?? '',
                                          });
                                        } catch (err) {
                                          console.error('[BusinessProfileView] fetchPostById failed:', err);
                                        }
                                      })();
                                      return;
                                    }

                                    if (item.type === 'thread' && item.itemId) {
                                      void (async () => {
                                        try {
                                          const thread = await fetchThreadById(item.itemId);
                                          setSelectedThread({
                                            id: thread.id,
                                            title: thread.title || '',
                                            content: thread.content || '',
                                            likes: thread.likes ?? 0,
                                            isLiked: thread.isLiked ?? false,
                                            commentsCount: thread.commentsCount ?? 0,
                                            shares: thread.shares ?? 0,
                                            timeAgo: formatTimeAgo(thread.timestamp),
                                            timestamp: thread.timestamp,
                                            tags: thread.tags ?? [],
                                            author: {
                                              id: thread.author?.id ?? '',
                                              name: thread.author?.name ?? 'Unknown',
                                              avatar: thread.author?.avatar ?? '',
                                            },
                                          });
                                        } catch (err) {
                                          console.error('[BusinessProfileView] fetchThreadById failed:', err);
                                        }
                                      })();
                                      return;
                                    }

                                    if (item.type === 'product' && item.itemId && onNavigateWithParams) {
                                      // Reuse the same dashboard/product highlighting behavior as product cards.
                                      onNavigateWithParams('dashboard', { productId: item.itemId });
                                      return;
                                    }

                                    if (item.type === 'business' && item.itemId && onNavigateWithParams) {
                                      // Navigate to the business/profile that owns this saved item.
                                      onNavigateWithParams('user-profile', { userId: item.itemId });
                                      return;
                                    }
                                  }}
                                >
                                  View Details →
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-24 bg-gradient-to-br from-neutral-50 to-white rounded-2xl border-2 border-dashed border-neutral-200">
                        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Bookmark className="w-10 h-10 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-neutral-900 mb-2">No saved items found</h3>
                        <p className="text-neutral-500 max-w-sm mx-auto leading-relaxed">
                          {savedItemsFilter === 'all' 
                            ? 'Items you save will appear here for easy access.' 
                            : `You haven't saved any ${savedItemsFilter === 'business' ? 'businesses' : savedItemsFilter + 's'} yet.`}
                        </p>
                        {savedItemsFilter !== 'all' && (
                          <button 
                            onClick={() => setSavedItemsFilter('all')}
                            className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                          >
                            View All Items
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          onLike={() => handleLikePost(selectedPost.id)}
          onComment={(text, parentId) => handleCommentPost(selectedPost.id, text, parentId)}
          onDeleteComment={handleDeletePostComment}
          onEditComment={handleEditPostComment}
          onLikeComment={handleLikePostComment}
          onShare={() => handleSharePost(selectedPost.id)}
          onSave={() => handleSavePost(selectedPost.id)}
          onNavigateToBusiness={(businessId) => onNavigateWithParams?.('user-profile', { userId: businessId })}
          onNavigateToUserProfile={(userId) => onNavigateWithParams?.('user-profile', { userId })}
          isLiked={selectedPost.isLiked ?? likedPosts.has(selectedPost.id)}
          isSaved={!!savedItems.find((s: any) => s.type === 'post' && (s.itemId === selectedPost.id || s.refId === selectedPost.id))}
        />
      )}

      {selectedThread && (
        <ThreadModal
          thread={{
            id: selectedThread.id,
            title: selectedThread.title,
            content: selectedThread.content || '',
            tags: selectedThread.tags || [],
            likes: selectedThread.likes ?? 0,
            isLiked: selectedThread.isLiked ?? false,
            commentsCount: selectedThread.commentsCount ?? 0,
            shares: selectedThread.shares ?? 0,
            timeAgo: selectedThread.timeAgo,
            timestamp: selectedThread.timestamp,
            author: selectedThread.author,
          }}
          comments={threadComments[selectedThread.id] ?? []}
          isOpen={!!selectedThread}
          onClose={() => setSelectedThread(null)}
          onLike={handleThreadLike}
          onComment={handleThreadComment}
          onLikeComment={handleThreadLikeComment}
          onDeleteComment={handleDeleteThreadComment}
          onEditComment={handleEditThreadComment}
          onNavigateToBusiness={(businessId) => onNavigateWithParams?.('user-profile', { userId: businessId })}
          onNavigateToUserProfile={(userId) => onNavigateWithParams?.('user-profile', { userId })}
          onSave={onRemoveSavedItem ? handleThreadSave : undefined}
          onShare={handleThreadShare}
          isLiked={selectedThread.isLiked ?? false}
          isSaved={!!savedItems.find((s: any) => s.type === 'thread' && (s.itemId === selectedThread.id || s.refId === selectedThread.id))}
        />
      )}

      {showEditPostModal && postToEdit && (
        <EditPostModal
          post={postToEdit}
          isOpen={showEditPostModal}
          onClose={() => {
            setShowEditPostModal(false);
            setPostToEdit(null);
          }}
          onSave={(postId, updatedData) => {
            if (onUpdatePost) {
              onUpdatePost(postId, updatedData);
            }
            setShowEditPostModal(false);
            setPostToEdit(null);
          }}
        />
      )}
      {showEditThreadModal && threadToEdit && (
        <EditThreadModal
          thread={threadToEdit}
          isOpen={showEditThreadModal}
          onClose={() => {
            setShowEditThreadModal(false);
            setThreadToEdit(null);
          }}
          onSave={(threadId, updatedData) => {
            if (onUpdateThread) {
              onUpdateThread(threadId, updatedData);
            }
            setShowEditThreadModal(false);
            setThreadToEdit(null);
          }}
        />
      )}
      {showDeleteModal && deleteTarget && (
        <DeleteConfirmationModal
          type={deleteTarget.type}
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
          onConfirm={() => {
            if (deleteTarget.type === 'post' && onDeletePost) {
              onDeletePost(deleteTarget.id, undefined);
            } else if (deleteTarget.type === 'thread' && onDeleteThread) {
              onDeleteThread(deleteTarget.id, undefined);
            }
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
        />
      )}

      {/* Switch User Modal */}
      {showSwitchUserModal && (
        <SwitchUserModal onClose={() => setShowSwitchUserModal(false)} />
      )}
    </div>
  );
}