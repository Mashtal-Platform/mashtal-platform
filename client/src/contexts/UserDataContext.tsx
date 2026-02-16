import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { SavedItem } from '../App';
import { 
  currentUser as mockCurrentUser, 
  otherUsers as mockOtherUsers, 
  mockPosts as centralPosts, 
  mockThreads as centralThreads,
  mockProducts as centralProducts,
} from '../data/centralMockData';

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

  // Load user data from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('mashtal_user_data');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setUserDataMap(parsed);
      } catch (e) {
        console.error('Failed to load user data:', e);
      }
    }
  }, []);

  // Update current user data when user changes
  useEffect(() => {
    if (user?.id) {
      const allUsers = [mockCurrentUser, ...mockOtherUsers];
      const currentUserInfo = allUsers.find(u => u.id === user.id);
      
      let userData = userDataMap[user.id];
      
      // If no stored data, initialize with mock data
      if (!userData && currentUserInfo) {
        // Get user's posts
        const userPosts = centralPosts
          .filter(p => p.authorId === user.id)
          .map(p => ({
            ...p,
            author: currentUserInfo
          }));

        // Get user's threads
        const userThreads = centralThreads
          .filter(t => t.authorId === user.id)
          .map(t => ({
            ...t,
            author: currentUserInfo
          }));

        // Get user's products (if business)
        const userProducts = currentUserInfo.role === 'business' && currentUserInfo.businessId
          ? centralProducts.filter(prod => prod.businessId === currentUserInfo.businessId)
          : [];

        // Get user's followers (mock data)
        const userFollowers = mockOtherUsers
          .filter(u => u.id !== user.id)
          .slice(3, 8)
          .map(u => ({
            id: u.id,
            name: u.fullName,
            fullName: u.fullName,
            avatar: u.avatar,
            role: u.role,
            location: u.location,
            rating: u.rating,
            reviews: u.reviewsCount,
            followingSince: 'Jan 2026'
          }));

        // Get user's following (mock data)
        const userFollowing = mockOtherUsers
          .filter(u => u.id !== user.id)
          .slice(0, 3)
          .map(u => ({
            id: u.id,
            name: u.fullName,
            role: u.role,
            location: u.location,
            image: u.avatar,
            followers: u.followers,
            rating: u.rating,
            reviews: u.reviewsCount
          }));

        userData = {
          savedItems: user.id === 'me' ? [{
            id: '1',
            type: 'post',
            itemId: 'p1',
            title: 'Seasonal Promotion: 20% Off All Seedlings',
            image: 'https://images.unsplash.com/photo-1697788189761-d954ed91cdb8?w=1080',
            description: 'We are excited to announce our seasonal sale!',
            savedAt: new Date('2026-02-01')
          }] : [],
          followers: userFollowers,
          following: userFollowing,
          posts: userPosts,
          threads: userThreads,
          products: userProducts,
        };

        // Save to map
        setUserDataMap(prev => ({
          ...prev,
          [user.id]: userData,
        }));
      }

      setCurrentUserData(userData || getDefaultUserData());
    } else {
      setCurrentUserData(getDefaultUserData());
    }
  }, [user?.id, userDataMap]);

  // Save to localStorage whenever data changes
  useEffect(() => {
    if (Object.keys(userDataMap).length > 0) {
      localStorage.setItem('mashtal_user_data', JSON.stringify(userDataMap));
    }
  }, [userDataMap]);

  const updateUserData = (updater: (prev: UserData) => UserData) => {
    if (!user?.id) return;
    
    setUserDataMap(prev => {
      const currentData = prev[user.id] || getDefaultUserData();
      const updated = updater(currentData);
      return {
        ...prev,
        [user.id]: updated,
      };
    });
  };

  const addSavedItem = (item: SavedItem) => {
    updateUserData(prev => ({
      ...prev,
      savedItems: [...prev.savedItems, item],
    }));
  };

  const removeSavedItem = (itemId: string) => {
    updateUserData(prev => ({
      ...prev,
      savedItems: prev.savedItems.filter(item => item.id !== itemId),
    }));
  };

  const updateFollowers = (followers: any[]) => {
    updateUserData(prev => ({
      ...prev,
      followers,
    }));
  };

  const updateFollowing = (following: any[]) => {
    updateUserData(prev => ({
      ...prev,
      following,
    }));
  };

  const addPost = (post: any) => {
    updateUserData(prev => ({
      ...prev,
      posts: [post, ...prev.posts],
    }));
  };

  const addThread = (thread: any) => {
    updateUserData(prev => ({
      ...prev,
      threads: [thread, ...prev.threads],
    }));
  };

  const deletePost = (postId: string) => {
    updateUserData(prev => ({
      ...prev,
      posts: prev.posts.filter(p => p.id !== postId),
    }));
  };

  const deleteThread = (threadId: string) => {
    updateUserData(prev => ({
      ...prev,
      threads: prev.threads.filter(t => t.id !== threadId),
    }));
  };

  const updatePost = (postId: string, updatedData: any) => {
    updateUserData(prev => ({
      ...prev,
      posts: prev.posts.map(p => p.id === postId ? { ...p, ...updatedData } : p),
    }));
  };

  const updateThread = (threadId: string, updatedData: any) => {
    updateUserData(prev => ({
      ...prev,
      threads: prev.threads.map(t => t.id === threadId ? { ...t, ...updatedData } : t),
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
