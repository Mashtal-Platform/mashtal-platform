import React, { useState, useRef } from 'react';
import { 
  User, Mail, Phone, MapPin, Settings, X, Save, MoreVertical, 
  Edit2, Trash2, Camera, Heart, MessageCircle, Bookmark, 
  Calendar, Briefcase, Award, Globe, CheckCircle, Send, FileText,
  MoreHorizontal, ShoppingBag, Users, Archive, Leaf, HardHat, Building2, Shield,
  ExternalLink, ThumbsUp, Reply as ReplyIcon, CheckCircle2, LogOut, RefreshCw
} from 'lucide-react';
import { UserProfile, Page, SavedItem } from '../App';
import { useAuth } from '../contexts/AuthContext';
import { UserEditProfile } from '../components/UserEditProfile';
import { EngineerEditProfile } from '../components/EngineerEditProfile';
import { BusinessProfileView } from '../components/BusinessProfileView';
import { Button } from '../components/ui/button';
import { PostModal } from '../components/PostModal';
import { getTotalCommentCount, mockComments } from '../data/centralMockData';
import { mockPurchases, getPurchaseStats } from '../data/purchaseData';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../components/ui/dropdown-menu';
import { EditPostModal } from '../components/EditPostModal';
import { EditThreadModal } from '../components/EditThreadModal';
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal';
import { Textarea } from '../components/ui/textarea';
import { VerifiedBadge } from '../components/VerifiedBadge';
import { SwitchUserModal } from '../components/SwitchUserModal';

// Thread comment types
interface Reply {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    verified: boolean;
    type: 'engineer' | 'business' | 'user';
    businessId?: string;
  };
  content: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  edited?: boolean;
}

interface Comment {
  id: string;
  author: {
    id?: string;
    name: string;
    avatar: string;
    verified: boolean;
    type: 'engineer' | 'business' | 'user';
    businessId?: string;
  };
  content: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  replies: Reply[];
  edited?: boolean;
}

interface ProfilePageProps {
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  onNavigate: (page: Page) => void;
  onNavigateToDashboard?: (targetSection?: 'analytics' | 'products') => void;
  userPosts?: any[];
  userThreads?: any[];
  savedItems?: SavedItem[];
  onDeletePost?: (postId: string) => void;
  onUpdatePost?: (postId: string, updatedData: any) => void;
  onDeleteThread?: (threadId: string) => void;
  onUpdateThread?: (threadId: string) => void;
  followingCount?: number;
  followersCount?: number;
  followedEntities?: any[];
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  onRemoveSavedItem?: (itemId: string) => void;
  onNavigateWithParams?: (page: string, params?: any) => void;
}

