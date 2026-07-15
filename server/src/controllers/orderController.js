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
  return res.status(403).json({
    message: 'Orders can only be created through checkout payment',
  });
}

module.exports = {
  getMyOrders,
  getOrderById,
  createOrder,
};

