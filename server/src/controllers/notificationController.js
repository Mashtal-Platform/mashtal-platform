const Notification = require('../models/Notification');
const User = require('../models/User');
const { Types } = require('mongoose');

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find({
      recipient: new Types.ObjectId(userId),
    })
      .sort({ createdAt: -1 })
      .populate('sender')
      .lean();

    const shaped = notifications.map((n) => {
      let uiType = 'alert';
      if (n.type === 'follow') uiType = 'follow';
      else if (n.type === 'like_post' || n.type === 'like_thread') uiType = 'like';
      else if (n.type === 'comment_post' || n.type === 'comment_thread')
        uiType = 'comment';
      else if (n.type === 'order_created') uiType = 'order';
      else if (n.type === 'chat_message') uiType = 'message';

      let message = 'You have a new notification.';
      if (n.type === 'follow' && n.sender?.fullName) {
        message = `${n.sender.fullName} started following you.`;
      } else if (n.type === 'like_post' && n.sender?.fullName) {
        message = `${n.sender.fullName} liked your post.`;
      } else if (n.type === 'like_thread' && n.sender?.fullName) {
        message = `${n.sender.fullName} liked your thread.`;
      } else if (n.type === 'order_created') {
        message = 'Your order has been created successfully.';
      } else if (n.type === 'chat_message' && n.sender?.fullName) {
        const count = n.messageCount && n.messageCount > 0 ? n.messageCount : 1;
        message =
          count === 1
            ? `${n.sender.fullName} sent you a message.`
            : `${n.sender.fullName} has sent you ${count} messages.`;
      }

      const messageCount = n.type === 'chat_message' ? (n.messageCount || 1) : 1;

      return {
        id: n._id.toString(),
        type: uiType,
        message,
        read: !!n.read,
        messageCount,
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleString()
          : new Date().toLocaleString(),
        relatedUserId: n.sender ? n.sender._id.toString() : undefined,
        postId:
          n.type === 'like_post' || n.type === 'comment_post'
            ? n.entityId?.toString()
            : undefined,
        threadId:
          n.type === 'like_thread' || n.type === 'comment_thread'
            ? n.entityId?.toString()
            : undefined,
      };
    });

    res.json(shaped);
  } catch (err) {
    console.error('[Notifications] getMyNotifications error:', err);
    res.status(500).json({ message: 'Failed to fetch notifications' });
  }
}

async function markAllAsRead(req, res) {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: new Types.ObjectId(userId), read: false },
      { $set: { read: true } }
    );

    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] markAllAsRead error:', err);
    res.status(500).json({ message: 'Failed to mark notifications as read' });
  }
}

async function clearReadNotifications(req, res) {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({
      recipient: new Types.ObjectId(userId),
      read: true,
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] clearReadNotifications error:', err);
    res.status(500).json({ message: 'Failed to clear read notifications' });
  }
}

async function clearAllNotifications(req, res) {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({
      recipient: new Types.ObjectId(userId),
    });

    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] clearAllNotifications error:', err);
    res.status(500).json({ message: 'Failed to clear notifications' });
  }
}

async function markOneAsRead(req, res) {
  try {
    const userId = req.user.id;

    const { id } = req.params;

    const updated = await Notification.findOneAndUpdate(
      {
        _id: id,
        recipient: new Types.ObjectId(userId),
      },
      { $set: { read: true } },
      { new: true }
    ).lean();

    if (!updated) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('[Notifications] markOneAsRead error:', err);
    res.status(500).json({ message: 'Failed to mark notification as read' });
  }
}

module.exports = {
  getMyNotifications,
  markAllAsRead,
  clearReadNotifications,
  clearAllNotifications,
  markOneAsRead,
};

