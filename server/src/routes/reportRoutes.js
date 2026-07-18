const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  createBusinessReport,
  getMyBusinessReport,
  listReportReasons,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/reasons', listReportReasons);
router.get('/business/:businessId/mine', requireAuth, getMyBusinessReport);
router.post('/business/:businessId', requireAuth, createBusinessReport);

module.exports = router;
