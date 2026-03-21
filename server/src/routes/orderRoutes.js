const express = require('express');
const {
  getMyOrders,
  getOrderById,
  createOrder,
} = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getMyOrders);
router.get('/:id', requireAuth, getOrderById);
router.post('/', requireAuth, createOrder);

module.exports = router;

