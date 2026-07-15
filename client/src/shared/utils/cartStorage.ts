import type { CartItem } from '../types';

/** Normalize email so the same account always maps to one local cart on this device. */
export function normalizeCartEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== 'string') return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed || null;
}

/**
 * Cart keys are per browser (device) + email.
 * Guests share `mashtal_cart_guest` on this device only.
 */
export function cartStorageKey(email: string | null | undefined): string {
  const normalized = normalizeCartEmail(email);
  return normalized
    ? `mashtal_cart_email_${encodeURIComponent(normalized)}`
    : 'mashtal_cart_guest';
}

function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadCartFromStorage(email: string | null | undefined): CartItem[] {
  try {
    const key = cartStorageKey(email);
    const items = parseCart(localStorage.getItem(key));
    if (items.length > 0) return items;

    // One-time migration from older userId-based keys (if caller passes legacy id separately)
    return items;
  } catch {
    return [];
  }
}

/** Load cart for a signed-in user; optionally migrate leftover cart from userId key. */
export function loadUserCart(params: {
  email: string | null | undefined;
  userId?: string | null;
}): CartItem[] {
  try {
    const emailKey = cartStorageKey(params.email);
    const byEmail = parseCart(localStorage.getItem(emailKey));
    if (byEmail.length > 0) return byEmail;

    // Migrate legacy per-userId cart → email key (same device)
    if (params.userId) {
      const legacyKey = `mashtal_cart_${params.userId}`;
      const legacy = parseCart(localStorage.getItem(legacyKey));
      if (legacy.length > 0) {
        localStorage.setItem(emailKey, JSON.stringify(legacy));
        localStorage.removeItem(legacyKey);
        return legacy;
      }
    }

    // Do not use shared legacy "mashtal_cart" — that was the cross-account leak
    return [];
  } catch {
    return [];
  }
}

export function saveCartToStorage(email: string | null | undefined, items: CartItem[]) {
  try {
    localStorage.setItem(cartStorageKey(email), JSON.stringify(items || []));
  } catch {
    /* ignore quota / private mode */
  }
}
