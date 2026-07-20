import React from 'react';
import { Bell, Package, MessageCircle, Heart, AlertCircle, Trash2, CheckCheck, UserPlus, AtSign, Flag } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'follow' | 'alert' | 'mention' | 'like' | 'comment' | 'transaction' | 'report' | 'admin_order';
  message: string;
  read: boolean;
  time: string;
  relatedUserId?: string;
  postId?: string;
  commentId?: string;
  threadId?: string;
  orderId?: string;
  paymentId?: string;
  reportId?: string;
  authorId?: string;
  messageCount?: number;
}

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
  onMarkAllAsRead?: () => void;
  onDeleteRead?: () => void;
  onNavigate?: (page: string, params?: any) => void;
  onNavigateToUserProfile?: (userId: string) => void;
  currentUserId?: string;
  userRole?: string;
}

export function NotificationsPage({
  notifications,
  onMarkAsRead,
  onClearAll,
  onMarkAllAsRead,
  onDeleteRead,
  onNavigate,
  onNavigateToUserProfile,
  currentUserId,
  userRole,
}: NotificationsPageProps) {
  const { t } = useTranslation();

  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'admin_order':
        return <Package className="w-5 h-5 text-emerald-700" />;
      case 'transaction':
        return <Package className="w-5 h-5 text-emerald-700" />;
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
      case 'report':
        return <Flag className="w-5 h-5 text-red-600" />;
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
        // Navigate to the follower's profile (fetches user, opens business profile if they're a business)
        if (onNavigateToUserProfile) {
          onNavigateToUserProfile(notification.relatedUserId);
        } else {
          onNavigate('user-profile', { userId: notification.relatedUserId });
        }
      } else if (notification.type === 'order') {
        // Buyers → purchase history; businesses → dashboard orders
        if (userRole === 'business') {
          onNavigate('dashboard', {
            section: 'orders',
            highlightOrderId: notification.orderId,
          });
        } else {
          onNavigate('purchase-history', {
            highlightOrderId: notification.orderId,
          });
        }
      } else if (notification.type === 'admin_order') {
        onNavigate('admin', {
          section: 'orders',
          highlightOrderId: notification.orderId,
        });
      } else if (notification.type === 'transaction') {
        onNavigate('admin', {
          section: 'transactions',
          highlightPaymentId: notification.paymentId,
        });
      } else if (notification.type === 'report') {
        onNavigate('admin', {
          section: 'reports',
        });
      }
    }
  };

  const unreadCount = notifications
    .filter((n) => !n.read)
    .reduce((acc, n) => acc + (n.messageCount ?? 1), 0);
  const readCount = notifications.filter((n) => n.read).length;

  return (
    <div className="min-h-screen bg-neutral-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl text-neutral-900 mb-2">{t('notifications.title')}</h1>
            <p className="text-neutral-600">
              {t('notifications.unread', { count: unreadCount })}
            </p>
          </div>
          {notifications.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {unreadCount > 0 && onMarkAllAsRead && (
                <button
                  onClick={onMarkAllAsRead}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                  title={t('notifications.markAllTitle')}
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>{t('notifications.markAllRead')}</span>
                </button>
              )}
              {readCount > 0 && onDeleteRead && (
                <button
                  onClick={onDeleteRead}
                  className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                  title={t('notifications.deleteReadTitle')}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('notifications.deleteRead')}</span>
                </button>
              )}
              <button
                onClick={onClearAll}
                className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-xs sm:text-sm font-medium"
                title={t('notifications.clearAllTitle')}
              >
                <Trash2 className="w-4 h-4" />
                <span>{t('notifications.clearAll')}</span>
              </button>
            </div>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-6 sm:p-12 text-center shadow-sm">
            <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">{t('notifications.emptyTitle')}</h3>
            <p className="text-neutral-600">{t('notifications.emptyBody')}</p>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`bg-white rounded-xl p-3 sm:p-4 flex items-start gap-3 sm:gap-4 cursor-pointer transition-all hover:shadow-md ${
                  !notification.read 
                    ? 'border-2 border-green-500 shadow-sm' 
                    : 'border border-neutral-200'
                }`}
              >
                <div className={`p-2 sm:p-2.5 rounded-lg shrink-0 ${
                  !notification.read ? 'bg-green-50' : 'bg-neutral-50'
                }`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm sm:text-base ${
                    !notification.read 
                      ? 'text-neutral-900 font-medium' 
                      : 'text-neutral-700'
                  }`}>
                    {notification.message}
                  </p>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-1">{notification.time}</p>
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