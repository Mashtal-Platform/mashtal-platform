import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SavedItem } from '../App';
import { fetchPosts } from '../shared/api/posts';
import { fetchThreads } from '../shared/api/threads';
import { fetchProducts } from '../shared/api/products';
import { fetchFollowers, fetchFollowing } from '../shared/api/users';
import { fetchSavedItems } from '../shared/api/saved';
import { filterOutOrphanSavedItems } from '../shared/utils/saved';

interface UserData {
  savedItems: SavedItem[];
  followers: any[];
  following: any[];
  posts: any[];
  threads: any[];
  products: any[];
}

interface UserDataMap {
  [userId: string]: UserData;
}

interface UserDataContextType {
  savedItems: SavedItem[];
  followers: any[];
  following: any[];
  userPosts: any[];
  userThreads: any[];
  userProducts: any[];
  addSavedItem: (item: SavedItem) => void;
  removeSavedItem: (itemId: string) => void;
  updateFollowers: (followers: any[]) => void;
  updateFollowing: (following: any[]) => void;
  addPost: (post: any) => void;
  addThread: (thread: any) => void;
  deletePost: (postId: string) => void;
  deleteThread: (threadId: string) => void;
  updatePost: (postId: string, updatedData: any) => void;
  updateThread: (threadId: string, updatedData: any) => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

const getDefaultUserData = (): UserData => ({
  savedItems: [],
  followers: [],
  following: [],
  posts: [],
  threads: [],
  products: [],
});

export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [userDataMap, setUserDataMap] = useState<UserDataMap>({});
  const [currentUserData, setCurrentUserData] = useState<UserData>(getDefaultUserData());

  // Load user data from API when user is authenticated
  useEffect(() => {
    if (!user?.id) {
      setCurrentUserData(getDefaultUserData());
      return;
    }

    let cancelled = false;

    async function load() {
      try {
        const [allPosts, allThreads, allProducts, followers, following, saved] = await Promise.all([
          fetchPosts({ limit: 500, skip: 0 }).catch(() => []),
          fetchThreads({ limit: 500, skip: 0 }).catch(() => []),
          fetchProducts().catch(() => []),
          fetchFollowers(user.id).catch(() => []),
          fetchFollowing(user.id).catch(() => []),
          fetchSavedItems().catch(() => []),
        ]);

        if (cancelled) return;

        const userPosts = (allPosts as any[]).filter((p) => p.author?.id === user.id);
        const userThreads = (allThreads as any[]).filter((t) => t.author?.id === user.id);
        const userProducts = (allProducts as any[]).filter(
          (p) => p.businessId === user.id || p.businessId === (user as any).businessId
        );

        // Map saved items from API shape; exclude orphans (deleted refs)
        const mappedSaved: SavedItem[] = (saved as any[]).map((s) => ({
          id: s.id,
          type: s.type as 'post' | 'thread' | 'product',
          itemId: s.refId != null ? String(s.refId) : '',
          title: s.title ?? '',
          image: s.image ?? '',
          description: s.description ?? '',
          savedAt: s.createdAt ? new Date(s.createdAt) : new Date(),
          ...(s.businessId && { businessId: s.businessId }),
        }));
        const savedItems: SavedItem[] = filterOutOrphanSavedItems(mappedSaved);

        const userData: UserData = {
          savedItems,
          followers: followers as any[],
          following: following as any[],
          posts: userPosts,
          threads: userThreads,
          products: userProducts,
        };

        setUserDataMap((prev) => ({ ...prev, [user.id]: userData }));
        setCurrentUserData(userData);
      } catch (e) {
        if (!cancelled) console.error('Failed to load user data from API:', e);
        setCurrentUserData(getDefaultUserData());
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  // When user changes, read from map (already loaded in effect above)
  useEffect(() => {
    if (user?.id && userDataMap[user.id]) {
      setCurrentUserData(userDataMap[user.id]);
    } else if (!user?.id) {
      setCurrentUserData(getDefaultUserData());
    }
  }, [user?.id, userDataMap]);

  const updateUserData = (updater: (prev: UserData) => UserData) => {
    if (!user?.id) return;

    setUserDataMap((prev) => {
      const currentData = prev[user.id] || getDefaultUserData();
      const updated = updater(currentData);
      return {
        ...prev,
        [user.id]: updated,
      };
    });
    setCurrentUserData((prev) => updater(prev));
  };

  const addSavedItem = (item: SavedItem) => {
    updateUserData((prev) => ({
      ...prev,
      savedItems: [...prev.savedItems, item],
    }));
  };

  const removeSavedItem = (itemId: string) => {
    updateUserData((prev) => ({
      ...prev,
      savedItems: prev.savedItems.filter((item) => item.id !== itemId),
    }));
  };

  const updateFollowers = (followers: any[]) => {
    updateUserData((prev) => ({ ...prev, followers }));
  };

  const updateFollowing = (following: any[]) => {
    updateUserData((prev) => ({ ...prev, following }));
  };

  const addPost = (post: any) => {
    updateUserData((prev) => ({
      ...prev,
      posts: [post, ...prev.posts],
    }));
  };

  const addThread = (thread: any) => {
    updateUserData((prev) => ({
      ...prev,
      threads: [thread, ...prev.threads],
    }));
  };

  const deletePost = (postId: string) => {
    updateUserData((prev) => ({
      ...prev,
      posts: prev.posts.filter((p) => p.id !== postId),
    }));
  };

  const deleteThread = (threadId: string) => {
    updateUserData((prev) => ({
      ...prev,
      threads: prev.threads.filter((t) => t.id !== threadId),
    }));
  };

  const updatePost = (postId: string, updatedData: any) => {
    updateUserData((prev) => ({
      ...prev,
      posts: prev.posts.map((p) => (p.id === postId ? { ...p, ...updatedData } : p)),
    }));
  };

  const updateThread = (threadId: string, updatedData: any) => {
    updateUserData((prev) => ({
      ...prev,
      threads: prev.threads.map((t) => (t.id === threadId ? { ...t, ...updatedData } : t)),
    }));
  };

  return (
    <UserDataContext.Provider
      value={{
        savedItems: currentUserData.savedItems,
        followers: currentUserData.followers,
        following: currentUserData.following,
        userPosts: currentUserData.posts,
        userThreads: currentUserData.threads,
        userProducts: currentUserData.products,
        addSavedItem,
        removeSavedItem,
        updateFollowers,
        updateFollowing,
        addPost,
        addThread,
        deletePost,
        deleteThread,
        updatePost,
        updateThread,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
