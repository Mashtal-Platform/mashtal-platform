import React, { useState } from 'react';
import { Star, ThumbsUp, Award } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  totalReviews: number;
  showReviewButton?: boolean;
  onReviewClick?: () => void;
  reviews?: Review[];
  type?: 'business' | 'engineer';
}

interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

export function RatingDisplay({ 
  rating, 
  totalReviews, 
  showReviewButton = false, 
  onReviewClick,
  reviews = [],
  type = 'business'
}: RatingDisplayProps) {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());

  const ratingBreakdown = {
    5: Math.floor(totalReviews * 0.65),
    4: Math.floor(totalReviews * 0.20),
    3: Math.floor(totalReviews * 0.10),
    2: Math.floor(totalReviews * 0.03),
    1: Math.floor(totalReviews * 0.02),
  };

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  const handleHelpfulClick = (reviewId: string) => {
    setHelpfulReviews(prev => {
      const newSet = new Set(prev);
      if (newSet.has(reviewId)) {
        newSet.delete(reviewId);
      } else {
        newSet.add(reviewId);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-6">
      {/* Rating Overview */}
      <div className="bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="text-5xl font-bold text-green-600">{rating.toFixed(1)}</div>
              <div>
                <div className="flex items-center gap-1 mb-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= Math.round(rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-neutral-200 text-neutral-200'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-sm text-neutral-600">
                  Based on <span className="font-semibold">{totalReviews}</span> reviews
                </p>
              </div>
            </div>
          </div>

          {showReviewButton && onReviewClick && (
            <button
              onClick={onReviewClick}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm hover:shadow-md"
            >
              Write a Review
            </button>
          )}
        </div>

        {/* Rating Breakdown */}
        <div className="mt-6 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <div key={stars} className="flex items-center gap-3">
              <div className="flex items-center gap-1 w-16">
                <span className="text-sm font-medium text-neutral-700">{stars}</span>
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all"
                  style={{ width: `${(ratingBreakdown[stars as keyof typeof ratingBreakdown] / totalReviews) * 100}%` }}
                />
              </div>
              <span className="text-sm text-neutral-500 w-12 text-right">
                {ratingBreakdown[stars as keyof typeof ratingBreakdown]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Reviews */}
      {reviews.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-neutral-900 mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-green-600" />
            Recent Reviews
          </h3>
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white border border-neutral-200 rounded-xl p-5 hover:border-green-200 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={review.avatar}
                      alt={review.author}
                      className="w-10 h-10 rounded-full object-cover border-2 border-neutral-100"
                    />
                    <div>
                      <h4 className="font-semibold text-neutral-900">{review.author}</h4>
                      <p className="text-xs text-neutral-500">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= review.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-neutral-200 text-neutral-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-neutral-700 leading-relaxed mb-3">{review.comment}</p>
                <button
                  onClick={() => handleHelpfulClick(review.id)}
                  className={`flex items-center gap-1.5 text-sm transition-colors ${
                    helpfulReviews.has(review.id)
                      ? 'text-green-600 font-medium'
                      : 'text-neutral-500 hover:text-green-600'
                  }`}
                >
                  <ThumbsUp className={`w-4 h-4 ${helpfulReviews.has(review.id) ? 'fill-current' : ''}`} />
                  <span>
                    Helpful ({review.helpful + (helpfulReviews.has(review.id) ? 1 : 0)})
                  </span>
                </button>
              </div>
            ))}
          </div>

          {reviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="mt-4 w-full py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-medium hover:border-green-200 hover:text-green-600 transition-all"
            >
              {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
