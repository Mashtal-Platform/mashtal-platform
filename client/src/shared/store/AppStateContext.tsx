import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { 
  Page, 
  CartItem, 
  SavedItem, 
  UserProfile,
  UserRole,
  Notification 
} from '../types';
import { 
  currentUser as mockCurrentUser, 
  otherUsers as mockOtherUsers,
  mockPosts as centralPosts,
  mockThreads as centralThreads,
  mockNotifications as centralNotifications
} from '../api/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { 
  addItemToCart, 
  updateCartQuantity, 
  removeCartItem 
} from '../utils/cart';
import { scrollToTop, initialNavigationState, NavigationState } from '../utils/navigation';

interface AppState extends NavigationState {
  // Cart
  cartItems: CartItem[];
  // Saved items
  savedItems: SavedItem[];
  // User content
  userPosts: any[];
  userThreads: any[];
  // Profile
  userProfile: UserProfile;
  // Following/Followers
  followedEntities: any[];
  followers: any[];
  // Notifications
  notifications: Notification[];
  // UI state
  showAIChat: boolean;
  showPostSuccess: boolean;
  showThreadSuccess: boolean;
  shouldScrollToPosts: boolean;
  shouldScrollToThreads: boolean;
  paymentRole: UserRole | null;
}

interface AppStateContextType {
  state: AppState;
  // Navigation
  navigate: (page: Page) => void;
  navigateWithParams: (page: string, params?: any) => void;
  navigateToBusiness: (businessId: string) => void;
  navigateToUserProfile: (userId: string) => void;
  navigateToChat: (profileId: string) => void;
  // Cart
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>) => void;
  updateCartItemQuantity: (itemId: string, quantity: number) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  // Saved items
  addSavedItem: (item: SavedItem) => void;
  removeSavedItem: (itemId: string) => void;
  // User content
  createPost: (postData: any) => void;
  createThread: (threadData: any) => void;
  deletePost: (postId: string) => void;
  updatePost: (postId: string, data: any) => void;
  deleteThread: (threadId: string) => void;
  updateThread: (threadId: string, data: any) => void;
  // Following/Followers
  followEntity: (entity: any) => void;
  unfollowEntity: (entityId: string) => void;
  removeFollower: (followerId: string) => void;
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteReadNotifications: () => void;
  clearAllNotifications: () => void;
  // Profile
  updateUserProfile: (profile: UserProfile) => void;
  // UI
  toggleAIChat: () => void;
  setPaymentRole: (role: UserRole | null) => void;
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  
  const [state, setState] = useState<AppState>({
    ...initialNavigationState,
    cartItems: [],
    savedItems: [
      {
        id: '1',
        type: 'post',
        itemId: 'p1',
        title: 'Seasonal Promotion: 20% Off All Seedlings',
        image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?w=1080',
        description: 'We are excited to announce our seasonal sale!',
        savedAt: new Date('2026-02-01')
      }
    ],
    userPosts: centralPosts.filter(p => p.authorId === 'me').map(p => ({ ...p, author: mockCurrentUser })),
    userThreads: centralThreads.filter(t => t.authorId === 'me').map(t => ({ ...t, author: mockCurrentUser })),
    userProfile: {
      id: mockCurrentUser.id,
      fullName: mockCurrentUser.fullName,
      email: mockCurrentUser.email,
      phone: mockCurrentUser.phone,
      location: mockCurrentUser.location,
      bio: mockCurrentUser.bio,
      avatar: mockCurrentUser.avatar,
      role: mockCurrentUser.role as any,
      customFields: [
        { id: '1', title: 'Farming Equipment', content: 'I own two tractors and a specialized irrigation system.' },
        { id: '2', title: 'Main Crops', content: 'Wheat and Dates are my primary focus this season.' }
      ]
    },
    followedEntities: mockOtherUsers.slice(0, 3).map(u => ({
      id: u.id,
      name: u.fullName,
      role: u.role,
      location: u.location,
      image: u.avatar,
      followers: u.followers,
      rating: u.rating,
      reviews: u.reviewsCount
    })),
    followers: mockOtherUsers.slice(3, 8).map(u => ({
      id: u.id,
      name: u.fullName,
      fullName: u.fullName,
      avatar: u.avatar,
      role: u.role,
      location: u.location,
      rating: u.rating,
      reviews: u.reviewsCount,
      followingSince: 'Jan 2026'
    })),
    notifications: centralNotifications,
    showAIChat: false,
    showPostSuccess: false,
    showThreadSuccess: false,
    shouldScrollToPosts: false,
    shouldScrollToThreads: false,
    paymentRole: null,
  });

  // Sync with authenticated user
  useEffect(() => {
    if (user && isAuthenticated) {
      const allUsers = [mockCurrentUser, ...mockOtherUsers];
      const currentUserData = allUsers.find(u => u.id === user.id);
      
      if (currentUserData) {
        setState(prev => ({
          ...prev,
          userProfile: {
            id: currentUserData.id,
            fullName: currentUserData.fullName,
            name: currentUserData.fullName,
            email: currentUserData.email,
            phone: currentUserData.phone || '',
            location: currentUserData.location,
            bio: currentUserData.bio,
            avatar: currentUserData.avatar,
            role: currentUserData.role as any,
            specialization: currentUserData.specialization,
            yearsExperience: currentUserData.yearsExperience,
            companyName: currentUserData.companyName,
            customFields: currentUserData.role === 'user' ? [
              { id: '1', title: 'Farming Equipment', content: 'Various agricultural equipment.' },
              { id: '2', title: 'Main Crops', content: 'Multiple crop varieties.' }
            ] : undefined
          },
          userPosts: centralPosts.filter(p => p.authorId === user.id).map(p => ({ ...p, author: currentUserData })),
          userThreads: centralThreads.filter(t => t.authorId === user.id).map(t => ({ ...t, author: currentUserData })),
          followedEntities: mockOtherUsers.filter(u => u.id !== user.id).slice(0, 3).map(u => ({
            id: u.id,
            name: u.fullName,
            role: u.role,
            location: u.location,
            image: u.avatar,
            followers: u.followers,
            rating: u.rating,
            reviews: u.reviewsCount
          })),
          followers: mockOtherUsers.filter(u => u.id !== user.id).slice(3, 8).map(u => ({
            id: u.id,
            name: u.fullName,
            fullName: u.fullName,
            avatar: u.avatar,
            role: u.role,
            location: u.location,
            rating: u.rating,
            reviews: u.reviewsCount,
            followingSince: 'Jan 2026'
          }))
        }));
      }
    }
  }, [user, isAuthenticated]);

  // Navigation handlers
  const navigate = useCallback((page: Page) => {
    setState(prev => {
      if (page === 'posts' && prev.currentPage === 'posts') {
        return { ...prev, shouldScrollToPosts: true };
      }
      
      const updates: Partial<AppState> = {
        currentPage: page,
        shouldScrollToPosts: false,
        shouldScrollToThreads: false,
      };

      if (page !== 'chats') updates.selectedChatProfileId = null;
      if (page === 'profile') updates.viewingUserId = null;
      if (page !== 'posts' && page !== 'create-post') updates.showPostSuccess = false;
      if (page !== 'threads' && page !== 'create-thread') updates.showThreadSuccess = false;
      if (page !== 'posts') {
        updates.highlightPostId = undefined;
        updates.highlightCommentId = undefined;
      }
      if (page !== 'threads') updates.highlightThreadId = undefined;

      return { ...prev, ...updates };
    });
    scrollToTop();
  }, []);

  const navigateWithParams = useCallback((page: string, params?: any) => {
    if (params) {
      if (page === 'chats' && params.profileId) {
        setState(prev => ({ ...prev, currentPage: 'chats', selectedChatProfileId: params.profileId }));
        scrollToTop();
        return;
      }
      if (page === 'posts') {
        setState(prev => ({
          ...prev,
          currentPage: 'posts',
          highlightPostId: params.highlightPostId,
          highlightCommentId: params.highlightCommentId
        }));
        return;
      }
      if (page === 'threads') {
        setState(prev => ({
          ...prev,
          currentPage: 'threads',
          highlightThreadId: params.highlightThreadId,
          highlightCommentId: params.highlightCommentId
        }));
        return;
      }
      if (page === 'shopping' && params.productId) {
        setState(prev => ({ ...prev, currentPage: 'shopping', highlightShoppingProductId: params.productId }));
        scrollToTop();
        return;
      }
      if (page === 'user-profile' && params.userId) {
        setState(prev => ({ ...prev, currentPage: 'user-profile', viewingUserId: params.userId }));
        scrollToTop();
        return;
      }
      if (page === 'dashboard' && params.productId) {
        setState(prev => ({
          ...prev,
          currentPage: 'dashboard',
          highlightProductId: params.productId,
          dashboardTargetSection: 'products'
        }));
        scrollToTop();
        return;
      }
    }
    navigate(page as Page);
  }, [navigate]);

  const navigateToBusiness = useCallback((businessId: string) => {
    setState(prev => ({ ...prev, selectedBusinessId: businessId, currentPage: 'business' }));
    scrollToTop();
  }, []);

  const navigateToUserProfile = useCallback((userId: string) => {
    if (user && userId === user.id) {
      navigate('profile');
      return;
    }
    const profileUser = [...mockOtherUsers, mockCurrentUser].find(u => u.id === userId);
    if (!profileUser) return;
    
    setState(prev => ({ ...prev, viewingUserId: userId }));
    
    if (profileUser.role === 'business' && profileUser.businessId) {
      navigateToBusiness(profileUser.businessId);
    } else if (profileUser.role === 'engineer' || profileUser.role === 'agronomist') {
      navigate('engineer-profile');
    } else {
      navigate('user-profile');
    }
  }, [user, navigate, navigateToBusiness]);

  const navigateToChat = useCallback((profileId: string) => {
    setState(prev => ({ ...prev, selectedChatProfileId: profileId, currentPage: 'chats' }));
    scrollToTop();
  }, []);

  // Cart handlers
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'quantity'>) => {
    setState(prev => ({ ...prev, cartItems: addItemToCart(prev.cartItems, item) }));
  }, []);

  const updateCartItemQuantity = useCallback((itemId: string, quantity: number) => {
    setState(prev => ({ ...prev, cartItems: updateCartQuantity(prev.cartItems, itemId, quantity) }));
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setState(prev => ({ ...prev, cartItems: removeCartItem(prev.cartItems, itemId) }));
  }, []);

  const clearCart = useCallback(() => {
    setState(prev => ({ ...prev, cartItems: [] }));
  }, []);

  // Saved items
  const addSavedItem = useCallback((item: SavedItem) => {
    setState(prev => ({ ...prev, savedItems: [...prev.savedItems, item] }));
  }, []);

  const removeSavedItem = useCallback((itemId: string) => {
    setState(prev => ({ ...prev, savedItems: prev.savedItems.filter(i => i.id !== itemId) }));
  }, []);

  // Content handlers
  const createPost = useCallback((postData: any) => {
    const newPost = {
      id: Date.now().toString(),
      title: postData.title || postData.content.substring(0, 50) + (postData.content.length > 50 ? '...' : ''),
      ...postData,
      tags: postData.tags || [],
      timeAgo: 'Just now',
    };
    setState(prev => ({
      ...prev,
      userPosts: [newPost, ...prev.userPosts],
      currentPage: 'posts',
      showPostSuccess: true
    }));
    setTimeout(() => setState(prev => ({ ...prev, showPostSuccess: false })), 2500);
  }, []);

  const createThread = useCallback((threadData: any) => {
    const newThread = {
      id: Date.now().toString(),
      title: threadData.title || threadData.content.substring(0, 50) + (threadData.content.length > 50 ? '...' : ''),
      ...threadData,
      tags: threadData.tags || [],
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
    };
    setState(prev => ({
      ...prev,
      userThreads: [newThread, ...prev.userThreads],
      currentPage: 'threads',
      showThreadSuccess: true
    }));
    setTimeout(() => setState(prev => ({ ...prev, showThreadSuccess: false })), 2500);
  }, []);

  const deletePost = useCallback((postId: string) => {
    setState(prev => ({ ...prev, userPosts: prev.userPosts.filter(p => p.id !== postId) }));
  }, []);

  const updatePost = useCallback((postId: string, data: any) => {
    setState(prev => ({
      ...prev,
      userPosts: prev.userPosts.map(p => p.id === postId ? { ...p, ...data } : p)
    }));
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    setState(prev => ({ ...prev, userThreads: prev.userThreads.filter(t => t.id !== threadId) }));
  }, []);

  const updateThread = useCallback((threadId: string, data: any) => {
    setState(prev => ({
      ...prev,
      userThreads: prev.userThreads.map(t => t.id === threadId ? { ...t, ...data } : t)
    }));
  }, []);

  // Following/Followers
  const followEntity = useCallback((entity: any) => {
    setState(prev => {
      const isAlreadyFollowing = prev.followedEntities.some(e => e.id === entity.id);
      if (isAlreadyFollowing) return prev;

      const normalizedEntity = {
        id: entity.id,
        name: entity.name || entity.fullName || "Unknown",
        role: entity.role || (entity.businessId ? 'business' : 'user'),
        location: entity.location || "Saudi Arabia",
        image: entity.image || entity.avatar || entity.logo || "",
        rating: entity.rating,
        reviews: entity.reviews,
        followers: entity.followers,
      };

      return { ...prev, followedEntities: [...prev.followedEntities, normalizedEntity] };
    });
  }, []);

  const unfollowEntity = useCallback((entityId: string) => {
    setState(prev => ({
      ...prev,
      followedEntities: prev.followedEntities.filter(e => e.id !== entityId)
    }));
  }, []);

  const removeFollower = useCallback((followerId: string) => {
    setState(prev => ({ ...prev, followers: prev.followers.filter(f => f.id !== followerId) }));
  }, []);

  // Notifications
  const markNotificationAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  }, []);

  const deleteReadNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => !n.read)
    }));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));
  }, []);

  // Profile
  const updateUserProfile = useCallback((profile: UserProfile) => {
    setState(prev => ({ ...prev, userProfile: profile }));
  }, []);

  // UI
  const toggleAIChat = useCallback(() => {
    setState(prev => ({ ...prev, showAIChat: !prev.showAIChat }));
  }, []);

  const setPaymentRole = useCallback((role: UserRole | null) => {
    setState(prev => ({ ...prev, paymentRole: role }));
  }, []);

  const value: AppStateContextType = {
    state,
    navigate,
    navigateWithParams,
    navigateToBusiness,
    navigateToUserProfile,
    navigateToChat,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    addSavedItem,
    removeSavedItem,
    createPost,
    createThread,
    deletePost,
    updatePost,
    deleteThread,
    updateThread,
    followEntity,
    unfollowEntity,
    removeFollower,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteReadNotifications,
    clearAllNotifications,
    updateUserProfile,
    toggleAIChat,
    setPaymentRole,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
}
