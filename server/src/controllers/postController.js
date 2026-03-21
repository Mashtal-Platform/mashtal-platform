const Post = require('../models/Post');
const User = require('../models/User');
const Notification = require('../models/Notification');
const SavedItem = require('../models/SavedItem');
const { Types } = require('mongoose');

function shapePost(doc, userId) {
  const author = doc.author || {};
  const likesArr = Array.isArray(doc.likes) ? doc.likes : [];
  const isLiked = userId
    ? likesArr.some((uid) => (uid && uid.toString()) === userId)
    : !!doc.isLiked;

  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    image: doc.image,
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

async function getPosts(req, res) {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || DEFAULT_PAGE_SIZE, 100);
    const skip = Math.max(0, parseInt(req.query.skip, 10) || 0);

    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author')
      .lean();

    const userId = req.user?.id ? String(req.user.id) : null;
    const shaped = posts.map((p) => shapePost(p, userId));
    res.json(shaped);
  } catch (err) {
    console.error('[Posts] getPosts error:', err);
    res.status(500).json({ message: 'Failed to fetch posts' });
  }
}

async function getPostById(req, res) {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ message: 'id is required' });

    const post = await Post.findById(id)
      .populate('author')
      .lean();

    if (!post) return res.status(404).json({ message: 'Post not found' });

    const userId = req.user?.id ? String(req.user.id) : null;
    res.json(shapePost(post, userId));
  } catch (err) {
    console.error('[Posts] getPostById error:', err);
    res.status(500).json({ message: 'Failed to fetch post' });
  }
}

async function createPost(req, res) {
  try {
    const body = req.body || {};
    let title = body.title;
    let content = body.content;
    let image = body.image;
    let tags = body.tags;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (_) {
        tags = [];
      }
    }
    if (!Array.isArray(tags)) tags = [];

    if (req.file && req.file.filename) {
      const { getRelativePath } = require('../middleware/upload');
      image = getRelativePath('posts', req.file.filename);
    }

    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }

    const authorId = req.user?.id || body.authorId || (body.author && body.author.id);

    const user = await User.findById(authorId);
    if (!user) {
      return res.status(400).json({ message: 'Invalid author id' });
    }

    const post = await Post.create({
      title,
      content,
      image: image || undefined,
      tags,
      author: user._id,
      likes: [],
      commentsCount: 0,
      shares: 0,
      isLiked: false,
      isSaved: false,
    });

    const populated = await Post.findById(post._id).populate('author').lean();

    const authorIdStr = user._id ? user._id.toString() : null;
    res.status(201).json(shapePost(populated, authorIdStr));
  } catch (err) {
    console.error('[Posts] createPost error:', err);
    res.status(500).json({ message: 'Failed to create post' });
  }
}

async function toggleLikePost(req, res) {
  try {
    const userId = req.user.id;

    const { id } = req.params;
    const post = await Post.findById(id).populate('author');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const hasLiked = post.likes.some(
      (uid) => uid.toString() === userId.toString()
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (uid) => uid.toString() !== userId.toString()
      );
    } else {
      post.likes.push(new Types.ObjectId(userId));

      if (post.author && post.author._id.toString() !== userId.toString()) {
        try {
          await Notification.create({
            recipient: post.author._id,
            sender: new Types.ObjectId(userId),
            type: 'like_post',
            entityId: post._id,
          });
        } catch (notifyErr) {
          console.error('[Posts] Notification error:', notifyErr);
        }
      }
    }

    await post.save();

    const shaped = shapePost(post.toObject({ virtuals: false }), userId);
    res.json(shaped);
  } catch (err) {
    console.error('[Posts] toggleLikePost error:', err);
    res.status(500).json({ message: 'Failed to like/unlike post' });
  }
}

async function incrementSharePost(req, res) {
  try {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author').lean();
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    await Post.updateOne({ _id: id }, { $inc: { shares: 1 } });
    const updated = await Post.findById(id).populate('author').lean();
    const userId = req.user?.id ? String(req.user.id) : null;
    res.json(shapePost(updated, userId));
  } catch (err) {
    console.error('[Posts] incrementSharePost error:', err);
    res.status(500).json({ message: 'Failed to record share' });
  }
}

async function updatePost(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const post = await Post.findById(id).populate('author');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const authorId = (post.author && post.author._id) ? post.author._id.toString() : (post.author && post.author.id) || '';
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own posts' });
    }
    const body = req.body || {};
    let { title, content, image, tags } = body;
    if (typeof tags === 'string') {
      try {
        tags = JSON.parse(tags);
      } catch (_) {
        tags = post.tags || [];
      }
    }
    if (!Array.isArray(tags)) tags = post.tags || [];
    if (req.file && req.file.filename) {
      const { getRelativePath } = require('../middleware/upload');
      image = getRelativePath('posts', req.file.filename);
    }
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (image !== undefined) post.image = image;
    post.tags = tags;
    await post.save();
    const populated = await Post.findById(post._id).populate('author').lean();
    res.json(shapePost(populated, userId));
  } catch (err) {
    console.error('[Posts] updatePost error:', err);
    res.status(500).json({ message: 'Failed to update post' });
  }
}

async function deletePost(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const { id } = req.params;
    const post = await Post.findById(id).populate('author');
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    const authorId = (post.author && post.author._id) ? post.author._id.toString() : (post.author && post.author.id) || '';
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }
    await Post.deleteOne({ _id: id });
    await SavedItem.deleteMany({ type: 'post', refId: new Types.ObjectId(id) });
    res.status(204).send();
  } catch (err) {
    console.error('[Posts] deletePost error:', err);
    res.status(500).json({ message: 'Failed to delete post' });
  }
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  toggleLikePost,
  incrementSharePost,
  updatePost,
  deletePost,
};

