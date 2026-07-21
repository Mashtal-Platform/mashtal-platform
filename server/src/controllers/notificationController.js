const Notification = require('../models/Notification');
const User = require('../models/User');
const { Types } = require('mongoose');
const { buildNotificationMessage } = require('../utils/notificationMessages');

function getSenderDisplayName(sender) {
  if (!sender) return null;
  if (sender.role === 'business') {
    const bp = sender.businessProfile || {};
    return (bp.companyName || sender.fullName || 'Business').trim();
  }
  return (sender.fullName || null)?.trim() || null;
}

async function getMyNotifications(req, res) {
  try {
    const userId = req.user.id;

    const me = await User.findById(userId).select('preferredLanguage').lean();
    const lang = me?.preferredLanguage === 'ar' ? 'ar' : 'en';

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
      else if (n.type === 'order_created' || n.type === 'order_cancelled')
        uiType = 'order_seller';
      else if (n.type === 'order_status_updated')
        uiType = 'order_buyer';
      else if (n.type === 'order_cancelled_admin' || n.type === 'order_ready_admin')
        uiType = 'admin_order';
      else if (n.type === 'payment_received') uiType = 'transaction';
      else if (n.type === 'business_report') uiType = 'report';
      else if (n.type === 'admin_warning') uiType = 'alert';
      else if (n.type === 'chat_message') uiType = 'message';

      const senderName = getSenderDisplayName(n.sender);
      const message = buildNotificationMessage(n, senderName, lang);

      const messageCount = n.type === 'chat_message' ? (n.messageCount || 1) : 1;

      const orderRelated = [
        'order_created',
        'order_cancelled',
        'order_cancelled_admin',
        'order_status_updated',
        'order_ready_admin',
      ].includes(n.type);

      if (
        n.type === 'subscription_expiring' ||
        n.type === 'subscription_expired' ||
        n.type === 'subscription_suspended'
      )
        uiType = 'subscription';

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
        orderId: orderRelated && n.entityId ? n.entityId.toString() : undefined,
        paymentId:
          n.type === 'payment_received' && n.entityId
            ? n.entityId.toString()
            : undefined,
        reportId:
          (n.type === 'business_report' || n.type === 'admin_warning') && n.entityId
            ? n.entityId.toString()
            : undefined,
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
