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
import {
  currentUser as mockCurrentUser,
  otherUsers as mockOtherUsers,
  mockPosts as centralPosts,
  mockThreads as centralThreads,
} from "../data/centralMockData";
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

interface UserProfilePageProps {
  userId: string | null;
  onOpenChat: (userId: string) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onNavigate?: (page: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
  userThreads?: any[];
  followedEntities: any[];
  onFollow: (entity: any) => void;
  onUnfollow: (entityId: string) => void;
  highlightPostId?: string; // Post ID to auto-open
  highlightCommentId?: string; // Comment ID to auto-scroll to
  highlightThreadId?: string; // Thread ID to auto-open
}

export function UserProfilePage({
  userId,
  onOpenChat,
  onNavigateToBusiness,
  onNavigateToUserProfile,
  onNavigate,
  onNavigateWithParams,
  userThreads = [],
  followedEntities,
  onFollow,
  onUnfollow,
  highlightPostId,
  highlightCommentId,
  highlightThreadId,
}: UserProfilePageProps) {
  const { user: currentUser, isAuthenticated, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<
    "posts" | "threads" | "about"
  >("posts");
  const [selectedPost, setSelectedPost] = useState<any | null>(
    null,
  );
  const [likedPosts, setLikedPosts] = useState<Set<string>>(
    new Set(),
  );
  const [savedPosts, setSavedPosts] = useState<Set<string>>(
    new Set(),
  );
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);

  const handleLogout = async () => {
    await signOut();
    if (onNavigate) {
      onNavigate('home');
    }
  };

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

  // Find the user by ID
  const user =
    [...mockOtherUsers, mockCurrentUser].find(
      (u) => u.id === userId,
    ) ||
    mockOtherUsers.find((u) => u.role === "user") ||
    mockCurrentUser;

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId;

  // Check if following
  const isFollowing = followedEntities.some(
    (e) => e.id === user?.id,
  );

  // Get posts for this specific user from centralized data
  const userPosts = userId
    ? centralPosts
        .filter((p) => p.authorId === userId)
        .map((post) => ({
          ...post,
          comments: [], // Managed by PostModal
        }))
    : [];

  // Get threads for this user (filter from userThreads prop)
  const filteredUserThreads = centralThreads.filter(
    (thread) => thread.authorId === userId,
  );

  // Auto-open post when highlightPostId is provided
  useEffect(() => {
    if (highlightPostId) {
      const postToOpen = userPosts.find(
        (post) => post.id === highlightPostId,
      );
      if (postToOpen) {
        setActiveTab("posts");
        handlePostClick(postToOpen);
      }
    }
  }, [highlightPostId]);

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

  if (!user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <p className="text-neutral-600">User not found</p>
      </div>
    );
  }

  const handleLikePost = (postId: string) => {
    if (!isAuthenticated) return;

    setLikedPosts((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });
  };

  const handleSavePost = (postId: string) => {
    if (!isAuthenticated) return;

    setSavedPosts((prev) => {
      const newSaved = new Set(prev);
      if (newSaved.has(postId)) {
        newSaved.delete(postId);
      } else {
        newSaved.add(postId);
      }
      return newSaved;
    });
  };

  const handlePostClick = (post: any) => {
    // Navigate to posts page with this post highlighted
    if (onNavigateWithParams) {
      onNavigateWithParams('posts', { highlightPostId: post.id });
    } else {
      // Fallback to modal if navigation not available
      setSelectedPost({
        ...post,
        authorName: user.fullName,
        authorAvatar: user.avatar,
        authorVerified: user.verified,
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src={user.avatar}
          alt={user.fullName}
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
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-neutral-900 mb-2">
                      {user.fullName}
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-3">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{user.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>Joined {user.joinDate}</span>
                      </div>
                    </div>
                    <p className="text-neutral-700 max-w-2xl leading-relaxed">
                      {user.bio}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 min-w-[200px]">
                    {isOwnProfile && onNavigate ? (
                      <>
                        <Button
                          onClick={() => onNavigate("profile")}
                          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                        >
                          <Edit className="w-5 h-5" />
                          <span>Edit Profile</span>
                        </Button>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-neutral-100">
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
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">
                      {user.following || 8}
                    </div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">
                      Following
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
                            src={post.image}
                            alt={post.title}
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
                        onClick={() => onNavigate('threads', { highlightThreadId: thread.id })}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border border-neutral-100">
                                <img
                                  src={user.avatar}
                                  alt=""
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <h4 className="font-bold text-neutral-900 text-sm leading-tight">
                                  {user.name}
                                </h4>
                                <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">
                                  {thread.timeAgo}
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
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-red-500 transition-colors">
                                <Heart className="w-4 h-4 group-hover/btn:fill-current" />
                                <span className="font-medium">
                                  {thread.likes || 0}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-green-600 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">
                                  {thread.comments || 0}
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
                      {user.bio}
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
                            {user.location}
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
                            {user.joinDate}
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
          onComment={(text) => console.log("comment", text)}
          onShare={() => console.log("share")}
          onSave={() => handleSavePost(selectedPost.id)}
          isLiked={likedPosts.has(selectedPost.id)}
          isSaved={savedPosts.has(selectedPost.id)}
          highlightCommentId={highlightCommentId}
        />
      )}

      {/* Switch User Modal */}
      {showSwitchUserModal && (
        <SwitchUserModal onClose={() => setShowSwitchUserModal(false)} />
      )}
    </div>
  );
}