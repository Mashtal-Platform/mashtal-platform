import { apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface ThreadAuthorDto {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  type: string;
  businessId?: string;
}

export interface ThreadDto {
  id: string;
  title: string;
  content: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  author: ThreadAuthorDto;
}

const DEFAULT_PAGE_SIZE = 20;

export async function fetchThreads(params?: { limit?: number; skip?: number }): Promise<ThreadDto[]> {
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
  const skip = params?.skip ?? 0;
  const q = new URLSearchParams({ limit: String(limit), skip: String(skip) });
  return apiGet(`/threads?${q.toString()}`);
}

export async function fetchThreadById(threadId: string): Promise<ThreadDto> {
  return apiGet(`/threads/${threadId}`);
}

export async function createThread(thread: {
  title?: string;
  content: string;
  tags?: string[];
  author: ThreadAuthorDto;
}) {
  return apiPost('/threads', thread);
}

/** Toggle like on a thread. Returns updated thread with likes count and isLiked. */
export async function toggleLikeThread(threadId: string): Promise<ThreadDto> {
  return apiPost(`/threads/${threadId}/like`, {}) as Promise<ThreadDto>;
}

/** Record a share (increments share count). Returns updated thread. */
export async function shareThread(threadId: string): Promise<ThreadDto> {
  return apiPost(`/threads/${threadId}/share`, {}) as Promise<ThreadDto>;
}

/** Update a thread (author only). Returns updated thread. */
export async function updateThread(
  threadId: string,
  data: { title?: string; content?: string; tags?: string[] }
): Promise<ThreadDto> {
  return apiPatch(`/threads/${threadId}`, data) as Promise<ThreadDto>;
}

/** Delete a thread (author only). */
export async function deleteThread(threadId: string): Promise<void> {
  await apiDelete(`/threads/${threadId}`);
}

