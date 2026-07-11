const Thread = require('../models/Thread');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SavedItem = require('../models/SavedItem');
const { Types } = require('mongoose');

function shapeThread(doc, userId) {
  const author = doc.author || {};
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
    author: {
      id: author._id ? author._id.toString() : author.id || '',
      name: author.fullName || author.name || 'Unknown User',
      avatar: author.avatar || '',
      verified: !!author.verified,
      type: author.role || author.type || 'user',
      businessId: author.businessProfile ? (author._id && author._id.toString()) : author.businessId,
    },
  };
}

const DEFAULT_PAGE_SIZE = 20;

async function getThreads(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 100);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);

    const threads = await Thread.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author')
      .lean();

    const userId = req.user?.id ? String(req.user.id) : null;
    const shaped = threads.map((t) => shapeThread(t, userId));
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
    res.json(shapeThread(thread, userId));
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

    const authorId = req.user?.id || author?.id;

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid author id' });
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
    res.status(201).json(shapeThread(populated, authorIdStr));
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
    const shaped = shapeThread(plain, userId);
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
    res.json(shapeThread(updated, userId));
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
    if (title !== undefined) thread.title = title;
    if (content !== undefined) thread.content = content;
    if (Array.isArray(tags)) thread.tags = tags;
    await thread.save();
    const populated = await Thread.findById(thread._id).populate('author').lean();
    res.json(shapeThread(populated, userId));
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

