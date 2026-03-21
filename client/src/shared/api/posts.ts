import { api, apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface PostAuthorDto {
  id: string;
  name: string;
  avatar: string;
  verified?: boolean;
  type: string;
  businessId?: string;
}

export interface PostDto {
  id: string;
  title: string;
  content: string;
  image?: string;
  tags: string[];
  likes: number;
  commentsCount: number;
  shares: number;
  isLiked: boolean;
  isSaved: boolean;
  timestamp: string;
  author: PostAuthorDto;
}

const DEFAULT_PAGE_SIZE = 20;

export async function fetchPosts(params?: { limit?: number; skip?: number }): Promise<PostDto[]> {
  const limit = params?.limit ?? DEFAULT_PAGE_SIZE;
  const skip = params?.skip ?? 0;
  const q = new URLSearchParams({ limit: String(limit), skip: String(skip) });
  return apiGet(`/posts?${q.toString()}`);
}

export async function fetchPostById(postId: string): Promise<PostDto> {
  return apiGet(`/posts/${postId}`);
}

export async function createPost(
  post: {
    title: string;
    content: string;
    image?: string;
    tags?: string[];
    author: PostAuthorDto;
  },
  imageFile?: File
) {
  if (imageFile) {
    const form = new FormData();
    form.append('title', post.title);
    form.append('content', post.content);
    form.append('tags', JSON.stringify(post.tags ?? []));
    if (post.author?.id) form.append('authorId', post.author.id);
    form.append('image', imageFile);
    const data = await api.post<unknown>('/posts', form, {
      headers: { 'Content-Type': undefined },
    });
    return data as PostDto;
  }
  return apiPost('/posts', post);
}

/** Toggle like on a post. Returns updated post with likes count and isLiked. */
export async function toggleLikePost(postId: string): Promise<PostDto> {
  const data = await api.post<unknown>(`/posts/${postId}/like`);
  return data as PostDto;
}

/** Record a share (increments share count). Returns updated post. */
export async function sharePost(postId: string): Promise<PostDto> {
  const data = await api.post<unknown>(`/posts/${postId}/share`);
  return data as PostDto;
}

/** Update a post (author only). Returns updated post. */
export async function updatePost(
  postId: string,
  data: { title?: string; content?: string; image?: string; tags?: string[] }
): Promise<PostDto> {
  const payload = { title: data.title, content: data.content, image: data.image, tags: data.tags };
  return apiPatch(`/posts/${postId}`, payload) as Promise<PostDto>;
}

/** Delete a post (author only). */
export async function deletePost(postId: string): Promise<void> {
  await apiDelete(`/posts/${postId}`);
}

