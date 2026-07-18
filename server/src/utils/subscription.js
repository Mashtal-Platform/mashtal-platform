const User = require('../models/User');
const Notification = require('../models/Notification');

function getSubscriptionPeriodDays() {
  const days = Number(process.env.BUSINESS_SUBSCRIPTION_DAYS);
  return Number.isFinite(days) && days > 0 ? days : 60;
}

function getSubscriptionPeriodMs() {
  return getSubscriptionPeriodDays() * 24 * 60 * 60 * 1000;
}

/** Mark expired active subscriptions as inactive. */
async function expireDueSubscriptions() {
  const now = new Date();
  const result = await User.updateMany(
    {
      role: 'business',
      subscriptionStatus: 'active',
      subscriptionExpiresAt: { $lte: now },
    },
    {
      $set: { subscriptionStatus: 'inactive' },
    }
  );

  const expiredUsers = await User.find({
    role: 'business',
    subscriptionStatus: 'inactive',
    subscriptionExpiresAt: { $lte: now, $gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
  })
    .select('_id')
    .lean();

  for (const u of expiredUsers) {
    const exists = await Notification.findOne({
      recipient: u._id,
      type: 'subscription_expired',
      createdAt: { $gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
    }).lean();
    if (!exists) {
      await Notification.create({
        recipient: u._id,
        type: 'subscription_expired',
      });
    }
  }

  return result.modifiedCount || 0;
}

/**
 * Notify businesses whose subscription expires within the next ~24 hours.
 */
async function notifyExpiringTomorrow() {
  const now = new Date();
  const inAboutOneDay = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 36 * 60 * 60 * 1000);

  const businesses = await User.find({
    role: 'business',
    subscriptionStatus: 'active',
    subscriptionExpiresAt: { $gte: now, $lte: windowEnd },
  }).lean();

  let sent = 0;
  for (const b of businesses) {
    const remindedAt = b.subscriptionExpiryReminderSentAt
      ? new Date(b.subscriptionExpiryReminderSentAt).getTime()
      : 0;
    if (now.getTime() - remindedAt < 20 * 60 * 60 * 1000) continue;

    await Notification.create({
      recipient: b._id,
      type: 'subscription_expiring',
      entityId: b._id,
    });
    await User.updateOne(
      { _id: b._id },
      { $set: { subscriptionExpiryReminderSentAt: now } }
    );
    sent += 1;
  }

  return { candidates: businesses.length, sent, windowEnds: inAboutOneDay };
}

function startSubscriptionMaintenance() {
  const run = async () => {
    try {
      const expired = await expireDueSubscriptions();
      const notify = await notifyExpiringTomorrow();
      if (expired || notify.sent) {
        console.log(
          `[Subscription] expired=${expired}, expiryRemindersSent=${notify.sent}`
        );
      }
    } catch (err) {
      console.error('[Subscription] maintenance error:', err?.message || err);
    }
  };

  // Run shortly after boot, then hourly
  setTimeout(run, 15_000);
  setInterval(run, 60 * 60 * 1000);
}

async function assertBusinessSubscriptionActive(userDoc) {
  if (!userDoc || userDoc.role !== 'business') {
    return { ok: false, message: 'Not a business account' };
  }
  if (userDoc.subscriptionStatus !== 'active') {
    return { ok: false, message: 'Business subscription is inactive. Please renew payment.' };
  }
  if (userDoc.subscriptionExpiresAt && new Date(userDoc.subscriptionExpiresAt) <= new Date()) {
    await User.updateOne(
      { _id: userDoc._id },
      { $set: { subscriptionStatus: 'inactive' } }
    );
    return { ok: false, message: 'Business subscription expired. Please renew payment.' };
  }
  return { ok: true };
}

/**
 * After successful business-fee payment: activate subscription and promote to
 * role=business only then (pendingBusinessProfile → businessProfile).
 */
async function activatePaidBusinessAccount(userId, session = null) {
  const query = User.findById(userId);
  const doc = session ? await query.session(session) : await query;
  if (!doc) return null;

  const now = new Date();
  const $set = {
    subscriptionStatus: 'active',
    subscriptionStartedAt: doc.subscriptionStartedAt || now,
    subscriptionExpiresAt: new Date(now.getTime() + getSubscriptionPeriodMs()),
    subscriptionExpiryReminderSentAt: null,
  };
  const $unset = {};

  const pending = doc.pendingBusinessProfile
    ? (doc.pendingBusinessProfile.toObject?.() || doc.pendingBusinessProfile)
    : null;

  if (doc.role !== 'business' || pending) {
    $set.role = 'business';
    if (pending && typeof pending === 'object') {
      $set.businessProfile = {
        ...pending,
        rating: pending.rating ?? 3.5,
        reviewsCount: pending.reviewsCount ?? 0,
      };
      $unset.pendingBusinessProfile = 1;
    }
  }

  const update = { $set };
  if (Object.keys($unset).length) update.$unset = $unset;

  const opts = session ? { session, new: true } : { new: true };
  return User.findByIdAndUpdate(userId, update, opts);
}

module.exports = {
  getSubscriptionPeriodDays,
  getSubscriptionPeriodMs,
  expireDueSubscriptions,
  notifyExpiringTomorrow,
  startSubscriptionMaintenance,
  assertBusinessSubscriptionActive,
  activatePaidBusinessAccount,
};
