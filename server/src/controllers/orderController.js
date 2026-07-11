const Order = require('../models/Order');
const { Types } = require('mongoose');

async function getMyOrders(req, res) {
  try {
    const userId = req.user.id;

    const orders = await Order.find({ user: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .populate('items.product')
      .lean();

    res.json(orders);
  } catch (err) {
    console.error('[Orders] getMyOrders error:', err);
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
}

async function getOrderById(req, res) {
  try {
    const userId = req.user.id;

    const order = await Order.findOne({
      _id: req.params.id,
      user: new Types.ObjectId(userId),
    })
      .populate('items.product')
      .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (err) {
    console.error('[Orders] getOrderById error:', err);
    res.status(500).json({ message: 'Failed to fetch order' });
  }
}

async function createOrder(req, res) {
  try {
    const userId = req.user.id;

    const { items } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const normalizedItems = items.map((item) => ({
      product: new Types.ObjectId(item.productId),
      quantity: item.quantity,
      priceAtPurchase: item.price,
    }));

    const total = normalizedItems.reduce(
      (sum, it) => sum + it.quantity * it.priceAtPurchase,
      0
    );

    const order = await Order.create({
      user: new Types.ObjectId(userId),
      items: normalizedItems,
      status: 'processing',
      total,
    });

    const populated = await Order.findById(order._id)
      .populate('items.product')
      .lean();

    res.status(201).json(populated);
  } catch (err) {
    console.error('[Orders] createOrder error:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
}

module.exports = {
  getMyOrders,
  getOrderById,
  createOrder,
};

