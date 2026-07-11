import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface ChatConversation {
  id: string;
  profileId: string;
  profileName: string;
  profileAvatar: string;
  profileType: string;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  online: boolean;
}

/** Shared post/thread preview payload (post owner = uploader, NOT chat sender). */
export interface SharedPostPreview {
  postId?: string;
  postTitle?: string;
  postImage?: string;
  postUrl?: string;
  postOwnerName?: string;
  postOwnerAvatar?: string;
  /** Legacy fields (mapped to above when sending). */
  title?: string;
  image?: string;
  url?: string;
  authorName?: string;
}

export interface ChatMessageDto {
  id: string;
  chatId: string;
  text: string;
  sender: 'user' | 'other';
  timestamp: string;
  senderName?: string;
  senderAvatar?: string;
  /** Set by server on real-time messages; client derives sender from this. */
  senderId?: string;
  /** When present, show a link preview (image, title, url) in the chat bubble. */
  sharedPost?: SharedPostPreview;
}

export async function getConversations(): Promise<ChatConversation[]> {
  const data = await apiGet<ChatConversation[]>('/chat/conversations');
  return Array.isArray(data) ? data : [];
}

export async function createOrGetConversation(participantId: string): Promise<ChatConversation> {
  const data = await apiPost<ChatConversation>('/chat/conversations', { participantId });
  return data;
}

export async function getMessages(conversationId: string, skip = 0, limit = 50): Promise<ChatMessageDto[]> {
  const data = await apiGet<ChatMessageDto[]>(
    `/chat/conversations/${conversationId}/messages?skip=${skip}&limit=${limit}`
  );
  return Array.isArray(data) ? data : [];
}

/** Send a message to a conversation (e.g. when sharing a post/thread to a contact). */
export async function sendMessage(
  conversationId: string,
  text: string,
  sharedPost?: SharedPostPreview
): Promise<ChatMessageDto> {
  const body: { text: string; sharedPost?: SharedPostPreview } = { text };
  const title = sharedPost?.postTitle ?? sharedPost?.title;
  const url = sharedPost?.postUrl ?? sharedPost?.url;
  if (sharedPost && (title || url)) {
    body.sharedPost = {
      postId: sharedPost.postId ?? undefined,
      postTitle: title ?? undefined,
      postImage: (sharedPost.postImage ?? sharedPost.image) && String(sharedPost.postImage ?? sharedPost.image).trim() ? String(sharedPost.postImage ?? sharedPost.image).trim() : undefined,
      postUrl: url ?? undefined,
      postOwnerName: (sharedPost.postOwnerName ?? sharedPost.authorName) && String(sharedPost.postOwnerName ?? sharedPost.authorName).trim() ? String(sharedPost.postOwnerName ?? sharedPost.authorName).trim() : undefined,
      postOwnerAvatar: sharedPost.postOwnerAvatar && String(sharedPost.postOwnerAvatar).trim() ? String(sharedPost.postOwnerAvatar).trim() : undefined,
    };
  }
  const data = await apiPost<ChatMessageDto>(`/chat/conversations/${conversationId}/messages`, body);
  return data;
}

/** Edit a message (allowed only within 20 minutes of sending). */
export async function editMessage(
  conversationId: string,
  messageId: string,
  text: string
): Promise<ChatMessageDto> {
  return apiPatch<ChatMessageDto>(
    `/chat/conversations/${conversationId}/messages/${messageId}`,
    { text }
  );
}

/** Delete a message (allowed only within 20 minutes of sending). */
export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<{ success: boolean; messageId: string }> {
  return apiDelete(`/chat/conversations/${conversationId}/messages/${messageId}`) as Promise<{ success: boolean; messageId: string }>;
}
