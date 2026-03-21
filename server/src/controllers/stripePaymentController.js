const crypto = require('crypto');
const mongoose = require('mongoose');
const { getStripe, getWebhookSecret } = require('../services/stripeClient');

const Payment = require('../models/Payment');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');

function toMoneyNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function calcAmountsFromCart({ cartLines }) {
  // Business logic:
  // - VAT: 15% of subtotal
  // - Shipping removed: amountShipping always 0
  const subtotal = cartLines.reduce((sum, l) => sum + l.priceAtPurchase * l.quantity, 0);
  const tax = subtotal * 0.15;
  const shipping = 0;
  const total = subtotal + tax;

  return {
    amountSubtotal: toMoneyNumber(subtotal),
    amountTax: toMoneyNumber(tax),
    amountShipping: toMoneyNumber(shipping),
    amountTotal: toMoneyNumber(total),
    amountTotalCents: Math.round(toMoneyNumber(total) * 100),
  };
}

function computeIdempotencyKey({ userId, cartLines }) {
  const payload = {
    userId,
    // Sort by product to make the key stable irrespective of array ordering.
    cartLines: [...cartLines].sort((a, b) => String(a.productId).localeCompare(String(b.productId))),
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

async function createPaymentIntent(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Cart items are required' });
    }

    const normalizedItems = items
      .map((it) => ({
        productId: String(it.productId || ''),
        quantity: Number(it.quantity),
      }))
      .filter((it) => it.productId && Number.isFinite(it.quantity));

    if (normalizedItems.length === 0) {
      return res.status(400).json({ message: 'Invalid cart items' });
    }

    // Basic guardrails to reduce abuse.
    for (const it of normalizedItems) {
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 50) {
        return res.status(400).json({ message: 'Invalid quantity (min 1, max 50)' });
      }
    }

    // Load products from DB so the client cannot tamper with prices.
    const productIds = [...new Set(normalizedItems.map((i) => i.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const cartLines = [];
    for (const it of normalizedItems) {
      const p = productMap.get(it.productId);
      if (!p) return res.status(404).json({ message: 'Product not found' });
      const productStock = Number(p.stock || 0);
      if (productStock < it.quantity) return res.status(409).json({ message: `Insufficient stock for ${p.name}` });

      cartLines.push({
        productId: it.productId,
        quantity: it.quantity,
        priceAtPurchase: Number(p.price),
      });
    }

    const { amountSubtotal, amountTax, amountShipping, amountTotal, amountTotalCents } = calcAmountsFromCart({
      cartLines,
    });

    const stripe = getStripe();

    const idempotencyKey = computeIdempotencyKey({
      userId,
      cartLines,
    });

    // Create (or reuse) our Payment record first.
    let payment = await Payment.findOne({ user: userId, idempotencyKey });
    if (!payment) {
      payment = await Payment.create({
        user: new mongoose.Types.ObjectId(userId),
        idempotencyKey,
        currency: 'SAR',
        amountSubtotal,
        amountTax,
        amountShipping,
        amountTotal,
        cart: cartLines.map((l) => ({
          product: new mongoose.Types.ObjectId(l.productId),
          quantity: l.quantity,
          priceAtPurchase: l.priceAtPurchase,
        })),
      });
    }

    // If we already created a PaymentIntent earlier, return its client secret.
    if (payment.stripePaymentIntentId) {
      const pi = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);
      return res.json({
        paymentId: payment.id,
        clientSecret: pi.client_secret,
        amountTotal,
      });
    }

    // Create the PaymentIntent. We store paymentId in metadata so the webhook can locate the record.
    const pi = await stripe.paymentIntents.create(
      {
        amount: amountTotalCents,
        currency: 'sar',
        // Keep things secure and simple: let Stripe pick a card payment method.
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        metadata: {
          paymentId: payment.id,
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
      amountTotal,
    });
  } catch (err) {
    console.error('[StripePayment] createPaymentIntent error:', err);
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('stripe') && (msg.includes('secret') || msg.includes('webhook'))) {
      return res.status(500).json({ message: 'Stripe is not configured on the server' });
    }
    res.status(500).json({ message: 'Failed to create payment' });
  }
}

async function getPaymentStatus(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentId } = req.params;
    const payment = await Payment.findOne({ _id: paymentId, user: userId })
      .populate('order')
      .lean();

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    return res.json({
      id: payment.id,
      status: payment.status,
      order: payment.order || null,
      amountTotal: payment.amountTotal,
    });
  } catch (err) {
    console.error('[StripePayment] getPaymentStatus error:', err);
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
}

