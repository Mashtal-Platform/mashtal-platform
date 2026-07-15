import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import {
  Page,
  CartItem,
  SavedItem,
  UserProfile,
  UserRole,
  Notification,
} from '../types';
import { useAuth } from '../../contexts/AuthContext';
import {
  addItemToCart,
  updateCartQuantity,
  removeCartItem,
} from '../utils/cart';
import {
  loadCartFromStorage,
  loadUserCart,
  normalizeCartEmail,
  saveCartToStorage,
} from '../utils/cartStorage';
import {
  scrollToTop,
  initialNavigationState,
  NavigationState,
} from '../utils/navigation';
import { createPost as apiCreatePost, fetchPosts, updatePost as apiUpdatePost, deletePost as apiDeletePost } from '../api/posts';
import { createThread as apiCreateThread, fetchThreads, updateThread as apiUpdateThread, deleteThread as apiDeleteThread } from '../api/threads';
import {
  fetchNotifications,
  markNotificationRead as apiMarkNotificationRead,
  markAllNotificationsRead as apiMarkAllNotificationsRead,
  clearReadNotifications as apiClearReadNotifications,
  clearAllNotifications as apiClearAllNotifications,
} from '../api/notifications';
import { fetchFollowers, fetchFollowing, fetchUser, followUser as apiFollowUser, unfollowUser as apiUnfollowUser, removeFollower as apiRemoveFollower } from '../api/users';
import { saveItem as apiSaveItem, deleteSavedItem as apiDeleteSavedItem, fetchSavedItems } from '../api/saved';
import { filterOutOrphanSavedItems } from '../utils/saved';

