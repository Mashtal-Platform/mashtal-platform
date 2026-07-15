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
app.use('/api/reviews', reviewRoutes);
app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/api/locations', locationRoutes);
app.use('/api/ai', aiRoutes);
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
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) return next(new Error('Authentication required'));
    try {
      const payload = jwt.verify(token, jwtSecret);
      socket.userId = payload.sub;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`);

    // Preload sender display info once per connection so send_message needs no extra DB read.
    // Fire-and-forget: does not block connection; first message may still use fallback if slow.
    User.findById(socket.userId)
      .select('fullName avatar')
      .lean()
      .then((u) => {
        if (u) {
          socket.senderName = u.fullName || 'User';
          socket.senderAvatar = u.avatar || '';
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
        // Single lean query: conversation membership check only (no populate).
        const conv = await Conversation.findById(conversationId).lean();
        if (!conv || !conv.participants.some((p) => p.toString() === socket.userId)) {
          return callback && callback({ error: 'Conversation not found' });
        }

        // Use preloaded sender info from connection; fallback to one lightweight read if not set yet.
        let senderName = socket.senderName;
        let senderAvatar = socket.senderAvatar;
        if (senderName === undefined || senderAvatar === undefined) {
          const u = await User.findById(socket.userId).select('fullName avatar').lean();
          senderName = u?.fullName || 'User';
          senderAvatar = u?.avatar || '';
          socket.senderName = senderName;
          socket.senderAvatar = senderAvatar;
        }

        // One write: save with denormalized sender info so we never populate on read or broadcast.
        const msg = await ChatMessage.create({
          conversation: conversationId,
          sender: socket.userId,
          senderName: senderName || 'User',
          senderAvatar: senderAvatar || '',
          text: text.trim(),
        });

        // Build payload from saved doc – no second query, no populate.
        // Frontend derives sender label: sender = (payload.senderId === currentUser.id) ? 'user' : 'other'
        const payload = {
          id: msg._id.toString(),
          chatId: conversationId,
          text: msg.text,
          senderId: socket.userId,
          sender: 'user',
          timestamp: msg.createdAt,
          senderName: msg.senderName || 'User',
          senderAvatar: msg.senderAvatar || '',
        };
        io.to(`conv:${conversationId}`).emit('message', payload);

        // Notifications: one per sender, increment messageCount so list shows "X has sent you n messages".
        const recipients = conv.participants.filter((p) => p.toString() !== socket.userId);
        setImmediate(() => {
          recipients.forEach((recipientId) => {
            upsertMessageNotification(recipientId, socket.userId, conversationId).catch((notifErr) =>
              console.error('[Socket] notification create error:', notifErr)
            );
          });
        });

        if (callback) callback({ ok: true, message: payload });
      } catch (err) {
        console.error('[Socket] send_message error:', err);
        if (callback) callback({ error: err.message || 'Failed to send message' });
      }
    });
  });

  app.set('io', io);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on port ${PORT} (HTTP + WebSocket)`);
    try {
      const { startSubscriptionMaintenance } = require('./utils/subscription');
      startSubscriptionMaintenance();
    } catch (err) {
      console.error('[Server] Failed to start subscription maintenance:', err?.message || err);
    }
  });
});

