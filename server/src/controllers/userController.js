const User = require('../models/User');
const Follow = require('../models/Follow');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const {
  isValidPhone,
  normalizeBusinessProfile,
  validateBusinessProfile,
} = require('../utils/businessProfile');
const { respondIfUnsafe } = require('../utils/assertContentSafe');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
}

async function getMe(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('[Users] getMe error:', err);
    res.status(500).json({ message: 'Failed to fetch current user' });
  }
}

async function updateMe(req, res) {
  try {
    const updates = req.body || {};
    delete updates.passwordHash;
    delete updates.password;
    delete updates.email;
    delete updates.role;

    const phoneFields = [
      updates.phone,
      updates.businessProfile?.phone,
      updates.businessProfile?.wishPhone,
      updates.professionalProfile?.phone,
    ].filter(Boolean);
    for (const p of phoneFields) {
      if (!isValidPhone(p)) {
        return res.status(400).json({
          message: 'Phone must be a valid number with country code (e.g. +961 70 123 456). Only digits, +, spaces and dashes allowed.',
        });
      }
    }

    if (updates.businessProfile && typeof updates.businessProfile === 'object') {
      const existing = await User.findById(req.user.id).lean();
      if (!existing) return res.status(404).json({ message: 'User not found' });
      if (existing.role === 'business') {
        const merged = {
          ...(existing.businessProfile || {}),
          ...updates.businessProfile,
        };
        const errMsg = validateBusinessProfile(merged, { requireAll: true });
        if (errMsg) return res.status(400).json({ message: errMsg });
        const normalized = normalizeBusinessProfile(merged);
        updates.businessProfile = {
          ...merged,
          ...normalized,
          rating: existing.businessProfile?.rating ?? 3.5,
          reviewsCount: existing.businessProfile?.reviewsCount ?? 0,
          hours: updates.businessProfile.hours ?? existing.businessProfile?.hours,
          about: updates.businessProfile.about ?? existing.businessProfile?.about,
        };
      }
    }

    const profileText = [
      updates.bio,
      updates.fullName,
      updates.businessProfile?.about,
      updates.businessProfile?.companyName,
      updates.professionalProfile?.bio,
      updates.professionalProfile?.about,
    ].filter(Boolean);
    if (profileText.length) {
      const allowed = await respondIfUnsafe(res, { text: profileText });
      if (!allowed) return;
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Users] updateMe error:', err);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

async function uploadAvatar(req, res) {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const { getRelativePath } = require('../middleware/upload');
    const avatarPath = getRelativePath('avatars', req.file.filename);
    const allowed = await respondIfUnsafe(res, { file: req.file, imagePath: avatarPath });
    if (!allowed) return;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { avatar: avatarPath } },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Users] uploadAvatar error:', err);
    res.status(500).json({ message: 'Failed to update avatar' });
  }
}

async function uploadCover(req, res) {
  try {
    if (!req.file || !req.file.filename) {
      return res.status(400).json({ message: 'No image file provided' });
    }
    const { getRelativePath } = require('../middleware/upload');
    const coverPath = getRelativePath('covers', req.file.filename);
    const allowed = await respondIfUnsafe(res, { file: req.file, imagePath: coverPath });
    if (!allowed) return;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { coverImage: coverPath } },
      { new: true }
    ).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('[Users] uploadCover error:', err);
    res.status(500).json({ message: 'Failed to update cover image' });
  }
}

async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const followers = user.followers || [];
    const following = user.following || [];
    const followersCount = Array.isArray(followers) ? followers.length : 0;
    const followingCount = Array.isArray(following) ? following.length : 0;
    res.json({
      id: user._id.toString(),
      _id: user._id,
      fullName: user.fullName || '',
      email: user.email || '',
      avatar: user.avatar || '',
      coverImage: user.coverImage || '',
      bio: user.bio || '',
      location: user.location || '',
      role: user.role || 'visitor',
      followersCount,
      followingCount,
      createdAt: user.createdAt,
      joinDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '',
    });
  } catch (err) {
    console.error('[Users] getUserById error:', err);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
}

async function getBusinesses(req, res) {
  try {
    const { search, roles } = req.query || {};
    const roleList = roles && typeof roles === 'string'
      ? roles.split(',').map((r) => r.trim()).filter(Boolean)
      : ['business'];
    const filter = { role: { $in: roleList } };
    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim();
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { fullName: regex },
        { 'businessProfile.companyName': regex },
      ];
    }
    const businesses = await User.find(filter).lean();
    const shaped = businesses.map((b) => {
      const bp = b.businessProfile || {};
      const followers = b.followers || [];
      const followersCount = Array.isArray(followers) ? followers.length : 0;
      return {
        id: b._id.toString(),
        fullName: b.fullName || '',
        companyName: bp.companyName || b.fullName || '',
        email: b.email || '',
        avatar: b.avatar || '',
        role: b.role || 'business',
        location: bp.location || b.location || '',
        bio: bp.bio || b.bio || '',
        verified: !!b.verified,
        rating: typeof bp.rating === 'number' ? bp.rating : 0,
        reviewsCount: typeof bp.reviewsCount === 'number' ? bp.reviewsCount : 0,
        followersCount,
        specialties: Array.isArray(bp.specialties) ? bp.specialties : [],
      };
    });
    res.json(shaped);
  } catch (err) {
    console.error('[Users] getBusinesses error:', err);
    res.status(500).json({ message: 'Failed to fetch businesses' });
  }
}

