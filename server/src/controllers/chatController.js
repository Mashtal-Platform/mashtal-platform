const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { Types } = require('mongoose');
const { respondIfUnsafe } = require('../utils/assertContentSafe');

/** Create or increment a single grouped chat_message notification per (recipient, sender). */
async function upsertMessageNotification(recipientId, senderId, conversationId) {
  const recipient = Types.ObjectId.isValid(recipientId) ? recipientId : new Types.ObjectId(recipientId);
  const sender = Types.ObjectId.isValid(senderId) ? senderId : new Types.ObjectId(senderId);
  const existing = await Notification.findOne({
    recipient,
    sender,
    type: 'chat_message',
    read: false,
  });
  if (existing) {
    await Notification.updateOne(
      { _id: existing._id },
      { $inc: { messageCount: 1 } }
    );
  } else {
    await Notification.create({
      recipient,
      sender,
      type: 'chat_message',
      entityId: conversationId,
      messageCount: 1,
    });
  }
}

/** Normalize stored sharedPost to API shape: postId, postTitle, postImage, postUrl, postOwnerName, postOwnerAvatar. */
function normalizeSharedPost(sp) {
  if (!sp || typeof sp !== 'object') return null;
  const postId = sp.postId
    || (sp.url && sp.url.match(/\/post\/([^/]+)/)?.[1])
    || (sp.url && sp.url.match(/\/threads?\/([^/]+)/)?.[1]);
  const postTitle = sp.postTitle ?? sp.title;
  const postImage = sp.postImage ?? sp.image;
  const postUrl = sp.postUrl ?? sp.url;
  const postOwnerName = sp.postOwnerName ?? sp.authorName;
  const postOwnerAvatar = sp.postOwnerAvatar ?? sp.ownerAvatar;
  if (!postTitle && !postUrl && !postImage) return null;
  return {
    postId: postId || undefined,
    postTitle: postTitle || undefined,
    postImage: postImage || undefined,
    postUrl: postUrl || undefined,
    postOwnerName: postOwnerName || undefined,
    postOwnerAvatar: postOwnerAvatar || undefined,
  };
}

/**
 * GET /conversations - list conversations for current user (with last message and participant info)
 */
async function getConversations(req, res) {
  try {
    const userId = req.user.id;
    const conversations = await Conversation.find({ participants: userId })
      .sort({ updatedAt: -1 })
      .lean();

    const result = await Promise.all(
      conversations.map(async (conv) => {
        const otherId = conv.participants.find((p) => p.toString() !== userId);
        const other = await User.findById(otherId).select('fullName avatar role').lean();
        const lastMsg = await ChatMessage.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .lean();
        return {
          id: conv._id.toString(),
          participantId: otherId ? otherId.toString() : '',
          profileId: otherId ? otherId.toString() : '',
          profileName: other?.fullName || 'User',
          profileAvatar: other?.avatar || '',
          profileType: other?.role || 'visitor',
          lastMessage: lastMsg?.text || '',
          lastMessageTime: lastMsg?.createdAt ? new Date(lastMsg.createdAt).toISOString() : conv.updatedAt,
          unread: 0,
          online: false,
        };
      })
    );

    res.json(result);
  } catch (err) {
    console.error('[Chat] getConversations error:', err);
    res.status(500).json({ message: 'Failed to fetch conversations' });
  }
}

/**
 * POST /conversations - create or get conversation with participantId (body: { participantId })
 */
