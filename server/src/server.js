require('dotenv').config();
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Types } = require('mongoose');
const { connectDB } = require('./config/db');
const Conversation = require('./models/Conversation');
const ChatMessage = require('./models/ChatMessage');
const Notification = require('./models/Notification');
const User = require('./models/User');
const { markOnline, markOffline } = require('./utils/presence');
const { areUsersBlocked } = require('./utils/chatBlock');
const {
  canAccessConversation,
  getMessageNotificationRecipients,
  resolveMessageSide,
} = require('./utils/conversationAccess');
const {
  acquireSupportLock,
  releaseSupportLock,
  assertCanSendAsAdmin,
} = require('./utils/supportLock');
const {
  MASHTAL_SUPPORT_NAME,
  MASHTAL_SUPPORT_AVATAR,
  getCanonicalAdminId,
} = require('./utils/publicAdminIdentity');

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

const postRoutes = require('./routes/postRoutes');
const threadRoutes = require('./routes/threadRoutes');
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const commentRoutes = require('./routes/commentRoutes');
const orderRoutes = require('./routes/orderRoutes');
const savedItemRoutes = require('./routes/savedItemRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const stripePaymentRoutes = require('./routes/stripePaymentRoutes');
const stripeSubscriptionRoutes = require('./routes/stripeSubscriptionRoutes');
const wishSubscriptionRoutes = require('./routes/wishSubscriptionRoutes');
const aiRoutes = require('./routes/aiRoutes');
const translateRoutes = require('./routes/translateRoutes');
const { warmupModeration } = require('./services/moderationService');
const { assertContentSafe, ContentNotAllowedError } = require('./utils/assertContentSafe');

const app = express();

// CORS: when client uses credentials: 'include', origin cannot be '*'
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  process.env.FRONTEND_URL,
].filter(Boolean);

function isDevLocalOrigin(origin) {
  if (!origin || typeof origin !== 'string') return false;
  return /^http:\/\/(localhost|127\.0\.0\.1):(3000|3001|3002|5173|5174)$/.test(origin);
}

app.use(
  cors({
    origin(origin, cb) {
      if (!origin || allowedOrigins.includes(origin) || isDevLocalOrigin(origin)) {
        return cb(null, true);
      }
      return cb(null, false);
    },
    credentials: true,
  })
);

// Stripe webhooks require the raw request body (signature verification).
app.use(
  '/api/payments/stripe/webhook',
  express.raw({ type: 'application/json' })
);
// JSON body (for routes that don't use multipart)
// Skip Stripe webhook route since it needs the raw body.
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/stripe/webhook' || req.originalUrl.startsWith('/api/payments/stripe/webhook')) {
    return next();
  }
  return express.json({ limit: '1mb' })(req, res, next);
});
app.use((req, res, next) => {
  if (req.originalUrl === '/api/payments/stripe/webhook' || req.originalUrl.startsWith('/api/payments/stripe/webhook')) {
    return next();
  }
  return express.urlencoded({ extended: true, limit: '1mb' })(req, res, next);
});
app.use(morgan('dev'));

