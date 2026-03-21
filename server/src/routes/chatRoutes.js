const express = require('express');
const {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
} = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', requireAuth, getConversations);
router.post('/conversations', requireAuth, createOrGetConversation);
router.get('/conversations/:id/messages', requireAuth, getMessages);
router.post('/conversations/:id/messages', requireAuth, sendMessage);
router.patch('/conversations/:id/messages/:messageId', requireAuth, editMessage);
router.delete('/conversations/:id/messages/:messageId', requireAuth, deleteMessage);

module.exports = router;
