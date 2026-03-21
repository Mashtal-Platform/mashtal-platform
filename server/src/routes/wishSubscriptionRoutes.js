const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  submitWishSubscriptionPayment,
  getWishSubscriptionPaymentStatus,
  wishSubscriptionCallback,
  verifyWishSubscriptionPayment,
} = require('../controllers/wishSubscriptionController');

const router = express.Router();

// User submits Wish Money transfer details.
router.post('/submit', requireAuth, submitWishSubscriptionPayment);

// User polls payment verification status.
router.get('/:paymentId', requireAuth, getWishSubscriptionPaymentStatus);

// Provider/backoffice callback with HMAC signature.
router.post('/callback', wishSubscriptionCallback);

// Optional manual review by admin.
router.post('/:paymentId/verify', requireAuth, requireRole('admin'), verifyWishSubscriptionPayment);

module.exports = router;

