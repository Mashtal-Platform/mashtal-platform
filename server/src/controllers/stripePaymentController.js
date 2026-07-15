const crypto = require('crypto');
const mongoose = require('mongoose');
const { getStripe, getWebhookSecret } = require('../services/stripeClient');
const { getSubscriptionPeriodMs } = require('../utils/subscription');

const Payment = require('../models/Payment');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const MoneyTransaction = require('../models/MoneyTransaction');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { assertBusinessSubscriptionActive } = require('../utils/subscription');

function toMoneyNumber(n) {
  const num = Number(n);
  if (!Number.isFinite(num)) return 0;
  return Number(num.toFixed(2));
}

function getTaxRate() {
  const r = Number(process.env.TAX_RATE);
  return Number.isFinite(r) && r >= 0 ? r : 0.15;
}

function getCurrency() {
  return (process.env.PAYMENT_CURRENCY || 'usd').toLowerCase();
}

/** Stripe card charges must be at least this amount (USD/cad-like). */
function getStripeMinChargeAmount() {
  const n = Number(process.env.STRIPE_MIN_CHARGE_USD);
  return Number.isFinite(n) && n > 0 ? n : 0.5;
}

function uniqueStripeIntentIds(legs) {
  return [
    ...new Set(
      (legs || [])
        .map((l) => l.stripePaymentIntentId)
        .filter((id) => typeof id === 'string' && id.length > 0)
    ),
  ];
}

/**
 * Refund/cancel orphaned multi-leg Stripe charges and clear ledger rows so checkout
 * can recreate a single PaymentIntent for the full cart.
 */
async function resetIncompleteCartPayment(payment, stripe) {
  const piIds = uniqueStripeIntentIds(payment.legs);
  for (const piId of piIds) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (pi.status === 'succeeded') {
        await stripe.refunds.create({ payment_intent: piId });
      } else if (
        pi.status === 'requires_payment_method' ||
        pi.status === 'requires_confirmation' ||
        pi.status === 'requires_action' ||
        pi.status === 'processing'
      ) {
        await stripe.paymentIntents.cancel(piId);
      }
    } catch (err) {
      console.error('[StripePayment] resetIncompleteCartPayment PI cleanup failed:', piId, err?.message);
    }
  }

  await MoneyTransaction.deleteMany({
    payment: payment._id,
    $or: [{ order: null }, { order: { $exists: false } }],
  });

  for (const leg of payment.legs || []) {
    leg.stripePaymentIntentId = undefined;
    leg.status = 'initiated';
  }
  payment.status = 'initiated';
  payment.stripePaymentIntentId = undefined;
  await payment.save();
  return payment;
}

function businessDisplayName(user) {
  if (!user) return 'Business';
  const bp = user.businessProfile || {};
  return (bp.companyName || user.fullName || 'Business').trim();
}

