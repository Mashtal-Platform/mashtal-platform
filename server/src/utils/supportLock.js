const Conversation = require('../models/Conversation');

const SUPPORT_LOCK_MS = 45 * 1000;

function isLockActive(conv, now = Date.now()) {
  if (!conv?.supportLockBy || !conv?.supportLockUntil) return false;
  return new Date(conv.supportLockUntil).getTime() > now;
}

/**
 * Acquire or renew support reply lock for an admin.
 * Returns { ok, lockedByMe, lock } or { ok: false, code, message, lock }.
 */
async function acquireSupportLock(conversationId, adminId, adminName) {
  const conv = await Conversation.findById(conversationId);
  if (!conv) return { ok: false, code: 'NOT_FOUND', message: 'Conversation not found' };
  if (!conv.isSupport) return { ok: true, lockedByMe: true, lock: null };

  const now = Date.now();
  const active = isLockActive(conv, now);
  const holder = conv.supportLockBy ? String(conv.supportLockBy) : null;

  if (active && holder && holder !== String(adminId)) {
    return {
      ok: false,
      code: 'SUPPORT_LOCKED',
      message: `${conv.supportLockName || 'Another admin'} is responding. Wait until they finish.`,
      lock: {
        by: holder,
        name: conv.supportLockName || 'Another admin',
        until: conv.supportLockUntil,
      },
    };
  }

  conv.supportLockBy = adminId;
  conv.supportLockName = adminName || 'Admin';
  conv.supportLockUntil = new Date(now + SUPPORT_LOCK_MS);
  await conv.save();

  return {
    ok: true,
    lockedByMe: true,
    lock: {
      by: String(adminId),
      name: conv.supportLockName,
      until: conv.supportLockUntil,
    },
  };
}

async function releaseSupportLock(conversationId, adminId) {
  const conv = await Conversation.findById(conversationId);
  if (!conv || !conv.isSupport) return { ok: true, lock: null };
  if (conv.supportLockBy && String(conv.supportLockBy) !== String(adminId)) {
    return {
      ok: false,
      code: 'SUPPORT_LOCKED',
      message: 'You do not hold this lock',
      lock: {
        by: String(conv.supportLockBy),
        name: conv.supportLockName || 'Another admin',
        until: conv.supportLockUntil,
      },
    };
  }
  conv.supportLockBy = null;
  conv.supportLockUntil = null;
  conv.supportLockName = '';
  await conv.save();
  return { ok: true, lock: null };
}

async function getSupportLockState(conversationId) {
  const conv = await Conversation.findById(conversationId)
    .select('isSupport supportLockBy supportLockUntil supportLockName')
    .lean();
  if (!conv?.isSupport) return null;
  if (!isLockActive(conv)) return null;
  return {
    by: String(conv.supportLockBy),
    name: conv.supportLockName || 'Another admin',
    until: conv.supportLockUntil,
  };
}

/** Assert admin may send on a support thread (must hold or acquire lock). */
async function assertCanSendAsAdmin(conversationId, adminId, adminName) {
  const result = await acquireSupportLock(conversationId, adminId, adminName);
  return result;
}

module.exports = {
  SUPPORT_LOCK_MS,
  acquireSupportLock,
  releaseSupportLock,
  getSupportLockState,
  assertCanSendAsAdmin,
  isLockActive,
};
