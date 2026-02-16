import React from 'react';
import { Bell, Package, MessageCircle, Heart, AlertCircle, Trash2, CheckCheck, UserPlus, AtSign } from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'follow' | 'alert' | 'mention' | 'like' | 'comment';
  message: string;
  read: boolean;
  time: string;
  // Navigation properties
  relatedUserId?: string;  // For message/follow notifications
  postId?: string;         // For post-related notifications
  commentId?: string;      // For comment-related notifications
  threadId?: string;       // For thread-related notifications
  authorId?: string;       // For the author of the post/thread (who created it)
}

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onMarkAllAsRead?: () => void;
  onDeleteRead?: () => void;
  onNavigate?: (page: string, params?: any) => void;
  currentUserId?: string; // Add current user ID to determine if post is own
}

export function NotificationsPage({ 
  notifications, 
  onMarkAsRead, 
  onClearAll, 
  onMarkAllAsRead,
  onDeleteRead,
  onNavigate,
  currentUserId
}: NotificationsPageProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-purple-600" />;
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-orange-600" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-green-600" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-600" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }

    // Navigate based on notification type
    if (onNavigate) {
      if (notification.type === 'message' && notification.relatedUserId) {
        // Navigate to chat with the person who sent the message
        onNavigate('chats', { profileId: notification.relatedUserId });
      } 
      else if (notification.type === 'mention') {
        // Check if mentioned in post or thread
        if (notification.postId) {
          // If mentioned in a post
          if (notification.commentId) {
            // Mentioned in a comment - go to posts page and open the post with that comment
            onNavigate('posts', { 
              highlightPostId: notification.postId, 
              highlightCommentId: notification.commentId,
              openComments: true 
            });
          } else {
            // Mentioned in post description - just show the post on posts page
            onNavigate('posts', { 
              highlightPostId: notification.postId 
            });
          }
        } else if (notification.threadId) {
          // If mentioned in a thread
          if (notification.commentId) {
            // Mentioned in a thread comment - go to threads page and open the thread with that comment
            onNavigate('threads', { 
              highlightThreadId: notification.threadId, 
              highlightCommentId: notification.commentId,
              openComments: true 
            });
          } else {
            // Mentioned in thread description - just show the thread on threads page
            onNavigate('threads', { 
              highlightThreadId: notification.threadId 
            });
          }
        }
      } 
      else if (notification.type === 'comment' && notification.postId) {
        // Someone commented on my post - go to my profile and show the post with comments
        onNavigate('profile', { 
          highlightPostId: notification.postId,
          highlightCommentId: notification.commentId,
          openComments: true,
          tab: 'posts'
        });
      } 
      else if (notification.type === 'like' && notification.postId) {
        // Someone liked my post - go to my profile and show the post
        onNavigate('profile', { 
          highlightPostId: notification.postId,
          tab: 'posts'
        });
      } 
      else if (notification.type === 'follow' && notification.relatedUserId) {
        // Navigate to the follower's profile
        onNavigate('user-profile', { userId: notification.relatedUserId });
      }
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const readCount = notifications.filter(n => n.read).length;

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-neutral-900 mb-2">Notifications</h1>
            <p className="text-neutral-600">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Mark All as Read */}
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-sm font-medium"
                  title="Mark all notifications as read"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All Read</span>
                </button>
              )}
              {/* Delete Read Notifications */}
              {readCount > 0 && onDeleteRead && (
                <button
                  onClick={onDeleteRead}
                  className="flex items-center gap-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-sm font-medium"
                  title="Delete all read notifications"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Read</span>
                </button>
              )}
              {/* Clear All */}
              <button
                onClick={onClearAll}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium"
                title="Clear all notifications"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear All</span>
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center shadow-sm">
            <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">No notifications</h3>
            <p className="text-neutral-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${
                  !notification.read 
                    ? 'border-2 border-green-500 shadow-sm' 
                    : 'border border-neutral-200'
                }`}
              >
                <div className={`p-2.5 rounded-lg shrink-0 ${
                  !notification.read ? 'bg-green-50' : 'bg-neutral-50'
                }`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`${
                    !notification.read 
                      ? 'text-neutral-900 font-medium' 
                      : 'text-neutral-700'
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="w-2.5 h-2.5 bg-green-600 rounded-full mt-2 shrink-0 animate-pulse"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}