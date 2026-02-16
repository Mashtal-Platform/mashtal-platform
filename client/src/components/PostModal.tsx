import React, { useState, useEffect } from 'react';
import { X, Heart, MessageCircle, Bookmark, Send } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timeAgo: string;
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
  onSave?: () => void;
  isLiked: boolean;
  isSaved?: boolean;
  highlightCommentId?: string;
}

export function PostModal({ 
  post, 
  isOpen, 
  onClose, 
  onLike, 
  onComment, 
  onSave,
  isLiked,
  isSaved = false,
  highlightCommentId
}: PostModalProps) {
  const { user, isAuthenticated } = useAuth();
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showFullText, setShowFullText] = useState(false);

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
  const canReply = user && (user.role === 'engineer' || user.role === 'business');

  const handleSubmitComment = () => {
    if (!newComment.trim() || !canComment) return;
    onComment(newComment, replyingTo || undefined);
    setNewComment('');
    setReplyingTo(null);
  };

  const handleEditComment = (commentId: string, content: string) => {
    setEditingCommentId(commentId);
    setEditContent(content);
  };

  const handleSaveEdit = () => {
    // TODO: Implement edit comment in parent
    setEditingCommentId(null);
    setEditContent('');
  };

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
            src={post.image} 
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
                  <img src={post.authorAvatar} alt={post.authorName} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <span className="text-green-600 font-medium">{post.authorName[0]}</span>
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
                  {showFullText ? 'Read less' : 'Read more'}
                </button>
              )}
            </p>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4">
              {post.comments.map((comment) => (
                <div key={comment.id} id={`comment-${comment.id}`} className="space-y-2 transition-colors duration-500 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-neutral-600 text-sm font-medium">{comment.userName[0]}</span>
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
                            <Button size="sm" onClick={handleSaveEdit}>Save</Button>
                            <Button size="sm" variant="outline" onClick={() => setEditingCommentId(null)}>Cancel</Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="bg-neutral-50 rounded-lg p-3">
                            <div className="font-medium text-neutral-900 text-sm mb-1">{comment.userName}</div>
                            <p className="text-neutral-700 text-sm">{comment.content}</p>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-neutral-500">
                            <span>{comment.timeAgo}</span>
                            {canReply && (
                              <button 
                                onClick={() => setReplyingTo(comment.id)}
                                className="hover:text-green-600"
                              >
                                Reply
                              </button>
                            )}
                            {user?.id === comment.userId && (
                              <button 
                                onClick={() => handleEditComment(comment.id, comment.content)}
                                className="hover:text-green-600"
                              >
                                Edit
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
                              <div className="w-6 h-6 bg-neutral-200 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-neutral-600 text-xs font-medium">{reply.userName[0]}</span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-neutral-50 rounded-lg p-2">
                                  <div className="font-medium text-neutral-900 text-xs mb-1">{reply.userName}</div>
                                  <p className="text-neutral-700 text-xs">{reply.content}</p>
                                </div>
                                <span className="text-xs text-neutral-500 mt-1">{reply.timeAgo}</span>
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

            {/* Add Comment */}
            {canComment ? (
              <div className="space-y-2">
                {replyingTo && (
                  <div className="text-xs text-neutral-600 flex items-center justify-between bg-neutral-50 px-3 py-2 rounded-lg">
                    <span>Replying to {post.comments.find(c => c.id === replyingTo)?.userName}</span>
                    <button onClick={() => setReplyingTo(null)} className="text-neutral-500 hover:text-neutral-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
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