async function createOrGetConversation(req, res) {
  try {
    const userId = req.user.id;
    const { participantId } = req.body || {};
    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required' });
    }
    const otherId = new mongoose.Types.ObjectId(participantId);
    const myId = new mongoose.Types.ObjectId(userId);
    if (otherId.toString() === myId.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    const existing = await Conversation.findOne({
      participants: { $all: [myId, otherId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    }).lean();

    if (existing) {
      const other = await User.findById(otherId).select('fullName avatar role').lean();
      const lastMsg = await ChatMessage.findOne({ conversation: existing._id }).sort({ createdAt: -1 }).lean();
      return res.json({
        id: existing._id.toString(),
        participantId: otherId.toString(),
        profileId: otherId.toString(),
        profileName: other?.fullName || 'User',
        profileAvatar: other?.avatar || '',
        profileType: other?.role || 'visitor',
        lastMessage: lastMsg?.text || '',
        lastMessageTime: lastMsg?.createdAt ? new Date(lastMsg.createdAt).toISOString() : existing.updatedAt,
        unread: 0,
        online: false,
      });
    }

    const conv = await Conversation.create({ participants: [myId, otherId] });
    const other = await User.findById(otherId).select('fullName avatar role').lean();
    res.status(201).json({
      id: conv._id.toString(),
      participantId: otherId.toString(),
      profileId: otherId.toString(),
      profileName: other?.fullName || 'User',
      profileAvatar: other?.avatar || '',
      profileType: other?.role || 'visitor',
      lastMessage: '',
      lastMessageTime: conv.updatedAt,
      unread: 0,
      online: false,
    });
  } catch (err) {
    console.error('[Chat] createOrGetConversation error:', err);
    res.status(500).json({ message: 'Failed to create conversation' });
  }
}

/**
 * GET /conversations/:id/messages - paginated messages for a conversation.
 *
 * Optimizations:
 * - No populate: uses denormalized senderName/senderAvatar on ChatMessage.
 * - .lean(): returns plain objects, no Mongoose docs (faster, less memory).
 * - Index (conversation, createdAt -1): efficient sort + limit.
 * - Optional cursor: ?before=messageId or ?after=messageId for cursor-based
 *   pagination (efficient for large histories; avoids large skip()).
 */
async function getMessages(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);
    const skip = parseInt(req.query.skip, 10) || 0;
    const before = req.query.before;
    const after = req.query.after;

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.some((p) => p.toString() === userId)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const filter = { conversation: conversationId };

    if (before) {
      const beforeDoc = await ChatMessage.findOne(
        { _id: before, conversation: conversationId },
        { createdAt: 1 }
      ).lean();
      if (beforeDoc) filter.createdAt = { $lt: beforeDoc.createdAt };
    } else if (after) {
      const afterDoc = await ChatMessage.findOne(
        { _id: after, conversation: conversationId },
        { createdAt: 1 }
      ).lean();
      if (afterDoc) filter.createdAt = { $gt: afterDoc.createdAt };
    }

    const messages = await ChatMessage.find(filter)
      .sort({ createdAt: -1 })
      .skip(before || after ? 0 : skip)
      .limit(limit)
      .select('_id text sender senderName senderAvatar createdAt sharedPost')
      .lean();

    const shaped = messages.reverse().map((m) => {
      const normalized = normalizeSharedPost(m.sharedPost);
      return {
        id: m._id.toString(),
        chatId: conversationId,
        text: m.text,
        sender: m.sender && m.sender.toString() === userId ? 'user' : 'other',
        timestamp: m.createdAt,
        senderName: m.senderName || 'User',
        senderAvatar: m.senderAvatar || '',
        ...(normalized && { sharedPost: normalized }),
      };
    });

    res.json(shaped);
  } catch (err) {
    console.error('[Chat] getMessages error:', err);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
}

/**
 * POST /conversations/:id/messages - send a message to a conversation (e.g. share post/thread via REST).
 * Creates the message in DB, broadcasts via Socket.IO so recipients see it in real time, and creates notifications.
 */
async function sendMessage(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const body = req.body || {};
    const text = body.text ? String(body.text).trim() : '';
    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const sharedTitle =
      body.sharedPost && typeof body.sharedPost === 'object'
        ? String(body.sharedPost.postTitle ?? body.sharedPost.title ?? '').trim()
        : '';
    const allowed = await respondIfUnsafe(res, { text: [text, sharedTitle].filter(Boolean) });
    if (!allowed) return;

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.some((p) => p.toString() === userId)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const sender = await User.findById(userId).select('fullName avatar').lean();
    const senderName = sender?.fullName || 'User';
    const senderAvatar = sender?.avatar || '';

    const raw = body.sharedPost && typeof body.sharedPost === 'object' ? body.sharedPost : null;
    const postId = raw?.postId ? String(raw.postId).trim() : (raw?.url && raw.url.match(/\/post\/([^/]+)/)?.[1]) || (raw?.url && raw.url.match(/\/thread\/([^/]+)/)?.[1]);
    const title = (raw?.postTitle ?? raw?.title) ? String(raw.postTitle ?? raw.title).trim() : undefined;
    const image = (raw?.postImage ?? raw?.image) && String(raw.postImage ?? raw.image).trim() ? String(raw.postImage ?? raw.image).trim() : undefined;
    const url = (raw?.postUrl ?? raw?.url) ? String(raw.postUrl ?? raw.url).trim() : undefined;
    const authorName = (raw?.postOwnerName ?? raw?.authorName) && String(raw.postOwnerName ?? raw.authorName).trim() ? String(raw.postOwnerName ?? raw.authorName).trim() : undefined;
    const ownerAvatar = raw?.postOwnerAvatar && String(raw.postOwnerAvatar).trim() ? String(raw.postOwnerAvatar).trim() : undefined;
    const sharedPost = (title || url) ? { postId, title, image, url, authorName, ownerAvatar } : undefined;

    const msg = await ChatMessage.create({
      conversation: conversationId,
      sender: userId,
      senderName,
      senderAvatar,
      text,
      ...(sharedPost && { sharedPost }),
    });

    const payload = {
      id: msg._id.toString(),
      chatId: conversationId,
      text: msg.text,
      senderId: userId,
      sender: 'user',
      timestamp: msg.createdAt,
      senderName,
      senderAvatar,
      ...(normalizeSharedPost(msg.sharedPost) && { sharedPost: normalizeSharedPost(msg.sharedPost) }),
    };

    const io = req.app.get('io');
    if (io) io.to(`conv:${conversationId}`).emit('message', payload);

    const recipients = conv.participants.filter((p) => p.toString() !== userId);
    setImmediate(() => {
      recipients.forEach((recipientId) => {
        upsertMessageNotification(recipientId, userId, conversationId).catch((notifErr) =>
          console.error('[Chat] notification create error:', notifErr)
        );
      });
    });

    res.status(201).json(payload);
  } catch (err) {
    console.error('[Chat] sendMessage error:', err);
    res.status(500).json({ message: 'Failed to send message' });
  }
}

