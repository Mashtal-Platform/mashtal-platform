const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    /** Shared Mashtal support inbox — visible to every admin. */
    isSupport: {
      type: Boolean,
      default: false,
      index: true,
    },
    /** Which admin currently holds the reply lock (support chats only). */
    supportLockBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    supportLockUntil: {
      type: Date,
      default: null,
    },
    supportLockName: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

ConversationSchema.index({ participants: 1 });
ConversationSchema.index({ isSupport: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
