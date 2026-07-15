const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },

    type: {
      type: String,
      enum: [
        'follow',
        'like_post',
        'like_thread',
        'comment_post',
        'comment_thread',
        'product_review',
        'order_created',
        'chat_message',
        'subscription_expiring',
        'subscription_expired',
      ],
      required: true,
    },

    entityId: {
      type: mongoose.Schema.Types.ObjectId,
    },

    read: {
      type: Boolean,
      default: false,
    },

    /** For chat_message: number of unread messages from this sender (grouped). */
    messageCount: {
      type: Number,
      default: 1,
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);

