const express = require('express');
const {
  getComments,
  createComment,
  toggleLikeComment,
  deleteComment,
  updateComment,
} = require('../controllers/commentController');
const { requireAuth, optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuth, getComments);
router.post('/', requireAuth, createComment);
router.post('/:id/like', requireAuth, toggleLikeComment);
router.delete('/:id', requireAuth, deleteComment);
router.patch('/:id', requireAuth, updateComment);

module.exports = router;

