import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Star, Send, User, Pencil, Trash2, Share2 } from 'lucide-react';
import { ShareModal } from './ShareModal';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { getImageUrl } from '../shared/api/client';
import { fetchProductReviews, createReview, deleteReview, ReviewDto } from '../shared/api/reviews';
import type { ShoppingProductDto } from '../shared/api/products';
import { useAuth } from '../contexts/AuthContext';
import { notifyError, isContentBlockedError, CONTENT_BLOCKED_DESCRIPTION } from '../shared/utils/notify';

interface ProductDetailModalProps {
  product: ShoppingProductDto | null;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated?: boolean;
  onAddToCart?: (product: ShoppingProductDto) => void;
  onRated?: (productId: string, averageRating: number, reviewsCount: number) => void;
}

export function ProductDetailModal({
  product,
  isOpen,
  onClose,
  isAuthenticated = false,
  onAddToCart,
  onRated,
}: ProductDetailModalProps) {
  const { t } = useTranslation();
  const { user: currentUser } = useAuth();
  const [reviews, setReviews] = useState<ReviewDto[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);

  const myReview = currentUser?.id && reviews.find((r) => r.user === currentUser.id);

  useEffect(() => {
    if (!isOpen || !product?.id) return;
    setReviewsLoading(true);
    setSubmitError(null);
    setRating(0);
    setComment('');
    fetchProductReviews(product.id)
      .then((list) => setReviews(Array.isArray(list) ? list : []))
      .catch(() => setReviews([]))
      .finally(() => setReviewsLoading(false));
  }, [isOpen, product?.id]);

  useEffect(() => {
    if (myReview) {
      setRating(myReview.rating);
      setComment(myReview.comment ?? '');
    } else {
      setRating(0);
      setComment('');
    }
  }, [myReview]);

  const handleSubmitRating = async () => {
    if (!product || rating < 1 || rating > 5) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await createReview({
        productId: product.id,
        rating,
        comment: comment.trim(),
      });
      const newReview: ReviewDto = {
        id: res.id,
        product: res.product,
        user: res.user || currentUser?.id || '',
        userFullName: res.userFullName || currentUser?.fullName || '',
        userAvatar: res.userAvatar || currentUser?.avatar || '',
        rating: res.rating,
        comment: res.comment ?? '',
        createdAt: res.createdAt ?? new Date().toISOString(),
      };

      // If the user already has a review, replace it in-place.
      // This prevents the UI from showing "two reviews" until the modal is reopened.
      const currentUserId = currentUser?.id;
      if (currentUserId) {
        setReviews((prev) => {
          const idx = prev.findIndex((r) => r.user === currentUserId);
          if (idx === -1) return [newReview, ...prev];
          const next = [...prev];
          // Preserve existing author fields if the response omitted them
          next[idx] = {
            ...next[idx],
            ...newReview,
            userFullName: newReview.userFullName || next[idx].userFullName,
            userAvatar: newReview.userAvatar || next[idx].userAvatar,
          };
          // Keep the most recent reviews first (backend typically does this).
          next.sort(
            (a, b) =>
              new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
          );
          return next;
        });
      } else {
        setReviews((prev) => [newReview, ...prev]);
      }

      const avg = res.averageRating ?? rating;
      const count = res.reviewsCount ?? 1;
      onRated?.(product.id, avg, count);
    } catch (err: any) {
      const msg = err?.message || err?.response?.data?.message || t('shopping.failedSubmitRating');
      setSubmitError(isContentBlockedError(err) ? CONTENT_BLOCKED_DESCRIPTION : msg);
      notifyError(err, t('shopping.failedSubmitRating'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!product || !myReview) return;
    setDeleting(true);
    setSubmitError(null);
    try {
      const res = await deleteReview(myReview.id);
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setRating(0);
      setComment('');
      onRated?.(product.id, res.averageRating ?? 0, res.reviewsCount ?? 0);
    } catch (err: any) {
      setSubmitError(err?.message || t('shopping.failedDeleteReview'));
    } finally {
      setDeleting(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const displayProduct = product;
  const displayRating = displayProduct?.rating ?? 0;
  const displayReviewsCount = displayProduct?.reviewsCount ?? reviews.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-hidden"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200 flex-shrink-0">
          <h2 className="text-base font-semibold text-neutral-900">{t('shopping.productDetails')}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 hover:text-neutral-700"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-3 space-y-4">
          {!displayProduct ? (
            <p className="text-neutral-500">{t('shopping.noProductSelected')}</p>
          ) : (
            <>
              <div className="flex gap-3">
                <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100">
                  <img
                    src={getImageUrl(displayProduct.image) || 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'}
                    alt={displayProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-0.5 line-clamp-2">{displayProduct.name}</h3>
                  <p className="text-xs text-neutral-600 line-clamp-2 mb-1">{displayProduct.description}</p>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span className="font-medium">{Number(displayRating).toFixed(1)}</span>
                    <span className="text-neutral-400">({displayReviewsCount})</span>
                  </div>
                  <p className="text-base font-bold text-green-600">${displayProduct.price}</p>
                  <p className="text-xs text-neutral-500 mt-1">
                    {displayProduct.inStock
                      ? t('shopping.inStockCount', { count: displayProduct.stock })
                      : t('shopping.outOfStock')}
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {isAuthenticated && displayProduct.inStock && onAddToCart && (
                      <Button
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => onAddToCart(displayProduct)}
                      >
                        {t('shopping.addToCart')}
                      </Button>
                    )}
                    {isAuthenticated && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-xs gap-1.5"
                        onClick={() => setShowShareModal(true)}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {t('common.share', { defaultValue: 'Share' })}
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Rate / Edit your review (one per user) */}
              {isAuthenticated && (
                <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/50">
                  <h4 className="text-xs font-semibold text-neutral-800 mb-2 flex items-center gap-1.5">
                    {myReview ? <Pencil className="w-3.5 h-3.5" /> : null}
                    {myReview ? t('shopping.editYourReview') : t('shopping.rateThisProduct')}
                  </h4>
                  <div className="flex items-center gap-0.5 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-0.5 rounded transition-transform hover:scale-110"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (hoverRating || rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'fill-neutral-200 text-neutral-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={t('shopping.optionalComment')}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="min-h-[60px] resize-none text-sm mb-2 py-2 px-3"
                  />
                  {submitError && (
                    <p className="text-xs text-red-600 mb-1">{submitError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={handleSubmitRating}
                      disabled={rating < 1 || submitting || deleting}
                      className="flex-1 gap-1.5 h-8 text-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {submitting ? t('common.saving') : myReview ? t('shopping.updateReview') : t('shopping.submitRating')}
                    </Button>
                    {myReview && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDeleteReview}
                        disabled={submitting || deleting}
                        className="h-8 text-xs gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {deleting ? t('common.deleting') : t('common.delete')}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Reviews list */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-800 mb-2">{t('reviews.title')}</h4>
                {reviewsLoading ? (
                  <p className="text-xs text-neutral-500">{t('common.loading')}</p>
                ) : reviews.length === 0 ? (
                  <p className="text-xs text-neutral-500">{t('shopping.noReviewsYet')}</p>
                ) : (
                  <ul className="space-y-2 max-h-36 overflow-y-auto">
                    {reviews.map((r) => (
                      <li key={r.id} className="flex gap-2 p-2 rounded-md bg-neutral-50 border border-neutral-100">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-neutral-200 flex-shrink-0 flex items-center justify-center">
                          {r.userAvatar ? (
                            <img
                              src={getImageUrl(r.userAvatar)}
                              alt={r.userFullName || t('common.user')}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-neutral-500" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-medium text-neutral-800">
                              {r.userFullName || t('common.user')}
                              {r.user === currentUser?.id && (
                                <span className="ml-1 text-neutral-500 font-normal">({t('common.you')})</span>
                              )}
                            </p>
                            {r.user === currentUser?.id && (
                              <button
                                type="button"
                                onClick={handleDeleteReview}
                                disabled={deleting}
                                className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0"
                                title={t('shopping.deleteReview')}
                                aria-label={t('shopping.deleteReview')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-1 mb-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3 h-3 ${
                                  s <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-neutral-200 text-neutral-200'
                                }`}
                              />
                            ))}
                          </div>
                          {r.comment ? (
                            <p className="text-xs text-neutral-700 line-clamp-2">{r.comment}</p>
                          ) : null}
                          <p className="text-[10px] text-neutral-400">
                            {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {displayProduct && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          postId={displayProduct.id}
          postUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/product/${displayProduct.id}`}
          postTitle={displayProduct.name}
          postImage={displayProduct.image}
          postOwnerName={displayProduct.businessName}
        />
      )}
    </div>
  );
}
