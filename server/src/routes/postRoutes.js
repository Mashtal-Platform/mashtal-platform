const express = require('express');
const { getPosts, getPostById, createPost, toggleLikePost, incrementSharePost, updatePost, deletePost } = require('../controllers/postController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { uploadPostImage } = require('../middleware/upload');

const router = express.Router();

router.get('/', optionalAuth, getPosts);
router.get('/:id', optionalAuth, getPostById);
router.post(
  '/',
  requireAuth,
  (req, res, next) => {
    if (!req.is('multipart/form-data')) return next();
    uploadPostImage(req, res, (err) => {
      if (err) {
        return res.status(400).json({ message: err.message || 'Image upload failed' });
      }
      next();
    });
  },
  createPost
);
router.post('/:id/like', requireAuth, toggleLikePost);
router.post('/:id/share', optionalAuth, incrementSharePost);
router.patch('/:id', requireAuth, (req, res, next) => {
  if (req.is('multipart/form-data')) {
    return uploadPostImage(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || 'Image upload failed' });
      next();
    });
  }
  next();
}, updatePost);
router.delete('/:id', requireAuth, deletePost);

module.exports = router;

