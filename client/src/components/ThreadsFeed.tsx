import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Clock, Bookmark, X, Send, ThumbsUp, Reply as ReplyIcon, CheckCircle2, UserPlus, Check, Sparkles, Briefcase, User, Leaf, HardHat, Building2, Shield } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { mockThreads as centralThreads, otherUsers, currentUser, threadComments as centralComments } from '../data/centralMockData';
import { threadComments as detailedThreadComments, Comment, Reply } from '../data/threadsCommentsData';
import { VerifiedBadge } from './VerifiedBadge';

interface ThreadsFeedProps {
  onSaveThread?: (thread: any) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  userThreads?: any[];
  highlightThreadId?: string;
  onClearHighlight?: () => void;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: string;
  verified?: boolean;
}

// Mock users/businesses for mentions - pull from central
const mentionableUsers: MentionUser[] = [...otherUsers, currentUser].map(u => ({
  id: u.id,
  name: u.fullName,
  avatar: u.avatar,
  type: u.role || 'user',
  verified: u.verified
}));

// Helper function to count total comments including replies
const getTotalCommentCount = (comments: any[]): number => {
  return comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);
};

export function ThreadsFeed({ onSaveThread, onNavigateToBusiness, onNavigateToUserProfile, followedBusinesses, onFollowBusiness, userThreads = [], highlightThreadId, onClearHighlight }: ThreadsFeedProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Highlight state
  const [showHighlight, setShowHighlight] = useState(false);
  const highlightedThreadRef = useRef<HTMLDivElement>(null);
  
  // Format threads for the feed
  const allThreads = centralThreads.map(t => {
    const author = t.authorId === 'me' ? currentUser : otherUsers.find(u => u.id === t.authorId) || currentUser;
    
    // Safety check
    if (!author) {
      console.warn('[ThreadsFeed] Author not found for thread:', t.id);
      return null;
    }
    
    return {
      ...t,
      author: {
        id: author.id,
        name: author.fullName,
        avatar: author.avatar,
        verified: author.verified,
        type: author.role,
        businessId: author.businessId
      },
      comments: t.commentsCount
    };
  }).filter(Boolean); // Remove any null threads

  // Combine user threads with all threads from centralized data
  const combinedThreads = React.useMemo(() => {
    const formattedUserThreads = userThreads
      .filter(thread => thread && thread.id) // Filter out any invalid threads
      .map(thread => ({
        ...thread,
        author: {
          id: user?.id || 'me',
          name: user?.fullName || 'User',
          avatar: user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
          verified: user?.verified || false,
          type: user?.role || 'user',
          businessId: user?.businessId,
        },
        likes: thread.likes || 0,
        comments: thread.comments || 0,
        shares: thread.shares || 0,
        isLiked: false,
        isSaved: false,
      }));
    
    // Combine and sort by timestamp (newest first)
    const centralThreadsFiltered = allThreads.filter(ct => !userThreads.some(ut => ut.id === ct.id));
    let combined = [...formattedUserThreads, ...centralThreadsFiltered];
    combined = combined.sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeB - timeA; // Sort descending (newest first)
    });
    
    // If highlightThreadId is provided, move that thread to the top
    if (highlightThreadId) {
      const highlightedThreadIndex = combined.findIndex(t => t.id === highlightThreadId);
      if (highlightedThreadIndex > -1) {
        const [highlightedThread] = combined.splice(highlightedThreadIndex, 1);
        combined = [highlightedThread, ...combined];
      }
    }
    
    return combined;
  }, [userThreads, user, highlightThreadId]);
  
  const [threads, setThreads] = useState(combinedThreads);

  // Update threads when userThreads or combinedThreads change
  useEffect(() => {
    setThreads(combinedThreads);
  }, [combinedThreads]);
  
  // Initialize comments from centralized data
  const initialComments: { [key: string]: any[] } = {};
  
  // First, load detailed comments from threadsCommentsData
  Object.keys(detailedThreadComments).forEach(threadId => {
    const threadCommentsArray = detailedThreadComments[threadId];
    if (!initialComments[threadId]) initialComments[threadId] = [];
    
    threadCommentsArray.forEach(comment => {
      initialComments[threadId].push(comment);
    });
  });
  
  // Then, also load comments from centralComments for threads that don't have detailed comments
  Object.keys(centralComments).forEach(threadId => {
    // Only load if this thread doesn't already have detailed comments
    if (!initialComments[threadId] || initialComments[threadId].length === 0) {
      if (!initialComments[threadId]) initialComments[threadId] = [];
      const threadCommentsArray = centralComments[threadId];
      
      threadCommentsArray.forEach(comment => {
        const author = comment.userId === 'me' ? currentUser : otherUsers.find(u => u.id === comment.userId) || currentUser;
        initialComments[threadId].push({
          ...comment,
          author: {
            id: author.id,
            name: author.fullName,
            avatar: author.avatar,
            verified: author.verified,
            type: author.role,
            businessId: author.businessId
          },
          content: comment.text,
          replies: comment.replies || []
        });
      });
    }
  });

  const [commentsModalThread, setCommentsModalThread] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string; parentId?: string } | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [shareModalThread, setShareModalThread] = useState<any | null>(null);
  const [visibleThreads, setVisibleThreads] = useState(isAuthenticated ? threads.length : 44);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  // Mention functionality
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Mention functionality for edit mode
  const [showEditMentions, setShowEditMentions] = useState(false);
  const [editMentionSearch, setEditMentionSearch] = useState('');
  const [editMentionPosition, setEditMentionPosition] = useState(0);
  const [filteredEditMentions, setFilteredEditMentions] = useState<MentionUser[]>([]);
  const [selectedEditMentionIndex, setSelectedEditMentionIndex] = useState(0);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Comment scroll and highlight
  const commentsListRef = useRef<HTMLDivElement>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  // Handle mention search
  useEffect(() => {
    if (mentionSearch) {
      const filtered = mentionableUsers.filter(user =>
        user.name.toLowerCase().includes(mentionSearch.toLowerCase())
      );
      setFilteredMentions(filtered);
      setSelectedMentionIndex(0);
    } else {
      setFilteredMentions([]);
    }
  }, [mentionSearch]);

  // Handle edit mention search
  useEffect(() => {
    if (editMentionSearch) {
      const filtered = mentionableUsers.filter(user =>
        user.name.toLowerCase().includes(editMentionSearch.toLowerCase())
      );
      setFilteredEditMentions(filtered);
      setSelectedEditMentionIndex(0);
    } else {
      setFilteredEditMentions([]);
    }
  }, [editMentionSearch]);

  // Handle highlighted thread from profile, notification, or direct link navigation
  // This ensures the thread is loaded (even if not yet scrolled to) and highlighted
  useEffect(() => {
    if (highlightThreadId) {
      setShowHighlight(true);
      
      // Scroll to top since highlighted thread is now moved to the top
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      setShowHighlight(false);
    }
  }, [highlightThreadId]);

  const handleLike = (threadId: string) => {
    if (!isAuthenticated) {
      return; // Don't allow liking if not authenticated
    }
    setThreads(threads.map(thread =>
      thread.id === threadId
        ? { ...thread, likes: thread.isLiked ? thread.likes - 1 : thread.likes + 1, isLiked: !thread.isLiked }
        : thread
    ));
  };

  const handleSave = (thread: any) => {
    if (!isAuthenticated) {
      return; // Don't allow saving if not authenticated
    }
    setThreads(threads.map(t =>
      t.id === thread.id ? { ...t, isSaved: !t.isSaved } : t
    ));
    if (onSaveThread && !thread.isSaved) {
      onSaveThread({
        id: `saved-${thread.id}-${Date.now()}`,
        type: 'thread',
        itemId: thread.id,
        title: thread.title || thread.content.substring(0, 50) + (thread.content.length > 50 ? '...' : ''),
        image: thread.author.avatar,
        description: thread.content,
        savedAt: new Date(),
      });
    }
  };

  const handleShare = (thread: any) => {
    setShareModalThread(thread);
  };

  const openCommentsModal = (threadId: string) => {
    setCommentsModalThread(threadId);
    setShowAllComments(false);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
  };

  const closeCommentsModal = () => {
    setCommentsModalThread(null);
    setReplyingTo(null);
    setNewComment('');
    setShowAllComments(false);
    // Restore body scroll when modal is closed
    document.body.style.overflow = '';
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setNewComment(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setMentionSearch(textAfterAt);
        setMentionPosition(lastAtIndex);
        setShowMentions(true);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (mentionUser: MentionUser) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(mentionPosition + mentionSearch.length + 1);
    const newValue = `${beforeMention}@${mentionUser.name} ${afterMention}`;
    
    setNewComment(newValue);
    setShowMentions(false);
    setMentionSearch('');
    
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 0);
  };

  const handleEditCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setEditContent(value);

    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      if (!textAfterAt.includes(' ')) {
        setEditMentionSearch(textAfterAt);
        setEditMentionPosition(lastAtIndex);
        setShowEditMentions(true);
      } else {
        setShowEditMentions(false);
      }
    } else {
      setShowEditMentions(false);
    }
  };

  const insertEditMention = (mentionUser: MentionUser) => {
    const beforeMention = editContent.substring(0, editMentionPosition);
    const afterMention = editContent.substring(editMentionPosition + editMentionSearch.length + 1);
    const newValue = `${beforeMention}@${mentionUser.name} ${afterMention}`;
    
    setEditContent(newValue);
    setShowEditMentions(false);
    setEditMentionSearch('');
    
    setTimeout(() => {
      editTextareaRef.current?.focus();
    }, 0);
  };

  const handleMentionKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || filteredMentions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev < filteredMentions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredMentions.length - 1
      );
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      insertMention(filteredMentions[selectedMentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
    }
  };

  const handleEditMentionKeyDown = (e: React.KeyboardEvent) => {
    if (!showEditMentions || filteredEditMentions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedEditMentionIndex(prev => 
        prev < filteredEditMentions.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedEditMentionIndex(prev => 
        prev > 0 ? prev - 1 : filteredEditMentions.length - 1
      );
    } else if (e.key === 'Enter' && showEditMentions) {
      e.preventDefault();
      insertEditMention(filteredEditMentions[selectedEditMentionIndex]);
    } else if (e.key === 'Escape') {
      setShowEditMentions(false);
    }
  };

  const canReply = () => {
    // Only authenticated users can reply
    return isAuthenticated;
  };

  // Function to highlight mentions in text
  const renderTextWithMentions = (text: string) => {
    // Safety check for undefined or null text
    if (!text || typeof text !== 'string') return text || '';
    
    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;

    // Find all @ symbols and try to match them against known users
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '@') {
        // Add text before this mention
        if (i > currentIndex) {
          parts.push(text.substring(currentIndex, i));
        }

        // Try to find the longest matching username after @
        let matchedUser: typeof mentionableUsers[0] | null = null;
        let matchedName = '';
        
        // Get text after @
        const textAfterAt = text.substring(i + 1);
        
        // Try to match against mentionable users
        for (const user of mentionableUsers) {
          if (textAfterAt.toLowerCase().startsWith(user.name.toLowerCase())) {
            if (user.name.length > matchedName.length) {
              matchedUser = user;
              matchedName = user.name;
            }
          }
        }

        if (matchedUser && matchedName) {
          // Found a match - render as clickable mention
          const mentionableUser = matchedUser as MentionUser;
          parts.push(
            <span
              key={`mention-${i}`}
              className="text-green-600 font-medium cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                setCommentsModalThread(null);
                
                // Navigate based on user type
                if (mentionableUser.type === 'business' && onNavigateToBusiness) {
                  onNavigateToBusiness(matchedUser.id);
                } else if ((mentionableUser.type === 'engineer' || mentionableUser.type === 'agronomist') && onNavigateToBusiness) {
                  onNavigateToBusiness(matchedUser.id);
                } else if (onNavigateToUserProfile) {
                  onNavigateToUserProfile(matchedUser.id);
                }
              }}
            >
              @{matchedName}
            </span>
          );
          currentIndex = i + 1 + matchedName.length;
          i = currentIndex - 1; // Skip past the mention
        } else {
          // No match found, just add @ as regular text
          parts.push('@');
          currentIndex = i + 1;
        }
      }
    }

    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }

    return parts;
  };

  const handleProfileClick = (commentAuthor: { name: string; avatar: string; type: string; verified?: boolean; id?: string; businessId?: string }) => {
    console.log('[ThreadsFeed] handleProfileClick called with:', {
      name: commentAuthor?.name,
      type: commentAuthor?.type,
      id: commentAuthor?.id,
      businessId: commentAuthor?.businessId
    });
    
    // Safety check
    if (!commentAuthor || !commentAuthor.type) {
      console.warn('[ThreadsFeed] Invalid commentAuthor:', commentAuthor);
      return;
    }
    
    // Close comments modal first
    closeCommentsModal();
    
    // Navigate based on author type
    // For businesses, use businessId
    if (commentAuthor.type === 'business' && commentAuthor.businessId && onNavigateToBusiness) {
      console.log('[ThreadsFeed] Navigating to business:', commentAuthor.businessId);
      onNavigateToBusiness(commentAuthor.businessId);
      return;
    }
    
    // For engineers and agronomists, use their id to navigate to business-style pages
    if ((commentAuthor.type === 'engineer' || commentAuthor.type === 'agronomist') && commentAuthor.id && onNavigateToBusiness) {
      console.log('[ThreadsFeed] Navigating to engineer/agronomist profile:', commentAuthor.id);
      onNavigateToBusiness(commentAuthor.id);
      return;
    }
    
    // For regular users, navigate to user profile
    if (commentAuthor.id && onNavigateToUserProfile) {
      console.log('[ThreadsFeed] Navigating to user profile:', commentAuthor.id);
      onNavigateToUserProfile(commentAuthor.id);
      return;
    }
    
    console.warn('[ThreadsFeed] No navigation performed for:', commentAuthor);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !commentsModalThread) return;

    const thread = threads.find(t => t.id === commentsModalThread);
    if (!thread) return;

    const newCommentObj: Comment = {
      id: Date.now().toString(),
      author: {
        id: user?.id,
        name: user?.fullName || 'User',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
        verified: user?.verified || false,
        type: user?.role || 'user',
        businessId: user?.businessId,
      },
      content: newComment,
      timeAgo: 'Just now',
      likes: 0,
      isLiked: false,
      replies: [],
    };

    if (replyingTo) {
      const reply: Reply = {
        id: Date.now().toString(),
        author: {
          id: user?.id,
          name: user?.fullName || 'User',
          avatar: user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
          verified: user?.verified || false,
          type: user?.role || 'user',
          businessId: user?.businessId,
        },
        content: `@${replyingTo.author} ${newComment}`,
        timeAgo: 'Just now',
        likes: 0,
        isLiked: false,
      };

      setComments(prev => ({
        ...prev,
        [commentsModalThread]: prev[commentsModalThread]?.map(comment => {
          if (comment.id === (replyingTo.parentId || replyingTo.id)) {
            return {
              ...comment,
              replies: [...comment.replies, reply],
            };
          }
          return comment;
        }) || [],
      }));

      setExpandedReplies(prev => new Set([...prev, replyingTo.parentId || replyingTo.id]));
    } else {
      setComments(prev => ({
        ...prev,
        [commentsModalThread]: [...(prev[commentsModalThread] || []), newCommentObj],
      }));
    }

    setThreads(threads.map(t =>
      t.id === commentsModalThread ? { ...t, comments: t.comments + 1 } : t
    ));

    setNewComment('');
    setReplyingTo(null);
  };

  const handleLikeComment = (threadId: string, commentId: string, isReply: boolean = false, parentId?: string) => {
    setComments(prev => ({
      ...prev,
      [threadId]: prev[threadId]?.map(comment => {
        if (isReply && comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? { ...reply, likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1, isLiked: !reply.isLiked }
                : reply
            ),
          };
        }
        if (comment.id === commentId) {
          return {
            ...comment,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
            isLiked: !comment.isLiked,
          };
        }
        return comment;
      }) || [],
    }));
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const handleDeleteComment = (threadId: string, commentId: string, isReply: boolean = false, parentId?: string) => {
    if (isReply && parentId) {
      setComments(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== commentId),
            };
          }
          return comment;
        }) || [],
      }));
    } else {
      setComments(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.filter(comment => comment.id !== commentId) || [],
      }));
    }

    setThreads(threads.map(t =>
      t.id === threadId ? { ...t, comments: Math.max(0, t.comments - 1) } : t
    ));
  };

  const handleEditComment = (commentId: string, currentContent: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentContent);
  };

  const handleSaveEdit = (threadId: string, isReply: boolean = false, parentId?: string) => {
    if (!editContent.trim()) return;

    if (isReply && parentId) {
      setComments(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies.map(reply =>
                reply.id === editingCommentId
                  ? { ...reply, content: editContent, edited: true }
                  : reply
              ),
            };
          }
          return comment;
        }) || [],
      }));
    } else {
      setComments(prev => ({
        ...prev,
        [threadId]: prev[threadId]?.map(comment =>
          comment.id === editingCommentId
            ? { ...comment, content: editContent, edited: true }
            : comment
        ) || [],
      }));
    }

    setEditingCommentId(null);
    setEditContent('');
  };

  const formatTime = (timestamp: string) => {
    // Safety check
    if (!timestamp) return 'Unknown';
    
    try {
      const date = new Date(timestamp);
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) return 'Unknown';
      
      const diff = now.getTime() - date.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      if (days < 30) return `${Math.floor(days / 7)}w ago`;
      if (days < 365) return `${Math.floor(days / 30)}mo ago`;
      return `${Math.floor(days / 365)}y ago`;
    } catch (error) {
      console.error('[ThreadsFeed] Error formatting time:', error);
      return 'Unknown';
    }
  };

  const handleAuthorClick = (author: any) => {
    // Safety check
    if (!author || !author.id) {
      console.warn('[ThreadsFeed] Invalid author in handleAuthorClick:', author);
      return;
    }
    
    // Check if this is the current user's thread
    if (user && author.id === user.id) {
      // Navigate to current user's profile
      if (onNavigateToUserProfile) {
        onNavigateToUserProfile(user.id);
      }
      return;
    }
    
    if (author.type === 'business' && author.businessId && onNavigateToBusiness) {
      onNavigateToBusiness(author.businessId);
    } else if ((author.type === 'engineer' || author.type === 'agronomist') && author.id && onNavigateToBusiness) {
      // Engineers and agronomists also have business-style pages
      onNavigateToBusiness(author.id);
    } else if (author.id && onNavigateToUserProfile) {
      onNavigateToUserProfile(author.id);
    }
  };

  const handleFollow = (author: any) => {
    if (!isAuthenticated) return;
    
    onFollowBusiness({
      id: author.id || author.businessId,
      name: author.name,
      role: author.type,
      location: 'Saudi Arabia',
      image: author.avatar,
      rating: 4.8,
      reviews: 100,
      followers: 1000,
    });
  };

  const isFollowingAuthor = (author: any) => {
    const id = author.id || author.businessId;
    return followedBusinesses.some(b => b.id === id);
  };

  // Check if thread is by current user
  const isOwnThread = (author: any) => {
    if (!user) return false;
    return user.id === author.id || user.businessId === author.id;
  };

  const getRoleIcon = (type: string) => {
    switch (type) {
      case 'business':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'agronomist':
        return <Leaf className="w-4 h-4 text-green-600" />;
      case 'engineer':
        return <HardHat className="w-4 h-4 text-orange-600" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-neutral-500" />;
    }
  };

  // Prepare displayed threads with highlighted thread at top if needed
  const displayedThreads = React.useMemo(() => {
    const slicedThreads = threads.slice(0, visibleThreads);
    
    // If there's a highlighted thread, ensure it's visible and at the top
    if (highlightThreadId) {
      const highlightedThread = threads.find(t => t.id === highlightThreadId);
      if (highlightedThread) {
        // Either way, we want it at the top for visibility and highlighting
        const filteredThreads = slicedThreads.filter(t => t.id !== highlightThreadId);
        return [highlightedThread, ...filteredThreads];
      }
    }
    
    return slicedThreads;
  }, [threads, visibleThreads, highlightThreadId]);
  
  const currentModalThread = threads.find(t => t.id === commentsModalThread);
  const threadComments = comments[commentsModalThread || ''] || [];
  const displayedComments = showAllComments ? threadComments : threadComments.slice(0, 15);
  const totalCommentsInModal = getTotalCommentCount(threadComments);

  return (
    <>
      <div className="space-y-6">
        {displayedThreads.map((thread) => {
          const totalComments = getTotalCommentCount(comments[thread.id] || []);
          const isHighlighted = highlightThreadId === thread.id && showHighlight;
          
          return (
            <article 
              key={thread.id} 
              id={`thread-${thread.id}`} 
              ref={isHighlighted ? highlightedThreadRef : null}
              className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-500 ${
                isHighlighted 
                  ? 'border-green-500 shadow-xl ring-4 ring-green-500 ring-offset-2' 
                  : 'border-neutral-200'
              }`}
            >
              {/* Thread Header */}
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  {/* Profile picture with role icon at bottom-right */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => handleAuthorClick(thread.author)}
                      className="block"
                    >
                      <img
                        src={thread.author.avatar}
                        alt={thread.author.name}
                        className="w-14 h-14 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                      />
                    </button>
                    <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md">
                      {getRoleIcon(thread.author.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                      {/* Username row with verified badge */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAuthorClick(thread.author)}
                          className="font-medium text-neutral-900 hover:text-green-600 transition-colors truncate text-left"
                        >
                          {thread.author.name}
                        </button>
                        {thread.author.verified && (
                          <VerifiedBadge />
                        )}
                      </div>
                      {/* Role name under username */}
                      <span className="text-xs text-neutral-500 capitalize">
                        {thread.author.type === 'business' ? 'Business' : 
                         thread.author.type === 'engineer' ? 'Engineer' : 
                         thread.author.type === 'agronomist' ? 'Agronomist' :
                         thread.author.type === 'admin' ? 'Administrator' : 'User'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <time>{formatTime(thread.timestamp)}</time>
                    </div>
                  </div>
                  {isAuthenticated && (thread.author.type === 'business' || thread.author.type === 'engineer' || thread.author.type === 'agronomist') && !isOwnThread(thread.author) && !isFollowingAuthor(thread.author) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleFollow(thread.author)}
                      className="flex items-center gap-2 ml-auto"
                    >
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </Button>
                  )}
                  {isAuthenticated && (thread.author.type === 'business' || thread.author.type === 'engineer' || thread.author.type === 'agronomist') && !isOwnThread(thread.author) && isFollowingAuthor(thread.author) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 bg-green-50 border-green-600 text-green-600 ml-auto"
                      disabled
                    >
                      <Check className="w-4 h-4" />
                      Following
                    </Button>
                  )}
                </div>

                {/* Thread Title */}
                {thread.title && (
                  <h2 className="text-xl font-semibold text-neutral-900 mb-3">
                    {thread.title}
                  </h2>
                )}

                {/* Thread Content */}
                <p className="text-neutral-800 whitespace-pre-wrap">{thread.content}</p>

                {/* Hashtags */}
                {thread.tags && thread.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4 mb-4">
                    {thread.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-6 pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => handleLike(thread.id)}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 transition-colors ${
                      !isAuthenticated 
                        ? 'cursor-not-allowed opacity-50' 
                        : thread.isLiked 
                        ? 'text-red-600' 
                        : 'text-neutral-600 hover:text-red-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to like threads' : ''}
                  >
                    <Heart className={`w-5 h-5 ${thread.isLiked ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{thread.likes}</span>
                  </button>
                  <button
                    onClick={() => openCommentsModal(thread.id)}
                    data-comments-button
                    className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors"
                  >
                    <MessageCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">{totalComments}</span>
                  </button>
                  <button
                    onClick={() => handleShare(thread)}
                    disabled={!isAuthenticated}
                    className={`flex items-center gap-2 transition-colors ${
                      !isAuthenticated 
                        ? 'text-neutral-400 cursor-not-allowed' 
                        : 'text-neutral-600 hover:text-blue-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to share' : 'Share thread'}
                  >
                    <Send className="w-5 h-5" />
                    <span className="text-sm font-medium">{thread.shares}</span>
                  </button>
                  <button
                    onClick={() => handleSave(thread)}
                    disabled={!isAuthenticated}
                    className={`ml-auto flex items-center gap-2 transition-colors ${
                      !isAuthenticated
                        ? 'cursor-not-allowed opacity-50'
                        : thread.isSaved 
                        ? 'text-green-600' 
                        : 'text-neutral-600 hover:text-green-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to save threads' : ''}
                  >
                    <Bookmark className={`w-5 h-5 ${thread.isSaved ? 'fill-current' : ''}`} />
                    <span className="text-sm font-medium">{thread.isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        
        {/* Load More Threads */}
        {visibleThreads < threads.length && (
          <div className="text-center mt-8">
            <button
              onClick={() => setVisibleThreads(prev => Math.min(prev + 10, threads.length))}
              className="px-8 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:border-green-600 hover:text-green-600 transition-colors"
            >
              {isAuthenticated ? 'Load More Threads' : 'Sign in to view more'}
            </button>
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {commentsModalThread && currentModalThread && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={closeCommentsModal}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl text-neutral-900 font-semibold">
                Comments ({totalCommentsInModal})
              </h3>
              <button
                onClick={closeCommentsModal}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
              {displayedComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <>
                  {displayedComments.map((comment) => (
                    <div key={comment.id} className="space-y-3">
                      {/* Main Comment */}
                      <div className="flex gap-3">
                        {/* Profile picture with role icon at bottom-right */}
                        <div className="relative flex-shrink-0">
                          <button
                            onClick={() => handleProfileClick(comment.author)}
                            className="block"
                          >
                            <img
                              src={comment.author.avatar}
                              alt={comment.author.name}
                              className="w-11 h-11 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                            />
                          </button>
                          <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full shadow-md">
                            {getRoleIcon(comment.author.type || 'user')}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="bg-neutral-50 rounded-2xl p-3">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span
                                className="text-neutral-900 font-medium cursor-pointer hover:text-green-600 transition-colors"
                                onClick={() => handleProfileClick(comment.author)}
                              >
                                {comment.author.name}
                              </span>
                              {comment.author.verified && (
                                <VerifiedBadge className="text-[10px]" />
                              )}
                              <span className="text-xs text-neutral-500">
                                {comment.timeAgo}
                                {comment.edited && ' · Edited'}
                              </span>
                            </div>
                            {editingCommentId === comment.id ? (
                              <div className="space-y-2">
                                <div className="relative">
                                  <Textarea
                                    ref={editTextareaRef}
                                    value={editContent}
                                    onChange={handleEditCommentChange}
                                    onKeyDown={handleEditMentionKeyDown}
                                    className="w-full min-h-[60px]"
                                  />
                                  {showEditMentions && filteredEditMentions.length > 0 && (
                                    <div className="absolute bottom-full left-0 mb-2 w-80 bg-white rounded-lg shadow-lg border border-neutral-200 max-h-60 overflow-y-auto z-50">
                                      {filteredEditMentions.map((mentionUser, index) => (
                                        <button
                                          key={mentionUser.id}
                                          onClick={() => insertEditMention(mentionUser)}
                                          className={`w-full flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors ${
                                            index === selectedEditMentionIndex ? 'bg-neutral-50' : ''
                                          }`}
                                        >
                                          <img
                                            src={mentionUser.avatar}
                                            alt={mentionUser.name}
                                            className="w-8 h-8 rounded-full object-cover"
                                          />
                                          <div className="flex-1 text-left">
                                            <div className="flex items-center gap-1">
                                              <span className="text-sm font-medium text-neutral-900">
                                                {mentionUser.name}
                                              </span>
                                              {mentionUser.verified && (
                                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                              )}
                                            </div>
                                            <span className="text-xs text-neutral-500 capitalize">
                                              {mentionUser.type}
                                            </span>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveEdit(commentsModalThread)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setEditingCommentId(null);
                                      setEditContent('');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-neutral-700">{renderTextWithMentions(comment.content)}</p>
                            )}
                          </div>
                          
                          {/* Comment Actions */}
                          {editingCommentId !== comment.id && (
                            <div className="flex items-center gap-4 mt-2 px-2">
                              <button
                                onClick={() => handleLikeComment(commentsModalThread, comment.id)}
                                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                  comment.isLiked ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                                }`}
                              >
                                <ThumbsUp className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                                <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
                              </button>
                              {canReply() && (
                                <button
                                  onClick={() => setReplyingTo({ id: comment.id, author: comment.author.name })}
                                  className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                >
                                  <ReplyIcon className="w-4 h-4" />
                                  <span>Reply</span>
                                </button>
                              )}
                              {comment.author.name === (user?.fullName || 'User') && (
                                <button
                                  onClick={() => handleEditComment(comment.id, comment.content)}
                                  className="text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          )}

                          {/* Replies Section */}
                          {comment.replies && comment.replies.length > 0 && (
                            <div className="mt-3 space-y-3">
                              {/* Show first reply or all replies if expanded */}
                              {(expandedReplies.has(comment.id) ? comment.replies : comment.replies.slice(0, 1)).map((reply) => (
                                <div key={reply.id} className="flex gap-2 ml-4 border-l-2 border-neutral-200 pl-3">
                                  {/* Profile picture with role icon at bottom-right */}
                                  <div className="relative flex-shrink-0">
                                    <img
                                      src={reply.author.avatar}
                                      alt={reply.author.name}
                                      onClick={() => handleProfileClick(reply.author)}
                                      draggable="false"
                                      className="w-9 h-9 rounded-full object-cover select-none cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                                    />
                                    <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full shadow-md">
                                      {getRoleIcon(reply.author.type || 'user')}
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <div className="bg-neutral-50 rounded-xl p-2">
                                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                                        <span
                                          className="text-neutral-900 text-sm font-medium cursor-pointer hover:text-green-600 transition-colors"
                                          onClick={() => handleProfileClick(reply.author)}
                                        >
                                          {reply.author.name}
                                        </span>
                                        {reply.author.verified && (
                                          <VerifiedBadge className="text-[10px]" />
                                        )}
                                        <span className="text-xs text-neutral-500">
                                          {reply.timeAgo}
                                          {reply.edited && ' · Edited'}
                                        </span>
                                      </div>
                                      <p className="text-neutral-700 text-sm">{renderTextWithMentions(reply.content)}</p>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 px-2">
                                      <button
                                        onClick={() => handleLikeComment(commentsModalThread, reply.id, true, comment.id)}
                                        className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                          reply.isLiked ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                                        }`}
                                      >
                                        <ThumbsUp className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                        <span>{reply.likes > 0 ? reply.likes : 'Like'}</span>
                                      </button>
                                      {canReply() && (
                                        <button
                                          onClick={() => setReplyingTo({ id: reply.id, author: reply.author.name, parentId: comment.id })}
                                          className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                        >
                                          <ReplyIcon className="w-3 h-3" />
                                          <span>Reply</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}

                              {/* View More Replies Button */}
                              {comment.replies.length > 1 && !expandedReplies.has(comment.id) && (
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="ml-4 pl-3 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors flex items-center gap-1 border-l-2 border-neutral-200"
                                >
                                  ──── View {comment.replies.length - 1} more {comment.replies.length - 1 === 1 ? 'reply' : 'replies'}
                                </button>
                              )}

                              {/* Hide Replies Button */}
                              {expandedReplies.has(comment.id) && comment.replies.length > 1 && (
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="ml-4 pl-3 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors flex items-center gap-1 border-l-2 border-neutral-200"
                                >
                                  ──── Hide replies
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Load More Comments */}
                  {threadComments.length > 15 && !showAllComments && (
                    <button
                      onClick={() => setShowAllComments(true)}
                      className="w-full py-2 text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      Load more comments ({threadComments.length - 15})
                    </button>
                  )}
                </>
              )}
            </div>

            {/* Add Comment - Fixed at bottom */}
            <div className="p-6 border-t border-neutral-200 flex-shrink-0 bg-white relative">
              {isAuthenticated ? (
                <div className="space-y-3">
                  {replyingTo && (
                    <div className="flex items-center justify-between bg-green-50 px-3 py-2 rounded-lg">
                      <span className="text-sm text-neutral-700 font-medium">
                        Replying to @{replyingTo.author}
                      </span>
                      <button
                        onClick={() => {
                          setReplyingTo(null);
                          setNewComment('');
                        }}
                        className="text-neutral-500 hover:text-neutral-700"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* Mention Dropdown */}
                  {showMentions && filteredMentions.length > 0 && (
                    <div className="absolute bottom-full left-6 right-6 mb-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-10">
                      {filteredMentions.map((mentionUser, index) => (
                        <button
                          key={mentionUser.id}
                          onClick={() => insertMention(mentionUser)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                            index === selectedMentionIndex ? 'bg-green-50' : ''
                          }`}
                        >
                          <img
                            src={mentionUser.avatar}
                            alt={mentionUser.name}
                            draggable="false"
                            className="w-8 h-8 rounded-full object-cover select-none"
                          />
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-neutral-900">{mentionUser.name}</span>
                              {mentionUser.verified && (
                                <CheckCircle2 className="w-3 h-3 text-green-600 fill-current" />
                              )}
                            </div>
                            <span className="text-xs text-neutral-500 capitalize">{mentionUser.type}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Textarea
                      ref={textareaRef}
                      value={newComment}
                      onChange={handleCommentChange}
                      onKeyDown={handleMentionKeyDown}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey && !showMentions) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      placeholder="Write a comment... (Type @ to mention)"
                      className="flex-1 min-h-[80px] resize-none"
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="self-end"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 bg-neutral-50 rounded-lg">
                  <p className="text-neutral-600">Please sign in to comment</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {shareModalThread && (
        <ShareModal
          isOpen={!!shareModalThread}
          onClose={() => setShareModalThread(null)}
          postUrl={`/threads/${shareModalThread.id}`}
          postTitle={shareModalThread.title || shareModalThread.content.substring(0, 50)}
        />
      )}
    </>
  );
}