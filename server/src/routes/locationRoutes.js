const express = require('express');
const https = require('https');

const router = express.Router();

// Very small in-memory cache to avoid hammering upstream
const cache = new Map(); // key -> { ts, data }
const TTL_MS = 5 * 60 * 1000;

function cached(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCached(key, data) {
  cache.set(key, { ts: Date.now(), data });
  // Prevent unbounded growth
  if (cache.size > 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
}

function httpGetJson(url, acceptLanguage) {
  return new Promise((resolve, reject) => {
    https
      .get(
        url,
        {
          headers: {
            // Nominatim usage policy requires an identifying UA
            'User-Agent': 'Mashtal/1.0 (location search; contact: admin@mashtal.local)',
            ...(acceptLanguage ? { 'Accept-Language': acceptLanguage } : {}),
          },
        },
        (res) => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 400) {
              return reject(new Error(`Upstream error ${res.statusCode}`));
            }
            try {
              resolve(JSON.parse(body));
            } catch (e) {
              reject(e);
            }
          });
        }
      )
      .on('error', reject);
  });
}

/**
 * GET /api/locations/search?q=...
 * Returns Lebanon-only city/town/village results in Arabic + English.
 */
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q || q.length < 1) return res.json([]);
    // "contains" mode: return places whose name includes the typed letters (substring match).
    const mode = String(req.query.mode || 'contains');
    const limit = Math.max(1, Math.min(Number(req.query.limit || 10), 20));

    const key = `${mode}|${q.toLowerCase()}|${limit}`;
    const hit = cached(key);
    if (hit) return res.json(hit);

    // Nominatim "type" varies a lot; Beirut and many Lebanese localities often come as administrative/municipality/locality.
    const allowed = new Set([
      'city',
      'town',
      'village',
      'hamlet',
      'suburb',
      'neighbourhood',
      'locality',
      'municipality',
      'administrative',
      'county',
      'state_district',
      'quarter',
    ]);

    function normalizeText(s) {
      if (!s) return '';
      try {
        return String(s)
          .toLowerCase()
          // Latin diacritics (é, ê, etc.)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          // Arabic diacritics/tashkeel
          .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, '')
          .trim();
      } catch {
        return String(s).toLowerCase().trim();
      }
    }

    const baseParams = (query) => ({
      q: query,
      format: 'json',
      addressdetails: '1',
      namedetails: '1',
      countrycodes: 'lb',
      limit: String(limit),
      viewbox: '35.1,34.7,36.7,33.0',
      bounded: '1',
    });

    const makeUrl = (query, lang) =>
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({ ...baseParams(query), 'accept-language': lang }).toString();

    const fetchLang = async (query, lang) => {
      const url = makeUrl(query, lang);
      const raw = await httpGetJson(url, lang);
      return Array.isArray(raw) ? raw : [];
    };

    // To support "contains" matching, first fetch a broader set using the first letter
    // (Nominatim works better with prefix-ish queries). Then filter locally by substring.
    const upstreamQuery = q.length >= 2 ? q.slice(0, 1) : q;

    // Fetch more results upstream so local filtering has enough candidates.
    // We still return at most `limit` to the client.
    const upstreamLimit = String(Math.max(30, Math.min(limit * 6, 80)));
    const baseParamsUpstream = (query) => ({ ...baseParams(query), limit: upstreamLimit });
    const makeUrlUpstream = (query, lang) =>
      'https://nominatim.openstreetmap.org/search?' +
      new URLSearchParams({ ...baseParamsUpstream(query), 'accept-language': lang }).toString();
    const fetchLangUpstream = async (query, lang) => {
      const url = makeUrlUpstream(query, lang);
      const raw = await httpGetJson(url, lang);
      return Array.isArray(raw) ? raw : [];
    };

    let [listAr, listEn] = await Promise.all([
      fetchLangUpstream(upstreamQuery, 'ar'),
      fetchLangUpstream(upstreamQuery, 'en'),
    ]);

    // Fallback for very short queries (and in case upstreamQuery is too broad/empty): hint country name
    if (listAr.length === 0 && listEn.length === 0) {
      const [ar2, en2] = await Promise.all([
        fetchLangUpstream(`${upstreamQuery} لبنان`, 'ar'),
        fetchLangUpstream(`${upstreamQuery} lebanon`, 'en'),
      ]);
      listAr = ar2;
      listEn = en2;
    }

    const byIdAr = new Map(
      listAr
        .filter((r) => allowed.has(r?.type))
        .map((r) => [String(r.place_id), r])
    );
    const byIdEn = new Map(
      listEn
        .filter((r) => allowed.has(r?.type))
        .map((r) => [String(r.place_id), r])
    );

    // Prefer ordering from English list (more consistent for search)
    const idsInOrder = listEn
      .filter((r) => allowed.has(r?.type))
      .map((r) => String(r.place_id));
    // If EN list is empty (possible for Arabic queries), fall back to Arabic ordering.
    const ids =
      idsInOrder.length > 0
        ? idsInOrder
        : listAr.filter((r) => allowed.has(r?.type)).map((r) => String(r.place_id));

    const needle = q.toLowerCase();
    const needleNorm = normalizeText(q);
    const shapedAll = ids
      .map((id) => {
        const en = byIdEn.get(id);
        const ar = byIdAr.get(id);
        if (!en && !ar) return null;

        const name_en = String(en?.display_name || '');
        const name_ar = String(ar?.display_name || '');
        const type = en?.type || ar?.type;
        const lat = en?.lat || ar?.lat;
        const lon = en?.lon || ar?.lon;

        const primary = name_ar || name_en;
        const secondary = name_ar && name_en && name_ar !== name_en ? name_en : '';
        const combined = secondary ? `${primary} / ${secondary}` : primary;

        return {
          id,
          name: combined,
          name_ar: name_ar || undefined,
          name_en: name_en || undefined,
          lat: lat ? String(lat) : undefined,
          lon: lon ? String(lon) : undefined,
          type,
        };
      })
      .filter(Boolean);

    const shaped =
      mode === 'contains'
        ? shapedAll
            .filter((r) => {
              const ar = normalizeText(r.name_ar);
              const en = normalizeText(r.name_en);
              const combined = normalizeText(r.name);
              // Keep also the raw Arabic includes (without lowercasing) for better behavior with Arabic letters.
              const rawAr = String(r.name_ar || '').trim();
              return (
                ar.includes(needleNorm) ||
                en.includes(needleNorm) ||
                combined.includes(needleNorm) ||
                rawAr.includes(q)
              );
            })
            .slice(0, limit)
        : shapedAll.slice(0, limit);

    setCached(key, shaped);
    res.json(shaped);
  } catch (err) {
    console.error('[Locations] search error:', err);
    res.status(500).json({ message: 'Failed to search locations' });
  }
});

module.exports = router;

