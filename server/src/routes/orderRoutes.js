const express = require('express');
const {
  getMyOrders,
  getOrderById,
  createOrder,
  cancelMyOrder,
  markOrderReady,
} = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getMyOrders);
router.get('/:id', requireAuth, getOrderById);
router.post('/', requireAuth, createOrder);
router.post('/:id/cancel', requireAuth, cancelMyOrder);
router.patch('/:id/ready', requireAuth, markOrderReady);

module.exports = router;
