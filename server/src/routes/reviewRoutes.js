const express = require('express');
const {
  createReview,
  getProductReviews,
  deleteReview,
} = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createReview);
router.delete('/:reviewId', requireAuth, deleteReview);
router.get('/:productId', getProductReviews);

module.exports = router;

