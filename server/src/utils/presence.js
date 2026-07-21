/** In-memory online presence: userId -> active socket count */
const onlineUsers = new Map();

function markOnline(userId) {
  const key = String(userId);
  onlineUsers.set(key, (onlineUsers.get(key) || 0) + 1);
}

function markOffline(userId) {
  const key = String(userId);
  const next = (onlineUsers.get(key) || 1) - 1;
  if (next <= 0) onlineUsers.delete(key);
  else onlineUsers.set(key, next);
}

function isUserOnline(userId) {
  return onlineUsers.has(String(userId));
}

module.exports = {
  markOnline,
  markOffline,
  isUserOnline,
};
