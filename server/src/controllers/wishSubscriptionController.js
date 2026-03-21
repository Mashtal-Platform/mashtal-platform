const crypto = require('crypto');
const mongoose = require('mongoose');

const SubscriptionPayment = require('../models/SubscriptionPayment');
const User = require('../models/User');

function getPlanAmountSars(planRole) {
  if (planRole === 'engineer') return 299;
  if (planRole === 'business') return 499;
  return 0;
}

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (!/^\+?[\d\s\-]{8,20}$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 8 && digits.length <= 15;
}

function normalizeTransferReference(reference) {
  return String(reference || '').trim().toUpperCase();
}

function isValidTransferReference(reference) {
  return /^[A-Z0-9\-]{6,40}$/.test(reference);
}

function safeCompareHex(a, b) {
  try {
    const aa = Buffer.from(a || '', 'hex');
    const bb = Buffer.from(b || '', 'hex');
    if (aa.length === 0 || bb.length === 0 || aa.length !== bb.length) return false;
    return crypto.timingSafeEqual(aa, bb);
  } catch (_err) {
    return false;
  }
}

async function submitWishSubscriptionPayment(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { planRole, senderFullName, senderPhone, transferReference, transferDate, amountTotal } = req.body || {};

    if (planRole !== 'engineer' && planRole !== 'business') {
      return res.status(400).json({ message: 'planRole must be engineer or business' });
    }

    const expectedAmount = getPlanAmountSars(planRole);
    if (!expectedAmount) return res.status(400).json({ message: 'Invalid planRole' });

    if (Number(amountTotal) !== expectedAmount) {
      return res.status(400).json({ message: `Amount must be exactly SR ${expectedAmount}` });
    }

    if (!senderFullName || String(senderFullName).trim().length < 3) {
      return res.status(400).json({ message: 'Sender full name is required' });
    }
    if (!isValidPhone(senderPhone)) {
      return res.status(400).json({ message: 'Sender phone must be a valid phone number' });
    }

    const normalizedReference = normalizeTransferReference(transferReference);
    if (!isValidTransferReference(normalizedReference)) {
      return res.status(400).json({ message: 'Transfer reference must be 6-40 chars (A-Z, 0-9, -)' });
    }

    const parsedTransferDate = new Date(transferDate);
    if (Number.isNaN(parsedTransferDate.getTime())) {
      return res.status(400).json({ message: 'transferDate is invalid' });
    }

    // Prevent reference replay/fraud.
    const existingByRef = await SubscriptionPayment.findOne({
      'wishTransfer.transferReference': normalizedReference,
      status: { $in: ['initiated', 'processing', 'succeeded'] },
    }).lean();
    if (existingByRef) {
      return res.status(409).json({ message: 'Transfer reference already used' });
    }

    const idempotencyKey = crypto
      .createHash('sha256')
      .update(
        JSON.stringify({
          userId,
          planRole,
          amountTotal: expectedAmount,
          transferReference: normalizedReference,
        })
      )
      .digest('hex');

    const payment = await SubscriptionPayment.create({
      user: new mongoose.Types.ObjectId(userId),
      idempotencyKey,
      status: 'processing',
      currency: 'SAR',
      amountTotal: expectedAmount,
      planRole,
      paymentMethod: 'wish_money',
      wishTransfer: {
        senderFullName: String(senderFullName).trim(),
        senderPhone: String(senderPhone).trim(),
        transferReference: normalizedReference,
        transferDate: parsedTransferDate,
        submittedAt: new Date(),
      },
    });

    return res.status(201).json({
      paymentId: payment.id,
      status: payment.status,
      message: 'Transfer submitted. Waiting secure verification.',
    });
  } catch (err) {
    console.error('[WishSubscription] submit error:', err);
    res.status(500).json({ message: 'Failed to submit Wish Money payment' });
  }
}

