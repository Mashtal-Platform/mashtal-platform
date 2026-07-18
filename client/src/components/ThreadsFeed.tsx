import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Clock, Bookmark, X, Send, ThumbsUp, Reply as ReplyIcon, CheckCircle2, UserPlus, Check, Sparkles, Briefcase, User, Leaf, HardHat, Building2, Shield } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { VerifiedBadge } from './VerifiedBadge';
import { fetchThreads, toggleLikeThread, shareThread, ThreadDto } from '../shared/api/threads';
import { fetchComments, createComment, toggleLikeComment, deleteComment, CommentDto } from '../shared/api/comments';
import { getAvatarUrl } from '../shared/api/client';
import { fetchMentionableProfiles } from '../shared/api/users';
import { notifyError } from '../shared/utils/notify';

interface ThreadsFeedProps {
  onSaveThread?: (thread: any) => void;
  onRemoveSavedItem?: (savedItemId: string) => void;
  savedItems?: { id: string; type: string; itemId?: string; refId?: string }[];
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  followedBusinesses: any[];
  onFollowBusiness: (business: any) => void;
  userThreads?: any[];
  highlightThreadId?: string;
  onClearHighlight?: () => void;
  feedVersion?: number;
  lastCreatedThread?: any | null;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: string;
  verified?: boolean;
}

// Helper function to count total comments including replies
const getTotalCommentCount = (comments: any[]): number => {
  return comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);
};

