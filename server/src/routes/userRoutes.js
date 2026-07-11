const express = require('express');
const {
  getMe,
  updateMe,
  uploadAvatar,
  getUserById,
  getBusinesses,
  getBusinessById,
  rateBusiness,
  getBusinessReviews,
  updateBusinessReview,
  toggleReviewHelpful,
  getFollowers,
  getFollowing,
  followUser,
  unfollowUser,
  removeFollower,
} = require('../controllers/userController');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { uploadAvatar: uploadAvatarMiddleware } = require('../middleware/upload');

const router = express.Router();

router.get('/me', requireAuth, getMe);
router.put('/me', requireAuth, updateMe);
router.post(
  '/me/avatar',
  requireAuth,
  (req, res, next) => {
    uploadAvatarMiddleware(req, res, (err) => {
      if (err) return res.status(400).json({ message: err.message || 'Avatar upload failed' });
      next();
    });
  },
  uploadAvatar
);
router.delete('/me/followers/:id', requireAuth, removeFollower);

// Generic users
router.get('/:id', getUserById);
router.get('/:id/followers', getFollowers);
router.get('/:id/following', getFollowing);
router.post('/:id/follow', requireAuth, followUser);
router.delete('/:id/follow', requireAuth, unfollowUser);

// Businesses
router.get('/', getBusinesses); // when used under /api/businesses
router.get('/business/:id', getBusinessById);
router.get('/business/:id/reviews', optionalAuth, getBusinessReviews);
router.post('/business/:id/rate', requireAuth, rateBusiness);
router.patch('/business/:businessId/reviews/:reviewId', requireAuth, updateBusinessReview);
router.post('/business/:businessId/reviews/:reviewId/helpful', requireAuth, toggleReviewHelpful);

module.exports = router;

