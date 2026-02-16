import React, { useState } from 'react';
import { Star, ThumbsUp, Award, X, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

interface InteractiveRatingProps {
  rating: number;
  totalReviews: number;
  reviews?: Review[];
  type?: 'business' | 'engineer';
  entityName: string;
  onSubmitReview?: (rating: number, comment: string) => void;
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

export function InteractiveRating({ 
  rating, 
  totalReviews, 
  reviews = [],
  type = 'business',
  entityName,
  onSubmitReview
}: InteractiveRatingProps) {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [helpfulReviews, setHelpfulReviews] = useState<Set<string>>(new Set());
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [allReviews, setAllReviews] = useState<Review[]>(reviews);

  const ratingBreakdown = {
    5: Math.floor(totalReviews * 0.65),
    4: Math.floor(totalReviews * 0.20),
    3: Math.floor(totalReviews * 0.10),
    2: Math.floor(totalReviews * 0.03),
    1: Math.floor(totalReviews * 0.02),
  };

  const displayedReviews = showAllReviews ? allReviews : allReviews.slice(0, 3);

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

  const handleSubmitReview = () => {
    if (selectedRating > 0 && reviewComment.trim()) {
      onSubmitReview?.(selectedRating, reviewComment);
      setUserHasReviewed(true);
      setShowReviewModal(false);
      setSelectedRating(0);
      setReviewComment('');
      const newReview: Review = {
        id: Date.now().toString(),
        author: 'You',
        avatar: 'https://via.placeholder.com/100',
        rating: selectedRating,
        comment: reviewComment,
        date: new Date().toLocaleDateString(),
        helpful: 0,
      };
      setUserReview(newReview);
      setAllReviews([...allReviews, newReview]);
    }
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

          {!userHasReviewed && (
            <Button
              onClick={() => setShowReviewModal(true)}
              className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all font-medium shadow-sm hover:shadow-md"
            >
              Write a Review
            </Button>
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
      {allReviews.length > 0 && (
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

          {allReviews.length > 3 && (
            <button
              onClick={() => setShowAllReviews(!showAllReviews)}
              className="mt-4 w-full py-2.5 border-2 border-neutral-200 rounded-lg text-neutral-700 font-medium hover:border-green-200 hover:text-green-600 transition-all"
            >
              {showAllReviews ? 'Show Less' : `View All ${allReviews.length} Reviews`}
            </button>
          )}
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 className="text-xl font-bold text-neutral-900">Write a Review</h2>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <p className="text-sm text-neutral-600 mb-3">
                  How would you rate <span className="font-semibold text-neutral-900">{entityName}</span>?
                </p>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setSelectedRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-10 h-10 transition-colors ${
                          star <= (hoverRating || selectedRating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-neutral-200 text-neutral-200 hover:fill-amber-200 hover:text-amber-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                {selectedRating > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-2">
                    {selectedRating === 5 && '⭐ Excellent!'}
                    {selectedRating === 4 && '⭐ Very Good!'}
                    {selectedRating === 3 && '⭐ Good'}
                    {selectedRating === 2 && '⭐ Fair'}
                    {selectedRating === 1 && '⭐ Needs Improvement'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Share your experience
                </label>
                <Textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="min-h-[120px] resize-none"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowReviewModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitReview}
                  disabled={selectedRating === 0 || !reviewComment.trim()}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Submit Review
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}