function computeIdempotencyKey({ userId, cartLines }) {
  const payload = {
    userId,
    cartLines: [...cartLines].sort((a, b) => String(a.productId).localeCompare(String(b.productId))),
  };
  return crypto.createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

/**
 * Expand cart into 1-to-1 legs: one per seller + one tax to platform.
 */
function buildLegsFromCart({ cartLines, productsById, sellersById, taxRate }) {
  const bySeller = new Map();
  for (const line of cartLines) {
    const p = productsById.get(line.productId);
    const businessId = String(p.business);
    const amount = toMoneyNumber(line.priceAtPurchase * line.quantity);
    if (!bySeller.has(businessId)) {
      bySeller.set(businessId, { businessId, amount: 0, productIds: [] });
    }
    const bucket = bySeller.get(businessId);
    bucket.amount = toMoneyNumber(bucket.amount + amount);
    bucket.productIds.push(line.productId);
  }

  const legs = [];
  let subtotal = 0;
  for (const [, bucket] of bySeller) {
    subtotal = toMoneyNumber(subtotal + bucket.amount);
    const seller = sellersById.get(bucket.businessId);
    const bp = seller?.businessProfile || {};
    legs.push({
      legKey: `seller:${bucket.businessId}`,
      type: 'order_seller',
      toUser: new mongoose.Types.ObjectId(bucket.businessId),
      toLabel: businessDisplayName(seller),
      toWishPhone: bp.wishPhone || '',
      toWishAccount: bp.wishAccountNumber || '',
      amount: bucket.amount,
      status: 'initiated',
    });
  }

  const tax = toMoneyNumber(subtotal * taxRate);
  legs.push({
    legKey: 'tax:platform',
    type: 'order_tax',
    toUser: null,
    toLabel: 'Mashtal (tax)',
    toWishPhone: process.env.WISH_ADMIN_PHONE || '',
    toWishAccount: process.env.WISH_ADMIN_ACCOUNT || '',
    amount: tax,
    status: 'initiated',
  });

  return {
    legs,
    amountSubtotal: toMoneyNumber(subtotal),
    amountTax: tax,
    amountTotal: toMoneyNumber(subtotal + tax),
  };
}

async function finalizeCartPaymentIfComplete(paymentDoc, session) {
  const payment = session
    ? await Payment.findById(paymentDoc._id).session(session)
    : await Payment.findById(paymentDoc._id);
  if (!payment) return null;
  if (payment.order) {
    payment.status = 'succeeded';
    await payment.save(session ? { session } : undefined);
    return payment.order;
  }

  const legs = payment.legs || [];
  if (legs.length === 0) return null;
  const allSucceeded = legs.every((l) => l.status === 'succeeded');
  if (!allSucceeded) return null;

  for (const line of payment.cart) {
    const product = session
      ? await Product.findById(line.product).session(session)
      : await Product.findById(line.product);
    if (!product) throw new Error('Product missing during order creation');
    const stockNow = Number(product.stock || 0);
    if (stockNow < line.quantity) {
      payment.status = 'failed';
      await payment.save(session ? { session } : undefined);
      throw new Error(`Insufficient stock for ${product.name}`);
    }
    product.stock = stockNow - line.quantity;
    await product.save(session ? { session } : undefined);
  }

  const orderDocs = await Order.create(
    [
      {
        user: payment.user,
        items: payment.cart.map((l) => ({
          product: l.product,
          quantity: l.quantity,
          priceAtPurchase: l.priceAtPurchase,
        })),
        status: 'processing',
        total: payment.amountTotal,
        shipping: payment.shipping || undefined,
      },
    ],
    session ? { session } : undefined
  );
  const order = Array.isArray(orderDocs) ? orderDocs[0] : orderDocs;

  // Ensure shipping has buyer name/phone for business dashboard
  if (!order.shipping?.phone || !order.shipping?.fullName) {
    const buyer = session
      ? await User.findById(payment.user).session(session).lean()
      : await User.findById(payment.user).lean();
    if (buyer) {
      order.shipping = {
        ...(order.shipping || {}),
        fullName: order.shipping?.fullName || buyer.fullName || '',
        email: order.shipping?.email || buyer.email || '',
        phone:
          order.shipping?.phone ||
          buyer.phone ||
          buyer.businessProfile?.phone ||
          '',
      };
      await order.save(session ? { session } : undefined);
    }
  }

  payment.order = order._id;
  payment.status = 'succeeded';
  await payment.save(session ? { session } : undefined);

  // Ensure money transactions exist / linked to order
  for (const leg of payment.legs) {
    await MoneyTransaction.findOneAndUpdate(
      {
        payment: payment._id,
        legKey: leg.legKey,
      },
      {
        $set: {
          type: leg.type,
          fromUser: payment.user,
          toUser: leg.toUser,
          toWishPhone: leg.toWishPhone || '',
          toWishAccount: leg.toWishAccount || '',
          amount: leg.amount,
          currency: (payment.currency || 'USD').toUpperCase(),
          status: 'succeeded',
          payment: payment._id,
          order: order._id,
          toLabel: leg.toLabel || '',
          stripePaymentIntentId: leg.stripePaymentIntentId,
          legKey: leg.legKey,
        },
      },
      { upsert: true, session: session || undefined, new: true }
    );
  }

  // Notify each distinct seller that they received an order
  const sellerIds = new Set();
  for (const line of payment.cart || []) {
    if (line.business) sellerIds.add(String(line.business));
  }
  for (const sellerId of sellerIds) {
    await Notification.create(
      [
        {
          recipient: new mongoose.Types.ObjectId(sellerId),
          sender: payment.user,
          type: 'order_created',
          entityId: order._id,
        },
      ],
      session ? { session } : undefined
    );
  }

  return order._id;
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

    for (const it of normalizedItems) {
      if (!Number.isInteger(it.quantity) || it.quantity < 1 || it.quantity > 50) {
        return res.status(400).json({ message: 'Invalid quantity (min 1, max 50)' });
      }
    }

    const productIds = [...new Set(normalizedItems.map((i) => i.productId))];
    const products = await Product.find({ _id: { $in: productIds } }).lean();
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const cartLines = [];
    const sellerIds = new Set();
    for (const it of normalizedItems) {
      const p = productMap.get(it.productId);
      if (!p) return res.status(404).json({ message: 'Product not found' });
      const productStock = Number(p.stock || 0);
      if (productStock < it.quantity) {
        return res.status(409).json({ message: `Insufficient stock for ${p.name}` });
      }
      const businessId = String(p.business);
      sellerIds.add(businessId);
      cartLines.push({
        productId: it.productId,
        quantity: it.quantity,
        priceAtPurchase: Number(p.price),
        businessId,
      });
    }

    const sellers = await User.find({ _id: { $in: [...sellerIds] } }).lean();
    const sellersById = new Map(sellers.map((u) => [String(u._id), u]));

    for (const sid of sellerIds) {
      const seller = sellersById.get(sid);
      if (!seller || seller.role !== 'business') {
        return res.status(400).json({ message: 'Cart contains products from an invalid seller' });
      }
      const subCheck = await assertBusinessSubscriptionActive(seller);
      if (!subCheck.ok) {
        return res.status(403).json({
          message: `${businessDisplayName(seller)}: ${subCheck.message}`,
        });
      }
      const wishPhone = seller.businessProfile?.wishPhone;
      if (!wishPhone || !String(wishPhone).trim()) {
        return res.status(400).json({
          message: `${businessDisplayName(seller)} has not set a Whish payout phone`,
        });
      }
    }

    const taxRate = getTaxRate();
    const { legs, amountSubtotal, amountTax, amountTotal } = buildLegsFromCart({
      cartLines,
      productsById: productMap,
      sellersById,
      taxRate,
    });

    if (amountTotal <= 0) {
      return res.status(400).json({ message: 'Cart total must be greater than zero' });
    }

    const stripeMin = getStripeMinChargeAmount();
    if (amountTotal + 1e-9 < stripeMin) {
      return res.status(400).json({
        message: `Order total must be at least $${stripeMin.toFixed(2)} USD (Stripe minimum).`,
      });
    }

    const stripe = getStripe();
    const currency = getCurrency();
    const idempotencyKey = computeIdempotencyKey({ userId, cartLines });

    let payment = await Payment.findOne({ user: userId, idempotencyKey });
    if (!payment) {
      const buyer = await User.findById(userId).select('fullName email phone businessProfile.phone').lean();
      payment = await Payment.create({
        user: new mongoose.Types.ObjectId(userId),
        idempotencyKey,
        currency: currency.toUpperCase(),
        amountSubtotal,
        amountTax,
        amountShipping: 0,
        amountTotal,
        cart: cartLines.map((l) => ({
          product: new mongoose.Types.ObjectId(l.productId),
          quantity: l.quantity,
          priceAtPurchase: l.priceAtPurchase,
          business: new mongoose.Types.ObjectId(l.businessId),
        })),
        legs,
        shipping: {
          fullName: buyer?.fullName || '',
          email: buyer?.email || '',
          phone: buyer?.phone || buyer?.businessProfile?.phone || '',
        },
        status: 'initiated',
      });
    }

    // Buyer pays Mashtal once (full cart). Ledger still stores 1-to-1 seller + tax legs.
    let didResetOrphans = false;
    const activeLegs = (payment.legs || []).filter((l) => toMoneyNumber(l.amount) > 0);
    const piIds = uniqueStripeIntentIds(payment.legs);
    const anySucceeded = activeLegs.some((l) => l.status === 'succeeded');
    const allSucceeded =
      activeLegs.length > 0 && activeLegs.every((l) => l.status === 'succeeded');
    const singleSharedPi =
      piIds.length === 1 &&
      activeLegs.length > 0 &&
      activeLegs.every((l) => l.stripePaymentIntentId === piIds[0]);

    // Stuck retries after the old multi-charge flow: refund partial successes and rebuild.
    if (!payment.order && anySucceeded && !allSucceeded) {
      payment = await resetIncompleteCartPayment(payment, stripe);
      payment.legs = legs;
      payment.amountSubtotal = amountSubtotal;
      payment.amountTax = amountTax;
      payment.amountTotal = amountTotal;
      await payment.save();
      didResetOrphans = true;
    } else if (!payment.order && (piIds.length > 1 || (piIds.length === 1 && !singleSharedPi))) {
      payment = await resetIncompleteCartPayment(payment, stripe);
      payment.legs = legs;
      payment.amountSubtotal = amountSubtotal;
      payment.amountTax = amountTax;
      payment.amountTotal = amountTotal;
      await payment.save();
      didResetOrphans = true;
    } else if (!payment.legs?.length) {
      payment.legs = legs;
    }

    let sharedPiId = uniqueStripeIntentIds(payment.legs)[0] || payment.stripePaymentIntentId || null;

    if (!sharedPiId || !payment.legs.some((l) => l.stripePaymentIntentId)) {
      const amountCents = Math.round(toMoneyNumber(payment.amountTotal) * 100);
      if (amountCents < Math.round(stripeMin * 100)) {
        return res.status(400).json({
          message: `Order total must be at least $${stripeMin.toFixed(2)} USD (Stripe minimum).`,
        });
      }

      const stripeIdempotency = didResetOrphans
        ? `${idempotencyKey}:cart_total:retry:${Date.now()}`
        : `${idempotencyKey}:cart_total:v2`;

      const piCreate = await stripe.paymentIntents.create(
        {
          amount: amountCents,
          currency,
          automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
          metadata: {
            paymentKind: 'cart_leg',
            paymentId: payment.id,
            legKeys: (payment.legs || []).map((l) => l.legKey).join(','),
            chargeGroup: 'cart_total',
          },
        },
        { idempotencyKey: stripeIdempotency }
      );

      sharedPiId = piCreate.id;
      payment.stripePaymentIntentId = piCreate.id;
      for (const leg of payment.legs) {
        if (toMoneyNumber(leg.amount) <= 0) continue;
        leg.stripePaymentIntentId = piCreate.id;
        leg.status = 'processing';
      }
      payment.status = 'processing';
      await payment.save();
    }

    const pi = await stripe.paymentIntents.retrieve(sharedPiId);

    // If this one charge already succeeded (webhook lag), finalize order now
    if (pi.status === 'succeeded') {
      await markLegSucceeded(pi);
      payment = await Payment.findById(payment._id);
    }

    return res.json({
      paymentId: payment.id,
      currency: payment.currency,
      amountSubtotal: payment.amountSubtotal,
      amountTax: payment.amountTax,
      amountTotal: payment.amountTotal,
      taxRate,
      ledgerLegs: (payment.legs || []).map((l) => ({
        legKey: l.legKey,
        type: l.type,
        toLabel: l.toLabel,
        amount: l.amount,
        status: l.status,
      })),
      /** Compat: single charge (confirm once). Ledger splits are in ledgerLegs. */
      legs: [
        {
          legKey: 'cart_total',
          type: 'cart_total',
          toLabel: 'Mashtal cart total',
          amount: payment.amountTotal,
          status: payment.status,
          clientSecret: pi.client_secret,
          stripePaymentIntentId: sharedPiId,
        },
      ],
      clientSecret: pi.client_secret || null,
    });
  } catch (err) {
    console.error('[StripePayment] createPaymentIntent error:', err);
    const msg = String(err?.message || '').toLowerCase();
    if (msg.includes('stripe') && (msg.includes('secret') || msg.includes('webhook'))) {
      return res.status(500).json({ message: 'Stripe is not configured on the server' });
    }
    res.status(500).json({ message: err?.message || 'Failed to create payment' });
  }
}