async function getBusinessById(req, res) {
  try {
    const { id } = req.params;
    const business = await User.findOne({
      $or: [{ _id: id }, { businessId: id }],
      role: 'business',
    }).lean();

    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const bp = business.businessProfile || {};
    const followers = business.followers || [];
    const followersCount = Array.isArray(followers) ? followers.length : 0;
    const aboutObj = bp.about && typeof bp.about === 'object' && !Array.isArray(bp.about)
      ? (bp.about.toObject ? bp.about.toObject() : bp.about)
      : {};

    const shaped = {
      id: business._id.toString(),
      fullName: business.fullName || '',
      companyName: bp.companyName || business.fullName || '',
      email: business.email || '',
      avatar: business.avatar || '',
      coverImage: business.coverImage || '',
      location: bp.location || business.location || '',
      bio: bp.bio || business.bio || '',
      phone: bp.phone || business.phone || '',
      wishPhone: bp.wishPhone || '',
      wishAccountNumber: bp.wishAccountNumber || '',
      subscriptionStatus: business.subscriptionStatus || 'inactive',
      verified: !!business.verified,
      rating: typeof bp.rating === 'number' ? bp.rating : 0,
      reviewsCount: typeof bp.reviewsCount === 'number' ? bp.reviewsCount : 0,
      followersCount,
      hours: bp.hours || [],
      about: aboutObj,
      specialties: Array.isArray(bp.specialties) ? bp.specialties : [],
    };

    res.json(shaped);
  } catch (err) {
    console.error('[Users] getBusinessById error:', err);
    res.status(500).json({ message: 'Failed to fetch business' });
  }
}

