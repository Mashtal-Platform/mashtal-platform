const express = require('express');
const {
  getMyNotifications,
  markAllAsRead,
  clearReadNotifications,
  clearAllNotifications,
  markOneAsRead,
} = require('../controllers/notificationController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, getMyNotifications);
router.post('/read-all', requireAuth, markAllAsRead);
router.post('/clear-read', requireAuth, clearReadNotifications);
router.post('/clear-all', requireAuth, clearAllNotifications);
router.post('/:id/read', requireAuth, markOneAsRead);

module.exports = router;

