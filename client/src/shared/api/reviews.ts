import { apiGet, apiPost } from './client';

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
  return apiPost('/reviews', input);
}

