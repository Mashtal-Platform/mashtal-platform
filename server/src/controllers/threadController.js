const Thread = require('../models/Thread');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SavedItem = require('../models/SavedItem');
const { Types } = require('mongoose');
const { respondIfUnsafe } = require('../utils/assertContentSafe');
const {
  MASHTAL_SUPPORT_NAME,
  MASHTAL_SUPPORT_AVATAR,
  getCanonicalAdminId,
} = require('../utils/publicAdminIdentity');

function getAuthorDisplayName(author) {
  if (!author) return 'Unknown User';
  if (author.role === 'admin') return MASHTAL_SUPPORT_NAME;
  if (author.role === 'business') {
    const bp = author.businessProfile || {};
    return (bp.companyName || author.fullName || author.name || 'Business').trim();
  }
  return (author.fullName || author.name || 'Unknown User').trim();
}

function shapeAuthor(author, canonicalAdminId) {
  const a = author || {};
  const id = a._id ? a._id.toString() : a.id || '';
  const isBusiness = a.role === 'business';
  if (a.role === 'admin') {
    return {
      id: canonicalAdminId || id,
      name: MASHTAL_SUPPORT_NAME,
      avatar: MASHTAL_SUPPORT_AVATAR,
      verified: true,
      type: 'admin',
      businessId: undefined,
    };
  }
  return {
    id,
    name: getAuthorDisplayName(a),
    avatar: a.avatar || '',
    verified: !!a.verified,
    type: a.role || a.type || 'user',
    businessId: isBusiness ? id : a.businessId || undefined,
  };
}

function shapeThread(doc, userId, canonicalAdminId) {
  const likesArr = Array.isArray(doc.likes) ? doc.likes : [];
  const isLiked = userId
    ? likesArr.some((uid) => (uid && uid.toString()) === userId)
    : !!doc.isLiked;

  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    tags: doc.tags || [],
    likes: likesArr.length,
    commentsCount: doc.commentsCount || 0,
    shares: doc.shares || 0,
    isLiked,
    isSaved: !!doc.isSaved,
    timestamp: (doc.createdAt || doc.updatedAt || new Date()).toISOString(),
    author: shapeAuthor(doc.author, canonicalAdminId),
  };
}

const DEFAULT_PAGE_SIZE = 20;
const FEED_PRIORITY_DAYS = 2;

async function getPriorityAuthorIds(userId) {
  if (!userId || !Types.ObjectId.isValid(userId)) return [];
  const me = await User.findById(userId).select('following').lean();
  if (!me) return [];
  const priorityIds = [new Types.ObjectId(userId)];
  for (const fid of me.following || []) {
    if (fid) priorityIds.push(fid);
  }
  return priorityIds;
}

