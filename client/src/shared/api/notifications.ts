import { apiGet, apiPost } from './client';

// Shape returned by backend notificationController, already adapted for UI
export interface NotificationDto {
  id: string;
  type: 'order' | 'message' | 'follow' | 'alert' | 'mention' | 'like' | 'comment';
  message: string;
  read: boolean;
  time: string;
  /** For message type: number of messages from that sender (grouped). Used for bell count. */
  messageCount?: number;
  relatedUserId?: string;
  postId?: string;
  commentId?: string;
  threadId?: string;
  authorId?: string;
  orderId?: string;
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  return apiGet('/notifications');
}

export async function markNotificationRead(id: string) {
  return apiPost(`/notifications/${id}/read`, {});
}

export async function markAllNotificationsRead() {
  return apiPost('/notifications/read-all', {});
}

export async function clearReadNotifications() {
  return apiPost('/notifications/clear-read', {});
}

export async function clearAllNotifications() {
  return apiPost('/notifications/clear-all', {});
}

