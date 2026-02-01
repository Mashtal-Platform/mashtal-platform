import React from 'react';
import { Bell, Package, MessageCircle, Heart, AlertCircle, Trash2 } from 'lucide-react';

interface Notification {
  id: string;
  type: 'order' | 'message' | 'follow' | 'alert';
  message: string;
  read: boolean;
  time: string;
}

interface NotificationsPageProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onClearAll: () => void;
}

export function NotificationsPage({ notifications, onMarkAsRead, onClearAll }: NotificationsPageProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <Package className="w-5 h-5 text-green-600" />;
      case 'message':
        return <MessageCircle className="w-5 h-5 text-blue-600" />;
      case 'follow':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'alert':
        return <AlertCircle className="w-5 h-5 text-amber-600" />;
      default:
        return <Bell className="w-5 h-5 text-neutral-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl text-neutral-900 mb-2">Notifications</h1>
            <p className="text-neutral-600">
              {notifications.filter(n => !n.read).length} unread notifications
            </p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={onClearAll}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <Bell className="w-16 h-16 text-neutral-300 mx-auto mb-4" />
            <h3 className="text-xl text-neutral-900 mb-2">No notifications</h3>
            <p className="text-neutral-600">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
                className={`bg-white rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all ${
                  !notification.read ? 'border-2 border-green-200' : 'border border-neutral-200 hover:shadow-md'
                }`}
              >
                <div className={`p-2 rounded-lg ${!notification.read ? 'bg-green-50' : 'bg-neutral-50'}`}>
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className={`${!notification.read ? 'text-neutral-900' : 'text-neutral-700'}`}>
                    {notification.message}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">{notification.time}</p>
                </div>
                {!notification.read && (
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
