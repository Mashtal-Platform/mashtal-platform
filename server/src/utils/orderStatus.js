/** Canonical order fulfillment statuses (user + admin). */
const ORDER_STATUSES = ['processing', 'ready', 'completed', 'cancelled'];

/** Legacy values still present in older documents */
const LEGACY_STATUS_MAP = {
  pending: 'processing',
  shipped: 'ready',
  delivered: 'completed',
  canceled: 'cancelled',
};

function normalizeOrderStatus(status) {
  const raw = String(status || '').toLowerCase().trim();
  if (LEGACY_STATUS_MAP[raw]) return LEGACY_STATUS_MAP[raw];
  if (ORDER_STATUSES.includes(raw)) return raw;
  return 'processing';
}

function isCancellableStatus(status) {
  const s = normalizeOrderStatus(status);
  return s === 'processing';
}

/**
 * Business may mark an order ready when it is still being prepared.
 */
function canBusinessMarkReady(status) {
  const s = normalizeOrderStatus(status);
  return s === 'processing';
}

/** Only admins may set an order to completed (enforced on admin routes). */
function canSetCompleted(role) {
  return role === 'admin';
}

const CANCEL_FEE_PERCENT = 25;
const CANCEL_REFUND_PERCENT = 75;

module.exports = {
  ORDER_STATUSES,
  LEGACY_STATUS_MAP,
  normalizeOrderStatus,
  isCancellableStatus,
  canBusinessMarkReady,
  canSetCompleted,
  CANCEL_FEE_PERCENT,
  CANCEL_REFUND_PERCENT,
};
