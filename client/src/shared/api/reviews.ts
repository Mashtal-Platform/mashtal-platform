import { api, apiGet, apiPost } from './client';

export interface ReviewDto {
  id: string;
  product: string;
  user: string;
  userFullName?: string;
  userAvatar?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

export async function fetchProductReviews(
  productId: string
): Promise<ReviewDto[]> {
  return apiGet(`/reviews/${productId}`);
}

export interface CreateReviewResponse extends ReviewDto {
  averageRating?: number;
  reviewsCount?: number;
}

export async function createReview(input: {
  productId: string;
  rating: number;
  comment?: string;
}): Promise<CreateReviewResponse> {
  // Always send comment (including empty string) so edits can clear the message
  return apiPost('/reviews', {
    productId: input.productId,
    rating: input.rating,
    comment: input.comment ?? '',
  });
}

export interface DeleteReviewResponse {
  id: string;
  product: string;
  averageRating: number;
  reviewsCount: number;
}

export async function deleteReview(reviewId: string): Promise<DeleteReviewResponse> {
  const data = await api.delete<DeleteReviewResponse>(`/reviews/${reviewId}`);
  return data as DeleteReviewResponse;
}

