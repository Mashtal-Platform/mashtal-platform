import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Heart, MessageCircle, Bookmark, Send, Share2, Reply, ThumbsUp, Trash2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { getImageUrl } from '../shared/api/client';
import { fetchMentionableProfiles } from '../shared/api/users';
import { SeeTranslation } from './SeeTranslation';

export interface ThreadModalComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timeAgo: string;
  likes?: number;
  isLiked?: boolean;
  replies?: ThreadModalComment[];
}

export interface ThreadModalThread {
  id: string;
  title?: string;
  content: string;
  tags?: string[];
  likes: number;
  isLiked?: boolean;
  commentsCount?: number;
  shares?: number;
  timeAgo?: string;
  timestamp?: string;
  author?: { id?: string; name?: string; avatar?: string };
  authorName?: string;
  authorAvatar?: string;
}

interface ThreadModalProps {
  thread: ThreadModalThread;
  comments: ThreadModalComment[];
  isOpen: boolean;
  onClose: () => void;
  onLike: () => void;
  onComment: (text: string, parentId?: string) => void;
  onLikeComment?: (commentId: string) => void;
  onEditComment?: (commentId: string, content: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onSave?: () => void;
  onShare?: () => void;
  isLiked: boolean;
  isSaved?: boolean;
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

export function ThreadModal({
  thread,
  comments,
  isOpen,
  onClose,
  onLike,
  onComment,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onSave,
  onShare,
  isLiked,
  isSaved = false,
  onNavigateToBusiness,
  onNavigateToUserProfile,
}: ThreadModalProps) {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const [mentionableUsers, setMentionableUsers] = useState<MentionUser[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState('');
  const [mentionPosition, setMentionPosition] = useState(0);
  const [filteredMentions, setFilteredMentions] = useState<MentionUser[]>([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const canComment = isAuthenticated;
  const authorName = thread.author?.name ?? thread.authorName ?? 'Unknown';
  const authorAvatar = thread.author?.avatar ?? thread.authorAvatar;
  const computedCommentCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length || 0), 0);
  const totalComments = Math.max(thread.commentsCount ?? 0, computedCommentCount);
  const effectiveIsLiked = isLiked ?? thread.isLiked ?? false;
  const displayLikes = thread.likes ?? 0;

  const commentById = useMemo(() => {
    const map = new Map<string, ThreadModalComment>();
    const visit = (c: ThreadModalComment) => {
      map.set(c.id, c);
      (c.replies ?? []).forEach(visit);
    };
    comments.forEach(visit);
    return map;
  }, [comments]);

  const replyingToComment = replyingTo ? commentById.get(replyingTo) : null;
  const canDelete = (commentUserId: string) => isAuthenticated && user?.id && user.id === commentUserId;

  // Load mentionables so @mentions can be rendered as green clickable links.
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

        const fromComments: MentionUser[] = [];
        const walk = (arr: ThreadModalComment[]) => {
          for (const c of arr) {
            if (c.userId) {
              const existing = baseById.get(c.userId);
              fromComments.push({
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
        walk(comments || []);

        const merged = [...base, ...fromComments].reduce((acc, u) => {
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
  }, [isOpen, comments]);

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

    let content = newComment.trim();
    if (replyingTo) {
      const replyAuthorName = replyingToComment?.userName;
      const prefix = replyAuthorName ? `@${replyAuthorName}` : '';
      if (prefix) {
        const lower = content.toLowerCase();
        const lowerPrefix = prefix.toLowerCase();
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

  const handleSaveEdit = () => {
    if (!editingCommentId) return;
    const next = editContent.trim();
    if (!next) return;
    onEditComment?.(editingCommentId, next);
    setEditingCommentId(null);
    setEditContent('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center overflow-hidden">
              {authorAvatar ? (
                <img src={getImageUrl(authorAvatar)} alt={authorName} className="w-full h-full object-cover" />
              ) : (
                <span className="text-green-600 font-medium">{(authorName || '?')[0]}</span>
              )}
            </div>
            <div>
              <div className="font-semibold text-neutral-900">{authorName}</div>
              <div className="text-sm text-neutral-500">{thread.timeAgo || (thread.timestamp ? new Date(thread.timestamp).toLocaleDateString() : '')}</div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thread Content */}
        <div className="p-4 border-b border-neutral-200 overflow-y-auto flex-shrink-0">
          {thread.title && (
            <h3 className="font-semibold text-neutral-900 mb-2">{thread.title}</h3>
          )}
          <p className="text-neutral-700 whitespace-pre-wrap">{renderTextWithMentions(thread.content)}</p>
          <SeeTranslation text={thread.content} />
          {thread.tags && thread.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {thread.tags.map((tag, i) => (
                <span key={i} className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-sm">#{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id} id={`comment-${comment.id}`} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {comment.userAvatar ? (
                      <img src={getImageUrl(comment.userAvatar)} alt={comment.userName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-neutral-600 text-sm font-medium">{(comment.userName || '?')[0]}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="bg-neutral-50 rounded-lg p-3">
                      <div className="font-medium text-neutral-900 text-sm mb-1">{comment.userName}</div>
                      {editingCommentId === comment.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[60px]"
                          />
                          <div className="flex gap-2">
                            <Button size="sm" onClick={handleSaveEdit}>{t('common.save')}</Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditingCommentId(null);
                                setEditContent('');
                              }}
                            >{t('common.cancel')}</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-neutral-700 text-sm">{renderTextWithMentions(comment.content)}</p>
                          <SeeTranslation text={comment.content} />
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-xs text-neutral-500">{comment.timeAgo}</span>
                      {onLikeComment && (
                        <button
                          type="button"
                          onClick={() => onLikeComment(comment.id)}
                          className={`text-xs flex items-center gap-1 transition-colors ${
                            comment.isLiked ? 'text-red-600' : 'text-neutral-500 hover:text-red-600'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${comment.isLiked ? 'fill-current' : ''}`} />
                          <span>{comment.likes ?? 0}</span>
                        </button>
                      )}
                      {canComment && (
                        <button
                          type="button"
                          onClick={() => setReplyingTo(comment.id)}
                          className="text-xs text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" />
                          {t('common.reply')}
                        </button>
                      )}
                      {onDeleteComment && canDelete(comment.userId) && (
                        <button
                          type="button"
                          onClick={() => onDeleteComment(comment.id)}
                          className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                      {onEditComment && canDelete(comment.userId) && editingCommentId !== comment.id && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditContent(comment.content);
                          }}
                          className="text-xs text-neutral-600 hover:text-green-700 hover:underline flex items-center gap-1"
                          title={t('common.edit')}
                        >
                          <ThumbsUp className="w-3 h-3" />
                          {t('common.edit')}
                        </button>
                      )}
                    </div>
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 ml-4 space-y-3 border-l-2 border-neutral-200 pl-3">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start gap-2">
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
                                    <Button size="sm" onClick={handleSaveEdit}>{t('common.save')}</Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        setEditingCommentId(null);
                                        setEditContent('');
                                      }}
                                    >{t('common.cancel')}</Button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <p className="text-neutral-700 text-xs">{renderTextWithMentions(reply.content)}</p>
                                  <SeeTranslation text={reply.content} />
                                </>
                              )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-xs text-neutral-500">{reply.timeAgo}</span>
                                {onLikeComment && (
                                  <button
                                    type="button"
                                    onClick={() => onLikeComment(reply.id)}
                                    className={`text-xs flex items-center gap-1 transition-colors ${
                                      reply.isLiked ? 'text-red-600' : 'text-neutral-500 hover:text-red-600'
                                    }`}
                                  >
                                    <ThumbsUp className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                                    <span>{reply.likes ?? 0}</span>
                                  </button>
                                )}
                                {canComment && (
                                  <button
                                    type="button"
                                    onClick={() => setReplyingTo(reply.id)}
                                    className="text-xs text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                                  >
                                    <Reply className="w-3 h-3" />
                                    {t('common.reply')}
                                  </button>
                                )}
                                {onDeleteComment && canDelete(reply.userId) && (
                                  <button
                                    type="button"
                                    onClick={() => onDeleteComment(reply.id)}
                                    className="text-xs text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
                                    title={t('common.delete')}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                    Delete
                                  </button>
                                )}
                              {onEditComment && canDelete(reply.userId) && editingCommentId !== reply.id && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingCommentId(reply.id);
                                    setEditContent(reply.content);
                                  }}
                                  className="text-xs text-neutral-600 hover:text-green-700 hover:underline flex items-center gap-1"
                                  title={t('common.edit')}
                                >
                                  <ThumbsUp className="w-3 h-3" />
                                  {t('common.edit')}
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
        <div className="border-t border-neutral-200 p-4 space-y-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onLike}
                className={`flex items-center gap-2 transition-colors ${effectiveIsLiked ? 'text-red-600' : 'text-neutral-700 hover:text-red-600'}`}
              >
                <Heart className={`w-6 h-6 ${effectiveIsLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{displayLikes}</span>
              </button>
              <div className="flex items-center gap-2 text-neutral-700">
                <MessageCircle className="w-6 h-6" />
                <span className="text-sm font-medium">{totalComments}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onShare && (
                <button onClick={onShare} className="text-neutral-700 hover:text-green-600 transition-colors" title="Share">
                  <Share2 className="w-6 h-6" />
                </button>
              )}
              {onSave && (
                <button
                  onClick={onSave}
                  className={`transition-colors ${isSaved ? 'text-green-600' : 'text-neutral-700 hover:text-green-600'}`}
                >
                  <Bookmark className={`w-6 h-6 ${isSaved ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>
          </div>
          {canComment && (
            <div className="space-y-2 relative">
              {replyingTo && (
                <div className="text-xs text-neutral-600 flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg">
                  <span>{t('posts.replyingTo', { name: replyingToComment?.userName ?? t('common.comment') })}</span>
                  <button onClick={() => setReplyingTo(null)} className="text-neutral-500 hover:text-neutral-700 p-1">
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
          )}
        </div>
      </div>
    </div>
  );
}
