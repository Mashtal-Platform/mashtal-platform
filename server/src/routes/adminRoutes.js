const express = require('express');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getOverview,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  listBusinesses,
  listTransactions,
  listSubscriptions,
  notifyExpiringSubscriptions,
} = require('../controllers/adminController');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));

router.get('/overview', getOverview);
router.get('/users', listUsers);
router.post('/users', createUser);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/businesses', listBusinesses);
router.get('/transactions', listTransactions);
router.get('/subscriptions', listSubscriptions);
router.post('/subscriptions/notify-expiring', notifyExpiringSubscriptions);

module.exports = router;
