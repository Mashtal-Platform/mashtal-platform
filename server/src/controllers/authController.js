const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { sendVerificationEmail } = require('../services/emailService');
const {
  isValidPhone,
  normalizeBusinessProfile,
  validateBusinessProfile,
} = require('../utils/businessProfile');
const {
  buildAdminAuthSession,
  shapeAdminMeResponse,
} = require('../utils/publicAdminIdentity');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

function signToken(payloadOrUser) {
  const payload = payloadOrUser.sub
    ? payloadOrUser
    : {
        sub: payloadOrUser._id.toString(),
        role: payloadOrUser.role,
        email: payloadOrUser.email,
        fullName: payloadOrUser.fullName,
      };
  return jwt.sign(payload, getJwtSecret(), { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
}

/** Issue JWT + user JSON; admins always open the shared canonical account. */
async function issueAuthResponse(userDoc) {
  const plain = userDoc.toJSON ? userDoc.toJSON() : userDoc;
  if (plain.role === 'admin') {
    const session = await buildAdminAuthSession(userDoc);
    if (session) {
      return {
        token: signToken(session.tokenPayload),
        user: session.user,
      };
    }
  }
  return {
    token: signToken(userDoc),
    user: toUserResponse(userDoc),
  };
}

function toUserResponse(userDoc) {
  const u = userDoc.toJSON ? userDoc.toJSON() : userDoc;
  return u;
}

let googleClient;

function getGoogleClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('GOOGLE_CLIENT_ID is not set');
  if (!googleClient) googleClient = new OAuth2Client(clientId);
  return { client: googleClient, clientId };
}

async function register(req, res) {
  try {
    const {
      fullName,
      email,
      password,
      role = 'visitor',
      avatar,
      businessProfile,
      professionalProfile,
    } = req.body || {};

    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email and password are required' });
    }
    if (typeof password !== 'string' || password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const phoneFields = [
      businessProfile?.phone,
      businessProfile?.wishPhone,
      professionalProfile?.phone,
    ].filter(Boolean);
    for (const p of phoneFields) {
      if (!isValidPhone(p)) {
        return res.status(400).json({
          message: 'Phone must be a valid number with country code (e.g. +961 70 123 456). Only digits, +, spaces and dashes allowed.',
        });
      }
    }

    const allowedRoles = ['visitor', 'business'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Allowed roles: visitor, business' });
    }

    let normalizedBusinessProfile;
    if (role === 'business') {
      const errMsg = validateBusinessProfile(businessProfile || {}, { requireAll: true });
      if (errMsg) return res.status(400).json({ message: errMsg });
      normalizedBusinessProfile = {
        ...normalizeBusinessProfile(businessProfile || {}),
        rating: 3.5,
        reviewsCount: 0,
      };
      delete normalizedBusinessProfile.hours;
      if (!normalizedBusinessProfile.about) delete normalizedBusinessProfile.about;
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail }).lean();
    if (existing) return res.status(409).json({ message: 'Email already in use' });

    const passwordHash = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Keep role as visitor until the business fee is paid.
    // Draft profile lives in pendingBusinessProfile until activation.
    const user = await User.create({
      fullName,
      email: normalizedEmail,
      passwordHash,
      role: 'visitor',
      avatar,
      pendingBusinessProfile: role === 'business' ? normalizedBusinessProfile : undefined,
      verified: false,
      emailVerificationToken,
      emailVerificationExpires,
    });

    try {
      await sendVerificationEmail(normalizedEmail, emailVerificationToken);
    } catch (mailErr) {
      console.error('[Auth] Failed to send verification email:', mailErr);
    }

    res.status(201).json({
      requiresVerification: true,
      message: 'Account created. Please check your email and click the verification link to sign in.',
      user: toUserResponse(user),
      needsPayment: role === 'business',
      pendingBusinessUpgrade: role === 'business',
    });
  } catch (err) {
    console.error('[Auth] register error:', err);
    res.status(500).json({ message: 'Failed to register' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ message: 'email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash +emailVerificationToken');
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.passwordHash) {
      return res.status(401).json({
        message: 'This account uses Google sign-in. Continue with Google instead.',
      });
    }
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    if (!user.verified) {
      const hasPendingVerification = user.emailVerificationToken != null && String(user.emailVerificationToken).trim() !== '';
      if (hasPendingVerification) {
        return res.status(403).json({
          message: 'Please verify your email before signing in. Check your inbox for the verification link.',
          code: 'EMAIL_NOT_VERIFIED',
        });
      }
      user.verified = true;
      await user.save({ validateBeforeSave: false });
    }

    const { token, user: sessionUser } = await issueAuthResponse(user);
    res.json({ token, user: sessionUser });
  } catch (err) {
    console.error('[Auth] login error:', err);
    res.status(500).json({ message: 'Failed to login' });
  }
}

