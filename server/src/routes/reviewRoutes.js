const express = require('express');
const {
  createReview,
  getProductReviews,
} = require('../controllers/reviewController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.post('/', requireAuth, createReview);
router.get('/:productId', getProductReviews);

module.exports = router;

