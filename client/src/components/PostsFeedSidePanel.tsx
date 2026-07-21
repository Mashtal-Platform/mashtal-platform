import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Filter,
  Heart,
  LayoutGrid,
  Lightbulb,
  MessageCircle,
  TrendingUp,
  Users,
  UserPlus,
  Check,
} from 'lucide-react';
import { fetchPosts, PostDto } from '../shared/api/posts';
import { fetchThreads, ThreadDto } from '../shared/api/threads';
import { fetchBusinesses, UserDto } from '../shared/api/users';
import { getAvatarUrl } from '../shared/api/client';
import {
  computePlatformPrior,
  trustedScore,
} from '../shared/utils/businessRanking';
import { useAuth } from '../contexts/AuthContext';

export type PostsFeedFilter = 'all' | 'following' | 'businesses';
export type FeedContentKind = 'posts' | 'threads';

/** How many businesses to show in the Suggested panel. */
export const SUGGESTED_BUSINESSES_LIMIT = 4;

/**
 * Trending score: engagement boosted by comments, decayed by age.
 * Prefer items that are getting attention recently, not all-time likes only.
 */
export function trendingItemScore(
  item: { likes?: number; commentsCount?: number; timestamp?: string },
  now = Date.now()
): number {
  const likes = Number(item.likes) || 0;
  const comments = Number(item.commentsCount) || 0;
  const engagement = likes + comments * 1.5;
  const ts = item.timestamp ? new Date(item.timestamp).getTime() : now;
  const ageHours = Math.max(0, (now - (Number.isFinite(ts) ? ts : now)) / 3_600_000);
  return engagement / Math.pow(ageHours + 2, 1.2);
}

/** @deprecated use trendingItemScore */
export function trendingPostScore(post: PostDto, now = Date.now()): number {
  return trendingItemScore(post, now);
}

