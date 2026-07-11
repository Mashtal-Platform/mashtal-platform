const express = require('express');
const { requireAuth } = require('../middleware/auth');

const {
  createSubscriptionPaymentIntent,
  getSubscriptionPaymentStatus,
} = require('../controllers/stripeSubscriptionController');

const router = express.Router();

// POST /api/payments/stripe/subscription/create-intent
router.post('/create-intent', requireAuth, createSubscriptionPaymentIntent);

// GET /api/payments/stripe/subscription/:paymentId
router.get('/:paymentId', requireAuth, getSubscriptionPaymentStatus);

module.exports = router;