// Static images: public/images/products, public/images/posts, public/images/avatars
const publicDir = path.join(__dirname, '..', 'public');
app.use('/images', express.static(path.join(publicDir, 'images')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/threads', threadRoutes);
app.use('/api/users', userRoutes);
// Businesses are users with role=business; reuse routes under separate prefix
app.use('/api/businesses', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/saved', savedItemRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/locations', locationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/translate', translateRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/payments/stripe', stripePaymentRoutes);
app.use('/api/payments/stripe/subscription', stripeSubscriptionRoutes);
app.use('/api/payments/wish/subscription', wishSubscriptionRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

// Start server after DB connection
connectDB().then(() => {
  const httpServer = http.createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin(origin, cb) {
        if (!origin || allowedOrigins.includes(origin) || isDevLocalOrigin(origin)) {
          return cb(null, true);
        }
        return cb(null, false);
      },
      credentials: true,
    },
    path: '/socket.io',
  });

  const jwtSecret = process.env.JWT_SECRET;
  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, jwtSecret);
      let userId = payload.sub;
      let operatorId = payload.operatorId || null;
      if (payload.role === 'admin') {
        const canonicalId = await getCanonicalAdminId();
        if (canonicalId) {
          operatorId = payload.operatorId || payload.sub;
          userId = canonicalId;
        }
      }
      socket.userId = userId;
      socket.operatorId = operatorId || userId;
      socket.userRole = payload.role;
      socket.lockDisplayName = payload.operatorName || payload.fullName || 'Admin';
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);
    markOnline(socket.userId);
    io.emit('presence_update', { userId: String(socket.userId), online: true });

    // Preload sender display info once per connection so send_message needs no extra DB read.
    // Fire-and-forget: does not block connection; first message may still use fallback if slow.
    User.findById(socket.userId)
      .select('fullName avatar role')
      .lean()
      .then((u) => {
        if (u) {
          socket.userRole = u.role || socket.userRole;
          if (u.role === 'admin') {
            socket.senderName = MASHTAL_SUPPORT_NAME;
            socket.senderAvatar = MASHTAL_SUPPORT_AVATAR;
            // Keep lockDisplayName from JWT operator (set at auth)
            if (!socket.lockDisplayName) {
              socket.lockDisplayName = 'Admin';
            }
          } else {
            socket.senderName = u.fullName || 'User';
            socket.senderAvatar = u.avatar || '';
            socket.lockDisplayName = u.fullName || 'User';
          }
        }
      })
      .catch(() => {});

    socket.on('join_conversation', (conversationId) => {
      if (conversationId) socket.join(`conv:${conversationId}`);
    });

    socket.on('leave_conversation', (conversationId) => {
      if (conversationId) socket.leave(`conv:${conversationId}`);
    });

    socket.on('send_message', async (data, callback) => {
      const { conversationId, text } = data || {};
      if (!conversationId || !text || typeof text !== 'string' || !text.trim()) {
        return callback && callback({ error: 'conversationId and text required' });
      }
      try {
        try {
          await assertContentSafe({ text: text.trim() });
        } catch (modErr) {
          if (
            modErr instanceof ContentNotAllowedError ||
            modErr?.code === 'CONTENT_NOT_ALLOWED' ||
            modErr?.code === 'MODERATION_UNAVAILABLE'
          ) {
            return callback && callback({
              error: modErr.message,
              code: modErr.code || 'CONTENT_NOT_ALLOWED',
            });
          }
          throw modErr;
        }

        // Single lean query: conversation membership check only (no populate).
        const conv = await Conversation.findById(conversationId).lean();
        if (!canAccessConversation(conv, socket.userId, socket.userRole)) {
          return callback && callback({ error: 'Conversation not found' });
        }

        const otherId = conv.participants.find((p) => p.toString() !== socket.userId);
        if (otherId && (await areUsersBlocked(socket.userId, otherId))) {
          return callback && callback({ error: 'Messaging is blocked between these accounts', code: 'BLOCKED' });
        }

        // Use preloaded sender info from connection; fallback to one lightweight read if not set yet.
        let senderName = socket.senderName;
        let senderAvatar = socket.senderAvatar;
        let senderRole = socket.userRole || 'visitor';
        if (senderName === undefined || senderAvatar === undefined || !socket.userRole) {
          const u = await User.findById(socket.userId).select('fullName avatar role').lean();
          senderRole = u?.role || 'visitor';
          if (senderRole === 'admin') {
            senderName = MASHTAL_SUPPORT_NAME;
            senderAvatar = MASHTAL_SUPPORT_AVATAR;
            if (!socket.lockDisplayName) socket.lockDisplayName = 'Admin';
          } else {
            senderName = u?.fullName || 'User';
            senderAvatar = u?.avatar || '';
            socket.lockDisplayName = u?.fullName || 'User';
          }
          socket.senderName = senderName;
          socket.senderAvatar = senderAvatar;
          socket.userRole = senderRole;
        }

        if (conv.isSupport && senderRole === 'admin') {
          const lockResult = await assertCanSendAsAdmin(
            conversationId,
            socket.operatorId || socket.userId,
            socket.lockDisplayName || senderName
          );
          if (!lockResult.ok) {
            return callback && callback({
              error: lockResult.message,
              code: lockResult.code || 'SUPPORT_LOCKED',
              supportLock: lockResult.lock,
            });
          }
          io.to(`conv:${conversationId}`).emit('support_lock', {
            conversationId,
            lock: lockResult.lock,
          });
        }

        // One write: save with denormalized sender info so we never populate on read or broadcast.
        const msg = await ChatMessage.create({
          conversation: conversationId,
          sender: socket.userId,
          senderName: senderName || 'User',
          senderAvatar: senderAvatar || '',
          senderRole,
          text: text.trim(),
        });

        // Build payload from saved doc – no second query, no populate.
        // Clients derive side from senderId + senderRole (support: all admin msgs are "mine" for admins)
        const payload = {
          id: msg._id.toString(),
          chatId: conversationId,
          text: msg.text,
          senderId: socket.userId,
          senderRole,
          sender: 'user',
          timestamp: msg.createdAt,
          senderName: msg.senderName || 'User',
          senderAvatar: msg.senderAvatar || '',
          isSupport: !!conv.isSupport,
        };
        io.to(`conv:${conversationId}`).emit('message', payload);

        // Notifications: support messages go to all admins; otherwise to other participants.
        setImmediate(async () => {
          try {
            const recipients = await getMessageNotificationRecipients(conv, socket.userId);
            await Promise.all(
              recipients.map((recipientId) =>
                upsertMessageNotification(recipientId, socket.userId, conversationId)
              )
            );
          } catch (notifErr) {
            console.error('[Socket] notification create error:', notifErr);
          }
        });

        if (callback) callback({ ok: true, message: payload });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        if (callback) callback({ error: err.message || 'Failed to send message' });
      }
    });

    socket.on('support_lock_acquire', async (data, callback) => {
      try {
        const conversationId = data?.conversationId;
        if (!conversationId) return callback && callback({ error: 'conversationId required' });
        if (socket.userRole !== 'admin') {
          return callback && callback({ error: 'Only admins can lock support chats' });
        }
        const name = socket.lockDisplayName || socket.senderName || 'Admin';
        const result = await acquireSupportLock(
          conversationId,
          socket.operatorId || socket.userId,
          name
        );
        if (result.ok && result.lock) {
          io.to(`conv:${conversationId}`).emit('support_lock', {
            conversationId,
            lock: result.lock,
          });
        }
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message || 'Failed to acquire lock' });
      }
    });

    socket.on('support_lock_release', async (data, callback) => {
      try {
        const conversationId = data?.conversationId;
        if (!conversationId) return callback && callback({ error: 'conversationId required' });
        const result = await releaseSupportLock(
          conversationId,
          socket.operatorId || socket.userId
        );
        if (result.ok) {
          io.to(`conv:${conversationId}`).emit('support_lock', {
            conversationId,
            lock: null,
          });
        }
        if (callback) callback(result);
      } catch (err) {
        if (callback) callback({ error: err.message || 'Failed to release lock' });
      }
    });

    socket.on('disconnect', () => {
      markOffline(socket.userId);
      io.emit('presence_update', { userId: String(socket.userId), online: false });
    });
  });

  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} (HTTP + WebSocket)`);
    try {
      warmupModeration();
    } catch (err) {
      console.error('[Server] Moderation warmup failed:', err?.message || err);
    }
    try {
      const { isSmtpConfigured } = require('./services/emailService');
      console.log(
        isSmtpConfigured()
          ? '[Email] SMTP configured. Verification links will be emailed to users.'
          : '[Email] SMTP NOT configured (set SMTP_HOST/SMTP_USER/SMTP_PASS in .env). Verification links will print to this console.'
      );
    } catch (err) {
      console.error('[Server] Email service check failed:', err?.message || err);
    }
    try {
      const { startSubscriptionMaintenance } = require('./utils/subscription');
      startSubscriptionMaintenance();
    } catch (err) {
      console.error('[Server] Failed to start subscription maintenance:', err?.message || err);
    }
    try {
      const { startLocalDiseaseSidecar } = require('./ai/localDiseaseProcess');
      startLocalDiseaseSidecar();
    } catch (err) {
      console.error('[Server] Local disease sidecar start failed:', err?.message || err);
    }
  });
});

process.on('exit', () => {
  try {
    require('./ai/localDiseaseProcess').stopLocalDiseaseSidecar();
  } catch {
    /* ignore */
  }
});