export function ThreadsFeed({ onSaveThread, onRemoveSavedItem, savedItems = [], onNavigateToBusiness, onNavigateToUserProfile, followedBusinesses, onFollowBusiness, userThreads = [], highlightThreadId, onClearHighlight, feedVersion = 0, lastCreatedThread = null }: ThreadsFeedProps) {
  const { user, isAuthenticated } = useAuth();
  const [mentionableUsers, setMentionableUsers] = useState<MentionUser[]>([]);
  const [backendThreads, setBackendThreads] = useState<any[]>([]);
  const [threadsError, setThreadsError] = useState<string | null>(null);
  const [isLoadingThreads, setIsLoadingThreads] = useState<boolean>(false);
  const [showHighlight, setShowHighlight] = useState(false);
  const highlightedThreadRef = useRef<HTMLDivElement>(null);

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

  // Load first page of threads (ranked for authenticated users; newest-first otherwise)
  useEffect(() => {
    let isMounted = true;
    async function loadInitial() {
      setIsLoadingThreads(true);
      setThreadsError(null);
      try {
        const apiThreads: ThreadDto[] = await fetchThreads({ limit: PAGE_SIZE, skip: 0 });
        if (!isMounted) return;
        let normalized = apiThreads.map((t) => ({
          ...t,
          comments: typeof t.commentsCount === 'number' ? t.commentsCount : 0,
        }));
        if (lastCreatedThread?.id && !normalized.some((t) => t.id === lastCreatedThread.id)) {
          normalized = [
            {
              ...lastCreatedThread,
              comments:
                typeof lastCreatedThread.commentsCount === 'number'
                  ? lastCreatedThread.commentsCount
                  : lastCreatedThread.comments ?? 0,
            },
            ...normalized,
          ];
        }
        setBackendThreads(normalized);
        nextSkipRef.current = apiThreads.length;
        setHasMoreThreads(apiThreads.length === PAGE_SIZE);
      } catch (err: any) {
        if (!isMounted) return;
        console.error('[ThreadsFeed] Failed to load threads from API:', err);
        setThreadsError('Failed to load latest threads.');
        if (lastCreatedThread?.id) {
          setBackendThreads([{
            ...lastCreatedThread,
            comments:
              typeof lastCreatedThread.commentsCount === 'number'
                ? lastCreatedThread.commentsCount
                : lastCreatedThread.comments ?? 0,
          }]);
        } else {
          setBackendThreads([]);
        }
        setHasMoreThreads(false);
      } finally {
        if (isMounted) setIsLoadingThreads(false);
      }
    }
    loadInitial();
    return () => { isMounted = false; };
  }, [feedVersion, lastCreatedThread?.id]);

  const allThreads = React.useMemo(() => backendThreads, [backendThreads]);

  const [threads, setThreads] = useState<any[]>([]);
  const [hasMoreThreads, setHasMoreThreads] = useState(true);
  const [loadingMoreThreads, setLoadingMoreThreads] = useState(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement>(null);
  const nextSkipRef = useRef(0);

  useEffect(() => {
    setThreads(allThreads);
  }, [allThreads]);

  // Merge isSaved from savedItems (DB) so Save button state is correct
  const displayThreads = React.useMemo(
    () =>
      threads.map((t) => ({
        ...t,
        isSaved: savedItems.some(
          (i) =>
            i.type === 'thread' &&
            (i.itemId || (i as any).refId) === t.id
        ),
      })),
    [threads, savedItems]
  );

  const getSavedItemId = (threadId: string) =>
    savedItems.find(
      (i) =>
        i.type === 'thread' && (i.itemId || (i as any).refId) === threadId
    )?.id;

  const loadMoreThreads = React.useCallback(async () => {
    if (loadingMoreThreads || !hasMoreThreads) return;
    const skip = nextSkipRef.current;
    nextSkipRef.current += PAGE_SIZE;
    setLoadingMoreThreads(true);
    try {
      const next = await fetchThreads({ limit: PAGE_SIZE, skip });
      const normalized = next.map((t) => ({
        ...t,
        comments: typeof t.commentsCount === 'number' ? t.commentsCount : 0,
      }));
      setBackendThreads((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const toAppend = normalized.filter((t) => !existingIds.has(t.id));
        return [...prev, ...toAppend];
      });
      setHasMoreThreads(normalized.length === PAGE_SIZE);
    } catch {
      setHasMoreThreads(false);
    } finally {
      setLoadingMoreThreads(false);
    }
  }, [loadingMoreThreads, hasMoreThreads]);

  useEffect(() => {
    const el = loadMoreSentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMoreThreads();
      },
      { rootMargin: '200px', threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [loadMoreThreads]);
  
  // Map API comment to UI shape (author as object for ThreadsFeed)
  const mapCommentDtoToUi = (dto: CommentDto): any => ({
    id: dto.id,
    author: dto.author
      ? {
          id: dto.author.id,
          name: dto.author.name,
          avatar: dto.author.avatar,
          verified: dto.author.verified,
          type: dto.author.type,
        }
      : { id: '', name: 'Unknown', avatar: '', verified: false, type: 'user' },
    content: dto.content,
    createdAt: dto.createdAt,
    likes: dto.likes ?? 0,
    isLiked: dto.isLiked ?? false,
    replies: (dto.replies ?? []).map(mapCommentDtoToUi),
  });

  const [commentsModalThread, setCommentsModalThread] = useState<string | null>(null);
  const [comments, setComments] = useState<{ [key: string]: any[] }>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<string, boolean>>({});

  // Load comments from API when modal opens for a thread
  useEffect(() => {
    if (!commentsModalThread) return;
    setCommentsLoading((prev) => ({ ...prev, [commentsModalThread]: true }));
    fetchComments('thread', commentsModalThread)
      .then((list) => {
        const mapped = list.map(mapCommentDtoToUi);
        setComments((prev) => ({ ...prev, [commentsModalThread]: mapped }));

        // Add comment authors to mentionable users so @mentions from replies are clickable
        const fromComments: MentionUser[] = [];
        const walk = (arr: any[]) => {
          for (const c of arr) {
            if (c.author?.id) {
              fromComments.push({
                id: c.author.id,
                name: (c.author.name || '').trim(),
                avatar: c.author.avatar || '',
                type: c.author.type || 'user',
                verified: !!c.author.verified,
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
        setComments((prev) => ({ ...prev, [commentsModalThread]: [] }));
      })
      .finally(() => {
        setCommentsLoading((prev) => ({ ...prev, [commentsModalThread]: false }));
      });
  }, [commentsModalThread]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string; parentId?: string } | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [shareModalThread, setShareModalThread] = useState<any | null>(null);
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

  // Handle highlighted thread from profile, notification, or shared link navigation
  useEffect(() => {
    if (highlightThreadId) {
      setShowHighlight(true);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
    } else {
      setShowHighlight(false);
    }
  }, [highlightThreadId]);

  // Auto-remove highlight after 3 seconds
  useEffect(() => {
    if (showHighlight && highlightThreadId) {
      const timer = setTimeout(() => setShowHighlight(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showHighlight, highlightThreadId]);

  const [likingThreadId, setLikingThreadId] = useState<string | null>(null);
  const handleLike = async (threadId: string) => {
    if (!isAuthenticated || likingThreadId) return;
    setLikingThreadId(threadId);
    try {
      const updated = await toggleLikeThread(threadId);
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId
            ? { ...t, likes: updated.likes ?? t.likes, isLiked: updated.isLiked ?? !t.isLiked }
            : t
        )
      );
    } catch (err) {
      console.error('[ThreadsFeed] toggleLike error:', err);
    } finally {
      setLikingThreadId(null);
    }
  };

  const handleSave = (thread: any) => {
    if (!isAuthenticated) return;
    const isSaved = displayThreads.find((t) => t.id === thread.id)?.isSaved;
    if (isSaved && onRemoveSavedItem) {
      const savedId = getSavedItemId(thread.id);
      if (savedId) onRemoveSavedItem(savedId);
    } else if (onSaveThread && !isSaved) {
      onSaveThread({
        id: `saved-${thread.id}-${Date.now()}`,
        type: 'thread',
        itemId: thread.id,
        title: thread.title || thread.content.substring(0, 50) + (thread.content.length > 50 ? '...' : ''),
        image: thread.author?.avatar,
        description: thread.content,
        savedAt: new Date(),
      });
    }
  };

  const handleShare = (thread: any) => {
    setShareModalThread(thread);
  };

  const handleShareAction = () => {
    if (!shareModalThread) return;
    shareThread(shareModalThread.id)
      .then((updated) => {
        setThreads((prev) =>
          prev.map((t) =>
            t.id === shareModalThread.id ? { ...t, shares: updated.shares } : t
          )
        );
      })
      .catch((err) => console.error('[ThreadsFeed] share error:', err));
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
                setCommentsModalThread(null);
                
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
                    setCommentsModalThread(null);

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
      onNavigateToBusiness(commentAuthor.businessId);
      return;
    }
    
    if (commentAuthor.id && onNavigateToUserProfile) {
      onNavigateToUserProfile(commentAuthor.id);
      return;
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !commentsModalThread || !user) return;

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
        targetType: 'thread',
        targetId: commentsModalThread,
        content,
        parentCommentId,
      });
      const list = await fetchComments('thread', commentsModalThread);
      const mapped = list.map(mapCommentDtoToUi);
      setComments((prev) => ({ ...prev, [commentsModalThread]: mapped }));
      setThreads((prev) =>
        prev.map((t) =>
          t.id === commentsModalThread ? { ...t, comments: (t.comments ?? 0) + 1 } : t
        )
      );
      if (replyingTo) {
        setExpandedReplies((prev) => new Set([...prev, replyingTo.parentId || replyingTo.id]));
      }
    } catch (err) {
      console.error('[ThreadsFeed] Failed to add comment:', err);
      notifyError(err, 'Failed to add comment');
    }
    setNewComment('');
    setReplyingTo(null);
  };

  const handleLikeComment = (threadId: string, commentId: string, isReply: boolean = false, parentId?: string) => {
    if (!isAuthenticated) return;
    toggleLikeComment(commentId)
      .then((updated) => {
        setComments(prev => {
          const threadComments = prev[threadId] || [];
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
          return { ...prev, [threadId]: updateOne(threadComments) };
        });
      })
      .catch((err) => console.error('[ThreadsFeed] toggleLikeComment error:', err));
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

  const handleDeleteComment = async (threadId: string, commentId: string) => {
    if (!isAuthenticated) return;
    try {
      await deleteComment(commentId);
      const list = await fetchComments('thread', threadId);
      const mapped = (Array.isArray(list) ? list : []).map(mapCommentDtoToUi);
      setComments((prev) => ({ ...prev, [threadId]: mapped }));
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, comments: Math.max(0, (t.comments ?? 0) - 1) } : t
        )
      );
    } catch (err) {
      console.error('[ThreadsFeed] Failed to delete comment:', err);
    }
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
    const currentBusinessId = user.businessId || user.id;
    const authorBusinessId =
      author.type === 'business'
        ? author.businessId || author.id
        : author.id || author.businessId;

    return author.id === user.id || (currentBusinessId && authorBusinessId === currentBusinessId);
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

  const displayedThreads = React.useMemo(() => {
    if (highlightThreadId) {
      const highlightedThread = displayThreads.find(t => t.id === highlightThreadId);
      if (highlightedThread) {
        const rest = displayThreads.filter(t => t.id !== highlightThreadId);
        return [highlightedThread, ...rest];
      }
    }
    return displayThreads;
  }, [displayThreads, highlightThreadId]);
  
  const currentModalThread = threads.find(t => t.id === commentsModalThread);
  const threadComments = comments[commentsModalThread || ''] || [];
  const displayedComments = showAllComments ? threadComments : threadComments.slice(0, 15);
  const totalCommentsInModal = getTotalCommentCount(threadComments);

  return (
    <>
      <div className="space-y-6">
        {threadsError && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
            {threadsError}
          </div>
        )}
        {displayedThreads.map((thread) => {
          const totalComments = comments[thread.id]
            ? getTotalCommentCount(comments[thread.id])
            : (thread.commentsCount ?? (typeof thread.comments === 'number' ? thread.comments : 0));
          const isHighlighted = highlightThreadId === thread.id && showHighlight;
          
          return (
            <article 
              key={thread.id} 
              id={`thread-${thread.id}`} 
              ref={isHighlighted ? highlightedThreadRef : null}
              className={`rounded-xl border overflow-hidden hover:shadow-lg transition-colors duration-500 ${
                isHighlighted 
                  ? 'bg-green-100 border-green-300 shadow-lg' 
                  : 'bg-white border-neutral-200'
              }`}
            >
              {/* Thread Header */}
              <div className="p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                  {/* Profile picture with role icon at bottom-right */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => handleAuthorClick(thread.author)}
                      className="block"
                    >
                      <img
                        src={getAvatarUrl(thread.author.avatar, thread.author.name)}
                        alt={thread.author.name}
                        className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-green-500 transition-all"
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
                         thread.author.type === 'admin' ? 'Administrator' : 'Visitor'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-600 mt-1">
                      <Clock className="w-4 h-4" />
                      <time>{formatTime(thread.timestamp)}</time>
                    </div>
                  </div>
                  {isAuthenticated && thread.author.type === 'business' && !isOwnThread(thread.author) && !isFollowingAuthor(thread.author) && (
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
                  {isAuthenticated && thread.author.type === 'business' && !isOwnThread(thread.author) && isFollowingAuthor(thread.author) && (
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
                  <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 mb-2 sm:mb-3">
                    {thread.title}
                  </h2>
                )}

                {/* Thread Content */}
                <p className="text-sm sm:text-base text-neutral-800 whitespace-pre-wrap">{renderTextWithMentions(thread.content)}</p>

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
                <div className="flex items-center gap-4 sm:gap-6 pt-3 sm:pt-4 border-t border-neutral-100">
                  <button
                    onClick={() => handleLike(thread.id)}
                    disabled={!isAuthenticated || likingThreadId === thread.id}
                    className={`flex items-center gap-2 transition-colors ${
                      !isAuthenticated || likingThreadId === thread.id
                        ? 'cursor-not-allowed opacity-50' 
                        : thread.isLiked 
                        ? 'text-red-600' 
                        : 'text-neutral-600 hover:text-red-600'
                    }`}
                    title={!isAuthenticated ? 'Sign in to like threads' : likingThreadId === thread.id ? 'Updating...' : ''}
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
        
        <div ref={loadMoreSentinelRef} className="h-4" aria-hidden />
        {loadingMoreThreads && (
          <div className="text-center py-6">
            <span className="inline-block w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-2 text-neutral-500 text-sm">Loading more threads...</p>
          </div>
        )}
        {!hasMoreThreads && threads.length > 0 && (
          <p className="text-center py-6 text-neutral-500 text-sm">You&apos;ve seen all threads.</p>
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
                              src={getAvatarUrl(comment.author.avatar, comment.author.name)}
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
                                            src={getAvatarUrl(mentionUser.avatar, mentionUser.name)}
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
                              {comment.author.id && user?.id === comment.author.id && (
                                <button
                                  onClick={() => handleDeleteComment(commentsModalThread, comment.id)}
                                  className="text-xs font-medium text-neutral-600 hover:text-red-600 transition-colors"
                                  type="button"
                                >
                                  Delete
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
                                      src={getAvatarUrl(reply.author.avatar, reply.author.name)}
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
                                      {reply.author.id && user?.id === reply.author.id && (
                                        <button
                                          onClick={() => handleDeleteComment(commentsModalThread, reply.id)}
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
          postId={shareModalThread.id}
          postUrl={typeof window !== 'undefined' ? `${window.location.origin}/thread/${shareModalThread.id}` : undefined}
          postTitle={shareModalThread.title || shareModalThread.content?.substring(0, 50)}
          postOwnerName={shareModalThread.author?.name || shareModalThread.author?.fullName}
          postOwnerAvatar={
            shareModalThread.author?.avatar
              ? getAvatarUrl(shareModalThread.author.avatar, shareModalThread.author.name)
              : getAvatarUrl(null, shareModalThread.author?.name)
          }
          onShare={handleShareAction}
        />
      )}
    </>
  );
}