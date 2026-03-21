const Review = require('../models/Review');
const Product = require('../models/Product');
const { Types } = require('mongoose');

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

    const review = await Review.findOneAndUpdate(
      {
        product: new Types.ObjectId(productId),
        user: new Types.ObjectId(userId),
      },
      {
        rating,
        comment,
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

    const shaped = {
      id: review._id.toString(),
      product: review.product.toString(),
      user: review.user.toString(),
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

module.exports = {
  createReview,
  getProductReviews,
};