const EDIT_DELETE_WINDOW_MS = 20 * 60 * 1000; // 20 minutes

function isWithinEditWindow(createdAt) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  return Date.now() - created <= EDIT_DELETE_WINDOW_MS;
}

/**
 * PATCH /conversations/:id/messages/:messageId - edit own message (within 20 minutes).
 */
async function editMessage(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const messageId = req.params.messageId;
    const body = req.body || {};
    const text = body.text != null ? String(body.text).trim() : '';

    if (!text) {
      return res.status(400).json({ message: 'Message text is required' });
    }

    const allowed = await respondIfUnsafe(res, { text });
    if (!allowed) return;

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.some((p) => p.toString() === userId)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const msg = await ChatMessage.findOne({
      _id: messageId,
      conversation: conversationId,
      sender: userId,
    }).lean();

    if (!msg) {
      return res.status(404).json({ message: 'Message not found or you can only edit your own messages' });
    }
    if (!isWithinEditWindow(msg.createdAt)) {
      return res.status(403).json({ message: 'Messages can only be edited within 20 minutes of sending' });
    }

    const updated = await ChatMessage.findByIdAndUpdate(
      messageId,
      { $set: { text } },
      { new: true }
    ).lean();

    const payload = {
      id: updated._id.toString(),
      chatId: conversationId,
      text: updated.text,
      senderId: userId,
      sender: 'user',
      timestamp: updated.createdAt,
      senderName: updated.senderName,
      senderAvatar: updated.senderAvatar,
      ...(normalizeSharedPost(updated.sharedPost) && { sharedPost: normalizeSharedPost(updated.sharedPost) }),
    };

    const io = req.app.get('io');
    if (io) io.to(`conv:${conversationId}`).emit('message_edited', payload);

    res.json(payload);
  } catch (err) {
    console.error('[Chat] editMessage error:', err);
    res.status(500).json({ message: 'Failed to edit message' });
  }
}

/**
 * DELETE /conversations/:id/messages/:messageId - delete own message (within 20 minutes).
 */
async function deleteMessage(req, res) {
  try {
    const userId = req.user.id;
    const conversationId = req.params.id;
    const messageId = req.params.messageId;

    const conv = await Conversation.findById(conversationId).lean();
    if (!conv || !conv.participants.some((p) => p.toString() === userId)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const msg = await ChatMessage.findOne({
      _id: messageId,
      conversation: conversationId,
      sender: userId,
    }).lean();

    if (!msg) {
      return res.status(404).json({ message: 'Message not found or you can only delete your own messages' });
    }
    if (!isWithinEditWindow(msg.createdAt)) {
      return res.status(403).json({ message: 'Messages can only be deleted within 20 minutes of sending' });
    }

    await ChatMessage.findByIdAndDelete(messageId);

    const io = req.app.get('io');
    if (io) io.to(`conv:${conversationId}`).emit('message_deleted', { conversationId, messageId });

    res.json({ success: true, messageId });
  } catch (err) {
    console.error('[Chat] deleteMessage error:', err);
    res.status(500).json({ message: 'Failed to delete message' });
  }
}

module.exports = {
  getConversations,
  createOrGetConversation,
  getMessages,
  sendMessage,
  editMessage,
  deleteMessage,
};
