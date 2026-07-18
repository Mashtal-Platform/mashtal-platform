const path = require('path');
const fs = require('fs');
const { checkBlocklist } = require('../moderation/blocklist');

const CACHE_DIR = path.join(__dirname, '..', '..', '.cache', 'transformers');

const TOXICITY_THRESHOLD = Number(process.env.MODERATION_TOXICITY_THRESHOLD) || 0.85;
const NSFW_THRESHOLD = Number(process.env.MODERATION_NSFW_THRESHOLD) || 0.25;
const WEAPON_IMAGE_THRESHOLD = Number(process.env.MODERATION_WEAPON_IMAGE_THRESHOLD) || 0.25;

const TOXIC_LABELS = new Set([
  'toxic',
  'severe_toxic',
  'obscene',
  'threat',
  'insult',
  'identity_hate',
]);

// CLIP zero-shot labels — keep unsafe vs safe balanced for fair softmax scores
const WEAPON_IMAGE_LABELS = [
  'a photo of a handgun or firearm',
  'a photo of a weapon or gun',
  'a photo of ammunition or bullets',
];
const NSFW_IMAGE_LABELS = [
  'a photo of pornography or nudity',
  'a photo of explicit sexual content',
];
const SAFE_IMAGE_LABELS = [
  'a photo of a plant fruit or vegetable',
  'a photo of gardening or farming products',
  'a photo of a safe everyday product',
];

let textClassifierPromise = null;
let imageClassifierPromise = null;
let envConfigured = false;

function isEnabled() {
  const v = process.env.MODERATION_ENABLED;
  if (v === undefined || v === '') return true;
  return !['0', 'false', 'no', 'off'].includes(String(v).toLowerCase());
}

function failOpen() {
  return ['1', 'true', 'yes', 'on'].includes(
    String(process.env.MODERATION_FAIL_OPEN || '').toLowerCase()
  );
}

function configureEnv(transformers) {
  if (envConfigured) return;
  const { env } = transformers;
  env.cacheDir = CACHE_DIR;
  env.allowLocalModels = true;
  // Prefer local cache after first download
  env.allowRemoteModels = true;
  envConfigured = true;
}

async function loadTransformers() {
  // Package is ESM-only; dynamic import works from CommonJS.
  return import('@xenova/transformers');
}

async function getTextClassifier() {
  if (!textClassifierPromise) {
    textClassifierPromise = (async () => {
      const transformers = await loadTransformers();
      configureEnv(transformers);
      const { pipeline } = transformers;
      console.log('[Moderation] Loading Xenova/toxic-bert…');
      const clf = await pipeline('text-classification', 'Xenova/toxic-bert', {
        quantized: true,
      });
      console.log('[Moderation] toxic-bert ready');
      return clf;
    })().catch((err) => {
      textClassifierPromise = null;
      throw err;
    });
  }
  return textClassifierPromise;
}

async function getImageClassifier() {
  if (!imageClassifierPromise) {
    imageClassifierPromise = (async () => {
      const transformers = await loadTransformers();
      configureEnv(transformers);
      const { pipeline } = transformers;
      console.log('[Moderation] Loading Xenova/clip-vit-base-patch32 (image)…');
      const clf = await pipeline(
        'zero-shot-image-classification',
        'Xenova/clip-vit-base-patch32',
        { quantized: true }
      );
      console.log('[Moderation] image classifier ready');
      return clf;
    })().catch((err) => {
      imageClassifierPromise = null;
      throw err;
    });
  }
  return imageClassifierPromise;
}

/**
 * Warm models in background (non-blocking).
 */
function warmupModeration() {
  if (!isEnabled()) {
    console.log('[Moderation] Disabled (MODERATION_ENABLED=false)');
    return;
  }
  Promise.all([getTextClassifier(), getImageClassifier()]).catch((err) => {
    console.error('[Moderation] Warmup failed:', err?.message || err);
  });
}

function joinTextParts(parts) {
  return (Array.isArray(parts) ? parts : [parts])
    .flat()
    .filter((p) => p != null && String(p).trim())
    .map((p) => String(p).trim())
    .join('\n');
}

/**
 * Resolve an uploaded image to a filesystem path for the classifier.
 * @param {{ imagePath?: string, imageAbsolutePath?: string, imageBuffer?: Buffer, mimeType?: string }} opts
 */
