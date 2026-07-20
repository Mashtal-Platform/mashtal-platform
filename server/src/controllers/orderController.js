const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Payment = require('../models/Payment');
const { Types } = require('mongoose');
const {
  ORDER_STATUSES,
  normalizeOrderStatus,
  isCancellableStatus,
  canBusinessMarkReady,
  CANCEL_FEE_PERCENT,
  CANCEL_REFUND_PERCENT,
} = require('../utils/orderStatus');

function shapeProduct(product, businessMap) {
  if (!product) {
    return {
      id: '',
      name: 'Unknown product',
      image: '',
      category: 'other',
      price: 0,
      businessId: '',
      businessName: 'Business',
    };
  }
  const id = product._id ? String(product._id) : String(product.id || '');
  const businessRef = product.business;
  const businessId =
    businessRef && businessRef._id
      ? String(businessRef._id)
      : businessRef
        ? String(businessRef)
        : '';
  const biz = businessId && businessMap[businessId] ? businessMap[businessId] : null;
  return {
    id,
    name: product.name || 'Product',
    description: product.description || '',
    image: product.image || '',
    category: product.category || 'other',
    price: Number(product.price) || 0,
    businessId,
    businessName:
      (biz && (biz.companyName || biz.fullName)) ||
      (businessRef && businessRef.businessProfile && businessRef.businessProfile.companyName) ||
      (businessRef && businessRef.fullName) ||
      'Business',
  };
}

async function buildBusinessMap(products) {
  const ids = [
    ...new Set(
      products
        .map((p) => {
          if (!p || !p.business) return null;
          if (p.business._id) return String(p.business._id);
          return String(p.business);
        })
        .filter(Boolean)
    ),
  ];
  if (!ids.length) return {};
  const users = await User.find({ _id: { $in: ids } })
    .select('fullName businessProfile.companyName')
    .lean();
  const map = {};
  users.forEach((u) => {
    map[String(u._id)] = {
      fullName: u.fullName,
      companyName: u.businessProfile?.companyName,
    };
  });
  return map;
}

async function shapeOrders(orders) {
  const products = [];
  for (const o of orders) {
    for (const item of o.items || []) {
      if (item.product && typeof item.product === 'object') products.push(item.product);
    }
  }
  const businessMap = await buildBusinessMap(products);

  return orders.map((o) => ({
    id: String(o._id),
    status: normalizeOrderStatus(o.status),
    total: Number(o.total) || 0,
    createdAt: o.createdAt,
    updatedAt: o.updatedAt,
    shipping: o.shipping || null,
    cancelledBy: o.cancelledBy || null,
    cancelledAt: o.cancelledAt || null,
    cancelFeePercent: o.cancelFeePercent ?? null,
    cancelRefundPercent: o.cancelRefundPercent ?? null,
    items: (o.items || []).map((item) => ({
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
      product: shapeProduct(
        item.product && typeof item.product === 'object' ? item.product : null,
        businessMap
      ),
    })),
  }));
}

async function getSellerIdsForOrder(order) {
  const productIds = (order.items || [])
    .map((i) => i.product)
    .filter(Boolean)
    .map((p) => (p._id ? p._id : p));
  if (!productIds.length) return [];
  const products = await Product.find({ _id: { $in: productIds } }).select('business').lean();
  return [...new Set(products.map((p) => String(p.business)).filter(Boolean))];
}

async function notifyOrderCancelled({ order, buyerId, buyerName }) {
  const sellerIds = await getSellerIdsForOrder(order);
  const admins = await User.find({ role: 'admin' }).select('_id').lean();
  const recipients = [
    ...sellerIds.map((id) => ({ id, type: 'order_cancelled' })),
    ...admins.map((a) => ({ id: String(a._id), type: 'order_cancelled_admin' })),
  ];

  const docs = [];
  for (const r of recipients) {
    if (String(r.id) === String(buyerId)) continue;
    docs.push({
      recipient: new Types.ObjectId(r.id),
      sender: new Types.ObjectId(buyerId),
      type: r.type,
      entityId: order._id,
      message: '',
    });
  }
  if (docs.length) await Notification.insertMany(docs);
  return { sellers: sellerIds.length, admins: admins.length };
}

