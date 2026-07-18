/** Inputs used for home-page business ranking. */
export interface RankableBusiness {
  id: string;
  name?: string;
  rating?: number;
  reviewsCount?: number;
  followersCount?: number;
  verified?: boolean;
  [key: string]: unknown;
}

export const BAYESIAN_M = 10;
export const BAYESIAN_C_FALLBACK = 4.0;

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function displayName(b: RankableBusiness): string {
  return String(b.name || b.fullName || b.companyName || '').trim();
}

/**
 * Bayesian smoothed rating — few reviews cannot dominate many reviews.
 * R = (v/(v+m))*r̄ + (m/(v+m))*C
 */
export function bayesianRating(
  averageRating: number,
  reviewCount: number,
  priorC: number = BAYESIAN_C_FALLBACK,
  m: number = BAYESIAN_M
): number {
  const r = Math.min(5, Math.max(0, num(averageRating)));
  const v = Math.max(0, num(reviewCount));
  const C = Math.min(5, Math.max(0, num(priorC, BAYESIAN_C_FALLBACK)));
  const M = Math.max(0, num(m, BAYESIAN_M));
  if (v + M <= 0) return C;
  return (v / (v + M)) * r + (M / (v + M)) * C;
}

export function computePlatformPrior(businesses: RankableBusiness[]): number {
  const rated = businesses.filter((b) => num(b.reviewsCount) > 0 || num(b.rating) > 0);
  if (rated.length === 0) return BAYESIAN_C_FALLBACK;
  const sum = rated.reduce((acc, b) => acc + num(b.rating), 0);
  const avg = sum / rated.length;
  return Number.isFinite(avg) && avg > 0 ? avg : BAYESIAN_C_FALLBACK;
}

/** Trust = quality of ratings × evidence (review count); followers are a light boost. */
export function trustedScore(
  averageRating: number,
  reviewCount: number,
  followersCount: number,
  priorC?: number
): number {
  const v = Math.max(0, num(reviewCount));
  const f = Math.max(0, num(followersCount));
  const R = bayesianRating(averageRating, v, priorC);
  return R * Math.log(1 + v) + 0.15 * Math.log(1 + f);
}

/** Featured = popularity (followers) + enough rating evidence to stay credible. */
export function featuredScore(
  averageRating: number,
  reviewCount: number,
  followersCount: number,
  priorC?: number
): number {
  const v = Math.max(0, num(reviewCount));
  const f = Math.max(0, num(followersCount));
  const R = bayesianRating(averageRating, v, priorC);
  return Math.log(1 + f) + 0.5 * R * Math.log(1 + v);
}

function tieBreak(a: RankableBusiness, b: RankableBusiness): number {
  const reviewsDiff = num(b.reviewsCount) - num(a.reviewsCount);
  if (reviewsDiff !== 0) return reviewsDiff;
  const followersDiff = num(b.followersCount) - num(a.followersCount);
  if (followersDiff !== 0) return followersDiff;
  return displayName(a).localeCompare(displayName(b));
}

function sortByTrusted(list: RankableBusiness[], priorC: number): RankableBusiness[] {
  return [...list].sort((a, b) => {
    const scoreDiff =
      trustedScore(num(b.rating), num(b.reviewsCount), num(b.followersCount), priorC) -
      trustedScore(num(a.rating), num(a.reviewsCount), num(a.followersCount), priorC);
    if (scoreDiff !== 0) return scoreDiff;
    return tieBreak(a, b);
  });
}

function sortByFeatured(list: RankableBusiness[], priorC: number): RankableBusiness[] {
  return [...list].sort((a, b) => {
    const scoreDiff =
      featuredScore(num(b.rating), num(b.reviewsCount), num(b.followersCount), priorC) -
      featuredScore(num(a.rating), num(a.reviewsCount), num(a.followersCount), priorC);
    if (scoreDiff !== 0) return scoreDiff;
    return tieBreak(a, b);
  });
}

/** Prefer verified; if none verified, use all businesses so sections still fill. */
function poolForRanking(businesses: RankableBusiness[]): RankableBusiness[] {
  const verified = businesses.filter((b) => !!b.verified);
  if (verified.length > 0) return verified;
  return businesses.filter((b) => b.id != null);
}

/**
 * Most Trusted — top N by TrustedScore from the full pool.
 * Prefers businesses that have at least one review; backfills if needed.
 */
export function rankMostTrusted(
  businesses: RankableBusiness[],
  limit = 2
): RankableBusiness[] {
  const pool = poolForRanking(businesses);
  if (pool.length === 0) return [];
  const priorC = computePlatformPrior(pool);

  const withReviews = sortByTrusted(
    pool.filter((b) => num(b.reviewsCount) > 0),
    priorC
  );
  if (withReviews.length >= limit) return withReviews.slice(0, limit);

  const taken = new Set(withReviews.map((b) => String(b.id)));
  const rest = sortByTrusted(
    pool.filter((b) => !taken.has(String(b.id))),
    priorC
  );
  return [...withReviews, ...rest].slice(0, limit);
}

/**
 * Featured — top N by FeaturedScore from the full pool.
 * Prefers businesses with followers or reviews; backfills if needed.
 */
export function rankFeatured(
  businesses: RankableBusiness[],
  limit = 8
): RankableBusiness[] {
  const pool = poolForRanking(businesses);
  if (pool.length === 0) return [];
  const priorC = computePlatformPrior(pool);

  const engaged = sortByFeatured(
    pool.filter((b) => num(b.followersCount) >= 1 || num(b.reviewsCount) >= 1),
    priorC
  );
  if (engaged.length >= limit) return engaged.slice(0, limit);

  const taken = new Set(engaged.map((b) => String(b.id)));
  const rest = sortByFeatured(
    pool.filter((b) => !taken.has(String(b.id))),
    priorC
  );
  return [...engaged, ...rest].slice(0, limit);
}

/**
 * Each section uses its own score on the full business list (independent).
 * - Trusted: top `trustedLimit` by trust (default 2)
 * - Featured: top `featuredLimit` by popularity (default 8)
 * Overlap is allowed so both lists stay correct even with few businesses.
 */
export function rankHomeBusinessSpotlights(
  businesses: RankableBusiness[],
  featuredLimit = 8,
  trustedLimit = 2
): { trusted: RankableBusiness[]; featured: RankableBusiness[] } {
  return {
    trusted: rankMostTrusted(businesses, trustedLimit),
    featured: rankFeatured(businesses, featuredLimit),
  };
}
