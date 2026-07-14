import { apiDelete, apiGet, apiPost, apiPatch } from './client';

export interface CommentAuthorDto {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  type: string;
  businessId?: string;
}

export interface CommentDto {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  author: CommentAuthorDto;
  replies: CommentDto[];
}

export async function fetchComments(
  targetType: 'post' | 'thread',
  targetId: string
): Promise<CommentDto[]> {
  const params = new URLSearchParams({ targetType, targetId });
  return apiGet(`/comments?${params.toString()}`);
}

export async function createComment(input: {
  targetType: 'post' | 'thread';
  targetId: string;
  parentCommentId?: string;
  content: string;
}): Promise<CommentDto> {
  return apiPost('/comments', {
    targetType: input.targetType,
    targetId: input.targetId,
    parentCommentId: input.parentCommentId || undefined,
    content: input.content,
  });
}

export async function toggleLikeComment(commentId: string): Promise<CommentDto> {
  return apiPost(`/comments/${commentId}/like`, {});
}

export async function deleteComment(commentId: string): Promise<void> {
  await apiDelete(`/comments/${commentId}`);
}

export async function updateComment(
  commentId: string,
  content: string,
): Promise<{ id: string; content: string; createdAt: string }> {
  return apiPatch(`/comments/${commentId}`, { content }) as any;
}
