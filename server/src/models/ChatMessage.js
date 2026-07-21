const mongoose = require('mongoose');

/**
 * ChatMessage schema – optimized for real-time chat and history.
 *
 * Design choices:
 * - Denormalized senderName/senderAvatar: avoids populate() on every read/send,
 *   so message list and send_message stay fast under load. Sender ref kept for
 *   integrity and optional future use.
 * - Index (conversation, createdAt -1): efficient sort + pagination for
 *   "latest N messages" and cursor-based pagination.
 * - Index (conversation, _id): supports cursor pagination by _id when
 *   conversations have thousands of messages (avoids large skip).
 */
const ChatMessageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    /** Denormalized: no populate needed on read or on send broadcast. */
    senderName: {
      type: String,
      default: 'User',
      trim: true,
    },
    senderAvatar: {
      type: String,
      default: '',
      trim: true,
    },
    /** Denormalized role so support inbox can align all admin messages together. */
    senderRole: {
      type: String,
      enum: ['visitor', 'business', 'admin'],
      default: 'visitor',
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    /** Optional: when message is a shared post/thread, show rich preview (post owner = uploader, NOT sender). */
    sharedPost: {
      postId: { type: String, trim: true },
      title: { type: String, trim: true },
      image: { type: String, trim: true },
      url: { type: String, trim: true },
      authorName: { type: String, trim: true },
      ownerAvatar: { type: String, trim: true },
    },
  },
  { timestamps: true }
);

// Primary index: list messages by conversation, newest first (used by getMessages and cursor pagination).
ChatMessageSchema.index({ conversation: 1, createdAt: -1 });

// Cursor pagination: fetch "next page" by (conversation, _id) for stable, efficient pagination without large skip().
ChatMessageSchema.index({ conversation: 1, _id: -1 });

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