async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('items.product')
      .lean();

    res.json(await shapeOrders(orders));
  } catch (err) {
    console.error('[Orders] getMyOrders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

async function getOrderById(req, res) {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    const filter = { _id: req.params.id };
    if (!isAdmin) filter.user = new Types.ObjectId(userId);

    const order = await Order.findOne(filter).populate('items.product').lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const shaped = (await shapeOrders([order]))[0];
    res.json(shaped);
  } catch (err) {
    console.error('[Orders] getOrderById error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
}

async function createOrder(req, res) {
  return res.status(403).json({
    message: 'Orders can only be created through checkout payment',
  });
}

/**
 * Buyer cancels order (pending/processing only).
 * Records 25% fee / 75% refund policy and notifies sellers + admins.
 */
async function cancelMyOrder(req, res) {
  try {
    const userId = req.user.id;
    const order = await Order.findOne({
      _id: req.params.id,
      user: new Types.ObjectId(userId),
    }).populate('items.product');

    if (!order) return res.status(404).json({ message: 'Order not found' });

    const current = normalizeOrderStatus(order.status);
    if (!isCancellableStatus(current)) {
      return res.status(400).json({
        message: 'This order can no longer be cancelled.',
      });
    }
    if (current === 'cancelled') {
      return res.status(400).json({ message: 'Order is already cancelled.' });
    }

    order.status = 'cancelled';
    order.cancelledBy = 'buyer';
    order.cancelledAt = new Date();
    order.cancelFeePercent = CANCEL_FEE_PERCENT;
    order.cancelRefundPercent = CANCEL_REFUND_PERCENT;
    order.statusUpdatedBy = new Types.ObjectId(userId);
    order.statusUpdatedAt = new Date();
    await order.save();

    const buyer = await User.findById(userId).select('fullName').lean();
    await notifyOrderCancelled({
      order,
      buyerId: userId,
      buyerName: buyer?.fullName || 'A buyer',
    });

    // Restock products
    for (const item of order.items || []) {
      const productId = item.product?._id || item.product;
      if (!productId) continue;
      await Product.updateOne(
        { _id: productId },
        { $inc: { stock: Number(item.quantity) || 0 } }
      );
    }

    const shaped = (await shapeOrders([order.toObject()]))[0];
    res.json({
      order: shaped,
      message: `Order cancelled. A ${CANCEL_FEE_PERCENT}% cancellation fee applies; ${CANCEL_REFUND_PERCENT}% will be returned.`,
      cancelFeePercent: CANCEL_FEE_PERCENT,
      cancelRefundPercent: CANCEL_REFUND_PERCENT,
    });
  } catch (err) {
    console.error('[Orders] cancelMyOrder error:', err);
    res.status(500).json({ message: 'Failed to cancel order' });
  }
}

/**
 * Business marks order as ready (waiting for delivery).
 * Allowed from pending or processing → ready.
 */
async function markOrderReady(req, res) {
  try {
    if (req.user?.role !== 'business') {
      return res.status(403).json({ message: 'Only businesses can mark orders ready' });
    }

    const businessId = String(req.user.id);
    const order = await Order.findById(req.params.id).populate('items.product');
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const sellerIds = await getSellerIdsForOrder(order);
    if (!sellerIds.includes(businessId)) {
      return res.status(403).json({ message: 'This order does not include your products' });
    }

    const current = normalizeOrderStatus(order.status);
    if (!canBusinessMarkReady(current)) {
      return res.status(400).json({
        message: `Cannot mark as ready from status "${current}". Only pending or processing orders can be marked ready.`,
      });
    }

    order.status = 'ready';
    order.statusUpdatedBy = new Types.ObjectId(businessId);
    order.statusUpdatedAt = new Date();
    await order.save();

    if (order.user) {
      await Notification.create({
        recipient: order.user,
        sender: new Types.ObjectId(businessId),
        type: 'order_status_updated',
        entityId: order._id,
        message: 'Your order is ready and waiting for delivery.',
      });
    }

    // Notify admins so they can arrange / track delivery
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (admins.length) {
      await Notification.insertMany(
        admins.map((a) => ({
          recipient: a._id,
          sender: new Types.ObjectId(businessId),
          type: 'order_ready_admin',
          entityId: order._id,
          message: '',
        }))
      );
    }

    const shaped = (await shapeOrders([order.toObject()]))[0];
    res.json({ order: shaped, status: 'ready' });
  } catch (err) {
    console.error('[Orders] markOrderReady error:', err);
    res.status(500).json({ message: 'Failed to mark order ready' });
  }
}

module.exports = {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelMyOrder,
  markOrderReady,
  shapeOrders,
  normalizeOrderStatus,
  ORDER_STATUSES,
  isCancellableStatus,
  canBusinessMarkReady,
  CANCEL_FEE_PERCENT,
  CANCEL_REFUND_PERCENT,
};