async function getThreads(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 100);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);
    const userId = req.user?.id ? String(req.user.id) : null;

    let threads;
    if (userId) {
      const priorityAuthorIds = await getPriorityAuthorIds(userId);
      const since = new Date(Date.now() - FEED_PRIORITY_DAYS * 24 * 60 * 60 * 1000);
      threads = await Thread.aggregate([
        {
          $addFields: {
            feedRank: {
              $cond: [
                {
                  $and: [
                    { $in: ['$author', priorityAuthorIds] },
                    { $gte: ['$createdAt', since] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
        { $sort: { feedRank: -1, createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
          $lookup: {
            from: 'users',
            localField: 'author',
            foreignField: '_id',
            as: 'author',
          },
        },
        { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      ]);
    } else {
      threads = await Thread.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author')
        .lean();
    }

    const canonicalAdminId = await getCanonicalAdminId();
    const shaped = threads.map((t) => shapeThread(t, userId, canonicalAdminId));
    res.json(shaped);
  } catch (err) {
    console.error('[Threads] getThreads error:', err);
    res.status(500).json({ message: 'Failed to fetch threads' });
  }
}

async function getThreadById(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });

    const thread = await Thread.findById(id)
      .populate('author')
      .lean();

    if (!thread) return res.status(404).json({ message: 'Thread not found' });

    const userId = req.user?.id ? String(req.user.id) : null;
    const canonicalAdminId = await getCanonicalAdminId();
    res.json(shapeThread(thread, userId, canonicalAdminId));
  } catch (err) {
    console.error('[Threads] getThreadById error:', err);
    res.status(500).json({ message: 'Failed to fetch thread' });
  }
}

async function createThread(req, res) {
  try {
    const { title, content, tags = [], author } = req.body || {};

    if (!content) {
      return res.status(400).json({ message: 'content is required' });
    }

    const allowed = await respondIfUnsafe(res, {
      text: [title, content, ...(Array.isArray(tags) ? tags : [])],
    });
    if (!allowed) return;

    const authorId = req.user?.id || author?.id;

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid author id' });
    }
    if (user.role !== 'business' && user.role !== 'admin') {
      return res.status(403).json({ message: 'Only business or admin accounts can create threads' });
    }

    const thread = await Thread.create({
      title,
      content,
      tags,
      author: user._id,
      likes: [],
      commentsCount: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
    });

    const populated = await Thread.findById(thread._id).populate('author').lean();

    const authorIdStr = user._id ? user._id.toString() : null;
    const canonicalAdminId = await getCanonicalAdminId();
    res.status(201).json(shapeThread(populated, authorIdStr, canonicalAdminId));
  } catch (err) {
    console.error('[Threads] createThread error:', err);
    res.status(500).json({ message: 'Failed to create thread' });
  }
}

async function toggleLikeThread(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const thread = await Thread.findById(id).populate('author');

    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }

    const hasLiked = (Array.isArray(thread.likes) ? thread.likes : []).some(
      (uid) => uid && String(uid) === userId
    );

    if (hasLiked) {
      thread.likes = thread.likes.filter(
        (uid) => uid && String(uid) !== userId
      );
    } else {
      thread.likes.push(new Types.ObjectId(userId));

      if (thread.author && thread.author._id.toString() !== userId.toString()) {
        try {
          await Notification.create({
            recipient: thread.author._id,
            sender: new Types.ObjectId(userId),
            type: 'like_thread',
            entityId: thread._id,
          });
        } catch (notifyErr) {
          console.error('[Threads] Notification error:', notifyErr);
        }
      }
    }

    await thread.save();

    const plain = thread.toObject ? thread.toObject({ virtuals: false }) : thread;
    const canonicalAdminId = await getCanonicalAdminId();
    const shaped = shapeThread(plain, userId, canonicalAdminId);
    res.json(shaped);
  } catch (err) {
    console.error('[Threads] toggleLikeThread error:', err);
    res.status(500).json({ message: 'Failed to like/unlike thread' });
  }
}

async function incrementShareThread(req, res) {
  try {
    const { id } = req.params;
    const thread = await Thread.findById(id).populate('author').lean();
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    await Thread.updateOne({ _id: id }, { $inc: { shares: 1 } });
    const updated = await Thread.findById(id).populate('author').lean();
    const userId = req.user?.id ? String(req.user.id) : null;
    const canonicalAdminId = await getCanonicalAdminId();
    res.json(shapeThread(updated, userId, canonicalAdminId));
  } catch (err) {
    console.error('[Threads] incrementShareThread error:', err);
    res.status(500).json({ message: 'Failed to record share' });
  }
}

async function updateThread(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const thread = await Thread.findById(id).populate('author');
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    const authorId = (thread.author && thread.author._id) ? thread.author._id.toString() : (thread.author && thread.author.id) || '';
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own threads' });
    }
    const { title, content, tags } = req.body || {};
    const nextTitle = title !== undefined ? title : thread.title;
    const nextContent = content !== undefined ? content : thread.content;
    const nextTags = Array.isArray(tags) ? tags : thread.tags || [];
    const allowed = await respondIfUnsafe(res, {
      text: [nextTitle, nextContent, ...nextTags],
    });
    if (!allowed) return;

    if (title !== undefined) thread.title = title;
    if (content !== undefined) thread.content = content;
    if (Array.isArray(tags)) thread.tags = tags;
    await thread.save();
    const populated = await Thread.findById(thread._id).populate('author').lean();
    const canonicalAdminId = await getCanonicalAdminId();
    res.json(shapeThread(populated, userId, canonicalAdminId));
  } catch (err) {
    console.error('[Threads] updateThread error:', err);
    res.status(500).json({ message: 'Failed to update thread' });
  }
}

async function deleteThread(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const thread = await Thread.findById(id).populate('author');
    if (!thread) {
      return res.status(404).json({ message: 'Thread not found' });
    }
    const authorId = (thread.author && thread.author._id) ? thread.author._id.toString() : (thread.author && thread.author.id) || '';
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own threads' });
    }
    await Thread.deleteOne({ _id: id });
    await SavedItem.deleteMany({ type: 'thread', refId: new Types.ObjectId(id) });
    res.status(204).send();
  } catch (err) {
    console.error('[Threads] deleteThread error:', err);
    res.status(500).json({ message: 'Failed to delete thread' });
  }
}

module.exports = {
  getThreads,
  getThreadById,
  createThread,
  toggleLikeThread,
  incrementShareThread,
  updateThread,
  deleteThread,
};