function shapePaymentStatus(payment) {
  return {
    id: payment._id?.toString?.() || payment.id,
    status: payment.status,
    order: payment.order || null,
    amountTotal: payment.amountTotal,
    amountSubtotal: payment.amountSubtotal,
    amountTax: payment.amountTax,
    currency: payment.currency,
    legs: (payment.legs || []).map((l) => ({
      legKey: l.legKey,
      type: l.type,
      toLabel: l.toLabel,
      amount: l.amount,
      status: l.status,
    })),
  };
}

/**
 * Sync cart payment legs from Stripe when webhooks are late/missing.
 * Marks succeeded legs and finalizes the order when all legs are done.
 */
async function syncCartPaymentFromStripe(payment) {
  if (!payment || payment.order || payment.status === 'succeeded') return payment;

  const stripe = getStripe();
  const legs = payment.legs || [];
  for (const leg of legs) {
    if (!leg.stripePaymentIntentId) continue;
    if (leg.status === 'succeeded') continue;
    try {
      const pi = await stripe.paymentIntents.retrieve(leg.stripePaymentIntentId);
      if (pi.status === 'succeeded') {
        await markLegSucceeded(pi);
      } else if (pi.status === 'canceled') {
        const latest = await Payment.findById(payment._id);
        if (!latest) continue;
        const latestLeg = latest.legs.find(
          (l) => l.stripePaymentIntentId === leg.stripePaymentIntentId
        );
        if (latestLeg && latestLeg.status !== 'succeeded') {
          latestLeg.status = 'canceled';
          latest.status = 'canceled';
          await latest.save();
        }
      }
    } catch (err) {
      console.error('[StripePayment] sync retrieve failed:', leg.stripePaymentIntentId, err?.message);
    }
  }

  return Payment.findById(payment._id).populate('order');
}

