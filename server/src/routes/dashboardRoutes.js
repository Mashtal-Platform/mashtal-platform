const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getBusinessDashboard } = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard/business/:businessId?period=week|month|year
// Business can only access its own analytics.
router.get('/business/:businessId', requireAuth, getBusinessDashboard);

module.exports = router;

