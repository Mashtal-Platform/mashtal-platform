import React, { useState, useEffect, useMemo, useRef } from 'react';
import { X, Heart, MessageCircle, Bookmark, Send, Share2, Trash2, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { getImageUrl } from '../shared/api/client';
import { fetchMentionableProfiles } from '../shared/api/users';
import { SeeTranslation } from './SeeTranslation';
import { useTranslation } from 'react-i18next';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timeAgo: string;
  likes?: number;
  isLiked?: boolean;
  replies?: Comment[];
}

interface Post {
  id: string;
  image: string;
  title: string;
  content: string;
  likes: number;
  comments: Comment[];
  timeAgo: string;
  authorName: string;
  authorAvatar: string;
}

interface PostModalProps {
  post: Post;
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  onComment: (comment: string, parentId?: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onLikeComment?: (commentId: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  isLiked: boolean;
  isSaved?: boolean;
  highlightCommentId?: string;
  onNavigateToBusiness?: (businessId: string) => void;
  onNavigateToUserProfile?: (userId: string) => void;
}

interface MentionUser {
  id: string;
  name: string;
  avatar: string;
  type: string;
  verified?: boolean;
}

export function PostModal({ 
  post, 
  isOpen, 
  onClose, 
  onLike, 
  onComment, 
  onDeleteComment,
  onLikeComment,
  onEditComment,
  onSave,
  onShare,
  isLiked,
  isSaved = false,
  highlightCommentId,
  onNavigateToBusiness,
  onNavigateToUserProfile,
}: PostModalProps) {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showFullText, setShowFullText] = useState(false);

  const [mentionableUsers, setMentionableUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const getUserNameByCommentId = (id: string | null) => {
    if (!id) return undefined;
    const walk = (arr: Comment[]): string | undefined => {
      for (const c of arr) {
        if (c.id === id) return c.userName;
        if (c.replies?.length) {
          const found = walk(c.replies);
          if (found) return found;
        }
      }
      return undefined;
    };
    return walk(post.comments);
  };

  useEffect(() => {
    if (isOpen && highlightCommentId) {
      setTimeout(() => {
        const element = document.getElementById(`comment-${highlightCommentId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add highlight effect
          element.classList.add('bg-green-50', 'ring-2', 'ring-green-500', 'rounded-lg', 'transition-all', 'duration-500', '-m-2', 'p-2');
          setTimeout(() => {
             element.classList.remove('ring-2', 'ring-green-500', '-m-2', 'p-2');
             // Fade out the background color
             setTimeout(() => {
               element.classList.remove('bg-green-50');
             }, 1000);
          }, 2000);
        }
      }, 300);
    }
  }, [isOpen, highlightCommentId]);

  if (!isOpen) return null;

  const canComment = isAuthenticated;
  // Allow reply for any authenticated user (Saved modal should match normal profile behavior).
  const canReply = isAuthenticated;

  // Load mentionable users (business/professional + all authors present in this modal),
  // so @mentions can be rendered as green clickable links.
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;

    async function load() {
      try {
        const profiles = await fetchMentionableProfiles().catch(() => []);
        const base: MentionUser[] = (Array.isArray(profiles) ? profiles : [])
          .map((u) => ({
            id: u.id,
            name: (u.fullName || u.companyName || '').trim(),
            avatar: u.avatar || '',
            type: u.role || 'business',
            verified: !!u.verified,
          }))
          .filter((u) => u.name.length > 0);

        const baseById = new Map<string, MentionUser>();
        base.forEach((u) => baseById.set(u.id, u));

        const fromPost: MentionUser[] = [];
        const walk = (arr: Comment[]) => {
          for (const c of arr) {
            if (c.userId) {
              const existing = baseById.get(c.userId);
              fromPost.push({
                id: c.userId,
                name: (c.userName || existing?.name || '').trim(),
                avatar: c.userAvatar || existing?.avatar || '',
                type: existing?.type || 'user',
                verified: existing?.verified || false,
              });
            }
            if (c.replies?.length) walk(c.replies);
          }
        };
        walk(post.comments || []);

        const merged = [...base, ...fromPost].reduce((acc, u) => {
          if (!u.id || !u.name) return acc;
          if (!acc.some((x) => x.id === u.id)) acc.push(u);
          return acc;
        }, [] as MentionUser[]);

        if (isMounted) setMentionableUsers(merged);
      } catch {
        // Non-fatal.
      }
    }

    void load();
    return () => {
      isMounted = false;
    };
  }, [isOpen, post]);

  // Filter mention candidates as you type after '@'
  useEffect(() => {
    if (!mentionSearch.trim()) {
      setFilteredMentions([]);
      return;
    }
    const filtered = mentionableUsers.filter((u) =>
      u.name.toLowerCase().includes(mentionSearch.toLowerCase()),
    );
    setFilteredMentions(filtered);
    setSelectedMentionIndex(0);
  }, [mentionSearch, mentionableUsers]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart ?? value.length;
    setNewComment(value);

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
        setMentionSearch('');
      }
    } else {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const insertMention = (mentionUser: MentionUser) => {
    const beforeMention = newComment.substring(0, mentionPosition);
    const afterMention = newComment.substring(mentionPosition + mentionSearch.length + 1);
    const newValue = `${beforeMention}@${mentionUser.name} ${afterMention}`;

    setNewComment(newValue);
    setShowMentions(false);
    setMentionSearch('');
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleMentionKeyDown = (e: React.KeyboardEvent) => {
    if (!showMentions || filteredMentions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev < filteredMentions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        prev > 0 ? prev - 1 : filteredMentions.length - 1,
      );
    } else if (e.key === 'Enter' && showMentions) {
      e.preventDefault();
      insertMention(filteredMentions[selectedMentionIndex]);
    } else if (e.key === 'Escape') {
      setShowMentions(false);
      setMentionSearch('');
    }
  };

  const renderTextWithMentions = (text: string) => {
    if (!text || typeof text !== 'string') return text || '';

    const parts: (string | JSX.Element)[] = [];
    let currentIndex = 0;

    for (let i = 0; i < text.length; i++) {
      if (text[i] !== '@') continue;

      if (i > currentIndex) parts.push(text.substring(currentIndex, i));

      const textAfterAt = text.substring(i + 1);
      const lowerAfterAt = textAfterAt.toLowerCase();

      // 1) Full match (supports multi-word names)
      let matchedUser: MentionUser | null = null;
      let matchedFullName = '';
      for (const u of mentionableUsers) {
        const lowerUserName = u.name.toLowerCase();
        if (lowerAfterAt.startsWith(lowerUserName) && u.name.length > matchedFullName.length) {
          matchedUser = u;
          matchedFullName = u.name;
        }
      }

      if (matchedUser && matchedFullName) {
        parts.push(
          <span
            key={`mention-${i}`}
            className="text-green-600 font-medium cursor-pointer hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
              if (matchedUser.type === 'business' && onNavigateToBusiness) {
                onNavigateToBusiness(matchedUser.id);
              } else if (onNavigateToUserProfile) {
                onNavigateToUserProfile(matchedUser.id);
              }
            }}
          >
            @{matchedFullName}
          </span>,
        );

        currentIndex = i + 1 + matchedFullName.length;
        i = currentIndex - 1;
        continue;
      }

      // 2) Partial match (token until whitespace)
      const tokenMatch = textAfterAt.match(/^[^\s]+/);
      const token = tokenMatch?.[0] ?? '';

      if (token) {
        const lowerToken = token.toLowerCase();
        let partialMatch: MentionUser | null = null;
        let bestPartialName = '';

        for (const u of mentionableUsers) {
          const lowerUserName = u.name.toLowerCase();
          if (lowerUserName.startsWith(lowerToken) && u.name.length > bestPartialName.length) {
            partialMatch = u;
            bestPartialName = u.name;
          }
        }

        if (partialMatch) {
          parts.push(
            <span
              key={`mention-${i}`}
              className="text-green-600 font-medium cursor-pointer hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
                if (partialMatch.type === 'business' && onNavigateToBusiness) {
                  onNavigateToBusiness(partialMatch.id);
                } else if (onNavigateToUserProfile) {
                  onNavigateToUserProfile(partialMatch.id);
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

      parts.push('@');
      currentIndex = i + 1;
    }

    if (currentIndex < text.length) parts.push(text.substring(currentIndex));
    return parts.length > 0 ? parts : text;
  };

  const handleSubmitComment = () => {
    if (!newComment.trim() || !canComment) return;

    // In reply mode, ensure the reply author is mentioned exactly once.
    let content = newComment.trim();
    if (replyingTo) {
      const replyAuthorName = getUserNameByCommentId(replyingTo);
      const prefix = replyAuthorName ? `@${replyAuthorName}` : '';

      if (prefix) {
        const lower = content.toLowerCase();
        const lowerPrefix = prefix.toLowerCase();
        // If user already typed the mention, keep it. Otherwise prefix it.
        if (!lower.startsWith(lowerPrefix)) {
          content = `${prefix} ${content}`.trim();
        }
      }
    }

    onComment(content, replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
    setShowMentions(false);
    setMentionSearch('');
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    if (!editingCommentId) return;
    const next = editContent.trim();
    if (!next) return;
    onEditComment?.(editingCommentId, next);
    setEditingCommentId(null);
    setEditContent('');
  };

  const canDelete = (commentUserId: string) => isAuthenticated && user?.id && user.id === commentUserId;

  const maxLength = 200;
  const shouldTruncate = post.content.length > maxLength;
  const displayContent = showFullText ? post.content : post.content.slice(0, maxLength);

  const totalComments = post.comments.reduce((acc, comment) => {
    return acc + 1 + (comment.replies?.length || 0);
  }, 0);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Image */}
        <div className="md:w-3/5 bg-black flex items-center justify-center">
          <img 
            src={post.image ? getImageUrl(post.image) : ''} 
            alt={post.title}
            className="w-full h-full object-contain max-h-[90vh]"
          />
        </div>

        {/* Right: Content */}
        <div className="md:w-2/5 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="p-4 border-b border-neutral-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                {post.authorAvatar ? (
                  <img src={getImageUrl(post.authorAvatar)} alt={post.authorName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-green-600 font-medium">{(post.authorName || '?')[0]}</span>
                )}
              </div>
              <div>
                <div className="font-semibold text-neutral-900">{post.authorName}</div>
                <div className="text-sm text-neutral-500">{post.timeAgo}</div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Post Content */}
          <div className="p-4 border-b border-neutral-200">
            <h3 className="font-semibold text-neutral-900 mb-2">{post.title}</h3>
            <p className="text-neutral-700 whitespace-pre-wrap">
              {displayContent}
              {shouldTruncate && !showFullText && '... '}
              {shouldTruncate && (
                <button 
                  onClick={() => setShowFullText(!showFullText)}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  {showFullText ? t('common.readLess') : t('common.readMore')}
                </button>
              )}
            </p>
            <SeeTranslation text={post.content} />
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} id={`comment-${comment.id}`} className="space-y-2 transition-colors duration-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {comment.userAvatar ? (
                        <img src={getImageUrl(comment.userAvatar)} alt={comment.userName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-neutral-600 text-sm font-medium">{(comment.userName || '?')[0]}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>{t('common.save')}</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>{t('common.cancel')}</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="font-medium text-neutral-900 text-sm mb-1">{comment.userName}</div>
                            <p className="text-neutral-700 text-sm">{renderTextWithMentions(comment.content)}</p>
                            <SeeTranslation text={comment.content} />
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                            <span>{comment.timeAgo}</span>
                            {onLikeComment && (
                              <button
                                type="button"
                                onClick={() => onLikeComment(comment.id)}
                                disabled={!isAuthenticated}
                                className={`text-xs flex items-center gap-1 transition-colors ${
                                  !isAuthenticated
                                    ? 'cursor-not-allowed opacity-50'
                                    : comment.isLiked
                                    ? 'text-red-600'
                                    : 'text-neutral-500 hover:text-red-600'
                                }`}
                              >
                                <ThumbsUp
                                  className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`}
                                />
                                <span>{comment.likes ?? 0}</span>
                              </button>
                            )}
                            {canReply && (
                              <button 
                                onClick={() => setReplyingTo(comment.id)}
                                className="hover:text-green-600"
                              >{t('common.reply')}</button>
                            )}
                            {user?.id === comment.userId && (
                              <button 
                                onClick={() => handleEditComment(comment.id, comment.content)}
                                className="hover:text-green-600"
                              >
                                {t('common.edit')}
                              </button>
                            )}
                            {onDeleteComment && canDelete(comment.userId) && (
                              <button
                                onClick={() => onDeleteComment(comment.id)}
                                className="hover:text-red-600 flex items-center gap-1"
                                title={t('common.delete')}
                                type="button"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t('common.delete')}
                              </button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Replies */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="mt-3 ml-4 space-y-3 border-l-2 border-neutral-200 pl-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} id={`comment-${reply.id}`} className="flex items-start gap-2 transition-colors duration-500 rounded-lg p-1">
                              <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {reply.userAvatar ? (
                                  <img src={getImageUrl(reply.userAvatar)} alt={reply.userName} className="w-full h-full object-cover" />
                                ) : (
                                  <span className="text-neutral-600 text-xs font-medium">{(reply.userName || '?')[0]}</span>
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="bg-neutral-50 rounded-lg p-2">
                                  <div className="font-medium text-neutral-900 text-xs mb-1">{reply.userName}</div>
                                  {editingCommentId === reply.id ? (
                                    <div className="space-y-2">
                                      <Textarea
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="min-h-[50px]"
                                      />
                                      <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveEdit}>
                                          {t('common.save')}
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setEditingCommentId(null);
                                            setEditContent('');
                                          }}
                                        >
                                          {t('common.cancel')}
                                        </Button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <p className="text-neutral-700 text-xs">{renderTextWithMentions(reply.content)}</p>
                                      <SeeTranslation text={reply.content} />
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 flex-wrap">
                                  <span>{reply.timeAgo}</span>
                                  {onLikeComment && (
                                    <button
                                      type="button"
                                      onClick={() => onLikeComment(reply.id)}
                                      disabled={!isAuthenticated}
                                      className={`text-xs flex items-center gap-1 transition-colors ${
                                        !isAuthenticated
                                          ? 'cursor-not-allowed opacity-50'
                                          : reply.isLiked
                                          ? 'text-red-600'
                                          : 'text-neutral-500 hover:text-red-600'
                                      }`}
                                    >
                                      <ThumbsUp
                                        className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`}
                                      />
                                      <span>{reply.likes ?? 0}</span>
                                    </button>
                                  )}
                                  {canReply && (
                                    <button
                                      onClick={() => setReplyingTo(reply.id)}
                                      className="hover:text-green-600"
                                      type="button"
                                    >{t('common.reply')}</button>
                                  )}
                                  {user?.id === reply.userId && (
                                    <button
                                      onClick={() => handleEditComment(reply.id, reply.content)}
                                      className="hover:text-green-600"
                                      type="button"
                                      disabled={editingCommentId === reply.id}
                                    >
                                      {t('common.edit')}
                                    </button>
                                  )}
                                  {onDeleteComment && canDelete(reply.userId) && (
                                    <button
                                      onClick={() => onDeleteComment(reply.id)}
                                      className="hover:text-red-600 flex items-center gap-1"
                                      title={t('common.delete')}
                                      type="button"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      {t('common.delete')}
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
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="border-t border-neutral-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={onLike}
                  className={`flex items-center gap-2 transition-colors ${
                    isLiked ? 'text-red-600' : 'text-neutral-700 hover:text-red-600'
                  }`}
                >
                  <Heart className={`w-6 h-6 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-sm font-medium">{post.likes}</span>
                </button>
                <div className="flex items-center gap-2 text-neutral-700">
                  <MessageCircle className="w-6 h-6" />
                  <span className="text-sm font-medium">{totalComments}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {onShare && (
                  <button 
                    onClick={onShare}
                    className="text-neutral-700 hover:text-green-600 transition-colors"
                    title="Share"
                  >
                    <Share2 className="w-6 h-6" />
                  </button>
                )}
                {onSave && (
                  <button 
                    onClick={onSave}
                    className={`transition-colors ${
                      isSaved ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'
                    }`}
                  >
                    <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                  </button>
                )}
              </div>
            </div>

            {/* Add Comment */}
            {canComment ? (
              <div className="space-y-2 relative">
                {replyingTo && (
                  <div className="text-xs text-neutral-600 flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg">
                    <span>{t('posts.replyingTo', { name: getUserNameByCommentId(replyingTo) ?? t('common.comment') })}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-neutral-500 hover:text-neutral-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Mention Dropdown */}
                {showMentions && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-64 overflow-y-auto z-10">
                    {filteredMentions.length > 0 ? (
                      filteredMentions.map((mentionUser, index) => (
                        <button
                          key={mentionUser.id}
                          type="button"
                          onClick={() => insertMention(mentionUser)}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors ${
                            index === selectedMentionIndex ? 'bg-green-50' : ''
                          }`}
                        >
                          <img
                            src={getImageUrl(mentionUser.avatar)}
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
                      <div className="px-4 py-3 text-sm text-neutral-500">No matches</div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    placeholder={t('posts.writeComment')}
                    value={newComment}
                    onChange={handleCommentChange}
                    onKeyDown={handleMentionKeyDown}
                    ref={textareaRef}
                    className="flex-1 min-h-[80px]"
                  />
                  <Button onClick={handleSubmitComment} disabled={!newComment.trim()}>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-neutral-500 bg-neutral-50 py-3 rounded-lg">
                {isAuthenticated 
                  ? 'Only Engineers and Businesses can comment' 
                  : 'Sign in to comment on this post'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}