async function getPaymentStatus(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentId } = req.params;
    let payment = await Payment.findOne({ _id: paymentId, user: userId }).populate('order');

    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    // Fallback when stripe listen / webhook has not updated legs yet
    if (!payment.order && payment.status !== 'succeeded' && payment.status !== 'failed' && payment.status !== 'canceled' && payment.status !== 'refunded') {
      try {
        payment = (await syncCartPaymentFromStripe(payment)) || payment;
      } catch (syncErr) {
        console.error('[StripePayment] sync during getPaymentStatus failed:', syncErr?.message);
      }
    }

    const lean = payment.toObject ? payment.toObject({ virtuals: true }) : payment;
    return res.json(shapePaymentStatus(lean));
  } catch (err) {
    console.error('[StripePayment] getPaymentStatus error:', err);
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
}

async function markLegSucceeded(pi) {
  const paymentId = pi.metadata?.paymentId;
  const stripePaymentIntentId = pi.id;

  const payment =
    (paymentId && (await Payment.findById(paymentId))) ||
    (await Payment.findOne({ 'legs.stripePaymentIntentId': stripePaymentIntentId }));

  if (!payment) {
    console.error('[StripePayment] cart_leg succeeded but Payment not found', {
      paymentId,
      stripePaymentIntentId,
    });
    return;
  }

  // One Stripe PI may cover several ledger legs (e.g. tax under Stripe's $0.50 minimum)
  const matchingLegs = payment.legs.filter(
    (l) => l.stripePaymentIntentId === stripePaymentIntentId
  );
  if (!matchingLegs.length) return;
  if (matchingLegs.every((l) => l.status === 'succeeded') && payment.order) return;

  for (const leg of matchingLegs) {
    leg.status = 'succeeded';
    await MoneyTransaction.findOneAndUpdate(
      {
        payment: payment._id,
        legKey: leg.legKey,
      },
      {
        $set: {
          type: leg.type,
          fromUser: payment.user,
          toUser: leg.toUser,
          toWishPhone: leg.toWishPhone || '',
          toWishAccount: leg.toWishAccount || '',
          amount: leg.amount,
          currency: (payment.currency || 'USD').toUpperCase(),
          status: 'succeeded',
          payment: payment._id,
          toLabel: leg.toLabel || '',
          stripePaymentIntentId,
          legKey: leg.legKey,
        },
      },
      { upsert: true, new: true }
    );
  }
  await payment.save();

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      await finalizeCartPaymentIfComplete(payment, session);
    });
  } finally {
    session.endSession();
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
    if (!pi) return res.status(200).send('Ignored');

    if (eventType === 'payment_intent.succeeded') {
      const paymentKind = pi.metadata?.paymentKind;

      if (paymentKind === 'subscription') {
        const subscriptionPaymentId = pi.metadata?.subscriptionPaymentId;
        const payment =
          (subscriptionPaymentId && (await SubscriptionPayment.findById(subscriptionPaymentId))) ||
          (await SubscriptionPayment.findOne({ stripePaymentIntentId: pi.id }));

        if (!payment) {
          console.error('[StripePayment] subscription succeeded but record not found');
          return res.status(200).send('Ignored');
        }
        if (payment.status === 'succeeded') return res.status(200).send('OK');

        const session = await mongoose.startSession();
        await session.withTransaction(async () => {
          const latestPayment = await SubscriptionPayment.findById(payment.id).session(session);
          if (!latestPayment || latestPayment.status === 'succeeded') return;
          latestPayment.status = 'succeeded';
          await latestPayment.save({ session });
          const bizUser = await User.findById(latestPayment.user).session(session);
          await User.findByIdAndUpdate(
            latestPayment.user,
            {
              $set: {
                subscriptionStatus: 'active',
                subscriptionStartedAt: bizUser?.subscriptionStartedAt || new Date(),
                subscriptionExpiresAt: new Date(Date.now() + getSubscriptionPeriodMs()),
                subscriptionExpiryReminderSentAt: null,
              },
            },
            { session }
          );
          await MoneyTransaction.findOneAndUpdate(
            { stripePaymentIntentId: pi.id },
            {
              $set: {
                type: 'business_subscription',
                fromUser: latestPayment.user,
                toUser: null,
                amount: latestPayment.amountTotal,
                currency: (latestPayment.currency || 'USD').toUpperCase(),
                status: 'succeeded',
                subscriptionPayment: latestPayment._id,
                toLabel: 'Mashtal business subscription',
                stripePaymentIntentId: pi.id,
                legKey: `subscription:${latestPayment._id}`,
              },
            },
            { upsert: true, session, new: true }
          );
        });
        session.endSession();
        return res.status(200).send('OK');
      }

      if (paymentKind === 'cart_leg') {
        await markLegSucceeded(pi);
        return res.status(200).send('OK');
      }

      // Legacy single-intent cart payments
      const paymentIdFromMeta = pi.metadata?.paymentId;
      const payment =
        (paymentIdFromMeta && (await Payment.findById(paymentIdFromMeta))) ||
        (await Payment.findOne({ stripePaymentIntentId: pi.id }));

      if (!payment) {
        return res.status(200).send('Ignored');
      }
      if (payment.status === 'succeeded' && payment.order) {
        return res.status(200).send('OK');
      }

      // If multi-leg payment without kind (shouldn't happen), try by intent id on legs
      if (payment.legs?.length) {
        await markLegSucceeded(pi);
        return res.status(200).send('OK');
      }

      const session = await mongoose.startSession();
      await session.withTransaction(async () => {
        const latestPayment = await Payment.findById(payment.id).session(session);
        if (!latestPayment || latestPayment.order) {
          if (latestPayment) {
            latestPayment.status = 'succeeded';
            await latestPayment.save({ session });
          }
          return;
        }
        for (const line of latestPayment.cart) {
          const product = await Product.findById(line.product).session(session);
          if (!product) throw new Error('Product missing during order creation');
          const stockNow = Number(product.stock || 0);
          if (stockNow < line.quantity) {
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
        latestPayment.order = order[0]._id;
        latestPayment.status = 'succeeded';
        await latestPayment.save({ session });
      });
      session.endSession();
      return res.status(200).send('OK');
    }

    if (eventType === 'payment_intent.payment_failed' || eventType === 'payment_intent.canceled') {
      const stripePaymentIntentId = pi.id;
      const paymentKind = pi.metadata?.paymentKind;
      const status = eventType === 'payment_intent.payment_failed' ? 'failed' : 'canceled';

      if (paymentKind === 'subscription') {
        const payment = await SubscriptionPayment.findOne({ stripePaymentIntentId });
        if (payment) {
          payment.status = status;
          await payment.save();
        }
        return res.status(200).send('OK');
      }

      const payment =
        (await Payment.findOne({ 'legs.stripePaymentIntentId': stripePaymentIntentId })) ||
        (await Payment.findOne({ stripePaymentIntentId }));

      if (payment) {
        for (const leg of payment.legs || []) {
          if (leg.stripePaymentIntentId === stripePaymentIntentId) {
            leg.status = status;
          }
        }
        payment.status = status;
        await payment.save();
        await MoneyTransaction.updateMany(
          { stripePaymentIntentId },
          { $set: { status } }
        );
      }
      return res.status(200).send('OK');
    }

    if (eventType === 'charge.refunded') {
      const charge = pi;
      const stripePaymentIntentId = charge.payment_intent;
      if (!stripePaymentIntentId) return res.status(200).send('OK');

      const subPayment = await SubscriptionPayment.findOne({ stripePaymentIntentId });
      if (subPayment) {
        subPayment.status = 'refunded';
        await subPayment.save();
        await User.findByIdAndUpdate(subPayment.user, { $set: { subscriptionStatus: 'inactive' } });
        await MoneyTransaction.findOneAndUpdate(
          { stripePaymentIntentId },
          { $set: { status: 'refunded' } }
        );
        return res.status(200).send('OK');
      }

      const payment =
        (await Payment.findOne({ 'legs.stripePaymentIntentId': stripePaymentIntentId })) ||
        (await Payment.findOne({ stripePaymentIntentId }));
      if (payment) {
        payment.status = 'refunded';
        await payment.save();
        if (payment.order) {
          await Order.findByIdAndUpdate(payment.order, { status: 'cancelled' });
        }
        await MoneyTransaction.updateMany(
          { payment: payment._id },
          { $set: { status: 'refunded' } }
        );
      }
      return res.status(200).send('OK');
    }

    return res.status(200).send('Ignored');
  } catch (err) {
    console.error('[StripePayment] Webhook processing error:', err);
    const msg = String(err?.message || '').toLowerCase();
    const nonRecoverable = msg.includes('insufficient stock') || msg.includes('payment record not found');
    if (nonRecoverable) return res.status(200).send('OK');
    return res.status(500).send('Webhook processing error');
  }
}

module.exports = {
  createPaymentIntent,
  getPaymentStatus,
  handleStripeWebhook,
};
