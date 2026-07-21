const User = require('../models/User');

const MASHTAL_SUPPORT_NAME = 'Mashtal Support';
/** Served from server/public/images (see static /images mount). */
const MASHTAL_SUPPORT_AVATAR = '/images/mashtal-logo.png';

let cachedCanonicalId = null;
let cachedCanonicalAt = 0;
const CACHE_MS = 60 * 1000;

function invalidateCanonicalAdminCache() {
  cachedCanonicalId = null;
  cachedCanonicalAt = 0;
}

/**
 * Canonical admin account all admins share after login.
 * Prefer SUPPORT_ADMIN_ID env, else oldest admin by createdAt.
 */
async function getCanonicalAdmin(select) {
  const projection =
    select ||
    '_id fullName email avatar coverImage bio location role followers following verified preferredLanguage createdAt';
  const envId = process.env.SUPPORT_ADMIN_ID;
  if (envId) {
    const byEnv = await User.findOne({ _id: envId, role: 'admin' }).select(projection).lean();
    if (byEnv) return byEnv;
  }
  return User.findOne({ role: 'admin' }).sort({ createdAt: 1 }).select(projection).lean();
}

async function getCanonicalAdminId() {
  if (cachedCanonicalId && Date.now() - cachedCanonicalAt < CACHE_MS) {
    return cachedCanonicalId;
  }
  const admin = await getCanonicalAdmin('_id');
  cachedCanonicalId = admin ? String(admin._id) : null;
  cachedCanonicalAt = Date.now();
  return cachedCanonicalId;
}

/** Notify only the shared admin account (unified inbox). */
async function getAdminRecipientIds() {
  const id = await getCanonicalAdminId();
  return id ? [id] : [];
}

/** Public face of Mashtal Support (shared by every admin account). */
function toPublicAdminProfile(canonicalAdmin) {
  const id = canonicalAdmin?._id
    ? String(canonicalAdmin._id)
    : canonicalAdmin?.id
      ? String(canonicalAdmin.id)
      : '';
  return {
    id,
    fullName: MASHTAL_SUPPORT_NAME,
    name: MASHTAL_SUPPORT_NAME,
    avatar: MASHTAL_SUPPORT_AVATAR,
    role: 'admin',
    type: 'admin',
    verified: true,
  };
}

async function getPublicAdminProfile() {
  const admin = await getCanonicalAdmin();
  if (!admin) return null;
  return toPublicAdminProfile(admin);
}

/** If targetId is any admin, return canonical admin id; else return targetId. */
async function resolveFollowTargetId(targetId) {
  const user = await User.findById(targetId).select('role').lean();
  if (!user) return null;
  if (user.role !== 'admin') return String(targetId);
  return getCanonicalAdminId();
}

/**
 * Build JWT + API user for an authenticated admin so every admin Gmail
 * opens the same shared account. operatorId keeps support-lock distinct.
 */
async function buildAdminAuthSession(operatorUser) {
  const canonical = await getCanonicalAdmin();
  if (!canonical) {
    return null;
  }
  const operatorId = String(operatorUser._id || operatorUser.id);
  const operatorEmail = operatorUser.email || '';
  const operatorName = operatorUser.fullName || 'Admin';

  const tokenPayload = {
    sub: String(canonical._id),
    role: 'admin',
    email: operatorEmail,
    fullName: MASHTAL_SUPPORT_NAME,
    operatorId,
    operatorEmail,
    operatorName,
  };

  const user = {
    ...canonical,
    id: String(canonical._id),
    _id: canonical._id,
    fullName: MASHTAL_SUPPORT_NAME,
    avatar: MASHTAL_SUPPORT_AVATAR,
    email: operatorEmail,
    role: 'admin',
    verified: true,
    followersCount: Array.isArray(canonical.followers) ? canonical.followers.length : 0,
    followingCount: Array.isArray(canonical.following) ? canonical.following.length : 0,
    operatorId,
    operatorEmail,
    operatorName,
  };

  return { tokenPayload, user, canonical, operatorId };
}

/** Shape /auth/me (and similar) for the unified admin session. */
function shapeAdminMeResponse(canonicalUser, reqUser) {
  const operatorId = reqUser?.operatorId || null;
  const followers = canonicalUser.followers || [];
  const following = canonicalUser.following || [];
  return {
    ...canonicalUser,
    id: String(canonicalUser._id || canonicalUser.id),
    fullName: MASHTAL_SUPPORT_NAME,
    avatar: MASHTAL_SUPPORT_AVATAR,
    email: reqUser?.email || canonicalUser.email || '',
    role: 'admin',
    verified: true,
    followersCount: Array.isArray(followers) ? followers.length : 0,
    followingCount: Array.isArray(following) ? following.length : 0,
    operatorId,
    operatorEmail: reqUser?.operatorEmail || reqUser?.email || null,
    operatorName: reqUser?.operatorName || reqUser?.fullName || null,
  };
}

module.exports = {
  MASHTAL_SUPPORT_NAME,
  MASHTAL_SUPPORT_AVATAR,
  getCanonicalAdmin,
  getCanonicalAdminId,
  getAdminRecipientIds,
  invalidateCanonicalAdminCache,
  toPublicAdminProfile,
  getPublicAdminProfile,
  resolveFollowTargetId,
  buildAdminAuthSession,
  shapeAdminMeResponse,
};
