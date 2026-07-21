const express = require('express');
const {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
  getSupportAdmin,
  getOrCreateSupportConversation,
  blockUser,
  unblockUser,
  getBlockStatus,
} = require('../controllers/chatController');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/conversations', requireAuth, getConversations);
router.get('/support-admin', requireAuth, getSupportAdmin);
router.post('/support', requireAuth, getOrCreateSupportConversation);
router.post('/conversations', requireAuth, createOrGetConversation);
router.get('/conversations/:id/messages', requireAuth, getMessages);
router.post('/conversations/:id/messages', requireAuth, sendMessage);
router.patch('/conversations/:id/messages/:messageId', requireAuth, editMessage);
router.delete('/conversations/:id/messages/:messageId', requireAuth, deleteMessage);
router.get('/block-status/:participantId', requireAuth, getBlockStatus);
router.post('/block/:participantId', requireAuth, blockUser);
router.delete('/block/:participantId', requireAuth, unblockUser);

module.exports = router;