async function googleLogin(req, res) {
  try {
    const credential = req.body?.credential;
    if (!credential || typeof credential !== 'string') {
      return res.status(400).json({ message: 'Google credential is required' });
    }

    const { client, clientId } = getGoogleClient();
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();

    if (!payload?.sub || !payload.email || !payload.email_verified) {
      return res.status(401).json({ message: 'Google did not provide a verified email address' });
    }

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    let user = await User.findOne({
      $or: [{ googleId: payload.sub }, { email: normalizedEmail }],
    }).select('+googleId +emailVerificationToken +emailVerificationExpires');

    if (user) {
      if (user.googleId && user.googleId !== payload.sub) {
        return res.status(409).json({ message: 'This email is linked to another Google account' });
      }
      user.googleId = payload.sub;
      user.verified = true;
      user.emailVerificationToken = undefined;
      user.emailVerificationExpires = undefined;
      if (!user.avatar && payload.picture) user.avatar = payload.picture;
      await user.save({ validateBeforeSave: false });
    } else {
      const requestedRole = req.body?.role === 'business' ? 'business' : 'visitor';
      let normalizedBusinessProfile;
      if (requestedRole === 'business') {
        const profile = req.body?.businessProfile || {};
        const errMsg = validateBusinessProfile(profile, { requireAll: true });
        if (errMsg) return res.status(400).json({ message: errMsg });
        for (const phone of [profile.phone, profile.wishPhone].filter(Boolean)) {
          if (!isValidPhone(phone)) {
            return res.status(400).json({
              message: 'Phone must be a valid number with country code (e.g. +961 70 123 456).',
            });
          }
        }
        normalizedBusinessProfile = {
          ...normalizeBusinessProfile(profile),
          rating: 3.5,
          reviewsCount: 0,
        };
        delete normalizedBusinessProfile.hours;
        if (!normalizedBusinessProfile.about) delete normalizedBusinessProfile.about;
      }

      user = await User.create({
        fullName: payload.name || normalizedEmail.split('@')[0],
        email: normalizedEmail,
        googleId: payload.sub,
        avatar: payload.picture,
        role: 'visitor',
        verified: true,
        pendingBusinessProfile: normalizedBusinessProfile,
      });
    }

    const { token, user: sessionUser } = await issueAuthResponse(user);
    const pendingUpgrade = !!(user.pendingBusinessProfile && user.role !== 'business');
    res.json({
      token,
      user: {
        ...sessionUser,
        needsPayment: pendingUpgrade || (user.role === 'business' && user.subscriptionStatus !== 'active'),
        pendingBusinessUpgrade: pendingUpgrade,
      },
    });
  } catch (err) {
    if (err?.message === 'GOOGLE_CLIENT_ID is not set') {
      console.error('[Auth] Google sign-in is not configured');
      return res.status(503).json({ message: 'Google sign-in is not configured yet' });
    }
    console.error('[Auth] googleLogin error:', err?.message || err);
    res.status(401).json({ message: 'Invalid or expired Google sign-in' });
  }
}

async function me(req, res) {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'admin') {
      return res.json(shapeAdminMeResponse(user, req.user));
    }
    res.json(user);
  } catch (err) {
    console.error('[Auth] me error:', err);
    res.status(500).json({ message: 'Failed to fetch current user' });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.query || {};
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    })
      .select('+emailVerificationToken +emailVerificationExpires')
      .exec();

    if (!user) {
      return res.status(400).json({
        message: 'Invalid or expired verification link. Please sign up again or request a new link.',
      });
    }

    user.verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    const { token: jwtToken, user: sessionUser } = await issueAuthResponse(user);
    const pendingUpgrade = !!(user.pendingBusinessProfile && user.role !== 'business');
    res.json({
      token: jwtToken,
      user: {
        ...sessionUser,
        needsPayment: pendingUpgrade || (user.role === 'business' && user.subscriptionStatus !== 'active'),
        pendingBusinessUpgrade: pendingUpgrade,
      },
    });
  } catch (err) {
    console.error('[Auth] verifyEmail error:', err);
    res.status(500).json({ message: 'Verification failed' });
  }
}

module.exports = {
  register,
  login,
  googleLogin,
  me,
  verifyEmail,
};

