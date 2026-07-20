const SavedItem = require('../models/SavedItem');
const Post = require('../models/Post');
const Thread = require('../models/Thread');
const Product = require('../models/Product');
const User = require('../models/User');
const { Types } = require('mongoose');
const { isBusinessSubscriptionActive } = require('../utils/subscription');

async function getMySaved(req, res) {
  try {
    const userId = req.user.id;

    const items = await SavedItem.find({
      user: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .lean();

    const shaped = await Promise.all(
      items.map(async (item) => {
        const refIdStr = item.refId && item.refId.toString ? item.refId.toString() : String(item.refId);
        const out = {
          id: item._id.toString(),
          type: item.type,
          refId: refIdStr,
          createdAt: item.createdAt,
          title: '',
          image: '',
          description: '',
        };
        try {
          if (item.type === 'post') {
            const post = await Post.findById(item.refId).lean();
            if (!post) {
              await SavedItem.deleteOne({ _id: item._id });
              return null;
            }
            out.title = post.title || '';
            out.image = post.image || '';
            out.description = post.content || '';
          } else if (item.type === 'thread') {
            const thread = await Thread.findById(item.refId).populate('author').lean();
            if (!thread) {
              await SavedItem.deleteOne({ _id: item._id });
              return null;
            }
            out.title = thread.title || '';
            out.description = thread.content || '';
            out.image = thread.author?.avatar || '';
          } else if (item.type === 'product') {
            const product = await Product.findById(item.refId).lean();
            if (!product) {
              await SavedItem.deleteOne({ _id: item._id });
              return null;
            }
            // Hide saved products whose seller plan expired (keep SavedItem; reappear on renew)
            if (product.business) {
              const seller = await User.findById(product.business)
                .select('role subscriptionStatus subscriptionExpiresAt')
                .lean();
              if (!isBusinessSubscriptionActive(seller)) {
                return null;
              }
            }
            out.title = product.name || '';
            out.image = product.image || '';
            out.description = product.description || '';
            out.businessId = product.business ? product.business.toString() : '';
          }
        } catch (e) {
          await SavedItem.deleteOne({ _id: item._id }).catch(() => {});
          return null;
        }
        return out;
      })
    );

    res.json(shaped.filter(Boolean));
  } catch (err) {
    console.error('[Saved] getMySaved error:', err);
    res.status(500).json({ message: 'Failed to fetch saved items' });
  }
}

async function saveItem(req, res) {
  try {
    const userId = req.user.id;

    const { type, refId } = req.body || {};

    if (!type || !refId) {
      return res.status(400).json({ message: 'type and refId are required' });
    }

    const existing = await SavedItem.findOne({
      user: new Types.ObjectId(userId),
      type,
      refId: new Types.ObjectId(refId),
    }).lean();

    if (existing) {
      return res.json({
        id: existing._id.toString(),
        type: existing.type,
        refId: existing.refId ? existing.refId.toString() : refId,
        createdAt: existing.createdAt,
      });
    }

    const saved = await SavedItem.create({
      user: new Types.ObjectId(userId),
      type,
      refId: new Types.ObjectId(refId),
    });

    res.status(201).json({
      id: saved._id.toString(),
      type: saved.type,
      refId: saved.refId ? saved.refId.toString() : refId,
      createdAt: saved.createdAt,
    });
  } catch (err) {
    console.error('[Saved] saveItem error:', err);
    res.status(500).json({ message: 'Failed to save item' });
  }
}

async function deleteSaved(req, res) {
  try {
    const userId = req.user.id;

    const { id } = req.params;

    const deleted = await SavedItem.findOneAndDelete({
      _id: id,
      user: new Types.ObjectId(userId),
    }).lean();

    if (!deleted) {
      return res.status(404).json({ message: 'Saved item not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Saved] deleteSaved error:', err);
    res.status(500).json({ message: 'Failed to delete saved item' });
  }
}

module.exports = {
  getMySaved,
  saveItem,
  deleteSaved,
};

