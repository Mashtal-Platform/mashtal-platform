const User = require('../models/User');
const {
  MASHTAL_SUPPORT_NAME,
  MASHTAL_SUPPORT_AVATAR,
  getCanonicalAdminId,
  getAdminRecipientIds,
} = require('./publicAdminIdentity');

function isParticipant(conv, userId) {
  return (conv?.participants || []).some((p) => String(p) === String(userId));
}

/** Participant OR (support thread + viewer is admin). */
function canAccessConversation(conv, userId, userRole) {
  if (!conv) return false;
  if (isParticipant(conv, userId)) return true;
  if (conv.isSupport && userRole === 'admin') return true;
  return false;
}

function displayNameForUser(u) {
  if (!u) return 'User';
  if (u.role === 'business') {
    return (u.businessProfile?.companyName || u.fullName || 'Business').trim();
  }
  if (u.role === 'admin') {
    return MASHTAL_SUPPORT_NAME;
  }
  return (u.fullName || 'User').trim();
}

/**
 * Resolve the "other party" profile shown in the chat list for this viewer.
 * Support threads: customer sees Mashtal Support (logo + canonical id); admins see the customer.
 */
async function resolveConversationPeer(conv, viewerId, viewerRole) {
  const participantIds = (conv.participants || []).map((p) => String(p));
  const users = await User.find({ _id: { $in: participantIds } })
    .select('fullName avatar role businessProfile.companyName')
    .lean();

  if (conv.isSupport) {
    if (viewerRole === 'admin') {
      const customer = users.find((u) => u.role !== 'admin') || users.find((u) => String(u._id) !== String(viewerId));
      return {
        profileId: customer ? String(customer._id) : '',
        profileName: displayNameForUser(customer),
        profileAvatar: customer?.avatar || '',
        profileType: customer?.role || 'visitor',
        isSupport: true,
      };
    }
    const canonicalId = await getCanonicalAdminId();
    return {
      profileId: canonicalId || 'support',
      profileName: MASHTAL_SUPPORT_NAME,
      profileAvatar: MASHTAL_SUPPORT_AVATAR,
      profileType: 'admin',
      isSupport: true,
    };
  }

  const other = users.find((u) => String(u._id) !== String(viewerId));
  if (other?.role === 'admin') {
    const canonicalId = await getCanonicalAdminId();
    return {
      profileId: canonicalId || String(other._id),
      profileName: MASHTAL_SUPPORT_NAME,
      profileAvatar: MASHTAL_SUPPORT_AVATAR,
      profileType: 'admin',
      isSupport: false,
    };
  }
  return {
    profileId: other ? String(other._id) : '',
    profileName: displayNameForUser(other),
    profileAvatar: other?.avatar || '',
    profileType: other?.role || 'visitor',
    isSupport: false,
  };
}

/** Recipients for chat notifications (shared admin inbox for support). */
async function getMessageNotificationRecipients(conv, senderId) {
  const sender = String(senderId);
  if (conv.isSupport) {
    const senderUser = await User.findById(senderId).select('role').lean();
    if (senderUser?.role === 'admin') {
      // Admin replied → notify non-admin participants (the customer)
      return (conv.participants || [])
        .map((p) => String(p))
        .filter((id) => id !== sender);
    }
    // Customer messaged support → notify the unified admin account
    const admins = await getAdminRecipientIds();
    return admins.filter((id) => id !== sender);
  }
  return (conv.participants || [])
    .map((p) => String(p))
    .filter((id) => id !== sender);
}

/**
 * For support chats viewed by an admin: any admin message shows as "mine" (right/green).
 * Otherwise: message is mine only if senderId === viewerId.
 */
function resolveMessageSide({
  senderId,
  senderRole,
  viewerId,
  viewerRole,
  isSupport,
}) {
  if (isSupport && viewerRole === 'admin') {
    return senderRole === 'admin' ? 'user' : 'other';
  }
  return String(senderId) === String(viewerId) ? 'user' : 'other';
}

module.exports = {
  isParticipant,
  canAccessConversation,
  displayNameForUser,
  resolveConversationPeer,
  getMessageNotificationRecipients,
  resolveMessageSide,
};
