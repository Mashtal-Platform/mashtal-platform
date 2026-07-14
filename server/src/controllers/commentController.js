const Comment = require('../models/Comment');
const Post = require('../models/Post');
const Thread = require('../models/Thread');
const { Types } = require('mongoose');

async function getComments(req, res) {
  try {
    const { targetType, targetId } = req.query;
    const userId = req.user?.id ? String(req.user.id) : null;

    if (!targetType || !targetId) {
      return res.status(400).json({ message: 'targetType and targetId are required' });
    }

    if (!['post', 'thread'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid targetType' });
    }

    const comments = await Comment.find({
      targetType,
      targetId: new Types.ObjectId(targetId),
    })
      .sort({ createdAt: 1 })
      .populate('author', 'fullName avatar verified role businessProfile.companyName')
      .lean();

    function getAuthorDisplayName(author) {
      if (!author) return 'Unknown';
      if (author.role === 'business') {
        const bp = author.businessProfile || {};
        return (bp.companyName || author.fullName || 'Business').trim();
      }
      return (author.fullName || 'Unknown').trim();
    }

    function shapeComment(c) {
      const author = c.author || {};
      const likesArr = Array.isArray(c.likes) ? c.likes : [];
      const isLiked = userId
        ? likesArr.some((uid) => uid && String(uid) === userId)
        : false;
      const id = author._id ? author._id.toString() : '';
      const isBusiness = author.role === 'business';
      return {
        id: c._id.toString(),
        content: c.content,
        createdAt: c.createdAt,
        likes: likesArr.length,
        isLiked,
        author: {
          id,
          name: getAuthorDisplayName(author),
          avatar: author.avatar || '',
          verified: !!author.verified,
          type: author.role || 'user',
          businessId: isBusiness ? id : undefined,
        },
        replies: [],
      };
    }

    // Build a nested tree structure (parent -> replies)
    const byId = new Map();
    comments.forEach((c) => {
      const shaped = shapeComment(c);
      byId.set(c._id.toString(), shaped);
    });

    const roots = [];
    comments.forEach((c) => {
      const shaped = byId.get(c._id.toString());
      if (c.parentComment) {
        const parent = byId.get(c.parentComment.toString());
        if (parent) {
          parent.replies.push(shaped);
        } else {
          roots.push(shaped);
        }
      } else {
        roots.push(shaped);
      }
    });

    res.json(roots);
  } catch (err) {
    console.error('[Comments] getComments error:', err);
    res.status(500).json({ message: 'Failed to fetch comments' });
  }
}

async function createComment(req, res) {
  try {
    const userId = req.user.id;

    const { targetType, targetId, parentCommentId, content } = req.body || {};

    if (!targetType || !targetId || !content) {
      return res.status(400).json({ message: 'targetType, targetId and content are required' });
    }

    if (!['post', 'thread'].includes(targetType)) {
      return res.status(400).json({ message: 'Invalid targetType' });
    }

    const comment = await Comment.create({
      targetType,
      targetId: new Types.ObjectId(targetId),
      parentComment: parentCommentId ? new Types.ObjectId(parentCommentId) : null,
      author: new Types.ObjectId(userId),
      content,
      likes: [],
    });

    // Update commentsCount on target
    if (targetType === 'post') {
      await Post.findByIdAndUpdate(targetId, { $inc: { commentsCount: 1 } }).exec();
    } else if (targetType === 'thread') {
      await Thread.findByIdAndUpdate(targetId, { $inc: { commentsCount: 1 } }).exec();
    }

    const populated = await Comment.findById(comment._id)
      .populate('author', 'fullName avatar verified role businessProfile.companyName')
      .lean();
    const author = populated?.author || {};
    const authorId = author._id ? author._id.toString() : '';
    const isBusiness = author.role === 'business';
    const bp = author.businessProfile || {};
    const displayName = isBusiness
      ? (bp.companyName || author.fullName || 'Business').trim()
      : (author.fullName || 'Unknown').trim();
    res.status(201).json({
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
      likes: 0,
      author: {
        id: authorId,
        name: displayName,
        avatar: author.avatar || '',
        verified: !!author.verified,
        type: author.role || 'user',
        businessId: isBusiness ? authorId : undefined,
      },
      replies: [],
    });
  } catch (err) {
    console.error('[Comments] createComment error:', err);
    res.status(500).json({ message: 'Failed to create comment' });
  }
}

async function toggleLikeComment(req, res) {
  try {
    const userId = req.user.id;

    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const hasLiked = comment.likes.some(
      (uid) => uid.toString() === userId.toString()
    );

    if (hasLiked) {
      comment.likes = comment.likes.filter(
        (uid) => uid.toString() !== userId.toString()
      );
    } else {
      comment.likes.push(new Types.ObjectId(userId));
    }

    await comment.save();

    const json = comment.toJSON();
    json.isLiked = !hasLiked; // after toggle: if we removed like then false, if we added then true
    res.json(json);
  } catch (err) {
    console.error('[Comments] toggleLikeComment error:', err);
    res.status(500).json({ message: 'Failed to like/unlike comment' });
  }
}

async function deleteComment(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const root = await Comment.findById(id).lean();
    if (!root) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const authorId = root.author ? String(root.author) : '';
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You can only delete your own comments' });
    }

    // Collect comment + all descendant replies
    const toDelete = [String(root._id)];
    let frontier = [root._id];
    while (frontier.length) {
      const children = await Comment.find({ parentComment: { $in: frontier } }, { _id: 1 }).lean();
      if (!children.length) break;
      const childIds = children.map((c) => c._id);
      childIds.forEach((cid) => toDelete.push(String(cid)));
      frontier = childIds;
    }

    await Comment.deleteMany({ _id: { $in: toDelete } }).exec();

    // Decrement commentsCount on target by deleted count
    const dec = -Math.max(1, toDelete.length);
    if (root.targetType === 'post') {
      await Post.findByIdAndUpdate(root.targetId, { $inc: { commentsCount: dec } }).exec();
    } else if (root.targetType === 'thread') {
      await Thread.findByIdAndUpdate(root.targetId, { $inc: { commentsCount: dec } }).exec();
    }

    res.status(204).send();
  } catch (err) {
    console.error('[Comments] deleteComment error:', err);
    res.status(500).json({ message: 'Failed to delete comment' });
  }
}

async function updateComment(req, res) {
  try {
    const userId = req.user?.id ? String(req.user.id) : null;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { id } = req.params;
    const { content } = req.body || {};

    if (!id) return res.status(400).json({ message: 'id is required' });
    if (!content || typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({ message: 'content is required' });
    }

    const comment = await Comment.findById(id);
    if (!comment) return res.status(404).json({ message: 'Comment not found' });

    const authorId = comment.author ? String(comment.author) : '';
    if (authorId !== userId) {
      return res.status(403).json({ message: 'You can only edit your own comments' });
    }

    comment.content = content.trim();
    await comment.save();

    // Return a shaped payload consistent with the other comment endpoints.
    const shaped = {
      id: comment._id.toString(),
      content: comment.content,
      createdAt: comment.createdAt,
    };

    res.json(shaped);
  } catch (err) {
    console.error('[Comments] updateComment error:', err);
    res.status(500).json({ message: 'Failed to update comment' });
  }
}

module.exports = {
  getComments,
  createComment,
  toggleLikeComment,
  deleteComment,
  updateComment,
};

