/**
 * Shared business profile normalize + required-field checks.
 * Required to operate as a seller on Mashtal:
 *   companyName, bio, location, phone, wishPhone, specialties (business type)
 * Optional:
 *   address, contactEmail, website, wishAccountNumber, hours, about
 */

function isValidPhone(phone) {
  if (!phone || typeof phone !== 'string') return true;
  const trimmed = phone.trim();
  if (!trimmed) return true;
  if (!/^\+?[\d\s\-]*$/.test(trimmed)) return false;
  const digits = trimmed.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

function normalizeBusinessProfile(bp = {}) {
  const specialties = Array.isArray(bp.specialties)
    ? bp.specialties.map((s) => String(s).trim()).filter(Boolean)
    : bp.businessType
      ? [String(bp.businessType).trim()].filter(Boolean)
      : [];

  return {
    companyName: bp.companyName != null ? String(bp.companyName).trim() : '',
    bio: bp.bio != null ? String(bp.bio).trim() : '',
    phone: bp.phone != null ? String(bp.phone).trim() : '',
    location: bp.location != null ? String(bp.location).trim() : '',
    address: bp.address != null ? String(bp.address).trim() : '',
    contactEmail: bp.contactEmail != null ? String(bp.contactEmail).trim().toLowerCase() : '',
    website: bp.website != null ? String(bp.website).trim() : '',
    wishPhone: bp.wishPhone != null ? String(bp.wishPhone).trim() : '',
    wishAccountNumber: bp.wishAccountNumber != null ? String(bp.wishAccountNumber).trim() : '',
    specialties,
    hours: Array.isArray(bp.hours) ? bp.hours : undefined,
    about: bp.about && typeof bp.about === 'object' ? bp.about : undefined,
  };
}

/**
 * @param {object} bp raw or normalized profile
 * @param {{ requireAll?: boolean }} opts requireAll=true for create/convert; false allows partial update
 * @returns {string|null} error message or null
 */
function validateBusinessProfile(bp, opts = {}) {
  const requireAll = opts.requireAll !== false;
  const n = normalizeBusinessProfile(bp);

  if (requireAll) {
    if (!n.companyName) return 'Business name is required';
    if (!n.specialties.length) return 'Business type is required';
    if (!n.bio) return 'Business description is required';
    if (!n.location) return 'City / village (Lebanon) is required';
    if (!n.phone) return 'Contact phone is required';
    if (!isValidPhone(n.phone)) {
      return 'Contact phone must be a valid number with country code (e.g. +961 70 123 456)';
    }
    if (!n.wishPhone) return 'Whish Money phone is required for receiving payouts';
    if (!isValidPhone(n.wishPhone)) {
      return 'Whish phone must be a valid number with country code (e.g. +961 70 123 456)';
    }
  } else {
    if (n.phone && !isValidPhone(n.phone)) {
      return 'Contact phone must be a valid number with country code (e.g. +961 70 123 456)';
    }
    if (n.wishPhone && !isValidPhone(n.wishPhone)) {
      return 'Whish phone must be a valid number with country code (e.g. +961 70 123 456)';
    }
    if (bp.companyName != null && !n.companyName) return 'Business name cannot be empty';
    if (bp.wishPhone != null && !n.wishPhone) {
      return 'Whish Money phone is required for receiving payouts';
    }
  }

  if (n.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(n.contactEmail)) {
    return 'Business contact email is invalid';
  }

  return null;
}

module.exports = {
  isValidPhone,
  normalizeBusinessProfile,
  validateBusinessProfile,
};