async function getWishSubscriptionPaymentStatus(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentId } = req.params;
    const payment = await SubscriptionPayment.findOne({ _id: paymentId, user: userId, paymentMethod: 'wish_money' }).lean();
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    const me = await User.findById(userId).lean();
    return res.json({
      id: payment._id.toString(),
      status: payment.status,
      amountTotal: payment.amountTotal,
      planRole: payment.planRole,
      transferReference: payment.wishTransfer?.transferReference || null,
      userSubscriptionStatus: me?.subscriptionStatus || 'inactive',
    });
  } catch (err) {
    console.error('[WishSubscription] status error:', err);
    res.status(500).json({ message: 'Failed to fetch payment status' });
  }
}

// Optional secure callback when provider/backoffice confirms transfer.
async function wishSubscriptionCallback(req, res) {
  try {
    const secret = process.env.WISH_MONEY_WEBHOOK_SECRET;
    if (!secret) return res.status(500).json({ message: 'WISH_MONEY_WEBHOOK_SECRET is not set' });

    const signature = req.header('x-wish-signature');
    if (!signature) return res.status(400).json({ message: 'Missing x-wish-signature' });

    const { transferReference, status, note } = req.body || {};
    const normalizedReference = normalizeTransferReference(transferReference);
    if (!isValidTransferReference(normalizedReference)) {
      return res.status(400).json({ message: 'Invalid transferReference' });
    }
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'status must be approved or rejected' });
    }

    const payload = `${normalizedReference}:${status}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (!safeCompareHex(signature, expected)) {
      return res.status(401).json({ message: 'Invalid signature' });
    }

    const payment = await SubscriptionPayment.findOne({
      paymentMethod: 'wish_money',
      'wishTransfer.transferReference': normalizedReference,
    });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status === 'succeeded' || payment.status === 'failed') {
      return res.status(200).json({ message: 'Already processed' });
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const latest = await SubscriptionPayment.findById(payment._id).session(session);
      if (!latest) throw new Error('Payment not found in transaction');

      latest.status = status === 'approved' ? 'succeeded' : 'failed';
      latest.wishTransfer.verificationNote = note ? String(note).slice(0, 500) : undefined;
      latest.wishTransfer.verifiedAt = new Date();
      await latest.save({ session });

      if (status === 'approved') {
        await User.findByIdAndUpdate(latest.user, { $set: { subscriptionStatus: 'active' } }, { session });
      }
    });

    return res.status(200).json({ message: 'OK' });
  } catch (err) {
    console.error('[WishSubscription] callback error:', err);
    return res.status(500).json({ message: 'Callback processing failed' });
  }
}

async function verifyWishSubscriptionPayment(req, res) {
  try {
    const verifierId = req.user?.id;
    if (!verifierId) return res.status(401).json({ message: 'Unauthorized' });

    const { paymentId } = req.params;
    const { decision, note } = req.body || {};
    if (!['approve', 'reject'].includes(decision)) {
      return res.status(400).json({ message: 'decision must be approve or reject' });
    }

    const payment = await SubscriptionPayment.findOne({ _id: paymentId, paymentMethod: 'wish_money' });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });

    if (payment.status === 'succeeded' || payment.status === 'failed') {
      return res.status(200).json({ message: 'Already verified', status: payment.status });
    }

    const session = await mongoose.startSession();
    await session.withTransaction(async () => {
      const latest = await SubscriptionPayment.findById(paymentId).session(session);
      if (!latest) throw new Error('Payment not found in transaction');

      latest.status = decision === 'approve' ? 'succeeded' : 'failed';
      latest.wishTransfer.verificationNote = note ? String(note).slice(0, 500) : undefined;
      latest.wishTransfer.verifiedBy = new mongoose.Types.ObjectId(verifierId);
      latest.wishTransfer.verifiedAt = new Date();
      await latest.save({ session });

      if (decision === 'approve') {
        await User.findByIdAndUpdate(latest.user, { $set: { subscriptionStatus: 'active' } }, { session });
      }
    });

    return res.status(200).json({ message: 'Verification saved' });
  } catch (err) {
    console.error('[WishSubscription] manual verify error:', err);
    return res.status(500).json({ message: 'Failed to verify payment' });
  }
}

module.exports = {
  submitWishSubscriptionPayment,
  getWishSubscriptionPaymentStatus,
  wishSubscriptionCallback,
  verifyWishSubscriptionPayment,
};