export function PostsFilterSidebar({
  value,
  onChange,
}: {
  value: PostsFeedFilter;
  onChange: (v: PostsFeedFilter) => void;
}) {
  const options: { id: PostsFeedFilter; label: string; icon: React.ReactNode }[] = [
    { id: 'all', label: 'All', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'following', label: 'Following', icon: <Users className="w-4 h-4" /> },
    { id: 'businesses', label: 'Businesses', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <aside className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Filter className="w-4 h-4 text-green-600" />
        <h4 className="text-sm font-semibold text-neutral-900">Filters</h4>
      </div>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-left transition-colors ${
              value === opt.id
                ? 'bg-green-600 text-white'
                : 'text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {opt.icon}
            {opt.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

export function PostsRightSidebar({
  kind = 'posts',
  followedBusinesses = [],
  onFollowBusiness,
  onNavigateToBusiness,
  onSelectPost,
  onSelectThread,
}: {
  kind?: FeedContentKind;
  followedBusinesses?: { id: string }[];
  onFollowBusiness?: (business: any) => void;
  onNavigateToBusiness?: (businessId: string) => void;
  onSelectPost?: (postId: string) => void;
  onSelectThread?: (threadId: string) => void;
}) {
  return (
    <aside className="space-y-4">
      <TrendingItemsPanel
        kind={kind}
        onSelectPost={onSelectPost}
        onSelectThread={onSelectThread}
      />
      <SuggestedBusinessesPanel
        followedBusinesses={followedBusinesses}
        onFollowBusiness={onFollowBusiness}
        onNavigateToBusiness={onNavigateToBusiness}
      />
      <div className="rounded-xl border border-green-100 bg-green-50/80 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Lightbulb className="w-4 h-4 text-green-700" />
          <h4 className="text-sm font-semibold text-green-900">Community tip</h4>
        </div>
        <p className="text-sm text-green-800/90 leading-relaxed">
          {kind === 'threads'
            ? 'Ask a clear question in your thread title — specific topics get better answers from the community.'
            : 'Share clear photos and short tips — posts with images get more engagement from growers.'}
        </p>
      </div>
    </aside>
  );
}

function TrendingItemsPanel({
  kind,
  onSelectPost,
  onSelectThread,
}: {
  kind: FeedContentKind;
  onSelectPost?: (postId: string) => void;
  onSelectThread?: (threadId: string) => void;
}) {
  const [items, setItems] = useState<(PostDto | ThreadDto)[]>([]);

  useEffect(() => {
    let alive = true;
    const load =
      kind === 'threads'
        ? fetchThreads({ limit: 40, skip: 0 })
        : fetchPosts({ limit: 40, skip: 0 });
    load
      .then((list) => {
        if (!alive) return;
        setItems(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (alive) setItems([]);
      });
    return () => {
      alive = false;
    };
  }, [kind]);

  const trending = useMemo(() => {
    const now = Date.now();
    return [...items]
      .sort((a, b) => trendingItemScore(b, now) - trendingItemScore(a, now))
      .slice(0, 5);
  }, [items]);

  const title = kind === 'threads' ? 'Trending threads' : 'Trending posts';

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-4 h-4 text-green-600" />
        <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
      </div>
      <p className="text-[11px] text-neutral-400 mb-3">
        Ranked by likes + comments, weighted toward newer items
      </p>
      <ul className="space-y-3">
        {trending.map((item) => (
          <li key={item.id} className="min-w-0">
            <button
              type="button"
              onClick={() =>
                kind === 'threads' ? onSelectThread?.(item.id) : onSelectPost?.(item.id)
              }
              className="w-full text-left group"
            >
              <p className="text-sm font-medium text-neutral-900 line-clamp-2 group-hover:text-green-700 transition-colors">
                {item.title}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5 inline-flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <Heart className="w-3 h-3" />
                  {item.likes ?? 0}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {item.commentsCount ?? 0}
                </span>
              </p>
            </button>
          </li>
        ))}
        {trending.length === 0 && (
          <li className="text-sm text-neutral-500">Nothing trending yet</li>
        )}
      </ul>
    </div>
  );
}

function SuggestedBusinessesPanel({
  followedBusinesses = [],
  onFollowBusiness,
  onNavigateToBusiness,
}: {
  followedBusinesses?: { id: string }[];
  onFollowBusiness?: (business: any) => void;
  onNavigateToBusiness?: (businessId: string) => void;
}) {
  const { user, isAuthenticated } = useAuth();
  const [list, setList] = useState<UserDto[]>([]);

  useEffect(() => {
    let alive = true;
    fetchBusinesses()
      .then((biz) => {
        if (!alive) return;
        setList(Array.isArray(biz) ? biz : []);
      })
      .catch(() => {
        if (alive) setList([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  const suggested = useMemo(() => {
    const followedIds = new Set(
      (followedBusinesses || []).map((b) => String(b.id))
    );
    const selfId = user?.id ? String(user.id) : '';
    const prior = computePlatformPrior(list as any[]);

    return [...list]
      .filter((b) => {
        const id = String(b.id);
        if (!id || id === selfId) return false;
        if (followedIds.has(id)) return false;
        return true;
      })
      .sort((a, b) => {
        const scoreDiff =
          trustedScore(
            Number(b.rating) || 0,
            Number(b.reviewsCount) || 0,
            Number(b.followersCount) || 0,
            prior
          ) -
          trustedScore(
            Number(a.rating) || 0,
            Number(a.reviewsCount) || 0,
            Number(a.followersCount) || 0,
            prior
          );
        if (scoreDiff !== 0) return scoreDiff;
        return (Number(b.followersCount) || 0) - (Number(a.followersCount) || 0);
      })
      .slice(0, SUGGESTED_BUSINESSES_LIMIT);
  }, [list, followedBusinesses, user?.id]);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Building2 className="w-4 h-4 text-green-600" />
        <h4 className="text-sm font-semibold text-neutral-900">Suggested businesses</h4>
      </div>
      <p className="text-[11px] text-neutral-400 mb-3">
        Up to {SUGGESTED_BUSINESSES_LIMIT} · not following yet · by rating, reviews & followers
      </p>
      {suggested.length === 0 ? (
        <p className="text-sm text-neutral-500">No suggestions right now</p>
      ) : (
        <ul className="space-y-3">
          {suggested.map((b) => {
            const name = b.companyName || b.fullName || 'Business';
            const alreadyFollowing = (followedBusinesses || []).some(
              (f) => String(f.id) === String(b.id)
            );
            return (
              <li key={b.id} className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  onClick={() => onNavigateToBusiness?.(String(b.id))}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
                >
                  <img
                    src={getAvatarUrl(b.avatar, name)}
                    alt={name}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-900 truncate hover:text-green-700">
                      {name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">
                      {(b.rating ?? 0) > 0 ? `${Number(b.rating).toFixed(1)}★ · ` : ''}
                      {b.followersCount ?? 0} followers
                    </p>
                  </div>
                </button>
                {isAuthenticated && onFollowBusiness && (
                  <button
                    type="button"
                    onClick={() =>
                      onFollowBusiness({
                        id: b.id,
                        name,
                        avatar: b.avatar,
                        type: 'business',
                        verified: b.verified,
                      })
                    }
                    className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                      alreadyFollowing
                        ? 'bg-green-100 text-green-700'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                    aria-label={alreadyFollowing ? 'Following' : 'Follow'}
                  >
                    {alreadyFollowing ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
