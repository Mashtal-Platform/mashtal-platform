import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PostInteractions {
  likes: Set<string>;
  saves: Set<string>;
  postLikeCounts: { [postId: string]: number };
  postCommentCounts: { [postId: string]: number };
  postShareCounts: { [postId: string]: number };
}

interface PostInteractionsContextType {
  interactions: PostInteractions;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  incrementCommentCount: (postId: string) => void;
  decrementCommentCount: (postId: string) => void;
  incrementShareCount: (postId: string) => void;
  isLiked: (postId: string) => boolean;
  isSaved: (postId: string) => boolean;
  getLikeCount: (postId: string, initialCount: number) => number;
  getCommentCount: (postId: string, initialCount: number) => number;
  getShareCount: (postId: string, initialCount: number) => number;
}

const PostInteractionsContext = createContext<PostInteractionsContextType | undefined>(undefined);

export function PostInteractionsProvider({ children }: { children: ReactNode }) {
  const [interactions, setInteractions] = useState<PostInteractions>({
    likes: new Set<string>(),
    saves: new Set<string>(),
    postLikeCounts: {},
    postCommentCounts: {},
    postShareCounts: {},
  });

  const toggleLike = (postId: string) => {
    setInteractions(prev => {
      const newLikes = new Set(prev.likes);
      const newLikeCounts = { ...prev.postLikeCounts };
      
      if (newLikes.has(postId)) {
        newLikes.delete(postId);
        newLikeCounts[postId] = (newLikeCounts[postId] || 0) - 1;
      } else {
        newLikes.add(postId);
        newLikeCounts[postId] = (newLikeCounts[postId] || 0) + 1;
      }
      
      return {
        ...prev,
        likes: newLikes,
        postLikeCounts: newLikeCounts,
      };
    });
  };

  const toggleSave = (postId: string) => {
    setInteractions(prev => {
      const newSaves = new Set(prev.saves);
      
      if (newSaves.has(postId)) {
        newSaves.delete(postId);
      } else {
        newSaves.add(postId);
      }
      
      return {
        ...prev,
        saves: newSaves,
      };
    });
  };

  const incrementCommentCount = (postId: string) => {
    setInteractions(prev => ({
      ...prev,
      postCommentCounts: {
        ...prev.postCommentCounts,
        [postId]: (prev.postCommentCounts[postId] || 0) + 1,
      },
    }));
  };

  const decrementCommentCount = (postId: string) => {
    setInteractions(prev => ({
      ...prev,
      postCommentCounts: {
        ...prev.postCommentCounts,
        [postId]: Math.max(0, (prev.postCommentCounts[postId] || 0) - 1),
      },
    }));
  };

  const incrementShareCount = (postId: string) => {
    setInteractions(prev => ({
      ...prev,
      postShareCounts: {
        ...prev.postShareCounts,
        [postId]: (prev.postShareCounts[postId] || 0) + 1,
      },
    }));
  };

  const isLiked = (postId: string) => interactions.likes.has(postId);
  const isSaved = (postId: string) => interactions.saves.has(postId);
  
  const getLikeCount = (postId: string, initialCount: number) => {
    return initialCount + (interactions.postLikeCounts[postId] || 0);
  };
  
  const getCommentCount = (postId: string, initialCount: number) => {
    return initialCount + (interactions.postCommentCounts[postId] || 0);
  };
  
  const getShareCount = (postId: string, initialCount: number) => {
    return initialCount + (interactions.postShareCounts[postId] || 0);
  };

  return (
    <PostInteractionsContext.Provider
      value={{
        interactions,
        toggleLike,
        toggleSave,
        incrementCommentCount,
        decrementCommentCount,
        incrementShareCount,
        isLiked,
        isSaved,
        getLikeCount,
        getCommentCount,
        getShareCount,
      }}
    >
      {children}
    </PostInteractionsContext.Provider>
  );
}

export function usePostInteractions() {
  const context = useContext(PostInteractionsContext);
  if (context === undefined) {
    throw new Error('usePostInteractions must be used within a PostInteractionsProvider');
  }
  return context;
}