interface AppState extends NavigationState {
  // Cart
  cartItems: CartItem[];
  // Saved items
  savedItems: SavedItem[];
  // User content
  userPosts: any[];
  userThreads: any[];
  allPosts: any[];
  allThreads: any[];
  // Bump when a post/thread is created so feeds refetch/prepend
  feedVersion: number;
  lastCreatedPost: any | null;
  lastCreatedThread: any | null;
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
  createPost: (postData: any, imageFile?: File) => void;
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

function cartOwnerKey(user: { email?: string; id?: string } | null | undefined): string {
  return normalizeCartEmail(user?.email) || 'guest';
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const cartOwnerRef = useRef<string>(cartOwnerKey(user));
  const skipCartSaveRef = useRef(false);

  const [state, setState] = useState<AppState>(() => ({
    ...initialNavigationState,
    cartItems: user?.email
      ? loadUserCart({ email: user.email, userId: user.id })
      : loadCartFromStorage(null),
    savedItems: [],
    userPosts: [],
    userThreads: [],
    allPosts: [],
    allThreads: [],
    feedVersion: 0,
    lastCreatedPost: null,
    lastCreatedThread: null,
    userProfile: user
      ? {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone || '',
          location: user.location,
          bio: user.bio,
          avatar: user.avatar,
          coverImage: (user as any).coverImage ?? '',
          role: user.role as any,
          companyName: user.companyName,
        }
      : {
          id: '',
          fullName: '',
          email: '',
          phone: '',
          location: '',
          bio: '',
          avatar: '',
          coverImage: '',
          role: null,
        },
    followedEntities: [],
    followers: [],
    notifications: [],
    showAIChat: false,
    showPostSuccess: false,
    showThreadSuccess: false,
    shouldScrollToPosts: false,
    shouldScrollToThreads: false,
    paymentRole: null,
  }));

  // When user opens verification link (e.g. from email), show verify-email page so token in hash can be processed
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash.includes('verify-email?token=')) {
      setState((prev) => ({ ...prev, currentPage: 'verify-email' }));
    }
  }, []);

  // Per device + email: switch cart on login/logout without leaking items across accounts
  useEffect(() => {
    const nextOwner = cartOwnerKey(user);
    if (cartOwnerRef.current === nextOwner) return;
    cartOwnerRef.current = nextOwner;
    // Prevent the save effect from writing the previous account's in-memory cart into this key
    skipCartSaveRef.current = true;
    const nextItems = user?.email
      ? loadUserCart({ email: user.email, userId: user.id })
      : loadCartFromStorage(null);
    setState((prev) => ({
      ...prev,
      cartItems: nextItems,
    }));
  }, [user?.email, user?.id]);

  useEffect(() => {
    if (skipCartSaveRef.current) {
      skipCartSaveRef.current = false;
      return;
    }
    const owner = cartOwnerKey(user);
    if (cartOwnerRef.current !== owner) return;
    saveCartToStorage(user?.email ?? null, state.cartItems);
  }, [user?.email, state.cartItems]);

  // Load notifications from backend when auth changes
  useEffect(() => {
    if (!user || !isAuthenticated) {
      setState(prev => ({ ...prev, notifications: [] }));
      return;
    }

    fetchNotifications()
      .then((items) => {
        setState((prev) => ({
          ...prev,
          notifications: items,
        }));
      })
      .catch((err) => {
        console.error('[AppState] Failed to load notifications from backend:', err);
      });
  }, [user, isAuthenticated]);

  // Refetch notifications when user opens the notifications page (so new message notifications appear)
  const prevPageRef = useRef<string | null>(null);
  useEffect(() => {
    const current = state.currentPage;
    if (current === 'notifications' && isAuthenticated && prevPageRef.current !== 'notifications') {
      prevPageRef.current = 'notifications';
      fetchNotifications()
        .then((items) => {
          setState((prev) => ({ ...prev, notifications: items }));
        })
        .catch(() => {});
    } else if (current !== 'notifications') {
      prevPageRef.current = current;
    }
  }, [state.currentPage, isAuthenticated]);

  // Sync profile, posts/threads and followers/following with authenticated user from backend
  useEffect(() => {
    if (!user || !isAuthenticated) {
      setState((prev) => ({
        ...prev,
        userProfile: {
          id: '',
          fullName: '',
          email: '',
          phone: '',
          location: '',
          bio: '',
          avatar: '',
          role: null,
        },
        userPosts: [],
        userThreads: [],
        allPosts: [],
        allThreads: [],
        feedVersion: 0,
        lastCreatedPost: null,
        lastCreatedThread: null,
        followedEntities: [],
        followers: [],
      }));
      return;
    }

    const bp = (user as any).businessProfile || {};
    // Sync profile from auth user immediately so profile page always has data
    setState((prev) => ({
      ...prev,
      userProfile: {
        id: user.id,
        fullName: user.fullName ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        location: user.location ?? '',
        bio: user.bio ?? '',
        avatar: user.avatar,
        coverImage: (user as any).coverImage ?? '',
        role: user.role as any,
        companyName: (user as any).companyName ?? '',
        rating: bp.rating ?? 0,
        reviewsCount: bp.reviewsCount ?? 0,
      },
    }));

    const load = async () => {
      try {
        const [allPosts, allThreads, followersRes, followingRes, savedRes] = await Promise.all([
          fetchPosts({ limit: 500, skip: 0 }).catch(() => []),
          fetchThreads({ limit: 500, skip: 0 }).catch(() => []),
          fetchFollowers(user.id).catch(() => []),
          fetchFollowing(user.id).catch(() => []),
          fetchSavedItems().catch(() => []),
        ]);

        const followers = Array.isArray(followersRes) ? followersRes : [];
        const following = Array.isArray(followingRes) ? followingRes : [];
        const bp = (user as any).businessProfile || {};
        const rawSaved = Array.isArray(savedRes) ? savedRes : [];
        const mappedSaved: SavedItem[] = rawSaved.map((s: any) => ({
          id: s.id,
          type: s.type,
          itemId: s.refId != null ? String(s.refId) : '',
          title: s.title ?? '',
          image: s.image ?? '',
          description: s.description ?? '',
          savedAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          ...(s.businessId && { businessId: s.businessId }),
        }));
        const savedItems: SavedItem[] = filterOutOrphanSavedItems(mappedSaved);

        const authorIdMatch = (author: any, id: string) =>
          (author?.id || author?._id?.toString?.()) === id;
        setState((prev) => ({
          ...prev,
          userProfile: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            location: user.location,
            bio: user.bio,
            avatar: user.avatar,
            coverImage: (user as any).coverImage ?? '',
            role: user.role as any,
            companyName: user.companyName,
            rating: bp.rating ?? 0,
            reviewsCount: bp.reviewsCount ?? 0,
          },
          allPosts: (allPosts as any[]) || [],
          allThreads: (allThreads as any[]) || [],
          userPosts: (allPosts as any[]).filter((p) => authorIdMatch(p.author, user.id)),
          userThreads: (allThreads as any[]).filter((t) => authorIdMatch(t.author, user.id)),
          followers,
          followedEntities: following,
          savedItems,
        }));
      } catch (err) {
        console.error('[AppState] Failed to load user-related data from backend:', err);
        const bp = (user as any).businessProfile || {};
        setState((prev) => ({
          ...prev,
          userProfile: {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || '',
            location: user.location,
            bio: user.bio,
            avatar: user.avatar,
            coverImage: (user as any).coverImage ?? '',
            role: user.role as any,
            companyName: user.companyName,
            rating: bp.rating ?? 0,
            reviewsCount: bp.reviewsCount ?? 0,
          },
        }));
      }
    };

    load();
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
      if (page === 'dashboard') {
        const focusingOrder = !!(params.highlightOrderId || params.orderId);
        const focusingProduct = !!params.productId;
        setState((prev) => ({
          ...prev,
          currentPage: 'dashboard',
          highlightProductId: params.productId ?? null,
          highlightOrderId: params.highlightOrderId ?? params.orderId ?? null,
          dashboardTargetSection:
            params.section ||
            (focusingOrder ? 'orders' : focusingProduct ? 'products' : null),
        }));
        // Opening a specific order uses row scroll — skipping scrollToTop avoids a jump-back.
        // Clearing highlight params ({}) must also not re-scroll.
        if (!focusingOrder && (focusingProduct || params.section)) {
          scrollToTop();
        }
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
    setState(prev => ({ ...prev, viewingUserId: userId }));
    fetchUser(userId)
      .then((profileUser: any) => {
        if (profileUser.role === 'business' && (profileUser.businessId || profileUser.id)) {
          navigateToBusiness(profileUser.businessId || profileUser.id);
        } else {
          navigate('user-profile');
        }
      })
      .catch(() => {
        navigate('user-profile');
      });
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

  // Saved items (persist to backend)
  const addSavedItem = useCallback((item: SavedItem) => {
    const refId = (item as any).itemId;
    if (!refId || !user?.id) {
      setState(prev => ({ ...prev, savedItems: [...prev.savedItems, item] }));
      return;
    }
    const type = item.type as 'post' | 'thread' | 'product';
    apiSaveItem({ type, refId })
      .then((saved: any) => {
        setState(prev => ({
          ...prev,
          savedItems: [...prev.savedItems, { ...item, id: saved.id || item.id }],
        }));
      })
      .catch(() => {
        setState(prev => ({ ...prev, savedItems: [...prev.savedItems, item] }));
      });
  }, [user?.id]);

  const removeSavedItem = useCallback((itemId: string) => {
    setState(prev => ({ ...prev, savedItems: prev.savedItems.filter(i => i.id !== itemId) }));
    apiDeleteSavedItem(itemId).catch(() => {
      fetchSavedItems().then((list) => {
        const mapped: SavedItem[] = (list as any[]).map((s) => ({
          id: s.id,
          type: s.type,
          itemId: s.refId != null ? String(s.refId) : '',
          title: s.title ?? '',
          image: s.image ?? '',
          description: s.description ?? '',
          savedAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          ...(s.businessId && { businessId: s.businessId }),
        }));
        const cleaned = filterOutOrphanSavedItems(mapped);
        setState(prev => ({ ...prev, savedItems: cleaned }));
      });
    });
  }, []);

  // Content handlers
  const createPost = useCallback(async (postData: any, imageFile?: File) => {
    if (!user) return;
    const title =
      postData.title ||
      postData.content.substring(0, 50) +
        (postData.content.length > 50 ? '...' : '');

    try {
      const created = await apiCreatePost(
        {
          title,
          content: postData.content,
          image: imageFile ? undefined : postData.image,
          tags: postData.tags || [],
          author: {
            id: user.id,
            name:
              user.role === 'business'
                ? (user.companyName || user.fullName || 'Business')
                : (user.fullName || 'User'),
            avatar: user.avatar ?? '',
            verified: user.verified ?? false,
            type: (user.role as any) ?? 'user',
            businessId: user.role === 'business' ? user.id : (user as any)?.businessId,
          },
        },
        imageFile
      );

      const createdPost = {
        ...created,
        comments: typeof (created as any).commentsCount === 'number' ? (created as any).commentsCount : 0,
      };

      setState((prev) => ({
        ...prev,
        currentPage: 'posts',
        showPostSuccess: true,
        feedVersion: prev.feedVersion + 1,
        lastCreatedPost: createdPost,
        lastCreatedThread: null,
        allPosts: [createdPost, ...prev.allPosts.filter((p) => p.id !== createdPost.id)],
        userPosts: [createdPost, ...prev.userPosts.filter((p) => p.id !== createdPost.id)],
      }));
    } catch (err) {
      console.error('[AppState] Failed to create post in backend:', err);
    } finally {
      setTimeout(
        () =>
          setState((prev) => ({ ...prev, showPostSuccess: false })),
        2500
      );
    }
  }, [user]);

  const createThread = useCallback(
    async (threadData: any) => {
      if (!user) return;
      const title =
        threadData.title ||
        threadData.content.substring(0, 50) +
          (threadData.content.length > 50 ? '...' : '');

      try {
        const created = (await apiCreateThread({
          title,
          content: threadData.content,
          tags: threadData.tags || [],
          author: {
            id: user.id,
            name:
              user.role === 'business'
                ? (user.companyName || user.fullName || 'Business')
                : (user.fullName || 'User'),
            avatar: user.avatar ?? '',
            verified: user.verified ?? false,
            type: (user.role as any) ?? 'user',
            businessId: user.role === 'business' ? user.id : (user as any)?.businessId,
          },
        })) as any;

        const createdThread = {
          ...created,
          comments: typeof created.commentsCount === 'number' ? created.commentsCount : 0,
        };

        setState((prev) => ({
          ...prev,
          currentPage: 'threads',
          showThreadSuccess: true,
          feedVersion: prev.feedVersion + 1,
          lastCreatedThread: createdThread,
          lastCreatedPost: null,
          allThreads: [createdThread, ...prev.allThreads.filter((t) => t.id !== createdThread.id)],
          userThreads: [createdThread, ...prev.userThreads.filter((t) => t.id !== createdThread.id)],
        }));
      } catch (err) {
        console.error('[AppState] Failed to create thread in backend:', err);
      } finally {
        setTimeout(
          () =>
            setState((prev) => ({ ...prev, showThreadSuccess: false })),
          2500
        );
      }
    },
    [user]
  );

  const deletePost = useCallback((postId: string) => {
    apiDeletePost(postId)
      .then(() => {
        setState(prev => ({
          ...prev,
          userPosts: prev.userPosts.filter(p => p.id !== postId),
          allPosts: prev.allPosts.filter(p => p.id !== postId),
          savedItems: prev.savedItems.filter(
            (s) => !(s.type === 'post' && s.itemId === postId)
          ),
        }));
      })
      .catch((err) => {
        console.error('[AppState] Failed to delete post in backend:', err);
      });
  }, []);

  const updatePost = useCallback((postId: string, data: any) => {
    apiUpdatePost(postId, { title: data.title, content: data.content, image: data.image, tags: data.tags })
      .then((updated) => {
        const merge = (p: any) => (p.id === postId ? { ...p, ...updated } : p);
        setState(prev => ({
          ...prev,
          userPosts: prev.userPosts.map(merge),
          allPosts: prev.allPosts.map(merge),
        }));
      })
      .catch((err) => {
        console.error('[AppState] Failed to update post in backend:', err);
      });
  }, []);

  const deleteThread = useCallback((threadId: string) => {
    apiDeleteThread(threadId)
      .then(() => {
        setState(prev => ({
          ...prev,
          userThreads: prev.userThreads.filter(t => t.id !== threadId),
          allThreads: prev.allThreads.filter(t => t.id !== threadId),
          savedItems: prev.savedItems.filter(
            (s) => !(s.type === 'thread' && s.itemId === threadId)
          ),
        }));
      })
      .catch((err) => {
        console.error('[AppState] Failed to delete thread in backend:', err);
      });
  }, []);

  const updateThread = useCallback((threadId: string, data: any) => {
    apiUpdateThread(threadId, { title: data.title, content: data.content, tags: data.tags })
      .then((updated) => {
        const merge = (t: any) => (t.id === threadId ? { ...t, ...updated } : t);
        setState(prev => ({
          ...prev,
          userThreads: prev.userThreads.map(merge),
          allThreads: prev.allThreads.map(merge),
        }));
      })
      .catch((err) => {
        console.error('[AppState] Failed to update thread in backend:', err);
      });
  }, []);

  // Following/Followers (persist to backend)
  const followEntity = useCallback((entity: any) => {
    const entityId = entity?.id || entity?._id?.toString?.();
    if (!entityId || !user?.id) return;
    setState(prev => {
      const isAlreadyFollowing = prev.followedEntities.some(
        e => (e?.id || (e as any)?._id?.toString?.()) === entityId
      );
      if (isAlreadyFollowing) return prev;
      const normalizedEntity = {
        id: entityId,
        name: entity.name || entity.fullName || "Unknown",
        role: entity.role || (entity.businessId ? 'business' : 'visitor'),
        location: entity.location || "Saudi Arabia",
        image: entity.image || entity.avatar || entity.logo || "",
        rating: entity.rating,
        reviews: entity.reviews,
        followers: entity.followers,
      };
      return { ...prev, followedEntities: [...prev.followedEntities, normalizedEntity] };
    });
    apiFollowUser(entityId).catch(() => {
      fetchFollowing(user.id).then((list) => {
        setState(prev => ({ ...prev, followedEntities: list as any[] }));
      });
    });
  }, [user?.id]);

  const unfollowEntity = useCallback((entityId: string) => {
    if (!user?.id) return;
    setState(prev => ({
      ...prev,
      followedEntities: prev.followedEntities.filter(e => e.id !== entityId),
    }));
    apiUnfollowUser(entityId).catch(() => {
      // Re-fetch following to restore state on error
      fetchFollowing(user.id).then((list) => {
        setState(prev => ({ ...prev, followedEntities: list as any[] }));
      });
    });
  }, [user?.id]);

  const removeFollower = useCallback((followerId: string) => {
    setState(prev => ({ ...prev, followers: prev.followers.filter(f => (f?.id || (f as any)?._id?.toString?.()) !== followerId) }));
    apiRemoveFollower(followerId).catch(() => {
      if (user?.id) {
        fetchFollowers(user.id).then((list) => {
          setState(prev => ({ ...prev, followers: Array.isArray(list) ? list : [] }));
        });
      }
    });
  }, [user?.id]);

  // Notifications
  const markNotificationAsRead = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));

    apiMarkNotificationRead(id).catch((err) => {
      console.error('[AppState] Failed to mark notification read in backend:', err);
    });
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));

    apiMarkAllNotificationsRead().catch((err) => {
      console.error('[AppState] Failed to mark all notifications read in backend:', err);
    });
  }, []);

  const deleteReadNotifications = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.filter(n => !n.read)
    }));

    apiClearReadNotifications().catch((err) => {
      console.error('[AppState] Failed to clear read notifications in backend:', err);
    });
  }, []);

  const clearAllNotifications = useCallback(() => {
    setState(prev => ({ ...prev, notifications: [] }));

    apiClearAllNotifications().catch((err) => {
      console.error('[AppState] Failed to clear notifications in backend:', err);
    });
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