async function rateBusiness(req, res) {
  try {
    const BusinessReview = require('../models/BusinessReview');
    const businessId = req.params.id;
    const userId = req.user.id;
    const { rating, comment } = req.body || {};

    if (rating == null || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    const commentValue = comment != null ? String(comment).trim() : '';
    if (commentValue) {
      const allowed = await respondIfUnsafe(res, { text: commentValue });
      if (!allowed) return;
    }

    const business = await User.findOne({
      $or: [{ _id: businessId }, { businessId: businessId }],
      role: 'business',
    });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const businessObjId = business._id;

    const review = await BusinessReview.findOneAndUpdate(
      { business: businessObjId, user: userId },
      { $set: { rating: Number(rating), comment: commentValue } },
      { new: true, upsert: true, runValidators: true }
    );

    const agg = await BusinessReview.aggregate([
      { $match: { business: businessObjId } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const avgRating = agg[0] ? Math.round(agg[0].avgRating * 10) / 10 : rating;
    const reviewsCount = agg[0] ? agg[0].count : 1;

    await User.findByIdAndUpdate(businessObjId, {
      $set: {
        'businessProfile.rating': avgRating,
        'businessProfile.reviewsCount': reviewsCount,
      },
    });

    res.json({
      id: review._id.toString(),
      rating: review.rating,
      comment: review.comment,
      businessRating: avgRating,
      businessReviewsCount: reviewsCount,
    });
  } catch (err) {
    console.error('[Users] rateBusiness error:', err);
    res.status(500).json({ message: 'Failed to submit rating' });
  }
}

async function getBusinessReviews(req, res) {
  try {
    const BusinessReview = require('../models/BusinessReview');
    const businessId = req.params.id;

    const business = await User.findOne({
      $or: [{ _id: businessId }, { businessId: businessId }],
      role: 'business',
    });
    if (!business) {
      return res.status(404).json({ message: 'Business not found' });
    }

    const reviews = await BusinessReview.find({ business: business._id })
      .populate('user', 'fullName avatar')
      .sort({ createdAt: -1 })
      .lean();

    const currentUserId = req.user ? req.user.id : null;
    const shaped = reviews.map((r) => {
      const userId = r.user && (r.user._id || r.user).toString ? (r.user._id || r.user).toString() : '';
      const helpfulBy = r.helpfulBy || [];
      const helpfulCount = typeof r.helpful === 'number' ? r.helpful : (Array.isArray(helpfulBy) ? helpfulBy.length : 0);
      const isHelpful = !!(currentUserId && Array.isArray(helpfulBy) && helpfulBy.some((id) => (id && id.toString ? id.toString() : id) === currentUserId));
      return {
        id: r._id.toString(),
        author: r.user?.fullName || 'User',
        avatar: r.user?.avatar || '',
        rating: r.rating,
        comment: r.comment || '',
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '',
        helpful: helpfulCount,
        isHelpful,
        isMine: !!(currentUserId && userId && currentUserId === userId),
      };
    });

    res.json(shaped);
  } catch (err) {
    console.error('[Users] getBusinessReviews error:', err);
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
}

async function updateBusinessReview(req, res) {
  try {
    const BusinessReview = require('../models/BusinessReview');
    const mongoose = require('mongoose');
    const { businessId, reviewId } = req.params;
    const { rating, comment } = req.body || {};
    const userId = req.user.id;

    const review = await BusinessReview.findById(reviewId).lean();
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }
    if (review.user.toString() !== userId || review.business.toString() !== businessId) {
      return res.status(403).json({ message: 'You can only edit your own review' });
    }

    const update = {};
    if (typeof rating === 'number' && rating >= 1 && rating <= 5) update.rating = rating;
    if (comment !== undefined) update.comment = comment != null ? String(comment) : '';
    if (update.comment) {
      const allowed = await respondIfUnsafe(res, { text: update.comment });
      if (!allowed) return;
    }
    const updated = await BusinessReview.findByIdAndUpdate(
      reviewId,
      { $set: update },
      { new: true, runValidators: true }
    );

    const businessObjId = updated.business;
    const agg = await BusinessReview.aggregate([
      { $match: { business: businessObjId } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    const avgRating = agg[0] ? Math.round(agg[0].avgRating * 10) / 10 : updated.rating;
    const reviewsCount = agg[0] ? agg[0].count : 1;
    await User.findByIdAndUpdate(businessObjId, {
      $set: { 'businessProfile.rating': avgRating, 'businessProfile.reviewsCount': reviewsCount },
    });

    res.json({
      id: updated._id.toString(),
      rating: updated.rating,
      comment: updated.comment || '',
      businessRating: avgRating,
      businessReviewsCount: reviewsCount,
    });
  } catch (err) {
    console.error('[Users] updateBusinessReview error:', err);
    res.status(500).json({ message: 'Failed to update review' });
  }
}

async function toggleReviewHelpful(req, res) {
  try {
    const BusinessReview = require('../models/BusinessReview');
    const mongoose = require('mongoose');
    const { businessId, reviewId } = req.params;
    const userId = req.user.id;

    const review = await BusinessReview.findOne({
      _id: reviewId,
      business: businessId,
    });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    const helpfulBy = review.helpfulBy || [];
    const userIdObj = mongoose.Types.ObjectId.isValid(userId) ? new mongoose.Types.ObjectId(userId) : userId;
    const hasMarked = helpfulBy.some((id) => (id && id.toString ? id.toString() : id) === userId);

    let newHelpfulBy;
    let newHelpful;
    if (hasMarked) {
      newHelpfulBy = helpfulBy.filter((id) => (id && id.toString ? id.toString() : id) !== userId);
      newHelpful = Math.max(0, (review.helpful || 0) - 1);
    } else {
      newHelpfulBy = [...helpfulBy, userIdObj];
      newHelpful = (review.helpful || 0) + 1;
    }

    await BusinessReview.findByIdAndUpdate(reviewId, {
      $set: { helpfulBy: newHelpfulBy, helpful: newHelpful },
    });

    res.json({ helpful: newHelpful, isHelpful: !hasMarked });
  } catch (err) {
    console.error('[Users] toggleReviewHelpful error:', err);
    res.status(500).json({ message: 'Failed to update helpful' });
  }
}

function shapeUserForList(u) {
  if (!u) return null;
  const id = u._id ? u._id.toString() : u.id;
  const bp = u.businessProfile || {};
  return {
    id,
    fullName: u.fullName || '',
    name: u.fullName || u.name || '',
    avatar: u.avatar || '',
    role: u.role || 'visitor',
    location: bp.location || u.location || '',
    rating: typeof bp.rating === 'number' ? bp.rating : 0,
    reviews: typeof bp.reviewsCount === 'number' ? bp.reviewsCount : 0,
    followers: Array.isArray(u.followers) ? u.followers.length : 0,
  };
}

async function getFollowers(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const followerIds = (user.followers || []).filter((fid) => isValidObjectId(fid));
    const followers = followerIds.length
      ? await User.find({ _id: { $in: followerIds } }).lean()
      : [];
    const list = followers.map(shapeUserForList).filter(Boolean);
    res.json(list);
  } catch (err) {
    console.error('[Users] getFollowers error:', err);
    res.status(500).json({ message: 'Failed to fetch followers' });
  }
}

async function getFollowing(req, res) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }
    const user = await User.findById(id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const followingIds = (user.following || []).filter((fid) => isValidObjectId(fid));
    const following = followingIds.length
      ? await User.find({ _id: { $in: followingIds } }).lean()
      : [];
    const list = following.map(shapeUserForList).filter(Boolean);
    res.json(list);
  } catch (err) {
    console.error('[Users] getFollowing error:', err);
    res.status(500).json({ message: 'Failed to fetch following' });
  }
}

async function followUser(req, res) {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    if (currentUserId === targetUserId) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const followableRoles = ['business'];
    if (!followableRoles.includes(targetUser.role)) {
      return res.status(400).json({
        message: 'You can only follow businesses. This account cannot be followed.',
      });
    }

    const alreadyFollowing = currentUser.following.some(
      (id) => id.toString() === targetUser._id.toString()
    );

    if (!alreadyFollowing) {
      currentUser.following.push(targetUser._id);
      targetUser.followers.push(currentUser._id);

      await Promise.all([currentUser.save(), targetUser.save()]);

      try {
        await Follow.findOneAndUpdate(
          { follower: currentUser._id, following: targetUser._id },
          {},
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        await Notification.create({
          recipient: targetUser._id,
          sender: currentUser._id,
          type: 'follow',
          entityId: currentUser._id,
        });
      } catch (err) {
        console.error('[Users] followUser aux error:', err);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Users] followUser error:', err);
    res.status(500).json({ message: 'Failed to follow user' });
  }
}

async function unfollowUser(req, res) {
  try {
    const currentUserId = req.user.id;
    const targetUserId = req.params.id;

    const [currentUser, targetUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(targetUserId),
    ]);

    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== targetUser._id.toString()
    );
    targetUser.followers = targetUser.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await Promise.all([
      currentUser.save(),
      targetUser.save(),
      Follow.findOneAndDelete({
        follower: currentUser._id,
        following: targetUser._id,
      }),
    ]);

    res.json({ success: true });
  } catch (err) {
    console.error('[Users] unfollowUser error:', err);
    res.status(500).json({ message: 'Failed to unfollow user' });
  }
}

async function removeFollower(req, res) {
  try {
    const currentUserId = req.user.id;
    const followerIdToRemove = req.params.id;
    const [me, followerUser] = await Promise.all([
      User.findById(currentUserId),
      User.findById(followerIdToRemove),
    ]);
    if (!me || !followerUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    me.followers = (me.followers || []).filter((id) => id.toString() !== followerUser._id.toString());
    followerUser.following = (followerUser.following || []).filter((id) => id.toString() !== me._id.toString());
    await Promise.all([me.save(), followerUser.save()]);
    await Follow.findOneAndDelete({ follower: followerUser._id, following: me._id });
    res.json({ success: true });
  } catch (err) {
    console.error('[Users] removeFollower error:', err);
    res.status(500).json({ message: 'Failed to remove follower' });
  }
}

async function convertToBusiness(req, res) {
  try {
    const userId = req.user.id;
    const body = req.body || {};
    const bp = body.businessProfile || {};

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.role === 'business') {
      const merged = { ...(user.businessProfile?.toObject?.() || user.businessProfile || {}), ...bp };
      const errMsg = validateBusinessProfile(merged, { requireAll: true });
      if (errMsg) return res.status(400).json({ message: errMsg });
      const n = normalizeBusinessProfile(merged);
      if (!user.businessProfile) user.businessProfile = {};
      Object.assign(user.businessProfile, n);
      if (n.hours) user.businessProfile.hours = n.hours;
      if (n.about) user.businessProfile.about = n.about;
      user.markModified('businessProfile');
      await user.save();
      return res.json(user.toJSON ? user.toJSON() : user);
    }

    if (user.role !== 'visitor' && user.role !== 'admin') {
      return res.status(400).json({ message: 'Only visitor accounts can convert to business' });
    }

    const errMsg = validateBusinessProfile(bp, { requireAll: true });
    if (errMsg) return res.status(400).json({ message: errMsg });
    const n = normalizeBusinessProfile(bp);

    // Do NOT set role=business until the fee is paid. Store draft profile only.
    user.pendingBusinessProfile = {
      ...n,
      rating: 3.5,
      reviewsCount: 0,
    };
    user.markModified('pendingBusinessProfile');
    await user.save();

    const json = user.toJSON ? user.toJSON() : user;
    res.json({ ...json, needsPayment: true, pendingBusinessUpgrade: true });
  } catch (err) {
    console.error('[Users] convertToBusiness error:', err);
    res.status(500).json({ message: 'Failed to convert to business account' });
  }
}

module.exports = {
  getMe,
  updateMe,
  uploadAvatar,
  uploadCover,
  convertToBusiness,
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
};

