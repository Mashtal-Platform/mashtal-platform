const Review = require('../models/Review');
const Product = require('../models/Product');
const { Types } = require('mongoose');
const { respondIfUnsafe } = require('../utils/assertContentSafe');

async function createReview(req, res) {
  try {
    const userId = req.user.id;

    const { productId, rating, comment } = req.body || {};

    if (!productId || rating == null) {
      return res
        .status(400)
        .json({ message: 'productId and rating are required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Comment is optional — empty string clears any previous message
    const commentValue = comment != null ? String(comment).trim() : '';

    if (commentValue) {
      const allowed = await respondIfUnsafe(res, { text: commentValue });
      if (!allowed) return;
    }

    const review = await Review.findOneAndUpdate(
      {
        product: new Types.ObjectId(productId),
        user: new Types.ObjectId(userId),
      },
      {
        rating,
        comment: commentValue,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const agg = await Review.aggregate([
      { $match: { product: new Types.ObjectId(productId) } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    let averageRating = review.rating;
    let reviewsCount = 1;
    if (agg.length) {
      averageRating = Math.round(agg[0].avgRating * 10) / 10;
      reviewsCount = agg[0].count;
      await Product.findByIdAndUpdate(productId, {
        $set: {
          rating: averageRating,
          reviewsCount,
        },
      });
    }

    const populated = await Review.findById(review._id)
      .populate('user', 'fullName avatar')
      .lean();
    const u = populated?.user;
    const shaped = {
      id: review._id.toString(),
      product: review.product.toString(),
      user: u?._id ? u._id.toString() : review.user.toString(),
      userFullName: u?.fullName ?? '',
      userAvatar: u?.avatar ?? '',
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt?.toISOString(),
      averageRating,
      reviewsCount,
    };

    res.status(201).json(shaped);
  } catch (err) {
    console.error('[Reviews] createReview error:', err);
    res.status(500).json({ message: 'Failed to create review' });
  }
}

async function getProductReviews(req, res) {
  try {
    const { productId } = req.params;
    if (!productId) {
      return res.status(400).json({ message: 'productId is required' });
    }

    const reviews = await Review.find({
      product: new Types.ObjectId(productId),
    })
      .populate('user', 'fullName avatar')
      .sort({ createdAt: -1 })
      .lean();

    const shaped = reviews.map((r) => {
      const u = r.user;
      const userId = u?._id ? u._id.toString() : (typeof r.user === 'string' ? r.user : '');
      const fullName = u?.fullName ?? '';
      const avatar = u?.avatar ?? '';
      return {
        id: r._id.toString(),
        product: r.product.toString(),
        user: userId,
        userFullName: fullName,
        userAvatar: avatar,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt?.toISOString(),
      };
    });

    res.json(shaped);
  } catch (err) {
    console.error('[Reviews] getProductReviews error:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}

async function deleteReview(req, res) {
  try {
    const userId = req.user.id;
    const { reviewId } = req.params;
    if (!reviewId) {
      return res.status(400).json({ message: 'reviewId is required' });
    }

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.user.toString() !== userId) {
      return res.status(403).json({ message: 'You can only delete your own review' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(reviewId);

    const agg = await Review.aggregate([
      { $match: { product: productId } },
      {
        $group: {
          _id: '$product',
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    let averageRating = 0;
    let reviewsCount = 0;
    if (agg.length) {
      averageRating = Math.round(agg[0].avgRating * 10) / 10;
      reviewsCount = agg[0].count;
    }
    await Product.findByIdAndUpdate(productId, {
      $set: {
        rating: averageRating,
        reviewsCount,
      },
    });

    res.json({
      id: reviewId,
      product: productId.toString(),
      averageRating,
      reviewsCount,
    });
  } catch (err) {
    console.error('[Reviews] deleteReview error:', err);
    res.status(500).json({ message: 'Failed to delete review' });
  }
}

module.exports = {
  createReview,
  getProductReviews,
  deleteReview,
};

