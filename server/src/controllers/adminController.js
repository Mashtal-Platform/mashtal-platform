const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const MoneyTransaction = require('../models/MoneyTransaction');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SubscriptionPayment = require('../models/SubscriptionPayment');
const { BusinessReport } = require('../models/BusinessReport');

function shapeUser(u) {
  if (!u) return null;
  const id = u._id?.toString?.() || u.id;
  const bp = u.businessProfile || {};
  return {
    id,
    fullName: u.fullName || '',
    email: u.email || '',
    role: u.role,
    avatar: u.avatar || '',
    verified: !!u.verified,
    subscriptionStatus: u.subscriptionStatus || 'inactive',
    subscriptionStartedAt: u.subscriptionStartedAt || null,
    subscriptionExpiresAt: u.subscriptionExpiresAt || null,
    phone: u.phone || bp.phone || '',
    location: u.location || bp.location || '',
    companyName: bp.companyName || '',
    wishPhone: bp.wishPhone || '',
    wishAccountNumber: bp.wishAccountNumber || '',
    createdAt: u.createdAt,
  };
}

function shapeTransaction(t) {
  const id = t._id?.toString?.() || t.id;
  const from = t.fromUser;
  const to = t.toUser;
  const toBp = to?.businessProfile || {};
  const fromPhone =
    (from && (from.phone || from.businessProfile?.phone)) ||
    t.order?.shipping?.phone ||
    '';
  const toPhone =
    t.toWishPhone ||
    toBp.wishPhone ||
    toBp.phone ||
    (to && to.phone) ||
    '';
  return {
    id,
    type: t.type,
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    toLabel: t.toLabel || '',
    toWishPhone: toPhone || t.toWishPhone || '',
    toPhone: toPhone || '',
    toWishAccount: t.toWishAccount || '',
    stripePaymentIntentId: t.stripePaymentIntentId || '',
    legKey: t.legKey || '',
    paymentId: t.payment?._id?.toString?.() || t.payment?.toString?.() || t.payment || null,
    orderId: t.order?._id?.toString?.() || t.order?.toString?.() || t.order || null,
    createdAt: t.createdAt,
    fromUser: from
      ? {
          id: from._id?.toString?.() || from.id || from,
          fullName: from.fullName || '',
          email: from.email || '',
          phone: fromPhone || '',
        }
      : null,
    toUser: to
      ? {
          id: to._id?.toString?.() || to.id || to,
          fullName: to.fullName || toBp.companyName || '',
          email: to.email || '',
          phone: toPhone || '',
        }
      : null,
  };
}

