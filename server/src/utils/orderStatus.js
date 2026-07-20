/** Canonical order fulfillment statuses (user + admin). */
const ORDER_STATUSES = ['pending', 'processing', 'ready', 'completed', 'cancelled'];

/** Legacy values still present in older documents */
const LEGACY_STATUS_MAP = {
  shipped: 'ready',
  delivered: 'completed',
  canceled: 'cancelled',
};

function normalizeOrderStatus(status) {
  const raw = String(status || '').toLowerCase().trim();
  if (LEGACY_STATUS_MAP[raw]) return LEGACY_STATUS_MAP[raw];
  if (ORDER_STATUSES.includes(raw)) return raw;
  return 'pending';
}

function isCancellableStatus(status) {
  const s = normalizeOrderStatus(status);
  return s === 'pending' || s === 'processing';
}

/**
 * Business may mark an order ready when it is still being prepared.
 * (pending is included so newly paid orders can be marked ready without admin.)
 */
function canBusinessMarkReady(status) {
  const s = normalizeOrderStatus(status);
  return s === 'pending' || s === 'processing';
}

const CANCEL_FEE_PERCENT = 25;
const CANCEL_REFUND_PERCENT = 75;

module.exports = {
  ORDER_STATUSES,
  LEGACY_STATUS_MAP,
  normalizeOrderStatus,
  isCancellableStatus,
  canBusinessMarkReady,
  CANCEL_FEE_PERCENT,
  CANCEL_REFUND_PERCENT,
};
