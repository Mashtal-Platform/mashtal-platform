import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Clock, Bookmark, X, Send, ThumbsUp, Reply as ReplyIcon, CheckCircle2, UserPlus, Check, Sparkles, Briefcase, User, Leaf, HardHat, Building2, Shield } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { VerifiedBadge } from './VerifiedBadge';
import { fetchPosts, toggleLikePost, sharePost, PostDto } from '../shared/api/posts';
import { fetchUser, fetchBusinesses, fetchMentionableProfiles, UserDto } from '../shared/api/users';
import { fetchComments, createComment, toggleLikeComment, deleteComment, CommentDto } from '../shared/api/comments';
import { getImageUrl, getAvatarUrl } from '../shared/api/client';

interface PostsFeedProps {
  onSavePost?: (post: any) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
  savedItems?: { id: string; type: string; itemId?: string; refId?: string }[];
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

export function PostsFeed({ 
  onSavePost, 
  onRemoveSavedItem,
  savedItems = [],
  onNavigateToBusiness, 
  onNavigateToUserProfile, 
  followedBusinesses, 
  onFollowBusiness, 
  userPosts = [],
  highlightPostId,
  onClearHighlight
}: PostsFeedProps) {
  const { user, isAuthenticated } = useAuth();
  const [mentionableUsers, setMentionableUsers] = useState<MentionUser[]>([]);
  const [backendPosts, setBackendPosts] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [authors, setAuthors] = useState<Record<string, UserDto>>({});

  const PAGE_SIZE = 20;

  // Load mentionable profiles once so @mentions can be rendered as green/clickable
  useEffect(() => {
    let isMounted = true;
    async function loadMentionable() {
      try {
        const profiles = await fetchMentionableProfiles().catch(() => []);
        const mapped: MentionUser[] = (Array.isArray(profiles) ? profiles : [])
          .map((u) => {
            const isBusiness = u.role === 'business';
            const name = (
              isBusiness ? (u.companyName || u.fullName) : (u.fullName || u.companyName) || ''
            ).trim();
            return {
              id: u.id,
              name,
              avatar: getAvatarUrl(u.avatar, name),
              type: u.role || 'business',
              verified: !!u.verified,
            };
          })
          .filter((u) => u.name.length > 0);
        if (isMounted) setMentionableUsers(mapped);
      } catch {
        // Non-fatal: mention dropdown/rendering just won't work.
      }
    }
    loadMentionable();
    return () => { isMounted = false; };
  }, []);

  // Load first page of posts (all users, newest first)
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      setIsLoadingPosts(true);
      setPostsError(null);
      try {
        const apiPosts: PostDto[] = await fetchPosts({ limit: PAGE_SIZE, skip: 0 });
        if (!isMounted) return;
        const normalized = apiPosts.map((p) => ({
          ...p,
          comments: typeof p.commentsCount === 'number' ? p.commentsCount : 0,
        }));
        setBackendPosts(normalized);
        nextSkipRef.current = normalized.length;
        setHasMorePosts(normalized.length === PAGE_SIZE);
        const authorIds = Array.from(
          new Set(normalized.map((p) => p.author?.id).filter(Boolean) as string[]),
        );
        const [biz] = await Promise.all([fetchBusinesses().catch(() => [])]);
        const authorMap: Record<string, UserDto> = {};
        (biz as UserDto[]).forEach((b) => { authorMap[b.id] = b; });
        for (const id of authorIds) {
          if (!authorMap[id]) {
            try {
              const u = await fetchUser(id);
              authorMap[id] = u;
            } catch { /* ignore */ }
          }
        }
        if (isMounted) setAuthors(authorMap);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[PostsFeed] Failed to load posts from API:', err);
        setPostsError('Failed to load latest posts.');
        setBackendPosts([]);
        setHasMorePosts(false);
      } finally {
        if (isMounted) setIsLoadingPosts(false);
      }
    }
    loadInitial();
    return () => { isMounted = false; };
  }, []);

  // Same relative time format as ThreadsFeed: "Just now", "2m ago", "5h ago", "3d ago", "2w ago", "3mo ago", "1y ago"
  const formatPostTime = (timestamp: string | undefined) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown';
      const now = new Date();
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
    } catch {
      return 'Unknown';
    }
  };

  // Format posts for the feed (all users, backend order = newest first)
  const allPosts = React.useMemo(() => {
    return backendPosts.map((p) => {
      const author = p.author || {};
      return {
        ...p,
        timeAgo: formatPostTime(p.timestamp),
        author: {
          id: author.id,
          name: author.name,
          avatar: author.avatar,
          verified: author.verified,
          type: author.type,
          businessId: author.businessId,
        },
      };
    });
  }, [backendPosts]);

  const [posts, setPosts] = useState<any[]>([]);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [loadingMorePosts, setLoadingMorePosts] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const nextSkipRef = useRef(0);

  useEffect(() => {
    setPosts(allPosts);
  }, [allPosts]);

  // Merge isSaved from savedItems (DB) so Save button state is correct
  const displayPosts = React.useMemo(
    () =>
      posts.map((p) => ({
        ...p,
        isSaved: savedItems.some(
          (i) => i.type === 'post' && (i.itemId || (i as any).refId) === p.id
        ),
      })),
    [posts, savedItems]
  );

  const getSavedItemId = (postId: string) =>
    savedItems.find(
      (i) => i.type === 'post' && (i.itemId || (i as any).refId) === postId
    )?.id;

  const loadMorePosts = React.useCallback(async () => {
    if (loadingMorePosts || !hasMorePosts) return;
    const skip = nextSkipRef.current;
    nextSkipRef.current += PAGE_SIZE;
    setLoadingMorePosts(true);
    try {
      const next = await fetchPosts({ limit: PAGE_SIZE, skip });
      const normalized = next.map((p) => ({
        ...p,
        comments: typeof p.commentsCount === 'number' ? p.commentsCount : 0,
      }));
      setBackendPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const toAppend = normalized.filter((p) => !existingIds.has(p.id));
        return [...prev, ...toAppend];
      });
      setHasMorePosts(normalized.length === PAGE_SIZE);
    } catch {
      setHasMorePosts(false);
    } finally {
      setLoadingMorePosts(false);
    }
  }, [loadingMorePosts, hasMorePosts]);

  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMorePosts();
      },
      { rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMorePosts]);
  
  // Map API comment shape to UI shape
  const mapCommentDtoToUi = (dto: CommentDto): any => ({
    id: dto.id,
    userId: dto.author?.id ?? '',
    author: dto.author?.name ?? 'Unknown',
    avatar: dto.author?.avatar ?? '',
    text: dto.content,
    timeAgo: formatTimeAgo(dto.createdAt),
    likes: dto.likes ?? 0,
    isLiked: dto.isLiked ?? false,
    replies: (dto.replies ?? []).map(mapCommentDtoToUi),
    isVerified: dto.author?.verified ?? false,
    userType: dto.author?.type ?? 'user',
    businessId: (dto.author as any)?.businessId,
  });
  function formatTimeAgo(iso: string): string {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  const [commentsModalPost, setCommentsModalPost] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});

  // Load comments from API when modal opens for a post
  useEffect(() => {
    if (!commentsModalPost) return;
    setCommentsLoading((prev) => ({ ...prev, [commentsModalPost]: true }));
    fetchComments('post', commentsModalPost)
      .then((list) => {
        const mapped = list.map(mapCommentDtoToUi);
        setComments((prev) => ({ ...prev, [commentsModalPost]: mapped }));

        // Add comment authors to mentionable users so @mentions from replies are clickable
        const fromComments: MentionUser[] = [];
        const walk = (arr: any[]) => {
          for (const c of arr) {
            if (c.userId) {
              fromComments.push({
                id: c.userId,
                name: (c.author || '').trim(),
                avatar: c.avatar || '',
                type: c.userType || 'user',
                verified: !!c.isVerified,
              });
            }
            if (c.replies?.length) walk(c.replies);
          }
        };
        walk(mapped as any[]);
        if (fromComments.length) {
          setMentionableUsers((prev) => {
            const merged = [...prev];
            for (const u of fromComments) {
              if (!u.id || !u.name) continue;
              if (!merged.some((x) => x.id === u.id)) merged.push(u);
            }
            return merged;
          });
        }
      })
      .catch(() => {
        setComments((prev) => ({ ...prev, [commentsModalPost]: [] }));
      })
      .finally(() => {
        setCommentsLoading((prev) => ({ ...prev, [commentsModalPost]: false }));
      });
  }, [commentsModalPost]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string; parentId?: string } | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [shareModalPost, setShareModalPost] = useState<any | null>(null);
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
  const [expandedFullTextIds, setExpandedFullTextIds] = useState<Set<string>>(new Set());

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

  // Handle highlighted post from profile, notification, or shared link navigation
  useEffect(() => {
    if (highlightPostId) {
      setShowHighlight(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setShowHighlight(false);
    }
  }, [highlightPostId]);

  // Auto-remove highlight after 3 seconds
  useEffect(() => {
    if (showHighlight && highlightPostId) {
      const timer = setTimeout(() => setShowHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showHighlight, highlightPostId]);

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
    
    // Check if the author is a business (they have business pages)
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
    // Prioritize: businesses > visitors
    const business = replies.find(r => r.userType === 'business');
    if (business) return business;
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

        // Get text after @
        const textAfterAt = text.substring(i + 1);
        const lowerAfterAt = textAfterAt.toLowerCase();

        // 1) Prefer full match (supports multi-word names already inserted like "@Ali Smith").
        let matchedUser: typeof mentionableUsers[0] | null = null;
        let matchedFullName = '';
        for (const user of mentionableUsers) {
          const lowerUserName = user.name.toLowerCase();
          if (lowerAfterAt.startsWith(lowerUserName)) {
            if (user.name.length > matchedFullName.length) {
              matchedUser = user;
              matchedFullName = user.name;
            }
          }
        }

        if (matchedUser && matchedFullName) {
          // Found a full match - render as clickable mention
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
                } else if (onNavigateToUserProfile) {
                  onNavigateToUserProfile(matchedUser.id);
                }
              }}
            >
              @{matchedFullName}
            </span>
          );
          currentIndex = i + 1 + matchedFullName.length;
          i = currentIndex - 1; // Skip past the mention
        } else {
          // 2) Partial match: if the user typed only part of the name (e.g. "@Ali"),
          // match the first whitespace-delimited token and still render it as green/clickable.
          const tokenMatch = textAfterAt.match(/^[^\s]+/);
          const token = tokenMatch?.[0] ?? '';
          if (token) {
            const lowerToken = token.toLowerCase();
            let partialMatch: typeof mentionableUsers[0] | null = null;
            let bestPartialName = '';

            for (const user of mentionableUsers) {
              const lowerUserName = user.name.toLowerCase();
              if (lowerUserName.startsWith(lowerToken)) {
                if (user.name.length > bestPartialName.length) {
                  partialMatch = user;
                  bestPartialName = user.name;
                }
              }
            }

            if (partialMatch) {
              const mentionableUser = partialMatch as MentionUser;
              parts.push(
                <span
                  key={`mention-${i}`}
                  className="text-green-600 font-medium cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCommentsModalPost(null);

                    if (mentionableUser.type === 'business' && onNavigateToBusiness) {
                      onNavigateToBusiness(mentionableUser.id);
                    } else if (onNavigateToUserProfile) {
                      onNavigateToUserProfile(mentionableUser.id);
                    }
                  }}
                >
                  @{token}
                </span>,
              );

              currentIndex = i + 1 + token.length;
              i = currentIndex - 1;
              continue;
            }
          }

          // No match found at all
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

    toggleLikePost(postId)
      .then((updated) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likes: updated.likes, isLiked: updated.isLiked }
              : p
          )
        );
      })
      .catch((err) => console.error('[PostsFeed] toggleLike error:', err));
  };

  const handleLikeComment = (commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!isAuthenticated || !commentsModalPost) return;

    toggleLikeComment(commentId)
      .then((updated) => {
        setComments(prev => {
          const postComments = prev[commentsModalPost] || [];
          const updateOne = (list: any[]): any[] =>
            list.map((c: any) => {
              if (c.id === commentId) {
                return { ...c, likes: updated.likes ?? c.likes, isLiked: updated.isLiked ?? !c.isLiked };
              }
              if (c.replies?.length) {
                return { ...c, replies: updateOne(c.replies) };
              }
              return c;
            });
          return { ...prev, [commentsModalPost]: updateOne(postComments) };
        });
      })
      .catch((err) => console.error('[PostsFeed] toggleLikeComment error:', err));
  };

  const handleSave = (post: any) => {
    if (!isAuthenticated) return;
    const isSaved = displayPosts.find((p) => p.id === post.id)?.isSaved;
    if (isSaved && onRemoveSavedItem) {
      const savedId = getSavedItemId(post.id);
      if (savedId) onRemoveSavedItem(savedId);
    } else if (onSavePost && !isSaved) {
      onSavePost({
        id: Date.now().toString(),
        type: 'post',
        itemId: post.id,
        title: post.title,
        image: post.image || post.author?.avatar,
        description: post.content,
        savedAt: new Date(),
      });
    }
  };

  const handleShareAction = () => {
    if (!shareModalPost) return;
    sharePost(shareModalPost.id)
      .then((updated) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === shareModalPost.id ? { ...p, shares: updated.shares } : p
          )
        );
      })
      .catch((err) => console.error('[PostsFeed] share error:', err));
  };

  const handleAddComment = async (postId: string) => {
    if (!isAuthenticated || !user) return;
    if (!newComment.trim()) return;

    const trimmed = newComment.trim();
    const content = replyingTo
      ? (() => {
          const prefix = `@${replyingTo.author}`.trim();
          const lowerTrimmed = trimmed.toLowerCase();
          const lowerPrefix = prefix.toLowerCase();
          if (lowerTrimmed.startsWith(lowerPrefix)) {
            const rest = trimmed.slice(prefix.length).trim();
            return rest ? `${prefix} ${rest}` : prefix;
          }
          return `${prefix} ${trimmed}`.trim();
        })()
      : trimmed;
    const parentCommentId = replyingTo?.id;

    try {
      await createComment({
        targetType: 'post',
        targetId: postId,
        content,
        parentCommentId,
      });
      const list = await fetchComments('post', postId);
      const mapped = list.map(mapCommentDtoToUi);
      setComments((prev) => ({ ...prev, [postId]: mapped }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, comments: (post.comments ?? 0) + 1 } : post
        )
      );
    } catch (err) {
      console.error('[PostsFeed] Failed to add comment:', err);
    }
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
    // Do not pre-fill with @author here.
    // The Send handler already prefixes exactly one @author, and pre-filling
    // would cause duplication like "@ali @ali hello".
    setNewComment('');
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

  const handleDeleteComment = async (commentId: string) => {
    if (!isAuthenticated || !commentsModalPost) return;
    try {
      await deleteComment(commentId);
      const list = await fetchComments('post', commentsModalPost);
      const mapped = list.map(mapCommentDtoToUi);
      setComments((prev) => ({ ...prev, [commentsModalPost]: mapped }));
      setPosts((prev) =>
        prev.map((post) =>
          post.id === commentsModalPost
            ? { ...post, comments: Math.max(0, (post.comments ?? 0) - 1) }
            : post
        )
      );
    } catch (err) {
      console.error('[PostsFeed] Failed to delete comment:', err);
    }
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
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-600" />;
      default:
        return <User className="w-4 h-4 text-neutral-500" />;
    }
  };

  // Display all accumulated posts; move highlighted to top if present; use displayPosts for correct isSaved
  const displayedPosts = React.useMemo(() => {
    if (highlightPostId) {
      const highlightedPost = displayPosts.find((p) => p.id === highlightPostId);
      if (highlightedPost) {
        const rest = displayPosts.filter((p) => p.id !== highlightPostId);
        return [highlightedPost, ...rest];
      }
    }
    return displayPosts;
  }, [displayPosts, highlightPostId]);

  return (
    <section id="posts" className="py-16 bg-neutral-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Optional API error banner */}
        {postsError && (
          <div className="mb-4 rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            {postsError}
          </div>
        )}

        {/* Posts List */}
        <div className="space-y-6">
          {displayedPosts.map((post) => {
            const { text: displayText, isTruncated } = truncateText(post.content, 200);
            const showFullText = expandedFullTextIds.has(post.id);
            const toggleShowFullText = () => {
              setExpandedFullTextIds((prev) => {
                const next = new Set(prev);
                if (next.has(post.id)) next.delete(post.id);
                else next.add(post.id);
                return next;
              });
            };
            const currentBusinessId = user?.businessId || user?.id;
            const authorBusinessId =
              post.author.type === 'business'
                ? post.author.businessId || post.author.id
                : post.author.id || post.author.businessId;

            const isFollowing = isFollowingBusiness(post.author.id);
            // Hide follow button when the post is authored by the current business/pro profile
            const isOwnPost =
              Boolean(currentBusinessId) &&
              (post.author.id === user?.id || authorBusinessId === currentBusinessId);
            const isHighlighted = highlightPostId === post.id && showHighlight;

            return (
              <article 
                key={post.id} 
                id={`post-${post.id}`} 
                ref={isHighlighted ? highlightedPostRef : null}
                className={`rounded-xl border overflow-hidden hover:shadow-lg transition-colors duration-500 ${
                  isHighlighted 
                    ? 'bg-green-100 border-green-300 shadow-lg' 
                    : 'bg-white border-neutral-200'
                }`}
              >
                {/* Post Header */}
                <div className="p-6 pb-4">
                  <div className="flex items-center gap-4 mb-4">
                    {/* Profile picture with role icon at bottom-right */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={getAvatarUrl(post.author.avatar, post.author.name)}
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
                          {/* Only show follow button for businesses, not for own posts */}
                          {(post.author.type === 'business') && !isOwnPost && isAuthenticated && !isFollowing && (
                            <button
                              onClick={(e) => handleFollow(post, e)}
                              className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors"
                            >
                              <UserPlus className="w-3 h-3" />
                              Follow
                            </button>
                          )}
                          {(post.author.type === 'business') && !isOwnPost && isFollowing && (
                            <span className="flex items-center gap-1 text-xs text-neutral-500">
                              <Check className="w-3 h-3" />
                              Following
                            </span>
                          )}
                        </div>
                        {/* Role name under username */}
                        <span className="text-xs text-neutral-500 capitalize">
                          {post.author.type === 'business' ? 'Business' : 
                           post.author.type === 'admin' ? 'Administrator' : 'Visitor'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                        <Clock className="w-4 h-4" />
                        <time dateTime={post.timestamp}>{post.timeAgo}</time>
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
                        onClick={toggleShowFullText}
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
                      src={getImageUrl(post.image)}
                      alt={post.title}
                      draggable="false"
                      className="w-full h-full object-cover select-none cursor-pointer transition-opacity duration-200"
                      onDoubleClick={() => {
                        handleLike(post.id);
                      }}
                      onMouseDown={() => handleImageMouseDown(getImageUrl(post.image) || post.image)}
                      onMouseUp={handleImageMouseUp}
                      onMouseLeave={handleImageMouseUp}
                      onTouchStart={() => handleImageMouseDown(getImageUrl(post.image) || post.image)}
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
                      <span className="font-medium">
                        {comments[post.id] ? getTotalComments(post.id) : (post.commentsCount ?? (typeof post.comments === 'number' ? post.comments : 0))}
                      </span>
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

        {/* Infinite scroll sentinel + loading more */}
        <div ref={loadMoreSentinelRef} className="h-4" aria-hidden />
        {loadingMorePosts && (
          <div className="text-center py-6">
            <span className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-neutral-500 text-sm">Loading more posts...</p>
          </div>
        )}
        {!hasMorePosts && posts.length > 0 && (
          <p className="text-center py-6 text-neutral-500 text-sm">You&apos;ve seen all posts.</p>
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
                          src={getAvatarUrl(comment.avatar, comment.author)}
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
                                      src={getAvatarUrl(mentionUser.avatar, mentionUser.name)} 
                                      alt={mentionUser.name} 
                                      draggable="false"
                                      className="w-8 h-8 rounded-full object-cover select-none"
                                    />
                                    <div className="flex-1 text-left">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium text-green-700">@{mentionUser.name}</span>
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
                                {comment.isVerified && comment.userType === 'business' && (
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
                              {user?.id === comment.userId && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-xs font-medium text-neutral-600 hover:text-red-600 transition-colors"
                                  type="button"
                                >
                                  Delete
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
                                    src={getAvatarUrl(reply.avatar, reply.author)}
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
                                      {reply.isVerified && reply.userType === 'business' && (
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
                                    {user?.id === reply.userId && (
                                      <button
                                        onClick={() => handleDeleteComment(reply.id)}
                                        className="text-xs font-medium text-neutral-600 hover:text-red-600 transition-colors"
                                        type="button"
                                      >
                                        Delete
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
                                              src={getAvatarUrl(nestedReply.avatar, nestedReply.author)}
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
                                                {nestedReply.isVerified && nestedReply.userType === 'business' && (
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
                                              {user?.id === nestedReply.userId && (
                                                <button
                                                  onClick={() => handleDeleteComment(nestedReply.id)}
                                                  className="text-xs font-medium text-neutral-600 hover:text-red-600 transition-colors"
                                                  type="button"
                                                >
                                                  Delete
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
                  {showMentions && (
                    <div className="absolute bottom-full left-6 right-6 mb-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-10">
                      {filteredMentions.length > 0 ? (
                        filteredMentions.map((mentionUser, index) => (
                          <button
                            key={mentionUser.id}
                            onClick={() => insertMention(mentionUser)}
                            className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                              index === selectedMentionIndex ? 'bg-green-50' : ''
                            }`}
                          >
                            <img
                              src={getAvatarUrl(mentionUser.avatar, mentionUser.name)}
                              alt={mentionUser.name}
                              draggable="false"
                              className="w-8 h-8 rounded-full object-cover select-none"
                            />
                            <div className="flex-1 text-left">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-green-700">@{mentionUser.name}</span>
                                {mentionUser.verified && (
                                  <CheckCircle2 className="w-3 h-3 text-green-600 fill-current" />
                                )}
                              </div>
                              <span className="text-xs text-neutral-500 capitalize">{mentionUser.type}</span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-neutral-500">
                          No matches
                        </div>
                      )}
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
        postId={shareModalPost?.id}
        postUrl={shareModalPost ? `${window.location.origin}/post/${shareModalPost.id}` : ''}
        postTitle={shareModalPost?.title}
        postImage={(shareModalPost?.image || shareModalPost?.images?.[0]) ? getImageUrl(shareModalPost?.image || shareModalPost?.images?.[0]) : undefined}
        postOwnerName={shareModalPost?.author?.name || shareModalPost?.author?.fullName}
        postOwnerAvatar={
          shareModalPost?.author?.avatar
            ? getAvatarUrl(shareModalPost.author.avatar, shareModalPost.author.name)
            : getAvatarUrl(null, shareModalPost?.author?.name)
        }
        onShare={handleShareAction}
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