const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getBusinessDashboard, getBusinessOrders, getProductSoldCounts } = require('../controllers/dashboardController');

const router = express.Router();

// More specific paths first
router.get('/business/:businessId/product-sold', requireAuth, getProductSoldCounts);
router.get('/business/:businessId/orders', requireAuth, getBusinessOrders);

// GET /api/dashboard/business/:businessId?period=week|month|year
router.get('/business/:businessId', requireAuth, getBusinessDashboard);

module.exports = router;

