const express = require('express');
const { getThreads, getThreadById, createThread, toggleLikeThread, incrementShareThread, updateThread, deleteThread } = require('../controllers/threadController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getThreads);
router.get('/:id', optionalAuth, getThreadById);
router.post('/', requireAuth, createThread);
router.post('/:id/like', requireAuth, toggleLikeThread);
router.post('/:id/share', optionalAuth, incrementShareThread);
router.patch('/:id', requireAuth, updateThread);
router.put('/:id', requireAuth, updateThread);
router.delete('/:id', requireAuth, deleteThread);

module.exports = router;