export function ProfilePage({ 
  userProfile, 
  onUpdateProfile, 
  onNavigate,
  onNavigateToDashboard,
  userPosts = [], 
  userThreads = [],
  savedItems = [],
  onDeletePost, 
  onUpdatePost,
  onDeleteThread,
  onUpdateThread,
  followingCount = 0,
  followersCount = 0,
  followedEntities = [],
  onNavigateToBusiness,
  onNavigateToUserProfile,
  onRemoveSavedItem,
  onNavigateWithParams
}: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'posts' | 'threads' | 'about' | 'saved'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(userProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editedPostData, setEditedPostData] = useState<any>({});
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [showSwitchUserModal, setShowSwitchUserModal] = useState(false);

  // Edit and Delete Modals State
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [postToEdit, setPostToEdit] = useState<any | null>(null);
  const [showEditThreadModal, setShowEditThreadModal] = useState(false);
  const [threadToEdit, setThreadToEdit] = useState<any | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'post' | 'thread'; id: string } | null>(null);

  // New section states
  const [expandedSection, setExpandedSection] = useState<'purchases' | 'following' | null>(null);
  const [savedFilter, setSavedFilter] = useState<'all' | 'post' | 'thread' | 'product'>('all');

  // Determine user role (default to visitor if not set)
  const userRole = userProfile.role || 'visitor';

  // Check if viewing own profile
  const isOwnProfile = user?.id === userProfile.id;

  const handleLogout = async () => {
    await signOut();
    onNavigate('home');
  };

  // Role-based hero banner
  const getBannerImage = () => {
    if (userRole === 'engineer') {
      return "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=1200";
    }
    if (userRole === 'business') {
      return "https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?w=1200";
    }
    return "https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1200";
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAvatar = reader.result as string;
        setEditedProfile({ ...editedProfile, avatar: newAvatar });
        onUpdateProfile({ ...userProfile, avatar: newAvatar });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDeletePost = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({ type: 'post', id: postId });
    setShowDeleteModal(true);
  };

  const handleEditPost = (post: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setPostToEdit(post);
    setShowEditPostModal(true);
  };

  const handleSavePostEdit = (postId: string, updatedData: any) => {
    if (onUpdatePost) {
      onUpdatePost(postId, updatedData);
    }
    setShowEditPostModal(false);
    setPostToEdit(null);
  };

  const handleEditThread = (thread: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setThreadToEdit(thread);
    setShowEditThreadModal(true);
  };

  const handleDeleteThread = (threadId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteTarget({ type: 'thread', id: threadId });
    setShowDeleteModal(true);
  };

  const handleSaveThreadEdit = (threadId: string, updatedData: any) => {
    if (onUpdateThread) {
      onUpdateThread(threadId, updatedData);
    }
    setShowEditThreadModal(false);
    setThreadToEdit(null);
  };

  const handlePostClick = (post: any) => {
    // Navigate to posts page with this post highlighted
    if (onNavigateWithParams) {
      onNavigateWithParams('posts', { highlightPostId: post.id });
    } else {
      setSelectedPost({
        ...post,
        authorName: userProfile.fullName,
        authorAvatar: userProfile.avatar,
        authorVerified: userRole === 'engineer' || userRole === 'business',
        comments: post.comments || []
      });
    }
  };

  const handleThreadClick = (thread: any) => {
    // Navigate to threads page with this thread highlighted
    if (onNavigateWithParams) {
      onNavigateWithParams('threads', { highlightThreadId: thread.id });
    } else {
      onNavigate('threads');
    }
  };

  const handleLikePost = (postId: string) => {
    setLikedPosts((prev) => {
      const newLiked = new Set(prev);
      if (newLiked.has(postId)) {
        newLiked.delete(postId);
      } else {
        newLiked.add(postId);
      }
      return newLiked;
    });
    
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost({
        ...selectedPost,
        likes: selectedPost.likes + (likedPosts.has(postId) ? -1 : 1),
      });
    }
  };

  const getFilteredSavedItems = () => {
    if (savedFilter === 'all') return savedItems;
    return savedItems.filter(item => item.type === savedFilter);
  };

  if (isEditing) {
    if (userRole === 'engineer') {
      return (
        <EngineerEditProfile
          profile={userProfile}
          onSave={(profile) => {
            onUpdateProfile(profile);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      );
    } else {
      return (
        <UserEditProfile
          profile={userProfile}
          onSave={(profile) => {
            onUpdateProfile(profile);
            setIsEditing(false);
          }}
          onCancel={() => setIsEditing(false)}
        />
      );
    }
  }

  // If user is a business, show business profile view
  if (userRole === 'business') {
    return (
      <BusinessProfileView
  userProfile={userProfile}
  userPosts={userPosts}
  userThreads={userThreads}
  isOwnProfile={true}
  onEditProfile={() => setIsEditing(true)}
  onPostClick={handlePostClick}
  onThreadClick={handleThreadClick}
  onDeletePost={onDeletePost}
  onEditPost={handleEditPost}
  onDeleteThread={onDeleteThread}
  onEditThread={handleEditThread}
  onAvatarChange={handleAvatarChange}
  avatarFileInputRef={fileInputRef}
  onNavigate={onNavigate}
  onNavigateToDashboard={onNavigateToDashboard}
  savedItems={savedItems}
  onRemoveSavedItem={onRemoveSavedItem}
  onNavigateWithParams={onNavigateWithParams}
/>

    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Hero Banner */}
      <div className="relative h-80 bg-gradient-to-r from-green-600 to-green-700">
        <img
          src={getBannerImage()}
          alt="Profile Banner"
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
                  className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg overflow-hidden cursor-pointer group bg-neutral-100"
                  onClick={handleAvatarClick}
                >
                  {userProfile.avatar ? (
                    <img
                      src={userProfile.avatar}
                      alt={userProfile.fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-green-50">
                      <User className="w-16 h-16 text-green-600" />
                    </div>
                  )}
                  {/* Circular Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 rounded-full">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {/* Role Icon Badge */}
                {userRole && userRole !== 'visitor' && (
                  <div className="absolute bottom-1 right-1 p-1.5 rounded-full border-2 border-white shadow-md z-10 bg-white">
                    {userRole === 'business' && <Building2 className="w-4 h-4 text-blue-600" />}
                    {userRole === 'agronomist' && <Leaf className="w-4 h-4 text-green-600" />}
                    {userRole === 'engineer' && <HardHat className="w-4 h-4 text-orange-600" />}
                    {userRole === 'admin' && <Shield className="w-4 h-4 text-purple-600" />}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <h1 className="text-3xl font-bold text-neutral-900">{userProfile.fullName}</h1>
                      {userRole === 'agronomist' && (
                        <span className="bg-green-100 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-green-200 flex items-center gap-1">
                          <Leaf className="w-3 h-3" />
                          Verified Agronomist
                        </span>
                      )}
                      {userRole === 'engineer' && (
                        <span className="bg-orange-100 text-orange-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-orange-200 flex items-center gap-1">
                          <HardHat className="w-3 h-3" />
                          Verified Engineer
                        </span>
                      )}
                      {userRole=== 'business' && (
                        <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Verified Business
                        </span>
                      )}
                      {userRole === 'admin' && (
                        <span className="bg-purple-100 text-purple-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-purple-200 flex items-center gap-1">
                          <Shield className="w-3 h-3" />
                          Administrator
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4 text-neutral-600 mb-4">
                      {userProfile.specialization && (
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-4 h-4 text-neutral-400" />
                          <span>{userProfile.specialization}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-neutral-400" />
                        <span>{userProfile.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-neutral-400" />
                        <span>Joined recently</span>
                      </div>
                    </div>
                    
                    <p className="text-neutral-700 max-w-2xl leading-relaxed">{userProfile.bio}</p>
                  </div>

                  {/* Action Button */}
                  <div className="flex gap-2 min-w-[160px]">
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </Button>
                  
                  </div>
                </div>

                {/* Stats Section */}
                <div className="grid grid-cols-3 gap-8 mt-8 pt-6 border-t border-neutral-100">
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{userPosts.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Posts</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{userThreads.length}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Threads</div>
                  </div>
                  <div className="text-center md:text-left">
                    <div className="text-2xl font-bold text-neutral-900">{followingCount}</div>
                    <div className="text-xs text-neutral-500 font-bold uppercase tracking-widest">Following</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NEW SECTION: Purchases, Following, Followers & Saved Items */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Purchased Products Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
            <button
              onClick={() => setExpandedSection(expandedSection === 'purchases' ? null : 'purchases')}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <ShoppingBag className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-900">Purchases</h3>
                  <p className="text-sm text-neutral-500">{getPurchaseStats(mockPurchases).totalOrders} {getPurchaseStats(mockPurchases).totalOrders === 1 ? 'order' : 'orders'}</p>
                </div>
              </div>
              <div className="text-neutral-400">
                {expandedSection === 'purchases' ? '−' : '+'}
              </div>
            </button>
            
            {expandedSection === 'purchases' && (
              <div className="border-t border-neutral-200 p-4 bg-neutral-50 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Show first 5 purchases from centralized data */}
                {mockPurchases.slice(0, 5).map((purchase) => (
                  <div 
                    key={purchase.id} 
                    onClick={() => onNavigateToBusiness && onNavigateToBusiness(purchase.businessId)}
                    className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer border border-neutral-100 group"
                  >
                    <img src={purchase.image} alt={purchase.name} className="w-14 h-14 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-neutral-900 truncate group-hover:text-green-600 transition-colors">{purchase.name}</h4>
                      <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                        <span className="font-bold text-green-600">${purchase.price.toFixed(2)}</span>
                        <span>{new Date(purchase.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-green-600 hover:text-green-700 font-bold mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('purchase-history');
                  }}
                >
                  Manage Purchase History
                </Button>
              </div>
            )}
          </div>

          {/* Following Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow">
            <button
              onClick={() => setExpandedSection(expandedSection === 'following' ? null : 'following')}
              className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-900">Following</h3>
                  <p className="text-sm text-neutral-500">{followingCount} accounts</p>
                </div>
              </div>
              <div className="text-neutral-400">
                {expandedSection === 'following' ? '−' : '+'}
              </div>
            </button>
            
            {expandedSection === 'following' && (
              <div className="border-t border-neutral-200 p-4 bg-neutral-50 space-y-3 max-h-[400px] overflow-y-auto">
                {/* Real following list from App state */}
                {followedEntities.length > 0 ? (
                  followedEntities.map((account) => (
                    <div 
                      key={account.id} 
                      onClick={() => {
                        if (account.role === 'business' && onNavigateToBusiness) {
                          onNavigateToBusiness(account.id);
                        } else if (onNavigateToUserProfile) {
                          onNavigateToUserProfile(account.id);
                        }
                      }}
                      className="flex items-center gap-3 p-3 bg-white rounded-lg hover:shadow-sm transition-shadow cursor-pointer border border-neutral-100 group"
                    >
                      <div className="relative">
                        <img src={account.image || account.avatar} alt={account.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-sm">
                          {account.role === 'business' && <Building2 className="w-3.5 h-3.5 text-blue-600" />}
                          {account.role === 'agronomist' && <Leaf className="w-3.5 h-3.5 text-green-600" />}
                          {account.role === 'engineer' && <HardHat className="w-3.5 h-3.5 text-orange-600" />}
                          {account.role === 'admin' && <Shield className="w-3.5 h-3.5 text-purple-600" />}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm text-neutral-900 truncate group-hover:text-green-600 transition-colors">{account.name}</h4>
                        <p className="text-xs text-neutral-500 capitalize">{account.role}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500">Not following anyone yet</p>
                  </div>
                )}
                <Button 
                  variant="ghost" 
                  className="w-full text-xs text-green-600 hover:text-green-700 font-bold mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate('following');
                  }}
                >
                  Manage Following
                </Button>
              </div>
            )}
          </div>

          {/* Followers Card - Only for Engineer/Agronomist/Business */}
          {(userRole === 'engineer' || userRole === 'agronomist' || userRole === 'business') && (
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                 onClick={() => onNavigate('followers')}
            >
              <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                    <Heart className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-neutral-900">Followers</h3>
                    <p className="text-sm text-neutral-500">{followersCount} followers</p>
                  </div>
                </div>
                <div className="text-neutral-400">
                  <ExternalLink className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {/* Saved Items Card - Acts as shortcut to Saved Tab */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
               onClick={() => {
                 setActiveTab('saved');
                 document.getElementById('profile-content-tabs')?.scrollIntoView({ behavior: 'smooth' });
               }}
          >
            <div className="w-full p-6 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg">
                  <Bookmark className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-neutral-900">Saved</h3>
                  <p className="text-sm text-neutral-500">{savedItems.length} items</p>
                </div>
              </div>
              <div className="text-neutral-400">
                <ExternalLink className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs Section */}
        <div className="mt-8 mb-16" id="profile-content-tabs">
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Tab Navigation */}
            <div className="border-b border-neutral-200 px-2 overflow-x-auto">
              <div className="flex min-w-max">
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
                  onClick={() => setActiveTab('saved')}
                  className={`relative px-8 py-5 text-sm font-semibold transition-all ${
                    activeTab === 'saved' ? 'text-green-600' : 'text-neutral-500 hover:text-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Bookmark className="w-4 h-4" />
                    <span>Saved</span>
                  </div>
                  {activeTab === 'saved' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-600 rounded-t-full" />}
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
              {activeTab === 'posts' && (
                <div>
                  {userPosts.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {userPosts.map((post) => (
                        <div
                          key={post.id}
                          id={`post-${post.id}`}
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
                              <span>{getTotalCommentCount(post.id)}</span>
                            </div>
                          </div>
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 bg-white/90 rounded-full text-neutral-900 hover:bg-white transition-colors shadow-lg backdrop-blur-sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem onClick={(e) => handleEditPost(post, e)} className="cursor-pointer gap-2">
                                  <Edit2 className="w-4 h-4" />
                                  <span>Edit Post</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleDeletePost(post.id, e)} className="cursor-pointer gap-2 text-red-600 focus:text-red-600">
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Camera className="w-10 h-10 text-neutral-300" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">No posts yet</h3>
                      <p className="text-neutral-600">Share your agricultural journey with the community.</p>
                      <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">Create First Post</Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'threads' && (
                <div className="space-y-4 max-w-3xl mx-auto">
                  {userThreads.length > 0 ? (
                    userThreads.map((thread) => (
                      <div 
                        key={thread.id} 
                        className="group border border-neutral-200 rounded-xl p-6 hover:border-green-200 hover:shadow-md transition-all bg-white relative cursor-pointer"
                        onClick={() => handleThreadClick(thread)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center overflow-hidden border border-neutral-100">
                                {userProfile.avatar ? (
                                  <img src={userProfile.avatar} alt={userProfile.fullName} className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-green-600" />
                                )}
                              </div>
                              <div>
                                <h4 className="font-bold text-neutral-900 text-sm leading-tight">{userProfile.fullName}</h4>
                                <p className="text-[10px] text-neutral-400 font-medium uppercase tracking-tight">{thread.timeAgo}</p>
                              </div>
                            </div>
                            
                            <h3 className="text-lg font-bold text-neutral-900 mb-2 leading-snug group-hover:text-green-600 transition-colors">
                              {thread.title}
                            </h3>
                            <p className="text-neutral-700 mb-4 line-clamp-3 leading-relaxed text-sm">{thread.content}</p>
                            
                            <div className="flex items-center gap-6 text-sm text-neutral-400">
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-red-500 transition-colors">
                                <Heart className="w-4 h-4 group-hover/btn:fill-current" />
                                <span className="font-medium">{thread.likes}</span>
                              </div>
                              <div className="flex items-center gap-1.5 group/btn cursor-pointer hover:text-green-600 transition-colors">
                                <MessageCircle className="w-4 h-4" />
                                <span className="font-medium">{thread.comments}</span>
                              </div>
                            </div>
                          </div>

                          <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-2 hover:bg-neutral-100 rounded-lg transition-colors text-neutral-400">
                                  <MoreHorizontal className="w-5 h-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={(e) => handleEditThread(thread, e)} className="cursor-pointer gap-2">
                                  <Edit2 className="w-4 h-4" />
                                  <span>Edit Thread</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="cursor-pointer gap-2 text-red-600 focus:text-red-600" onClick={(e) => handleDeleteThread(thread.id, e)}>
                                  <Trash2 className="w-4 h-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-20 bg-neutral-50 rounded-xl border-2 border-dashed border-neutral-200">
                      <div className="bg-neutral-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <MessageCircle className="w-10 h-10 text-neutral-300" />
                      </div>
                      <h3 className="text-xl font-bold text-neutral-900 mb-2">No discussions yet</h3>
                      <p className="text-neutral-600">Start a discussion to connect with other farmers.</p>
                      <Button className="mt-6 bg-green-600 hover:bg-green-700 text-white">Start Discussion</Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'saved' && (
                <div className="p-6">
                  {/* Saved Items Filter */}
                  <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {(['all', 'post', 'thread', 'product'] as const).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => setSavedFilter(filter)}
                        className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
                          savedFilter === filter
                            ? 'bg-green-600 text-white shadow-md shadow-green-200'
                            : 'bg-white text-neutral-600 hover:bg-green-50 hover:text-green-600 border border-neutral-200'
                        }`}
                      >
                        {filter === 'all' ? 'All Items' : 
                         filter === 'post' ? 'Posts' : 
                         filter === 'thread' ? 'Threads' : 'Products'}
                      </button>
                    ))}
                  </div>

                  {getFilteredSavedItems().length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {getFilteredSavedItems().map((item) => (
                        <div key={item.id} className="bg-white border border-neutral-200 rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
                          <div className="relative h-48 bg-gradient-to-br from-neutral-50 to-neutral-100">
                            {item.image ? (
                              <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-neutral-300">
                                {item.type === 'thread' ? <MessageCircle className="w-16 h-16" /> : <FileText className="w-16 h-16" />}
                              </div>
                            )}
                            <div className="absolute top-3 left-3">
                              <span className={`px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg backdrop-blur-sm ${
                                item.type === 'product' ? 'bg-blue-600/90 text-white' :
                                item.type === 'thread' ? 'bg-purple-600/90 text-white' :
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
                              {item.title}
                            </h3>
                            <p className="text-neutral-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                              {item.description}
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
                                  if (item.type === 'product' && (item as any).businessId && onNavigateToBusiness) {
                                    // Navigate to business page and scroll to products
                                    onNavigateToBusiness((item as any).businessId);
                                    // Scroll to products tab after navigation
                                    setTimeout(() => {
                                      const productsTab = document.querySelector('[data-tab="products"]');
                                      if (productsTab) {
                                        (productsTab as HTMLElement).click();
                                      }
                                      // Then scroll to the specific product
                                      setTimeout(() => {
                                        const productElement = document.getElementById(`product-${item.itemId}`);
                                        if (productElement) {
                                          productElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                          productElement.classList.add('ring-4', 'ring-green-500');
                                          setTimeout(() => {
                                            productElement.classList.remove('ring-4', 'ring-green-500');
                                          }, 2000);
                                        }
                                      }, 300);
                                    }, 100);
                                  } else if (item.type === 'post' && item.itemId) {
                                    // Navigate to posts page
                                    onNavigate('posts');
                                  } else if (item.type === 'thread' && item.itemId) {
                                    // Navigate to threads page
                                    onNavigate('threads');
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
                        {savedFilter === 'all' 
                          ? 'Items you save will appear here for easy access.' 
                          : `You haven't saved any ${savedFilter}s yet.`}
                      </p>
                      {savedFilter !== 'all' && (
                        <button 
                          onClick={() => setSavedFilter('all')}
                          className="mt-6 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                          View All Items
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div className="space-y-10">
                  <section>
                    <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                      <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                      About
                    </h3>
                    <p className="text-neutral-700 leading-relaxed bg-neutral-50 p-6 rounded-xl border border-neutral-100 text-sm">
                      {userProfile.bio}
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
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Location</div>
                          <div className="text-neutral-900 font-semibold">{userProfile.location}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Calendar className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Joined</div>
                          <div className="text-neutral-900 font-semibold">Joined recently</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Mail className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Email</div>
                          <div className="text-neutral-900 font-semibold">{userProfile.email}</div>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div className="p-2.5 bg-white rounded-lg shadow-sm">
                          <Phone className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-1">Phone</div>
                          <div className="text-neutral-900 font-semibold">{userProfile.phone}</div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {userProfile.customFields && userProfile.customFields.length > 0 && (
                    <section>
                      <h3 className="text-lg font-bold text-neutral-900 mb-6 flex items-center gap-2">
                        <div className="w-1.5 h-6 bg-green-600 rounded-full" />
                        Additional Details
                      </h3>
                      <div className="space-y-4">
                        {userProfile.customFields.map((field) => (
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Switch User Modal */}
      {showSwitchUserModal && (
        <SwitchUserModal onClose={() => setShowSwitchUserModal(false)} />
      )}

      {/* Post Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {/* Edit Post Modal */}
      {showEditPostModal && postToEdit && (
        <EditPostModal
          post={postToEdit}
          isOpen={showEditPostModal}
          onClose={() => {
            setShowEditPostModal(false);
            setPostToEdit(null);
          }}
          onSave={handleSavePostEdit}
        />
      )}

      {/* Edit Thread Modal */}
      {showEditThreadModal && threadToEdit && (
        <EditThreadModal
          thread={threadToEdit}
          isOpen={showEditThreadModal}
          onClose={() => {
            setShowEditThreadModal(false);
            setThreadToEdit(null);
          }}
          onSave={handleSaveThreadEdit}
        />
      )}

      {/* Delete Confirmation Modal */}
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
              onDeletePost(deleteTarget.id);
            } else if (deleteTarget.type === 'thread' && onDeleteThread) {
              onDeleteThread(deleteTarget.id);
            }
            setShowDeleteModal(false);
            setDeleteTarget(null);
          }}
        />
      )}
    </div>
  );
}