async function handleStripeWebhook(req, res) {
  let stripe;
  let endpointSecret;
  try {
    stripe = getStripe();
    endpointSecret = getWebhookSecret();
  } catch (err) {
    console.error('[StripePayment] Stripe not configured for webhook:', err);
    return res.status(500).send('Stripe webhook is not configured');
  }

  const signature = req.headers['stripe-signature'];
  if (!signature) return res.status(400).send('Missing stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
  } catch (err) {
    console.error('[StripePayment] Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const eventType = event.type;
    const pi = event.data?.object;

    if (!pi) {
      return res.status(200).send('Ignored');
    }

    // 1) PAYMENT SUCCEEDED -> create order (only once)
    if (eventType === 'payment_intent.succeeded') {
      const paymentKind = pi.metadata?.paymentKind;
      const stripePaymentIntentId = pi.id;

      // SUBSCRIPTION: activate subscription only after webhook verification.
      if (paymentKind === 'subscription') {
        const subscriptionPaymentId = pi.metadata?.subscriptionPaymentId;

        const payment =
          (subscriptionPaymentId && (await SubscriptionPayment.findById(subscriptionPaymentId))) ||
          (await SubscriptionPayment.findOne({ stripePaymentIntentId }));

        if (!payment) {
          console.error('[StripePayment] subscription succeeded but record not found', {
            subscriptionPaymentId,
            stripePaymentIntentId,
          });
          return res.status(200).send('Ignored');
        }

        if (payment.status === 'succeeded') {
          return res.status(200).send('OK');
        }

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
          const latestPayment = await SubscriptionPayment.findById(payment.id).session(session);
          if (!latestPayment) throw new Error('SubscriptionPayment not found during transaction');

          if (latestPayment.status === 'succeeded') return;

          latestPayment.status = 'succeeded';
          await latestPayment.save({ session });

          // Activate subscription on the user.
          await User.findByIdAndUpdate(
            latestPayment.user,
            { $set: { subscriptionStatus: 'active' } },
            { session }
          );
        });

        return res.status(200).send('OK');
      }

      // CART: create order after webhook verification.
      const paymentIdFromMeta = pi.metadata?.paymentId;
      const payment =
        (paymentIdFromMeta && (await Payment.findById(paymentIdFromMeta))) ||
        (await Payment.findOne({ stripePaymentIntentId }));

      if (!payment) {
        console.error('[StripePayment] payment_intent.succeeded but Payment record not found', {
          paymentIdFromMeta,
          stripePaymentIntentId,
        });
        return res.status(200).send('Ignored');
      }

      // Idempotency: do nothing if we already succeeded & have an order.
      if (payment.status === 'succeeded' && payment.order) {
        return res.status(200).send('OK');
      }

      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const latestPayment = await Payment.findById(payment.id).session(session);
        if (!latestPayment) throw new Error('Payment not found during transaction');

        // In case we raced: only create the order once.
        if (latestPayment.order) {
          latestPayment.status = 'succeeded';
          await latestPayment.save({ session });
          return;
        }

        // Validate stock & decrement stock.
        for (const line of latestPayment.cart) {
          const product = await Product.findById(line.product).session(session);
          if (!product) throw new Error('Product missing during order creation');

          const stockNow = Number(product.stock || 0);
          if (stockNow < line.quantity) {
            // If stock is insufficient at this point, mark payment as failed (and do not create order).
            latestPayment.status = 'failed';
            await latestPayment.save({ session });
            throw new Error(`Insufficient stock for ${product.name}`);
          }

          product.stock = stockNow - line.quantity;
          await product.save({ session });
        }

        const order = await Order.create(
          [
            {
              user: latestPayment.user,
              items: latestPayment.cart.map((l) => ({
                product: l.product,
                quantity: l.quantity,
                priceAtPurchase: l.priceAtPurchase,
              })),
              status: 'processing',
              total: latestPayment.amountTotal,
            },
          ],
          { session }
        );

        // Order.create with array returns array docs.
        latestPayment.order = order[0]._id;
        latestPayment.status = 'succeeded';
        await latestPayment.save({ session });
      });

      return res.status(200).send('OK');
    }

    // 2) FAILED / CANCELED -> update payment status
    if (eventType === 'payment_intent.payment_failed' || eventType === 'payment_intent.canceled') {
      const stripePaymentIntentId = pi.id;
      const paymentKind = pi.metadata?.paymentKind;

      if (paymentKind === 'subscription') {
        const payment = await SubscriptionPayment.findOne({ stripePaymentIntentId });
        if (payment) {
          payment.status = eventType === 'payment_intent.payment_failed' ? 'failed' : 'canceled';
          await payment.save();
        }
        return res.status(200).send('OK');
      }

      const payment = await Payment.findOne({ stripePaymentIntentId });
      if (payment) {
        payment.status = eventType === 'payment_intent.payment_failed' ? 'failed' : 'canceled';
        await payment.save();
      }
      return res.status(200).send('OK');
    }

    // 3) REFUNDS -> mark as refunded (optional: set order to cancelled)
    if (eventType === 'charge.refunded') {
      const charge = pi; // actually 'charge' event object
      const stripePaymentIntentId = charge.payment_intent;
      if (!stripePaymentIntentId) return res.status(200).send('OK');

      // Prefer subscription payment first.
      const subPayment = await SubscriptionPayment.findOne({ stripePaymentIntentId });
      if (subPayment) {
        subPayment.status = 'refunded';
        await subPayment.save();
        await User.findByIdAndUpdate(subPayment.user, { $set: { subscriptionStatus: 'inactive' } });
        return res.status(200).send('OK');
      }

      const payment = await Payment.findOne({ stripePaymentIntentId });
      if (payment) {
        payment.status = 'refunded';
        await payment.save();

        if (payment.order) {
          await Order.findByIdAndUpdate(payment.order, { status: 'cancelled' });
        }
      }
      return res.status(200).send('OK');
    }

    // Default: acknowledge unknown events.
    return res.status(200).send('Ignored');
  } catch (err) {
    console.error('[StripePayment] Webhook processing error:', err);
    const msg = String(err?.message || '').toLowerCase();
    const nonRecoverable = msg.includes('insufficient stock') || msg.includes('payment record not found');
    // If we can’t safely recover (e.g. stock mismatch), acknowledge so Stripe stops retrying.
    if (nonRecoverable) return res.status(200).send('OK');
    // Otherwise, fail so Stripe retries.
    return res.status(500).send('Webhook processing error');
  }
}

module.exports = {
  createPaymentIntent,
  getPaymentStatus,
  handleStripeWebhook,
};