function resolveImageInput(opts = {}) {
  if (opts.imageAbsolutePath && fs.existsSync(opts.imageAbsolutePath)) {
    return opts.imageAbsolutePath;
  }
  if (opts.imagePath) {
    const rel = String(opts.imagePath).replace(/^[/\\]+/, '');
    const abs = path.join(__dirname, '..', '..', 'public', rel);
    if (fs.existsSync(abs)) return abs;
  }
  if (opts.imageBuffer && Buffer.isBuffer(opts.imageBuffer)) {
    const ext = (opts.mimeType || '').includes('png') ? '.png' : '.jpg';
    const tmp = path.join(CACHE_DIR, `mod-${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(tmp, opts.imageBuffer);
    return { path: tmp, cleanup: true };
  }
  return null;
}

async function moderateText(text) {
  const block = checkBlocklist(text);
  if (block.hit) {
    return { allowed: false, reason: 'blocklist', detail: block.term };
  }

  const classifier = await getTextClassifier();
  const results = await classifier(text.slice(0, 2000), { topk: null });
  const list = Array.isArray(results) ? results : [results];

  for (const item of list) {
    const label = String(item?.label || '').toLowerCase();
    const score = Number(item?.score) || 0;
    if (TOXIC_LABELS.has(label) && score >= TOXICITY_THRESHOLD) {
      return { allowed: false, reason: 'toxicity', detail: label, score };
    }
  }
  return { allowed: true };
}

async function moderateImage(imageInput) {
  const classifier = await getImageClassifier();
  const candidate_labels = [
    ...WEAPON_IMAGE_LABELS,
    ...NSFW_IMAGE_LABELS,
    ...SAFE_IMAGE_LABELS,
  ];
  const results = await classifier(imageInput, candidate_labels);
  const list = Array.isArray(results) ? results : [];

  const nsfwSet = new Set(NSFW_IMAGE_LABELS.map((l) => l.toLowerCase()));
  const weaponSet = new Set(WEAPON_IMAGE_LABELS.map((l) => l.toLowerCase()));
  const safeSet = new Set(SAFE_IMAGE_LABELS.map((l) => l.toLowerCase()));

  let maxWeapon = 0;
  let maxNsfw = 0;
  let maxSafe = 0;
  let topWeaponLabel = '';
  let topNsfwLabel = '';

  for (const item of list) {
    const label = String(item?.label || '').toLowerCase();
    const score = Number(item?.score) || 0;
    if (weaponSet.has(label) && score > maxWeapon) {
      maxWeapon = score;
      topWeaponLabel = label;
    }
    if (nsfwSet.has(label) && score > maxNsfw) {
      maxNsfw = score;
      topNsfwLabel = label;
    }
    if (safeSet.has(label) && score > maxSafe) {
      maxSafe = score;
    }
  }

  // Reject when unsafe beats safe (handles disguised titles like "tomato" + gun photo)
  if (maxWeapon >= WEAPON_IMAGE_THRESHOLD && maxWeapon >= maxSafe) {
    return { allowed: false, reason: 'weapon_image', detail: topWeaponLabel, score: maxWeapon };
  }
  if (maxNsfw >= NSFW_THRESHOLD && maxNsfw >= maxSafe) {
    return { allowed: false, reason: 'nsfw_image', detail: topNsfwLabel, score: maxNsfw };
  }

  // Also reject if the single top CLIP label is unsafe
  const top = list[0];
  if (top) {
    const topLabel = String(top.label || '').toLowerCase();
    const topScore = Number(top.score) || 0;
    if (weaponSet.has(topLabel) && topScore >= WEAPON_IMAGE_THRESHOLD) {
      return { allowed: false, reason: 'weapon_image', detail: topLabel, score: topScore };
    }
    if (nsfwSet.has(topLabel) && topScore >= NSFW_THRESHOLD) {
      return { allowed: false, reason: 'nsfw_image', detail: topLabel, score: topScore };
    }
  }

  return { allowed: true };
}

/**
 * @param {{ text?: string|string[], imagePath?: string, imageAbsolutePath?: string, imageBuffer?: Buffer, mimeType?: string }} opts
 * @returns {Promise<{ allowed: boolean, reason?: string, detail?: string, score?: number }>}
 */
async function moderateContent(opts = {}) {
  if (!isEnabled()) {
    return { allowed: true, reason: 'disabled' };
  }

  const wantsImageCheck = !!(
    opts.imageAbsolutePath ||
    opts.imagePath ||
    opts.imageBuffer ||
    (opts.file && (opts.file.path || opts.file.filename))
  );

  try {
    const text = joinTextParts(opts.text);
    if (text) {
      const textResult = await moderateText(text);
      if (!textResult.allowed) {
        console.log('[Moderation] BLOCKED text:', textResult.reason, textResult.detail || '');
        return textResult;
      }
    }

    const resolved = resolveImageInput({
      ...opts,
      imageAbsolutePath:
        opts.imageAbsolutePath ||
        (opts.file && opts.file.path && fs.existsSync(opts.file.path) ? opts.file.path : undefined),
    });

    if (wantsImageCheck && !resolved) {
      console.error('[Moderation] Image provided but could not resolve path for scanning');
      return {
        allowed: false,
        reason: 'unavailable',
        detail: 'Could not read uploaded image for safety check',
      };
    }

    if (resolved) {
      const imagePath = typeof resolved === 'string' ? resolved : resolved.path;
      const cleanup = typeof resolved === 'object' && resolved.cleanup;
      console.log('[Moderation] Scanning image:', imagePath);
      try {
        const imageResult = await moderateImage(imagePath);
        if (!imageResult.allowed) {
          console.log('[Moderation] BLOCKED image:', imageResult.reason, imageResult.detail, imageResult.score);
          return imageResult;
        }
        console.log('[Moderation] Image OK');
      } finally {
        if (cleanup) {
          try {
            fs.unlinkSync(imagePath);
          } catch (_) {
            /* ignore */
          }
        }
      }
    }

    return { allowed: true };
  } catch (err) {
    console.error('[Moderation] Error:', err?.message || err);
    // Only skip checks when explicitly opted in — never silently allow gun/NSFW uploads
    if (failOpen()) {
      console.warn('[Moderation] Allowing content (MODERATION_FAIL_OPEN=true)');
      return { allowed: true, reason: 'error_fail_open' };
    }
    return {
      allowed: false,
      reason: 'unavailable',
      detail: err?.message || 'Moderation unavailable',
    };
  }
}

module.exports = {
  moderateContent,
  warmupModeration,
  isEnabled,
  CACHE_DIR,
};
