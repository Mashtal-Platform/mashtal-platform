const crypto = require('crypto');
const mongoose = require('mongoose');

const { getStripe } = require('../services/stripeClient');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const User = require('../models/User');
const { getSubscriptionPeriodMs } = require('../utils/subscription');

function toMoneyNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function computeIdempotencyKey({ userId, planRole, amountTotal }) {
  // Include calendar day so renewals after expiry can create a new PaymentIntent
  const day = new Date().toISOString().slice(0, 10);
  const payload = { userId, planRole, amountTotal, day };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

function getPlanAmountUsd(planRole) {
  if (planRole === 'business') {
    const fee = Number(process.env.BUSINESS_FEE_USD);
    return Number.isFinite(fee) && fee > 0 ? fee : 499;
  }
  return 0;
}

async function createSubscriptionPaymentIntent(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { planRole } = req.body || {};
    if (!planRole || planRole !== 'business') {
      return res.status(400).json({ message: 'planRole must be business' });
    }

    const amountTotal = getPlanAmountUsd(planRole);
    if (!amountTotal) return res.status(400).json({ message: 'Invalid plan' });

    const idempotencyKey = computeIdempotencyKey({ userId, planRole, amountTotal });

    let payment = await SubscriptionPayment.findOne({ user: userId, idempotencyKey });
    if (!payment) {
      payment = await SubscriptionPayment.create({
        user: new mongoose.Types.ObjectId(userId),
        idempotencyKey,
        currency: 'USD',
        amountTotal: toMoneyNumber(amountTotal),
        planRole,
      });
    }

    // If we already created the PaymentIntent, return its clientSecret again.
    if (payment.stripePaymentIntentId) {
      const stripe = getStripe();
      const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
      return res.json({
        paymentId: payment.id,
        clientSecret: pi.client_secret,
        amountTotal: payment.amountTotal,
      });
    }

    const stripe = getStripe();

    const amountCents = Math.round(toMoneyNumber(amountTotal) * 100);
    const pi = await stripe.paymentIntents.create(
      {
        amount: amountCents,
        currency: 'usd',
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: {
          paymentKind: 'subscription',
          subscriptionPaymentId: payment.id,
        },
      },
      { idempotencyKey }
    );

    payment.stripePaymentIntentId = pi.id;
    payment.status = 'processing';
    await payment.save();

    return res.json({
      paymentId: payment.id,
      clientSecret: pi.client_secret,
      amountTotal: payment.amountTotal,
    });
  } catch (err) {
    console.error('[StripeSubscription] create error:', err);
    res.status(500).json({ message: 'Failed to create subscription payment' });
  }
}

async function getSubscriptionPaymentStatus(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentId } = req.params;

    const payment = await SubscriptionPayment.findOne({ _id: paymentId, user: userId })
      .lean();

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const me = await User.findById(userId).lean();
    return res.json({
      id: payment._id.toString(),
      status: payment.status,
      amountTotal: payment.amountTotal,
      planRole: payment.planRole,
      userSubscriptionStatus: me?.subscriptionStatus || 'inactive',
    });
  } catch (err) {
    console.error('[StripeSubscription] status error:', err);
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
}

module.exports = {
  createSubscriptionPaymentIntent,
  getSubscriptionPaymentStatus,
};

