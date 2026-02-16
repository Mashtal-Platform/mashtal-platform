import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Clock, Bookmark, X, Send, ThumbsUp, Reply as ReplyIcon, CheckCircle2, UserPlus, Check, Sparkles, Briefcase, User, Leaf, HardHat, Building2, Shield } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { mockPosts as centralPosts, otherUsers, currentUser, mockComments as centralComments } from '../data/centralMockData';
import { postComments as detailedComments } from '../data/commentsData';
import { VerifiedBadge } from './VerifiedBadge';

interface PostsFeedProps {
  onSavePost?: (post: any) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  userPosts?: any[];
  highlightPostId?: string;
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

export function PostsFeed({ 
  onSavePost, 
  onNavigateToBusiness, 
  onNavigateToUserProfile, 
  followedBusinesses, 
  onFollowBusiness, 
  userPosts = [],
  highlightPostId,
  onClearHighlight
}: PostsFeedProps) {
  const { user, isAuthenticated } = useAuth();
  
  // Format posts for the feed
  const allPosts = centralPosts.map(p => {
    const author = p.authorId === 'me' ? currentUser : otherUsers.find(u => u.id === p.authorId) || currentUser;
    return {
      ...p,
      author: {
        id: author.id,
        name: author.fullName,
        avatar: author.avatar,
        verified: author.verified,
        type: author.role,
        businessId: author.businessId
      },
      comments: p.commentsCount // Map field names if different
    };
  });

  // Combine user posts with all posts from centralized data
  const combinedPosts = React.useMemo(() => {
    const formattedUserPosts = userPosts.map(post => ({
      ...post,
      author: {
        id: user?.id || 'me',
        name: user?.fullName || 'User',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
        verified: user?.verified || false,
        type: user?.role || 'user',
        businessId: user?.businessId,
      },
      tags: post.tags || [],
      likes: post.likes || 0,
      comments: post.comments || 0,
      shares: post.shares || 0,
      isLiked: false,
      isSaved: false,
    }));
    
    // Filter out duplicates from central posts if userPosts already has them
    const centralPostsFiltered = allPosts.filter(cp => !userPosts.some(up => up.id === cp.id));
    let combined = [...formattedUserPosts, ...centralPostsFiltered];
    
    // If highlightPostId is provided, move that post to the top
    if (highlightPostId) {
      const highlightedPostIndex = combined.findIndex(p => p.id === highlightPostId);
      if (highlightedPostIndex > -1) {
        const [highlightedPost] = combined.splice(highlightedPostIndex, 1);
        combined = [highlightedPost, ...combined];
      }
    }
    
    return combined;
  }, [userPosts, user, highlightPostId]);
  
  const [posts, setPosts] = useState(combinedPosts);

  // Update posts when userPosts or combinedPosts change
  useEffect(() => {
    setPosts(combinedPosts);
  }, [combinedPosts]);
  
  // Initialize comments from centralized data
const initialComments: { [key: string]: any[] } = {};

// First, load detailed comments from commentsData (which use post IDs like 'p1', 'p2', 'p3', etc.)
Object.keys(detailedComments).forEach(postId => {
  const postCommentsArray = detailedComments[postId];
  
  if (!initialComments[postId]) initialComments[postId] = [];

  postCommentsArray.forEach(comment => {
    initialComments[postId].push(comment);
  });
});

// Then, also load comments from centralComments for posts that don't have detailed comments
Object.keys(centralComments).forEach(postId => {
  // Only load if this post doesn't already have detailed comments
  if (!initialComments[postId] || initialComments[postId].length === 0) {
    // Ensure it's always an array
    const postCommentsArray = Array.isArray(centralComments[postId]) ? centralComments[postId] : [];
    
    if (!initialComments[postId]) initialComments[postId] = [];

    postCommentsArray.forEach(comment => {
      const author = comment.userId === 'me'
        ? currentUser
        : otherUsers.find(u => u.id === comment.userId) || currentUser;

      initialComments[postId].push({
        ...comment,
        author: author.fullName,
        avatar: author.avatar,
        userType: author.role,
        isVerified: author.verified,
        userId: author.id,
        text: comment.text,
        replies: Array.isArray(comment.replies) ? comment.replies : [],
      });
    });
  }
});

  const [commentsModalPost, setCommentsModalPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string; parentId?: string } | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [shareModalPost, setShareModalPost] = useState<any | null>(null);
  const [visiblePosts, setVisiblePosts] = useState(isAuthenticated ? posts.length : 44);
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
  
  // Image hold-to-zoom
  const [holdingImage, setHoldingImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Highlighted post from profile navigation
  const [showHighlight, setShowHighlight] = useState(false);
  const highlightedPostRef = useRef<HTMLDivElement>(null);

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (commentsModalPost) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [commentsModalPost]);

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

  // Handle mention search for edit mode
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

  // Handle highlighted post from profile, notification, or direct link navigation
  // This ensures the post is loaded (even if not yet scrolled to) and highlighted
  useEffect(() => {
    if (highlightPostId) {
      setShowHighlight(true);
      
      // Scroll to highlighted post after a delay to ensure DOM is ready
      // Since the post is now moved to the top, scroll to top of page
      setTimeout(() => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      }, 100);
    } else {
      setShowHighlight(false);
    }
  }, [highlightPostId]);

