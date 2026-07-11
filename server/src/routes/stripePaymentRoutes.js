const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  createPaymentIntent,
  getPaymentStatus,
  handleStripeWebhook,
} = require('../controllers/stripePaymentController');

const router = express.Router();

// POST /api/payments/stripe/create-intent
router.post('/create-intent', requireAuth, createPaymentIntent);

// GET /api/payments/stripe/:paymentId
router.get('/:paymentId', requireAuth, getPaymentStatus);

// POST /api/payments/stripe/webhook
// NOTE: This endpoint must receive the raw body for signature verification.
router.post('/webhook', handleStripeWebhook);

module.exports = router;