async function getOverview(req, res) {
  try {
    const now = new Date();
    const days30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [
      usersCount,
      businessesCount,
      activeBusinesses,
      pendingSubscriptions,
      ordersCount,
      txAgg,
      recentUsers,
      dailyTx,
      monthlyMashtal,
      yearlyMashtal,
      expiringSoon,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: 'business' }),
      User.countDocuments({ role: 'business', subscriptionStatus: 'active' }),
      SubscriptionPayment.countDocuments({ status: { $in: ['processing', 'initiated'] } }),
      Order.countDocuments(),
      MoneyTransaction.aggregate([
        { $match: { status: 'succeeded' } },
        {
          $group: {
            _id: '$type',
            total: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
      User.find({ createdAt: { $gte: days30 } })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
      MoneyTransaction.aggregate([
        {
          $match: {
            status: 'succeeded',
            createdAt: { $gte: days30 },
            type: { $in: ['order_tax', 'business_subscription'] },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            volume: { $sum: '$amount' },
            tax: {
              $sum: { $cond: [{ $eq: ['$type', 'order_tax'] }, '$amount', 0] },
            },
            fees: {
              $sum: { $cond: [{ $eq: ['$type', 'business_subscription'] }, '$amount', 0] },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MoneyTransaction.aggregate([
        {
          $match: {
            status: 'succeeded',
            type: { $in: ['order_tax', 'business_subscription'] },
            createdAt: { $gte: new Date(now.getFullYear() - 1, now.getMonth(), 1) },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            tax: {
              $sum: { $cond: [{ $eq: ['$type', 'order_tax'] }, '$amount', 0] },
            },
            fees: {
              $sum: { $cond: [{ $eq: ['$type', 'business_subscription'] }, '$amount', 0] },
            },
            total: { $sum: '$amount' },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      MoneyTransaction.aggregate([
        {
          $match: {
            status: 'succeeded',
            type: { $in: ['order_tax', 'business_subscription'] },
            createdAt: { $gte: yearStart },
          },
        },
        {
          $group: {
            _id: null,
            tax: {
              $sum: { $cond: [{ $eq: ['$type', 'order_tax'] }, '$amount', 0] },
            },
            fees: {
              $sum: { $cond: [{ $eq: ['$type', 'business_subscription'] }, '$amount', 0] },
            },
            total: { $sum: '$amount' },
          },
        },
      ]),
      User.countDocuments({
        role: 'business',
        subscriptionStatus: 'active',
        subscriptionExpiresAt: {
          $gte: now,
          $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    ]);

    const byType = {};
    for (const row of txAgg) {
      byType[row._id] = { total: row.total, count: row.count };
    }

    const revenueTax = byType.order_tax?.total || 0;
    const revenueFees = byType.business_subscription?.total || 0;
    const yearRow = yearlyMashtal[0] || { tax: 0, fees: 0, total: 0 };

    res.json({
      usersCount,
      businessesCount,
      activeBusinesses,
      pendingSubscriptions,
      ordersCount,
      expiringSoonCount: expiringSoon,
      revenueTax,
      revenueFees,
      mashtalIncomeTotal: revenueTax + revenueFees,
      mashtalIncomeYear: yearRow.total || 0,
      mashtalIncomeYearTax: yearRow.tax || 0,
      mashtalIncomeYearFees: yearRow.fees || 0,
      gmvSellers: byType.order_seller?.total || 0,
      transactionCounts: byType,
      recentUsers: recentUsers.map(shapeUser),
      volumeByDay: dailyTx.map((d) => ({
        date: d._id,
        volume: d.volume,
        tax: d.tax,
        fees: d.fees,
        count: d.count,
      })),
      mashtalIncomeByMonth: monthlyMashtal.map((m) => ({
        month: m._id,
        tax: m.tax,
        fees: m.fees,
        total: m.total,
      })),
    });
  } catch (err) {
    console.error('[Admin] getOverview error:', err);
    res.status(500).json({ message: 'Failed to load overview' });
  }
}

async function listUsers(req, res) {
  try {
    const { role, search, limit = 50, skip = 0 } = req.query || {};
    const filter = {};
    if (role) filter.role = String(role);
    if (search && String(search).trim()) {
      const term = String(search).trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ fullName: regex }, { email: regex }, { 'businessProfile.companyName': regex }];
    }
    const [users, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(Math.max(0, Number(skip) || 0))
        .limit(Math.min(100, Number(limit) || 50))
        .lean(),
      User.countDocuments(filter),
    ]);
    res.json({ users: users.map(shapeUser), total });
  } catch (err) {
    console.error('[Admin] listUsers error:', err);
    res.status(500).json({ message: 'Failed to list users' });
  }
}

async function createUser(req, res) {
  try {
    const { fullName, email, password, role = 'visitor' } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }
    if (!['visitor', 'business', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }
    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(String(password), 10);
    const user = await User.create({
      fullName: String(fullName).trim(),
      email: String(email).trim().toLowerCase(),
      passwordHash,
      role,
      subscriptionStatus: role === 'business' ? 'inactive' : undefined,
      verified: true,
    });
    res.status(201).json(shapeUser(user.toJSON ? user.toJSON() : user));
  } catch (err) {
    console.error('[Admin] createUser error:', err);
    res.status(500).json({ message: 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};
    if (body.fullName != null) updates.fullName = String(body.fullName);
    if (body.role != null && ['visitor', 'business', 'admin'].includes(body.role)) {
      updates.role = body.role;
    }
    if (body.subscriptionStatus != null && ['active', 'inactive'].includes(body.subscriptionStatus)) {
      updates.subscriptionStatus = body.subscriptionStatus;
      if (body.subscriptionStatus === 'active') {
        const { getSubscriptionPeriodMs } = require('../utils/subscription');
        const existing = await User.findById(id).select('subscriptionStartedAt').lean();
        updates.subscriptionStartedAt =
          existing?.subscriptionStartedAt || new Date();
        updates.subscriptionExpiresAt = new Date(Date.now() + getSubscriptionPeriodMs());
        updates.subscriptionExpiryReminderSentAt = null;
      }
    }
    if (body.verified != null) updates.verified = !!body.verified;
    if (body.phone != null) updates.phone = String(body.phone);
    if (body.businessProfile) {
      for (const key of ['companyName', 'wishPhone', 'wishAccountNumber', 'phone', 'location', 'bio']) {
        if (body.businessProfile[key] != null) {
          updates[`businessProfile.${key}`] = String(body.businessProfile[key]);
        }
      }
    }
    if (body.password) {
      updates.passwordHash = await bcrypt.hash(String(body.password), 10);
    }

    const user = await User.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(shapeUser(user));
  } catch (err) {
    console.error('[Admin] updateUser error:', err);
    res.status(500).json({ message: 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ message: 'You cannot delete your own admin account' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ ok: true, id });
  } catch (err) {
    console.error('[Admin] deleteUser error:', err);
    res.status(500).json({ message: 'Failed to delete user' });
  }
}

async function listBusinesses(req, res) {
  try {
    const { status, search } = req.query || {};
    const filter = { role: 'business' };
    if (status === 'active' || status === 'inactive') {
      filter.subscriptionStatus = status;
    }
    if (search && String(search).trim()) {
      const term = String(search).trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ fullName: regex }, { email: regex }, { 'businessProfile.companyName': regex }];
    }
    const businesses = await User.find(filter).sort({ createdAt: -1 }).limit(100).lean();
    const ids = businesses.map((b) => b._id);
    const pendingFees = await SubscriptionPayment.find({
      user: { $in: ids },
      status: { $in: ['processing', 'initiated'] },
    })
      .sort({ createdAt: -1 })
      .lean();
    const pendingByUser = new Map();
    for (const p of pendingFees) {
      const uid = p.user.toString();
      if (!pendingByUser.has(uid)) pendingByUser.set(uid, p);
    }

    const reportCounts = ids.length
      ? await BusinessReport.aggregate([
          { $match: { business: { $in: ids } } },
          {
            $group: {
              _id: '$business',
              reportsCount: { $sum: 1 },
              pendingReportsCount: {
                $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] },
              },
            },
          },
        ])
      : [];
    const reportsByBusiness = new Map(
      reportCounts.map((row) => [
        String(row._id),
        {
          reportsCount: row.reportsCount || 0,
          pendingReportsCount: row.pendingReportsCount || 0,
        },
      ])
    );

    res.json({
      businesses: businesses.map((b) => {
        const shaped = shapeUser(b);
        const pending = pendingByUser.get(String(b._id));
        const counts = reportsByBusiness.get(String(b._id)) || {
          reportsCount: 0,
          pendingReportsCount: 0,
        };
        return {
          ...shaped,
          pendingSubscriptionPaymentId: pending?._id?.toString() || null,
          pendingSubscriptionStatus: pending?.status || null,
          reportsCount: counts.reportsCount,
          pendingReportsCount: counts.pendingReportsCount,
        };
      }),
    });
  } catch (err) {
    console.error('[Admin] listBusinesses error:', err);
    res.status(500).json({ message: 'Failed to list businesses' });
  }
}

async function listTransactions(req, res) {
  try {
    const { type, status, limit = 80, skip = 0 } = req.query || {};
    const filter = {};
    if (type) filter.type = String(type);
    if (status) filter.status = String(status);

    const [rows, total] = await Promise.all([
      MoneyTransaction.find(filter)
        .sort({ createdAt: -1 })
        .skip(Math.max(0, Number(skip) || 0))
        .limit(Math.min(200, Number(limit) || 80))
        .populate('fromUser', 'fullName email phone businessProfile.phone')
        .populate(
          'toUser',
          'fullName email phone businessProfile.companyName businessProfile.phone businessProfile.wishPhone'
        )
        .populate({
          path: 'order',
          populate: { path: 'items.product', select: 'name price' },
        })
        .lean(),
      MoneyTransaction.countDocuments(filter),
    ]);

    const shaped = rows.map(shapeTransaction);

    // Group legs that belong to the same payment (or same stripe intent / timestamp+buyer)
    const groupsMap = new Map();
    for (let i = 0; i < rows.length; i++) {
      const raw = rows[i];
      const shapedRow = shaped[i];
      const groupKey =
        (raw.payment && String(raw.payment._id || raw.payment)) ||
        (raw.subscriptionPayment && String(raw.subscriptionPayment._id || raw.subscriptionPayment)) ||
        (raw.stripePaymentIntentId
          ? `pi:${raw.stripePaymentIntentId}`
          : `solo:${shapedRow.id}`);

      if (!groupsMap.has(groupKey)) {
        const order = raw.order;
        const items = Array.isArray(order?.items)
          ? order.items.map((it) => ({
              name: it.product?.name || 'Product',
              quantity: it.quantity,
              priceAtPurchase: it.priceAtPurchase,
            }))
          : [];
        const buyerPhone =
          shapedRow.fromUser?.phone ||
          raw.fromUser?.phone ||
          raw.fromUser?.businessProfile?.phone ||
          order?.shipping?.phone ||
          '';
        groupsMap.set(groupKey, {
          id: groupKey,
          createdAt: shapedRow.createdAt,
          buyer: shapedRow.fromUser
            ? {
                ...shapedRow.fromUser,
                phone: buyerPhone,
              }
            : null,
          orderId: shapedRow.orderId,
          items,
          legs: [],
          amountTotal: 0,
          mashtalIncome: 0,
        });
      }
      const g = groupsMap.get(groupKey);
      g.legs.push(shapedRow);
      g.amountTotal += Number(shapedRow.amount) || 0;
      if (shapedRow.type === 'order_tax' || shapedRow.type === 'business_subscription') {
        g.mashtalIncome += Number(shapedRow.amount) || 0;
      }
      const orderPhone = raw.order?.shipping?.phone;
      if (!g.buyer?.phone && orderPhone) {
        g.buyer = { ...(g.buyer || {}), phone: orderPhone };
      }
      if ((!g.items || g.items.length === 0) && Array.isArray(raw.order?.items)) {
        g.items = raw.order.items.map((it) => ({
          name: it.product?.name || 'Product',
          quantity: it.quantity,
          priceAtPurchase: it.priceAtPurchase,
        }));
        g.orderId = g.orderId || shapedRow.orderId;
      }
    }

    // Backfill missing buyer phones from User docs, then stamp onto every leg
    const missingBuyerIds = [
      ...new Set(
        Array.from(groupsMap.values())
          .filter((g) => g.buyer?.id && !g.buyer.phone)
          .map((g) => g.buyer.id)
      ),
    ];
    if (missingBuyerIds.length) {
      const buyers = await User.find({ _id: { $in: missingBuyerIds } })
        .select('phone businessProfile.phone')
        .lean();
      const phoneById = new Map(
        buyers.map((u) => [
          String(u._id),
          u.phone || u.businessProfile?.phone || '',
        ])
      );
      for (const g of groupsMap.values()) {
        if (g.buyer?.id && !g.buyer.phone) {
          const phone = phoneById.get(String(g.buyer.id)) || '';
          if (phone) g.buyer.phone = phone;
        }
      }
    }

    for (const g of groupsMap.values()) {
      const buyerPhone = g.buyer?.phone || '';
      for (const leg of g.legs) {
        if (leg.fromUser && buyerPhone) {
          leg.fromUser.phone = leg.fromUser.phone || buyerPhone;
        }
      }
    }

    const groups = Array.from(groupsMap.values()).sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    res.json({
      transactions: shaped,
      groups,
      total,
    });
  } catch (err) {
    console.error('[Admin] listTransactions error:', err);
    res.status(500).json({ message: 'Failed to list transactions' });
  }
}

async function listSubscriptions(req, res) {
  try {
    const { status } = req.query || {};
    const filter = { role: 'business' };
    if (status === 'active' || status === 'inactive') {
      filter.subscriptionStatus = status;
    }
    const businesses = await User.find(filter)
      .sort({ subscriptionExpiresAt: 1, createdAt: -1 })
      .limit(200)
      .lean();

    const now = Date.now();
    const periodDays = Number(process.env.BUSINESS_SUBSCRIPTION_DAYS) || 60;

    res.json({
      periodDays,
      subscriptions: businesses.map((b) => {
        const shaped = shapeUser(b);
        const expires = b.subscriptionExpiresAt ? new Date(b.subscriptionExpiresAt).getTime() : null;
        const started = b.subscriptionStartedAt ? new Date(b.subscriptionStartedAt).getTime() : null;
        let daysRemaining = null;
        if (expires) {
          daysRemaining = Math.ceil((expires - now) / (24 * 60 * 60 * 1000));
        }
        let monthsActive = null;
        if (started) {
          monthsActive = Math.max(
            0,
            (now - started) / (30.4375 * 24 * 60 * 60 * 1000)
          );
        }
        return {
          ...shaped,
          daysRemaining,
          monthsActive: monthsActive != null ? Number(monthsActive.toFixed(1)) : null,
          expiresSoon: daysRemaining != null && daysRemaining >= 0 && daysRemaining <= 7,
        };
      }),
    });
  } catch (err) {
    console.error('[Admin] listSubscriptions error:', err);
    res.status(500).json({ message: 'Failed to list subscriptions' });
  }
}

async function notifyExpiringSubscriptions(req, res) {
  try {
    const { notifyExpiringTomorrow } = require('../utils/subscription');
    const result = await notifyExpiringTomorrow();
    res.json({
      message: `Sent ${result.sent} renewal reminder(s) to businesses expiring within ~24h`,
      ...result,
    });
  } catch (err) {
    console.error('[Admin] notifyExpiringSubscriptions error:', err);
    res.status(500).json({ message: 'Failed to send expiry notifications' });
  }
}

async function listOrders(req, res) {
  try {
    const Order = require('../models/Order');
    const {
      shapeOrders,
      normalizeOrderStatus,
      ORDER_STATUSES,
    } = require('./orderController');
    const { status, limit = 100, skip = 0 } = req.query || {};

    const filter = {};
    if (status && String(status) !== 'all') {
      const s = normalizeOrderStatus(status);
      if (ORDER_STATUSES.includes(s)) {
        // Include legacy aliases so older docs still match
        if (s === 'ready') filter.status = { $in: ['ready', 'shipped'] };
        else if (s === 'completed') filter.status = { $in: ['completed', 'delivered'] };
        else if (s === 'cancelled') filter.status = { $in: ['cancelled', 'canceled'] };
        else filter.status = s;
      }
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip(Number(skip) || 0)
        .limit(Math.min(Number(limit) || 100, 200))
        .populate('user', 'fullName email phone')
        .populate('items.product')
        .lean(),
      Order.countDocuments(filter),
    ]);

    const shaped = await shapeOrders(orders);
    const withBuyer = shaped.map((o, i) => {
      const raw = orders[i];
      const u = raw?.user || {};
      return {
        ...o,
        buyer: u._id
          ? {
              id: String(u._id),
              fullName: u.fullName || '',
              email: u.email || '',
              phone: u.phone || '',
            }
          : null,
      };
    });

    res.json({ orders: withBuyer, total, statuses: ORDER_STATUSES });
  } catch (err) {
    console.error('[Admin] listOrders error:', err);
    res.status(500).json({ message: 'Failed to list orders' });
  }
}

async function updateOrderStatus(req, res) {
  try {
    const Order = require('../models/Order');
    const Notification = require('../models/Notification');
    const Product = require('../models/Product');
    const {
      shapeOrders,
      normalizeOrderStatus,
      ORDER_STATUSES,
    } = require('./orderController');
    const {
      CANCEL_FEE_PERCENT,
      CANCEL_REFUND_PERCENT,
      isCancellableStatus,
    } = require('../utils/orderStatus');

    const { status } = req.body || {};
    const next = normalizeOrderStatus(status);
    if (!ORDER_STATUSES.includes(next)) {
      return res.status(400).json({
        message: `status must be one of: ${ORDER_STATUSES.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const prev = normalizeOrderStatus(order.status);
    if (prev === next) {
      const shaped = (await shapeOrders([order.toObject()]))[0];
      return res.json({ order: shaped });
    }

    order.status = next;
    order.statusUpdatedBy = req.user.id;
    order.statusUpdatedAt = new Date();

    if (next === 'cancelled' && prev !== 'cancelled') {
      order.cancelledBy = 'admin';
      order.cancelledAt = new Date();
      order.cancelFeePercent = CANCEL_FEE_PERCENT;
      order.cancelRefundPercent = CANCEL_REFUND_PERCENT;
      // Restock when admin cancels
      for (const item of order.items || []) {
        const productId = item.product?._id || item.product;
        if (!productId) continue;
        await Product.updateOne(
          { _id: productId },
          { $inc: { stock: Number(item.quantity) || 0 } }
        );
      }
    }

    await order.save();

    // Notify buyer of status change
    if (order.user) {
      await Notification.create({
        recipient: order.user,
        sender: req.user.id,
        type: 'order_status_updated',
        entityId: order._id,
        message:
          next === 'cancelled'
            ? `Your order was cancelled by admin. A ${CANCEL_FEE_PERCENT}% fee applies; ${CANCEL_REFUND_PERCENT}% will be refunded.`
            : `Your order status is now: ${next}.`,
      });
    }

    const shaped = (await shapeOrders([order.toObject()]))[0];
    res.json({ order: shaped });
  } catch (err) {
    console.error('[Admin] updateOrderStatus error:', err);
    res.status(500).json({ message: 'Failed to update order status' });
  }
}

module.exports = {
  getOverview,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listBusinesses,
  listTransactions,
  listSubscriptions,
  notifyExpiringSubscriptions,
  listOrders,
  updateOrderStatus,
};
