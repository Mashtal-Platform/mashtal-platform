import { api, apiGet, apiPost, apiPatch, apiDelete } from './client';

export interface UserDto {
  id: string;
  fullName: string;
  email: string;
  role: string;
  avatar?: string;
  companyName?: string;
  location?: string;
  bio?: string;
  verified?: boolean;
  rating?: number;
  reviewsCount?: number;
  followersCount?: number;
  specialties?: string[];
  followers?: number; // legacy field (not always present)
}

export async function fetchUser(id: string): Promise<UserDto> {
  return apiGet(`/users/${id}`);
}

export async function fetchBusinesses(): Promise<UserDto[]> {
  // Mounted under /api/businesses in the server
  return apiGet('/businesses');
}

/** Fetch all mentionable profiles (businesses and visitors). */
export async function fetchMentionableProfiles(): Promise<UserDto[]> {
  return apiGet('/businesses?roles=business,visitor,admin,agronomist,engineer');
}

/** Search for businesses (e.g. for Share modal "Send to Mashtal users"). */
export async function searchShareRecipients(query: string): Promise<UserDto[]> {
  if (!query || !query.trim()) return [];
  const q = encodeURIComponent(query.trim());
  const roles = encodeURIComponent('business');
  const data = await apiGet<UserDto[]>(`/businesses?search=${q}&roles=${roles}`);
  return Array.isArray(data) ? data : [];
}

export async function fetchBusinessById(id: string) {
  return apiGet<{
    id: string;
    fullName: string;
    companyName?: string;
    email?: string;
    avatar?: string;
    location?: string;
    bio?: string;
    phone?: string;
    verified?: boolean;
    rating?: number;
    reviewsCount?: number;
    followersCount?: number;
    hours?: Array<{ day?: string; closed?: boolean; open?: Array<{ from?: string; to?: string }> }>;
    about?: Record<string, string>;
    specialties?: string[];
  }>(`/businesses/business/${id}`);
}

/** Rate a business (1–5). Upserts: re-rating updates the same user's rating. */
export async function rateBusiness(
  businessId: string,
  rating: number,
  comment?: string
): Promise<{ businessRating: number; businessReviewsCount: number }> {
  const data = await apiPost<{ businessRating: number; businessReviewsCount: number }>(
    `/businesses/business/${businessId}/rate`,
    { rating, comment }
  );
  return data;
}

export interface BusinessReviewDto {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful?: number;
  isHelpful?: boolean;
  isMine?: boolean;
}

/** Fetch all reviews for a business (for profile page). Requires optional auth for isMine. */
export async function fetchBusinessReviews(businessId: string): Promise<BusinessReviewDto[]> {
  const data = await apiGet<BusinessReviewDto[]>(`/businesses/business/${businessId}/reviews`);
  return Array.isArray(data) ? data : [];
}

/** Update current user's review for a business. */
export async function updateBusinessReview(
  businessId: string,
  reviewId: string,
  data: { rating?: number; comment?: string }
): Promise<{ businessRating: number; businessReviewsCount: number }> {
  const res = await apiPatch<{ businessRating: number; businessReviewsCount: number }>(
    `/businesses/business/${businessId}/reviews/${reviewId}`,
    data
  );
  return res;
}

/** Toggle helpful on a business review. Returns updated helpful count and whether current user has marked helpful. */
export async function toggleBusinessReviewHelpful(
  businessId: string,
  reviewId: string
): Promise<{ helpful: number; isHelpful: boolean }> {
  const data = await apiPost<{ helpful: number; isHelpful: boolean }>(
    `/businesses/business/${businessId}/reviews/${reviewId}/helpful`,
    {}
  );
  return data;
}

export async function fetchFollowers(userId: string) {
  return apiGet(`/users/${userId}/followers`);
}

export async function fetchFollowing(userId: string) {
  return apiGet(`/users/${userId}/following`);
}

export async function followUser(userId: string) {
  return apiPost(`/users/${userId}/follow`, {});
}

export async function unfollowUser(userId: string) {
  await apiDelete(`/users/${userId}/follow`);
}

/** Remove a follower from the current user's followers list (current user must be authenticated). */
export async function removeFollower(followerId: string) {
  await apiDelete(`/users/me/followers/${followerId}`);
}

/** Upload avatar image; returns updated user (with avatar path). */
export async function uploadAvatar(file: File): Promise<UserDto> {
  const form = new FormData();
  form.append('avatar', file);
  const data = await api.post<UserDto>('/users/me/avatar', form, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

/** Upload profile cover / header image; returns updated user. */
export async function uploadCover(file: File): Promise<UserDto & { coverImage?: string }> {
  const form = new FormData();
  form.append('cover', file);
  const data = await api.post<UserDto & { coverImage?: string }>('/users/me/cover', form, {
    headers: { 'Content-Type': undefined },
  });
  return data;
}