  const handleFollow = (post: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      return;
    }

    // Pass the author as the entity to follow
    onFollowBusiness({
      id: post.author.id,
      name: post.author.name,
      role: post.author.type,
      location: post.author.location || 'Saudi Arabia',
      image: post.author.avatar,
      rating: post.author.rating || 4.8,
      reviews: post.author.reviews || 100,
      followers: post.author.followers || 1000,
    });
  };

  const isFollowingBusiness = (businessId: string) => {
    return followedBusinesses.some(b => b.id === businessId);
  };

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setNewComment(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @, if so, don't show mentions
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
    
    // Focus back on textarea
    setTimeout(() => {
      textareaRef.current?.focus();
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

  const handleEditCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    setEditContent(value);

    // Check for @ mention
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space after @, if so, don't show mentions
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
    
    // Focus back on textarea
    setTimeout(() => {
      editTextareaRef.current?.focus();
    }, 0);
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

  const canReply = (commentUserId: string) => {
    // All authenticated users can reply to any comment
    return isAuthenticated;
  };

  const handlePostAuthorClick = (post: any) => {
    // Check if this is the current user's post
    if (user && post.author.id === user.id) {
      // Navigate to current user's profile
      if (onNavigateToUserProfile) {
        onNavigateToUserProfile(user.id);
      }
      return;
    }
    
    // Check if the author is a business or engineer (they have business pages)
    if (post.author.type === 'business' && post.author.businessId && onNavigateToBusiness) {
      onNavigateToBusiness(post.author.businessId);
    } 
    // Otherwise navigate to user profile
    else if (post.author.id && onNavigateToUserProfile) {
      onNavigateToUserProfile(post.author.id);
    }
  };

  const handleProfileClick = (comment: Comment | Reply) => {
    // Safety check
    if (!comment || !comment.userType) {
      console.warn('[PostsFeed] Invalid comment object:', comment);
      return;
    }
    
    // Close comments modal first
    setCommentsModalPost(null);
    
    // If it's a business, navigate to business page
    if (comment.businessId && comment.userType === 'business' && onNavigateToBusiness) {
      onNavigateToBusiness(comment.businessId);
    }
    // For engineers and agronomists, navigate to their business-style profile page
    else if ((comment.userType === 'engineer' || comment.userType === 'agronomist') && comment.userId && onNavigateToBusiness) {
      onNavigateToBusiness(comment.userId);
    }
    // For any user (including regular users), navigate to their profile
    else if (comment.userId && onNavigateToUserProfile) {
      onNavigateToUserProfile(comment.userId);
    }
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

  const getMostImportantReply = (replies: Reply[]): Reply | null => {
    if (replies.length === 0) return null;
    // Prioritize: businesses > engineers > users
    const business = replies.find(r => r.userType === 'business');
    if (business) return business;
    const engineer = replies.find(r => r.userType === 'engineer');
    if (engineer) return engineer;
    return replies[0];
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
                setCommentsModalPost(null);
                
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

    return parts.length > 0 ? parts : text;
  };

  const handleLike = (postId: string) => {
    if (!isAuthenticated) {
      return;
    }

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1,
        };
      }
      return post;
    }));
  };

  const handleLikeComment = (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!isAuthenticated) {
      return;
    }

    if (!commentsModalPost) return;

    setComments(prev => {
      const postComments = prev[commentsModalPost] || [];
      
      const updatedComments = postComments.map(comment => {
        if (isReply && comment.id === parentId) {
          return {
            ...comment,
            replies: comment.replies.map(reply =>
              reply.id === commentId
                ? {
                    ...reply,
                    isLiked: !reply.isLiked,
                    likes: reply.isLiked ? reply.likes - 1 : reply.likes + 1,
                  }
                : reply
            ),
          };
        } else if (!isReply && comment.id === commentId) {
          return {
            ...comment,
            isLiked: !comment.isLiked,
            likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          };
        }
        return comment;
      });

      return {
        ...prev,
        [commentsModalPost]: updatedComments,
      };
    });
  };

  const handleSave = (post: any) => {
    if (!isAuthenticated) {
      return;
    }

    setPosts(posts.map(p => {
      if (p.id === post.id) {
        return { ...p, isSaved: !p.isSaved };
      }
      return p;
    }));

    if (onSavePost && !post.isSaved) {
      onSavePost({
        id: Date.now().toString(),
        type: 'post',
        itemId: post.id,
        title: post.title,
        image: post.image || post.author.avatar,
        description: post.content,
        savedAt: new Date(),
      });
    }
  };

  const handleAddComment = (postId: string) => {
    if (!isAuthenticated) {
      return;
    }

    if (!newComment.trim()) return;

    const newCommentObj: Comment | Reply = {
      id: Date.now().toString(),
      userId: user?.id || '',
      author: user?.fullName || 'User',
      avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=300',
      text: newComment,
      timeAgo: 'Just now',
      likes: 0,
      isLiked: false,
      replies: [],
      isVerified: user?.verified,
      userType: user?.role,
      businessId: user?.businessId,
    };

    if (replyingTo) {
      // Add as reply (could be nested)
      setComments(prev => {
        const postComments = prev[postId] || [];
        
        // Helper function to add reply recursively
        const addReplyRecursively = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            // If this is the target comment
            if (comment.id === replyingTo.id) {
              return { ...comment, replies: [...(comment.replies || []), newCommentObj as Reply] };
            }
            
            // If this is the parent comment (for nested replies)
            if (replyingTo.parentId && comment.id === replyingTo.parentId) {
              return {
                ...comment,
                replies: addReplyToReplies(comment.replies || [], replyingTo.id, newCommentObj as Reply)
              };
            }
            
            // Check nested replies
            if (comment.replies && comment.replies.length > 0) {
              const updatedReplies = addReplyToReplies(comment.replies, replyingTo.id, newCommentObj as Reply);
              if (updatedReplies !== comment.replies) {
                return { ...comment, replies: updatedReplies };
              }
            }
            
            return comment;
          });
        };
        
        // Helper function to add reply to nested replies
        const addReplyToReplies = (replies: Reply[], targetId: string, newReply: Reply): Reply[] => {
          return replies.map(reply => {
            if (reply.id === targetId) {
              return { ...reply, replies: [...(reply.replies || []), newReply] };
            }
            if (reply.replies && reply.replies.length > 0) {
              const updatedNestedReplies = addReplyToReplies(reply.replies, targetId, newReply);
              if (updatedNestedReplies !== reply.replies) {
                return { ...reply, replies: updatedNestedReplies };
              }
            }
            return reply;
          });
        };
        
        const updatedComments = addReplyRecursively(postComments);
        return { ...prev, [postId]: updatedComments };
      });
      
      // Highlight the parent comment briefly
      setHighlightedCommentId(replyingTo.id);
      setTimeout(() => setHighlightedCommentId(null), 1200);
    } else {
      // Add as new comment
      setComments({
        ...comments,
        [postId]: [newCommentObj as Comment, ...(comments[postId] || [])],
      });
      
      // Scroll to top where new comment is added and highlight it
      setTimeout(() => {
        if (commentsListRef.current) {
          commentsListRef.current.scrollTo({ top: 0, behavior: 'smooth' });
        }
        setHighlightedCommentId(newCommentObj.id);
        setTimeout(() => setHighlightedCommentId(null), 1200);
      }, 100);
    }

    // Update comment count
    setPosts(posts.map(post => 
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ));

    setNewComment('');
    setReplyingTo(null);
  };

  const handleEditComment = (commentId: string, currentText: string) => {
    setEditingCommentId(commentId);
    setEditContent(currentText);
  };

  const handleSaveEdit = () => {
    if (!commentsModalPost || !editingCommentId) return;

    setComments(prev => {
      const postComments = prev[commentsModalPost] || [];
      const updatedComments = postComments.map(comment =>
        comment.id === editingCommentId
          ? { ...comment, text: editContent, isEdited: true }
          : comment
      );
      return { ...prev, [commentsModalPost]: updatedComments };
    });

    setEditingCommentId(null);
    setEditContent('');
  };

  const handleReply = (commentId: string, author: string, parentId?: string) => {
    setReplyingTo({ id: commentId, author, parentId });
    setNewComment(`@${author} `);
    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
      // Move cursor to end
      if (textareaRef.current) {
        const length = textareaRef.current.value.length;
        textareaRef.current.setSelectionRange(length, length);
      }
    }, 100);
  };

  const handleLoadMore = () => {
    if (!isAuthenticated) {
      return;
    }
    setVisiblePosts(prev => Math.min(prev + 10, posts.length));
  };

  const getTotalComments = (postId: string): number => {
    const postComments = comments[postId] || [];
    return postComments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return { text, isTruncated: false };
    return { text: text.slice(0, maxLength), isTruncated: true };
  };

  // Handle hold to preview image
  const handleImageMouseDown = (imageUrl: string) => {
    holdTimerRef.current = setTimeout(() => {
      setHoldingImage(imageUrl);
      setPreviewImage(imageUrl);
    }, 500); // 500ms delay before preview shows
  };

  const handleImageMouseUp = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    setHoldingImage(null);
    // Don't close preview here - let it stay open until user clicks to close
  };

  const handleClosePreview = () => {
    setPreviewImage(null);
    setHoldingImage(null);
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

  // Prepare displayed posts with highlighted post at top if needed
  const displayedPosts = React.useMemo(() => {
    const slicedPosts = posts.slice(0, visiblePosts);
    
    // If there's a highlighted post, ensure it's visible and at the top
    if (highlightPostId) {
      const highlightedPost = posts.find(p => p.id === highlightPostId);
      if (highlightedPost) {
        // Check if the highlighted post is already in the visible posts
        const isInVisiblePosts = slicedPosts.some(p => p.id === highlightPostId);
        
        // Either way, we want it at the top for visibility and highlighting
        const filteredPosts = slicedPosts.filter(p => p.id !== highlightPostId);
        return [highlightedPost, ...filteredPosts];
      }
    }
    
    return slicedPosts;
  }, [posts, visiblePosts, highlightPostId]);

  return (
    <section id="posts" className="py-16 bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Posts List */}
        <div className="space-y-6">
          {displayedPosts.map((post) => {
            const { text: displayText, isTruncated } = truncateText(post.content, 200);
            const [showFullText, setShowFullText] = useState(false);
            const isFollowing = isFollowingBusiness(post.author.id);
            const isOwnBusiness = user?.businessId === post.author.id;
            // Check if this post is by the current user
            const isOwnPost = user?.id === post.author.id || isOwnBusiness;
            const isHighlighted = highlightPostId === post.id && showHighlight;

            return (
              <article 
                key={post.id} 
                id={`post-${post.id}`} 
                ref={isHighlighted ? highlightedPostRef : null}
                className={`bg-white rounded-xl border overflow-hidden hover:shadow-lg transition-all duration-500 ${
                  isHighlighted 
                    ? 'border-green-500 shadow-xl ring-4 ring-green-500 ring-offset-2' 
                    : 'border-neutral-200'
                }`}
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Profile picture with role icon at bottom-right */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        onClick={() => handlePostAuthorClick(post)}
                        draggable="false"
                        className="w-14 h-14 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-green-500 transition-all select-none"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1 bg-white rounded-full shadow-md">
                        {getRoleIcon(post.author.type)}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-col gap-1">
                        {/* Username row with verified badge and follow button */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            onClick={() => handlePostAuthorClick(post)}
                            className="text-neutral-900 font-medium cursor-pointer hover:text-green-600 transition-colors"
                          >
                            {post.author.name}
                          </span>
                          {post.author.verified && (
                            <VerifiedBadge />
                          )}
                          {/* Only show follow button for engineers, agronomists and businesses, not for own posts */}
                          {(post.author.type === 'engineer' || post.author.type === 'agronomist' || post.author.type === 'business') && !isOwnPost && isAuthenticated && !isFollowing && (
                            <button
                              onClick={(e) => handleFollow(post, e)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              Follow
                            </button>
                          )}
                          {(post.author.type === 'engineer' || post.author.type === 'agronomist' || post.author.type === 'business') && !isOwnPost && isFollowing && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <Check className="w-3 h-3" />
                              Following
                            </span>
                          )}
                        </div>
                        {/* Role name under username */}
                        <span className="text-xs text-neutral-500 capitalize">
                          {post.author.type === 'business' ? 'Business' : 
                           post.author.type === 'engineer' ? 'Engineer' : 
                           post.author.type === 'agronomist' ? 'Agronomist' :
                           post.author.type === 'admin' ? 'Administrator' : 'User'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                        <Clock className="w-4 h-4" />
                        <span>{post.timeAgo}</span>
                      </div>
                    </div>
                  </div>

                  {/* Post Content */}
                  <h3 className="text-xl text-neutral-900 mb-3">{post.title}</h3>
                  <p className="text-neutral-600 mb-4">
                    {showFullText ? renderTextWithMentions(post.content) : renderTextWithMentions(displayText)}
                    {isTruncated && !showFullText && '... '}
                    {isTruncated && (
                      <button
                        onClick={() => setShowFullText(!showFullText)}
                        className="text-green-600 hover:text-green-700 font-medium ml-1"
                      >
                        {showFullText ? 'Read less' : 'Read more'}
                      </button>
                    )}
                  </p>

                  {/* Post Tags */}
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Post Image */}
                {post.image && (
                  <div className="relative h-80 overflow-hidden">
                    <img
                      src={post.image}
                      alt={post.title}
                      draggable="false"
                      className="w-full h-full object-cover select-none cursor-pointer transition-opacity duration-200"
                      onDoubleClick={() => {
                        handleLike(post.id);
                      }}
                      onMouseDown={() => handleImageMouseDown(post.image)}
                      onMouseUp={handleImageMouseUp}
                      onMouseLeave={handleImageMouseUp}
                      onTouchStart={() => handleImageMouseDown(post.image)}
                      onTouchEnd={handleImageMouseUp}
                    />
                  </div>
                )}

                {/* Post Actions */}
                <div className="p-6 pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-6">
                    <button
                      onClick={() => handleLike(post.id)}
                      disabled={!isAuthenticated}
                      className={`flex items-center gap-2 transition-colors ${
                        !isAuthenticated
                          ? 'cursor-not-allowed opacity-50'
                          : post.isLiked 
                          ? 'text-red-600' 
                          : 'text-neutral-600 hover:text-red-600'
                      }`}
                      title={!isAuthenticated ? 'Sign in to like posts' : ''}
                    >
                      <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.likes}</span>
                    </button>
                    <button
                      onClick={() => setCommentsModalPost(post.id)}
                      data-comments-button
                      className="flex items-center gap-2 text-neutral-600 hover:text-green-600 transition-colors"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-medium">{getTotalComments(post.id)}</span>
                    </button>
                    <button
                      onClick={() => setShareModalPost(post)}
                      disabled={!isAuthenticated}
                      className={`flex items-center gap-2 transition-colors ${
                        !isAuthenticated 
                          ? 'text-neutral-400 cursor-not-allowed' 
                          : 'text-neutral-600 hover:text-blue-600'
                      }`}
                      title={!isAuthenticated ? 'Sign in to share' : 'Share post'}
                    >
                      <Send className="w-5 h-5" />
                      <span className="font-medium">{post.shares}</span>
                    </button>
                    <button
                      onClick={() => handleSave(post)}
                      disabled={!isAuthenticated}
                      className={`ml-auto flex items-center gap-2 transition-colors ${
                        !isAuthenticated
                          ? 'cursor-not-allowed opacity-50'
                          : post.isSaved 
                          ? 'text-green-600' 
                          : 'text-neutral-600 hover:text-green-600'
                      }`}
                      title={!isAuthenticated ? 'Sign in to save posts' : ''}
                    >
                      <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                      <span className="font-medium">{post.isSaved ? 'Saved' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Load More */}
        {visiblePosts < posts.length && (
          <div className="text-center mt-8">
            <button
              onClick={handleLoadMore}
              className="px-8 py-3 bg-white border-2 border-neutral-200 text-neutral-700 rounded-lg hover:border-green-600 hover:text-green-600 transition-colors"
            >
              {isAuthenticated ? 'Load More Posts' : 'Sign in to view more'}
            </button>
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {commentsModalPost && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" 
          onClick={() => {
            setCommentsModalPost(null);
            setReplyingTo(null);
            setNewComment('');
            setShowMentions(false);
          }}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl" 
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
              <h3 className="text-xl text-neutral-900 font-semibold">
                Comments ({getTotalComments(commentsModalPost)})
              </h3>
              <button
                onClick={() => {
                  setCommentsModalPost(null);
                  setReplyingTo(null);
                  setNewComment('');
                  setShowMentions(false);
                }}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List - Scrollable */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar" ref={commentsListRef}>
              {(comments[commentsModalPost] || []).slice(0, showAllComments ? undefined : 15).map((comment) => {
                const importantReply = getMostImportantReply(comment.replies);
                const hasMoreReplies = comment.replies.length > 1;
                const showAllReplies = expandedReplies.has(comment.id);

                return (
                  <div key={comment.id} className="space-y-3">
                    <div className={`flex gap-3 rounded-2xl transition-all duration-500 ${
                      highlightedCommentId === comment.id ? 'bg-green-100/50 p-2 -m-2' : ''
                    }`}>
                      {/* Profile picture with role icon at bottom-right */}
                      <div className="relative flex-shrink-0">
                        <img
                          src={comment.avatar}
                          alt={comment.author}
                          onClick={() => handleProfileClick(comment)}
                          draggable="false"
                          className="w-11 h-11 rounded-full object-cover select-none cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full shadow-md">
                          {getRoleIcon(comment.userType || 'user')}
                        </div>
                      </div>
                      <div className="flex-1">
                        {editingCommentId === comment.id ? (
                          <div className="space-y-2 relative">
                            <Textarea
                              ref={editTextareaRef}
                              value={editContent}
                              onChange={handleEditCommentChange}
                              onKeyDown={handleEditMentionKeyDown}
                              onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && !showEditMentions) {
                                  e.preventDefault();
                                  handleSaveEdit();
                                }
                              }}
                              className="min-h-[80px]"
                              placeholder="Edit comment... (Type @ to mention)"
                            />
                            
                            {/* Mention Dropdown for Edit Mode - Below textarea */}
                            {showEditMentions && filteredEditMentions.length > 0 && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-20 custom-scrollbar">
                                {filteredEditMentions.map((mentionUser, index) => (
                                  <button
                                    key={mentionUser.id}
                                    onClick={() => insertEditMention(mentionUser)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                                      index === selectedEditMentionIndex ? 'bg-green-50' : ''
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
                            
                            <div className="flex gap-2">
                              <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                              <Button size="sm" variant="outline" onClick={() => {
                                setEditingCommentId(null);
                                setShowEditMentions(false);
                              }}>Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="bg-neutral-50 rounded-2xl p-3">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span 
                                  className="text-neutral-900 font-medium cursor-pointer hover:text-green-600 transition-colors"
                                  onClick={() => handleProfileClick(comment)}
                                >
                                  {comment.author}
                                </span>
                                {comment.isVerified && (comment.userType === 'engineer' || comment.userType === 'business') && (
                                  <VerifiedBadge className="text-[10px]" />
                                )}
                                <span className="text-xs text-neutral-500">
                                  {comment.timeAgo}
                                  {comment.isEdited && ' · Edited'}
                                </span>
                              </div>
                              <p className="text-neutral-700">{renderTextWithMentions(comment.text)}</p>
                            </div>
                            <div className="flex items-center gap-4 mt-2 px-2">
                              <button
                                onClick={() => handleLikeComment(comment.id, false)}
                                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                  comment.isLiked ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                                }`}
                              >
                                <ThumbsUp className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                                <span>{comment.likes > 0 ? comment.likes : 'Like'}</span>
                              </button>
                              {canReply(comment.userId) && (
                                <button
                                  onClick={() => handleReply(comment.id, comment.author)}
                                  className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                >
                                  <ReplyIcon className="w-4 h-4" />
                                  <span>Reply</span>
                                </button>
                              )}
                              {user?.id === comment.userId && (
                                <button
                                  onClick={() => handleEditComment(comment.id, comment.text)}
                                  className="text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                >
                                  Edit
                                </button>
                              )}
                            </div>
                          </>
                        )}

                        {/* Replies Section */}
                        {comment.replies && comment.replies.length > 0 && (
                          <div className="mt-3 space-y-3">
                            {/* Show important reply or all replies */}
                            {(showAllReplies ? comment.replies : importantReply ? [importantReply] : []).map((reply) => (
                              <div key={reply.id} className="flex gap-2 ml-4 border-l-2 border-neutral-200 pl-3">
                                {/* Profile picture with role icon at bottom-right */}
                                <div className="relative flex-shrink-0">
                                  <img
                                    src={reply.avatar}
                                    alt={reply.author}
                                    onClick={() => handleProfileClick(reply)}
                                    draggable="false"
                                    className="w-9 h-9 rounded-full object-cover select-none cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                                  />
                                  <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full shadow-md">
                                    {getRoleIcon(reply.userType || 'user')}
                                  </div>
                                </div>
                                <div className="flex-1">
                                  <div className="bg-neutral-50 rounded-xl p-2">
                                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                                      <span 
                                        className="text-neutral-900 text-sm font-medium cursor-pointer hover:text-green-600 transition-colors"
                                        onClick={() => handleProfileClick(reply)}
                                      >
                                        {reply.author}
                                      </span>
                                      {reply.isVerified && (reply.userType === 'engineer' || reply.userType === 'business') && (
                                        <VerifiedBadge className="text-[10px]" />
                                      )}
                                      <span className="text-xs text-neutral-500">
                                        {reply.timeAgo}
                                        {reply.isEdited && ' · Edited'}
                                      </span>
                                    </div>
                                    <p className="text-neutral-700 text-sm">{renderTextWithMentions(reply.text)}</p>
                                  </div>
                                  <div className="flex items-center gap-3 mt-1 px-2">
                                    <button
                                      onClick={() => handleLikeComment(reply.id, true, comment.id)}
                                      className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                        reply.isLiked ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                                      }`}
                                    >
                                      <ThumbsUp className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                      <span>{reply.likes > 0 ? reply.likes : 'Like'}</span>
                                    </button>
                                    {canReply(reply.userId) && (
                                      <button
                                        onClick={() => handleReply(reply.id, reply.author, comment.id)}
                                        className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                      >
                                        <ReplyIcon className="w-3 h-3" />
                                        <span>Reply</span>
                                      </button>
                                    )}
                                  </div>
                                  
                                  {/* Nested Replies */}
                                  {reply.replies && reply.replies.length > 0 && (
                                    <div className="mt-2 ml-4 space-y-2 border-l-2 border-neutral-100 pl-3">
                                      {reply.replies.map((nestedReply) => (
                                        <div key={nestedReply.id} className="flex gap-2">
                                          {/* Profile picture with role icon at bottom-right */}
                                          <div className="relative flex-shrink-0">
                                            <img
                                              src={nestedReply.avatar}
                                              alt={nestedReply.author}
                                              onClick={() => handleProfileClick(nestedReply)}
                                              draggable="false"
                                              className="w-7 h-7 rounded-full object-cover select-none cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
                                            />
                                            <div className="absolute -bottom-0.5 -right-0.5 p-0.5 bg-white rounded-full shadow-md">
                                              {getRoleIcon(nestedReply.userType || 'user')}
                                            </div>
                                          </div>
                                          <div className="flex-1">
                                            <div className="bg-neutral-50 rounded-lg p-2">
                                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span 
                                                  className="text-neutral-900 text-xs font-medium cursor-pointer hover:text-green-600 transition-colors"
                                                  onClick={() => handleProfileClick(nestedReply)}
                                                >
                                                  {nestedReply.author}
                                                </span>
                                                {nestedReply.isVerified && (nestedReply.userType === 'engineer' || nestedReply.userType === 'business') && (
                                                  <VerifiedBadge className="text-[9px]" />
                                                )}
                                                <span className="text-[10px] text-neutral-500">
                                                  {nestedReply.timeAgo}
                                                  {nestedReply.isEdited && ' · Edited'}
                                                </span>
                                              </div>
                                              <p className="text-neutral-700 text-xs">{renderTextWithMentions(nestedReply.text)}</p>
                                            </div>
                                            <div className="flex items-center gap-3 mt-1 px-2">
                                              <button
                                                onClick={() => handleLikeComment(nestedReply.id, true, comment.id)}
                                                className={`flex items-center gap-1 text-xs font-medium transition-colors ${
                                                  nestedReply.isLiked ? 'text-red-600' : 'text-neutral-600 hover:text-red-600'
                                                }`}
                                              >
                                                <ThumbsUp className={`w-3 h-3 ${nestedReply.isLiked ? 'fill-current' : ''}`} />
                                                <span className="text-[10px]">{nestedReply.likes > 0 ? nestedReply.likes : 'Like'}</span>
                                              </button>
                                              {canReply(nestedReply.userId) && (
                                                <button
                                                  onClick={() => handleReply(nestedReply.id, nestedReply.author, comment.id)}
                                                  className="flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors"
                                                >
                                                  <ReplyIcon className="w-3 h-3" />
                                                  <span className="text-[10px]">Reply</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}

                            {/* View More Replies Button */}
                            {hasMoreReplies && !showAllReplies && (
                              <button
                                onClick={() => toggleReplies(comment.id)}
                                className="ml-4 pl-3 text-xs font-medium text-neutral-600 hover:text-green-600 transition-colors flex items-center gap-1 border-l-2 border-neutral-200"
                              >
                                ──── View {comment.replies.length - 1} more {comment.replies.length - 1 === 1 ? 'reply' : 'replies'}
                              </button>
                            )}

                            {/* Hide Replies Button */}
                            {showAllReplies && hasMoreReplies && (
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
                );
              })}

              {/* Load More Comments */}
              {(comments[commentsModalPost] || []).length > 15 && !showAllComments && (
                <button
                  onClick={() => setShowAllComments(true)}
                  className="w-full py-2 text-green-600 hover:text-green-700 font-medium text-sm"
                >
                  Load more comments ({(comments[commentsModalPost] || []).length - 15})
                </button>
              )}

              {(!comments[commentsModalPost] || comments[commentsModalPost].length === 0) && (
                <div className="text-center py-8">
                  <MessageCircle className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
                  <p className="text-neutral-600">No comments yet. Be the first to comment!</p>
                </div>
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
                          handleAddComment(commentsModalPost);
                        }
                      }}
                      placeholder="Write a comment... (Type @ to mention)"
                      className="flex-1 min-h-[80px] resize-none"
                    />
                    <Button
                      onClick={() => handleAddComment(commentsModalPost)}
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
      <ShareModal
        isOpen={!!shareModalPost}
        onClose={() => setShareModalPost(null)}
        postUrl={shareModalPost ? `${window.location.origin}/post/${shareModalPost.id}` : ''}
        postTitle={shareModalPost?.title}
        postImage={shareModalPost?.image}
      />

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60] p-0"
          onClick={handleClosePreview}
          style={{ 
            animation: 'fadeIn 0.3s ease-out',
          }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img 
              src={previewImage} 
              alt="Preview" 
              draggable="false"
              className="max-w-full max-h-full object-contain select-none cursor-pointer"
              style={{
                animation: 'zoomIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>
          <button
            onClick={handleClosePreview}
            className="absolute top-6 right-6 w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full flex items-center justify-center transition-all hover:scale-110"
          >
            <X className="w-7 h-7 text-white" />
          </button>
          <p className="absolute bottom-6 text-white/70 text-sm">Click anywhere to close</p>
        </div>
      )}
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            backdrop-filter: blur(0px);
          }
          to {
            opacity: 1;
            backdrop-filter: blur(10px);
          }
        }
        
        @keyframes zoomIn {
          from {
            transform: scale(0.7);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes pulse-subtle {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
          }
        }
        
        .animate-pulse-subtle {
          animation: pulse-subtle 2s ease-in-out;
        }
      `}</style>
    </section>
  );
}