const crypto = require('crypto');

const CACHE_MAX = 200;
const cache = new Map();

function cacheKey(text, to) {
  return crypto.createHash('sha256').update(`${to}\0${text}`).digest('hex');
}

function getCached(text, to) {
  const key = cacheKey(text, to);
  const hit = cache.get(key);
  if (!hit) return null;
  cache.delete(key);
  cache.set(key, hit);
  return hit;
}

function setCached(text, to, value) {
  const key = cacheKey(text, to);
  if (cache.has(key)) cache.delete(key);
  cache.set(key, value);
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
}

function fail(message, status, code) {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

/** Rough script check: mostly Arabic letters → ar, else en */
function guessSourceLang(text) {
  const arabic = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latin = (text.match(/[A-Za-z]/g) || []).length;
  if (arabic > latin && arabic >= 2) return 'ar';
  return 'en';
}

function buildResult(trimmed, target, translatedText, from) {
  const sameLang =
    from && (from === target || String(from).startsWith(`${target}-`));
  const unchanged = !translatedText || translatedText === trimmed;
  return {
    translatedText: sameLang || unchanged ? trimmed : translatedText,
    from: from || null,
    to: target,
    translated: !sameLang && !unchanged,
  };
}

/**
 * Free MyMemory API — no key required.
 * Optional MYMEMORY_EMAIL raises the daily character limit.
 * Docs: https://mymemory.translated.net/doc/spec.php
 */
async function translateWithMyMemory(trimmed, target) {
  const source = guessSourceLang(trimmed);
  if (source === target) {
    return buildResult(trimmed, target, trimmed, source);
  }

  const langpair = `${source}|${target}`;
  const params = new URLSearchParams({
    q: trimmed,
    langpair,
  });
  const email = process.env.MYMEMORY_EMAIL;
  if (email && String(email).trim()) {
    params.set('de', String(email).trim());
  }

  const url = `https://api.mymemory.translated.net/get?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    console.error('[Translate] MyMemory HTTP error:', res.status, body);
    throw fail('Translation failed. Please try again.', 502, 'TRANSLATE_FAILED');
  }

  const data = await res.json();
  const status = data?.responseStatus;
  if (status && Number(status) !== 200) {
    console.error('[Translate] MyMemory response:', data?.responseDetails || data);
    throw fail(
      data?.responseDetails || 'Translation failed. Please try again.',
      502,
      'TRANSLATE_FAILED'
    );
  }

  const translatedText = data?.responseData?.translatedText;
  if (typeof translatedText !== 'string') {
    throw fail('Translation failed. Please try again.', 502, 'TRANSLATE_FAILED');
  }

  // MyMemory sometimes returns "PLEASE SELECT TWO DISTINCT LANGUAGES" style errors as text
  if (/PLEASE SELECT TWO DISTINCT LANGUAGES/i.test(translatedText)) {
    return buildResult(trimmed, target, trimmed, source);
  }

  return buildResult(trimmed, target, translatedText, source);
}

/**
 * Self-hosted (or remote) LibreTranslate.
 * Requires LIBRETRANSLATE_URL (e.g. http://127.0.0.1:5001).
 * Optional LIBRETRANSLATE_API_KEY if the instance requires one.
 */
async function translateWithLibreTranslate(trimmed, target) {
  const base = (process.env.LIBRETRANSLATE_URL || '').replace(/\/$/, '');
  if (!base) {
    throw fail(
      'Translation is not configured. Set LIBRETRANSLATE_URL for LibreTranslate.',
      503,
      'TRANSLATE_NOT_CONFIGURED'
    );
  }

  const source = guessSourceLang(trimmed);
  if (source === target) {
    return buildResult(trimmed, target, trimmed, source);
  }

  const body = {
    q: trimmed,
    source: source,
    target,
    format: 'text',
  };
  const apiKey = process.env.LIBRETRANSLATE_API_KEY;
  if (apiKey) body.api_key = apiKey;

  const res = await fetch(`${base}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    console.error('[Translate] LibreTranslate error:', res.status, errBody);
    throw fail('Translation failed. Please try again.', 502, 'TRANSLATE_FAILED');
  }

  const data = await res.json();
  const translatedText = data?.translatedText;
  if (typeof translatedText !== 'string') {
    throw fail('Translation failed. Please try again.', 502, 'TRANSLATE_FAILED');
  }

  return buildResult(trimmed, target, translatedText, source);
}

/**
 * Translate text for "See translation".
 * Provider: TRANSLATE_PROVIDER=mymemory (default) | libretranslate
 */
async function translateText(text, to) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    return { translatedText: '', from: null, to, translated: false };
  }

  const target = to === 'ar' ? 'ar' : 'en';
  const cached = getCached(trimmed, target);
  if (cached) return cached;

  const provider = String(process.env.TRANSLATE_PROVIDER || 'mymemory')
    .toLowerCase()
    .trim();

  let result;
  if (provider === 'libretranslate') {
    result = await translateWithLibreTranslate(trimmed, target);
  } else {
    result = await translateWithMyMemory(trimmed, target);
  }

  setCached(trimmed, target, result);
  return result;
}

module.exports = { translateText };
