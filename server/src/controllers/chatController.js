const Conversation = require('../models/Conversation');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const { Types } = require('mongoose');
const { respondIfUnsafe } = require('../utils/assertContentSafe');
const { areUsersBlocked, canBlockTarget } = require('../utils/chatBlock');
const { isUserOnline } = require('../utils/presence');
const {
  canAccessConversation,
  resolveConversationPeer,
  getMessageNotificationRecipients,
  resolveMessageSide,
} = require('../utils/conversationAccess');
const { assertCanSendAsAdmin, getSupportLockState } = require('../utils/supportLock');
const {
  getCanonicalAdmin,
  toPublicAdminProfile,
  MASHTAL_SUPPORT_NAME,
  MASHTAL_SUPPORT_AVATAR,
} = require('../utils/publicAdminIdentity');

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
    || (sp.url && sp.url.match(/\/threads?\/([^/]+)/)?.[1])
    || (sp.url && sp.url.match(/\/product\/([^/]+)/)?.[1]);
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
 * GET /conversations - list conversations for current user (with last message and participant info).
 * Admins also receive every support (isSupport) conversation.
 */
async function getConversations(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    const query =
      role === 'admin'
        ? { $or: [{ participants: userId }, { isSupport: true }] }
        : { participants: userId };

    const conversations = await Conversation.find(query).sort({ updatedAt: -1 }).lean();

    // Deduplicate by id (admin may match both clauses)
    const seen = new Set();
    const unique = [];
    for (const conv of conversations) {
      const id = String(conv._id);
      if (seen.has(id)) continue;
      seen.add(id);
      unique.push(conv);
    }

    const result = await Promise.all(
      unique.map(async (conv) => {
        const peer = await resolveConversationPeer(conv, userId, role);
        const lastMsg = await ChatMessage.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .lean();
        // Hide empty conversations from the list (no messages yet)
        if (!lastMsg) return null;
        return {
          id: String(conv._id),
          participantId: peer.profileId,
          profileId: peer.profileId,
          profileName: peer.profileName,
          profileAvatar: peer.profileAvatar,
          profileType: peer.profileType,
          lastMessage: lastMsg?.text || '',
          lastMessageTime: lastMsg?.createdAt
            ? new Date(lastMsg.createdAt).toISOString()
            : conv.updatedAt,
          unread: 0,
          online: peer.profileId ? isUserOnline(peer.profileId) : false,
          isSupport: !!conv.isSupport,
        };
      })
    );

    res.json(result.filter(Boolean));
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
    const role = req.user.role;
    const { participantId } = req.body || {};
    if (!participantId) {
      return res.status(400).json({ message: 'participantId is required' });
    }
    const otherId = new mongoose.Types.ObjectId(participantId);
    const myId = new mongoose.Types.ObjectId(userId);
    if (otherId.toString() === myId.toString()) {
      return res.status(400).json({ message: 'Cannot chat with yourself' });
    }

    if (await areUsersBlocked(userId, otherId)) {
      return res.status(403).json({ message: 'Messaging is blocked between these accounts' });
    }

    const otherUser = await User.findById(otherId).select('fullName avatar role businessProfile.companyName').lean();
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Chat with Mashtal admin ↔ user/business is a shared support thread
    const markSupport =
      (otherUser.role === 'admin' && role !== 'admin') ||
      (role === 'admin' && otherUser.role !== 'admin');

    let existing = await Conversation.findOne({
      participants: { $all: [myId, otherId] },
      $expr: { $eq: [{ $size: '$participants' }, 2] },
    });

    if (!existing && markSupport) {
      // Prefer an existing support thread for this customer
      const customerId = role === 'admin' ? otherId : myId;
      existing = await Conversation.findOne({
        isSupport: true,
        participants: customerId,
      });
    }

    if (existing) {
      if (markSupport && !existing.isSupport) {
        existing.isSupport = true;
        await existing.save();
      }
      const lean = existing.toObject ? existing.toObject() : existing;
      const peer = await resolveConversationPeer(lean, userId, role);
      const lastMsg = await ChatMessage.findOne({ conversation: existing._id }).sort({ createdAt: -1 }).lean();
      return res.json({
        id: String(existing._id),
        participantId: peer.profileId,
        profileId: peer.profileId,
        profileName: peer.profileName,
        profileAvatar: peer.profileAvatar,
        profileType: peer.profileType,
        lastMessage: lastMsg?.text || '',
        lastMessageTime: lastMsg?.createdAt
          ? new Date(lastMsg.createdAt).toISOString()
          : existing.updatedAt,
        unread: 0,
        online: peer.profileId ? isUserOnline(peer.profileId) : false,
        isSupport: !!lean.isSupport || markSupport,
      });
    }

    const conv = await Conversation.create({
      participants: [myId, otherId],
      isSupport: markSupport,
    });
    const peer = await resolveConversationPeer(conv.toObject(), userId, role);
    res.status(201).json({
      id: String(conv._id),
      participantId: peer.profileId,
      profileId: peer.profileId,
      profileName: peer.profileName,
      profileAvatar: peer.profileAvatar,
      profileType: peer.profileType,
      lastMessage: '',
      lastMessageTime: conv.updatedAt,
      unread: 0,
      online: peer.profileId ? isUserOnline(peer.profileId) : false,
      isSupport: markSupport,
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
    if (!canAccessConversation(conv, userId, req.user.role)) {
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
      .select('_id text sender senderName senderAvatar senderRole createdAt sharedPost')
      .lean();

    // Backfill senderRole for older messages (needed for support inbox alignment)
    let roleBySender = {};
    if (conv.isSupport && req.user.role === 'admin') {
      const missing = [
        ...new Set(
          messages
            .filter((m) => !m.senderRole)
            .map((m) => String(m.sender))
            .filter(Boolean)
        ),
      ];
      if (missing.length) {
        const users = await User.find({ _id: { $in: missing } }).select('role').lean();
        roleBySender = Object.fromEntries(users.map((u) => [String(u._id), u.role]));
      }
    }

    const shaped = messages.reverse().map((m) => {
      const normalized = normalizeSharedPost(m.sharedPost);
      const senderId = m.sender ? String(m.sender) : '';
      const senderRole = m.senderRole || roleBySender[senderId] || 'visitor';
      const isAdminSender = senderRole === 'admin';
      return {
        id: m._id.toString(),
        chatId: conversationId,
        text: m.text,
        sender: resolveMessageSide({
          senderId,
          senderRole,
          viewerId: userId,
          viewerRole: req.user.role,
          isSupport: !!conv.isSupport,
        }),
        senderId,
        senderRole,
        timestamp: m.createdAt,
        senderName: isAdminSender ? MASHTAL_SUPPORT_NAME : (m.senderName || 'User'),
        senderAvatar: isAdminSender ? MASHTAL_SUPPORT_AVATAR : (m.senderAvatar || ''),
        ...(normalized && { sharedPost: normalized }),
      };
    });

    const lock =
      conv.isSupport && req.user.role === 'admin'
        ? await getSupportLockState(conversationId)
        : null;

    res.json({ messages: shaped, isSupport: !!conv.isSupport, supportLock: lock });
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
    if (!canAccessConversation(conv, userId, req.user.role)) {
      return res.status(404).json({ message: 'Conversation not found' });
    }

    const otherId = conv.participants.find((p) => p.toString() !== userId);
    if (otherId && (await areUsersBlocked(userId, otherId))) {
      return res.status(403).json({ message: 'Messaging is blocked between these accounts' });
    }

    const sender = await User.findById(userId).select('fullName avatar role').lean();
    const senderRole = sender?.role || 'visitor';
    const senderName =
      senderRole === 'admin' ? MASHTAL_SUPPORT_NAME : (sender?.fullName || 'User');
    const senderAvatar =
      senderRole === 'admin' ? MASHTAL_SUPPORT_AVATAR : (sender?.avatar || '');

    if (conv.isSupport && senderRole === 'admin') {
      const lockResult = await assertCanSendAsAdmin(
        conversationId,
        req.user.operatorId || userId,
        req.user.operatorName || senderName
      );
      if (!lockResult.ok) {
        return res.status(423).json({
          message: lockResult.message,
          code: lockResult.code,
          supportLock: lockResult.lock,
        });
      }
    }

    const raw = body.sharedPost && typeof body.sharedPost === 'object' ? body.sharedPost : null;
    const postId = raw?.postId ? String(raw.postId).trim() : (raw?.url && raw.url.match(/\/post\/([^/]+)/)?.[1]) || (raw?.url && raw.url.match(/\/thread\/([^/]+)/)?.[1]) || (raw?.url && raw.url.match(/\/product\/([^/]+)/)?.[1]);
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
      senderRole,
      text,
      ...(sharedPost && { sharedPost }),
    });

    const payload = {
      id: msg._id.toString(),
      chatId: conversationId,
      text: msg.text,
      senderId: userId,
      senderRole,
      sender: resolveMessageSide({
        senderId: userId,
        senderRole,
        viewerId: userId,
        viewerRole: req.user.role,
        isSupport: !!conv.isSupport,
      }),
      timestamp: msg.createdAt,
      senderName,
      senderAvatar,
      isSupport: !!conv.isSupport,
      ...(normalizeSharedPost(msg.sharedPost) && { sharedPost: normalizeSharedPost(msg.sharedPost) }),
    };

    const io = req.app.get('io');
    if (io) io.to(`conv:${conversationId}`).emit('message', payload);

    const recipients = await getMessageNotificationRecipients(conv, userId);
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
    if (!canAccessConversation(conv, userId, req.user.role)) {
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
    if (!canAccessConversation(conv, userId, req.user.role)) {
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
  getSupportAdmin,
  getOrCreateSupportConversation,
  blockUser,
  unblockUser,
  getBlockStatus,
};

/** Returns the shared Mashtal Support public profile (logo + canonical admin id). */
async function getSupportAdmin(req, res) {
  try {
    const admin = await getCanonicalAdmin();
    if (!admin) {
      return res.status(404).json({ message: 'No support agent available' });
    }
    res.json(toPublicAdminProfile(admin));
  } catch (err) {
    console.error('[Chat] getSupportAdmin error:', err);
    res.status(500).json({ message: 'Failed to load support contact' });
  }
}

/**
 * POST /support - open or create the shared Mashtal support conversation for the current user.
 * Visible to every admin.
 */
async function getOrCreateSupportConversation(req, res) {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === 'admin') {
      return res.status(400).json({ message: 'Admins receive support messages in their chat list' });
    }

    const admin = await getCanonicalAdmin();
    if (!admin) {
      return res.status(404).json({ message: 'No support agent available' });
    }

    let conv = await Conversation.findOne({
      isSupport: true,
      participants: userId,
    });

    if (!conv) {
      // Migrate older 1:1 chats with any admin into the shared support inbox
      const admins = await User.find({ role: 'admin' }).select('_id').lean();
      for (const a of admins) {
        const legacy = await Conversation.findOne({
          participants: { $all: [userId, a._id] },
          $expr: { $eq: [{ $size: '$participants' }, 2] },
        });
        if (legacy) {
          legacy.isSupport = true;
          await legacy.save();
          conv = legacy;
          break;
        }
      }
    }

    if (!conv) {
      conv = await Conversation.create({
        participants: [userId, admin._id],
        isSupport: true,
      });
    } else if (!conv.isSupport) {
      conv.isSupport = true;
      await conv.save();
    }

    const lean = conv.toObject ? conv.toObject() : conv;
    const peer = await resolveConversationPeer(lean, userId, role);
    const lastMsg = await ChatMessage.findOne({ conversation: conv._id }).sort({ createdAt: -1 }).lean();

    res.json({
      id: String(conv._id),
      participantId: peer.profileId,
      profileId: peer.profileId,
      profileName: peer.profileName,
      profileAvatar: peer.profileAvatar,
      profileType: peer.profileType,
      lastMessage: lastMsg?.text || '',
      lastMessageTime: lastMsg?.createdAt
        ? new Date(lastMsg.createdAt).toISOString()
        : conv.updatedAt,
      unread: 0,
      online: peer.profileId ? isUserOnline(peer.profileId) : false,
      isSupport: true,
    });
  } catch (err) {
    console.error('[Chat] getOrCreateSupportConversation error:', err);
    res.status(500).json({ message: 'Failed to open support chat' });
  }
}

async function blockUser(req, res) {
  try {
    const userId = req.user.id;
    const { participantId } = req.params;
    if (!participantId || participantId === userId) {
      return res.status(400).json({ message: 'Invalid participant' });
    }

    const [me, target] = await Promise.all([
      User.findById(userId).select('role').lean(),
      User.findById(participantId).select('role').lean(),
    ]);
    if (!me || !target) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (!canBlockTarget(me.role, target.role)) {
      return res.status(403).json({
        message:
          target.role === 'admin'
            ? 'You cannot block Mashtal Support'
            : 'You are not allowed to block this user',
      });
    }

    await User.findByIdAndUpdate(userId, {
      $addToSet: { blockedUsers: participantId },
    });
    res.json({ success: true, blocked: true });
  } catch (err) {
    console.error('[Chat] blockUser error:', err);
    res.status(500).json({ message: 'Failed to block user' });
  }
}

async function unblockUser(req, res) {
  try {
    const userId = req.user.id;
    const { participantId } = req.params;
    if (!participantId) {
      return res.status(400).json({ message: 'Invalid participant' });
    }
    await User.findByIdAndUpdate(userId, {
      $pull: { blockedUsers: participantId },
    });
    res.json({ success: true, blocked: false });
  } catch (err) {
    console.error('[Chat] unblockUser error:', err);
    res.status(500).json({ message: 'Failed to unblock user' });
  }
}

async function getBlockStatus(req, res) {
  try {
    const userId = req.user.id;
    const { participantId } = req.params;
    const [me, target] = await Promise.all([
      User.findById(userId).select('blockedUsers role').lean(),
      User.findById(participantId).select('role').lean(),
    ]);
    const blockedByMe = (me?.blockedUsers || []).some((id) => String(id) === String(participantId));
    const blocked = await areUsersBlocked(userId, participantId);
    const canBlock = canBlockTarget(me?.role, target?.role);
    res.json({ blocked, blockedByMe, canBlock });
  } catch (err) {
    console.error('[Chat] getBlockStatus error:', err);
    res.status(500).json({ message: 'Failed to get block status' });
  }
}
