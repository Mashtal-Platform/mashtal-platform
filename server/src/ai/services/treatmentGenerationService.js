// Text generation via HuggingFace Router (OpenAI-compatible).
const { callHuggingFaceTextModel } = require('./hfTextClient');

function normalizeKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function guessCropName(message) {
  const text = String(message || '').toLowerCase();
  const crops = [
    'strawberry',
    'tomato',
    'potato',
    'apple',
    'grape',
    'pepper',
    'corn',
    'rice',
    'wheat',
    'wheat',
    'cucumber',
    'date palm',
    'palm',
    'orange',
    'peach',
    'cherry',
    'squash',
  ];

  for (const c of crops) {
    if (text.includes(c)) return c === 'palm' ? 'date palm' : c;
  }
  return 'your crop';
}

function parseAdvisorText(text) {
  // Normalize markdown headings the HF router often returns (**Description:**).
  let normalized = String(text || '')
    .replace(/\r\n/g, '\n')
    .replace(/\*\*/g, '')
    .replace(/__/g, '')
    .trim();

  const headings = ['Description', 'Treatment', 'Prevention', 'Recommended products'];

  const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find the first occurrence index for each heading, then slice until the next heading.
  const found = [];
  for (const h of headings) {
    const re = new RegExp(`(?:^|\\n)\\s*${escapeRegex(h)}\\s*:\\s*`, 'i');
    const m = re.exec(normalized);
    if (m && typeof m.index === 'number') {
      found.push({
        heading: h,
        start: m.index + m[0].length,
        labelStart: m.index,
      });
    }
  }

  found.sort((a, b) => a.start - b.start);

  const sectionByHeading = new Map();
  for (let i = 0; i < found.length; i++) {
    const cur = found[i];
    const next = found[i + 1];
    // Cut at the next heading's label (not its content start) so we don't swallow "**Treatment:**"
    const end = next ? next.labelStart : normalized.length;
    const content = normalized.slice(cur.start, end).trim();
    sectionByHeading.set(cur.heading, content);
  }

  const description = sectionByHeading.get('Description') || '';
  const treatment = sectionByHeading.get('Treatment') || '';
  const prevention = sectionByHeading.get('Prevention') || '';
  let recommendedRaw = sectionByHeading.get('Recommended products') || '';

  const stripLeadingHeading = (value, heading) => {
    const v = String(value || '').trim();
    const re = new RegExp(`^\\s*${escapeRegex(heading)}\\s*:\\s*`, 'i');
    return v.replace(re, '').trim();
  };

  const cleanedDescription = stripLeadingHeading(description, 'Description');
  const cleanedTreatment = stripLeadingHeading(treatment, 'Treatment');
  const cleanedPrevention = stripLeadingHeading(prevention, 'Prevention');
  recommendedRaw = stripLeadingHeading(recommendedRaw, 'Recommended products');

  const cutAtHeading = (value, heading) => {
    const v = String(value || '');
    const re = new RegExp(`\\n\\s*${escapeRegex(heading)}\\s*:\\s*`, 'i');
    return v.split(re)[0].trim();
  };

  // Remove any embedded next-heading tokens that models sometimes include.
  const descCleaned = cutAtHeading(
    cutAtHeading(cutAtHeading(cleanedDescription, 'Treatment'), 'Prevention'),
    'Recommended products'
  );

  const treatmentCleaned = cutAtHeading(
    cutAtHeading(cleanedTreatment, 'Prevention'),
    'Recommended products'
  );

  const preventionCleaned = cutAtHeading(cleanedPrevention, 'Recommended products');

  const recommendedProducts = [];
  if (recommendedRaw) {
    const recommendedFirstBlock = recommendedRaw.split(/\n\s*\n/g)[0] || '';
    const parts = recommendedFirstBlock
      .split(/\n|,/g)
      .map((p) =>
        p
          .replace(/^[-*]\s*/g, '')
          .replace(/^\d+\.\s*/g, '')
          .replace(/^\s*and\s+/i, '')
          .trim()
      )
      .filter(Boolean);
    for (const p of parts) {
      let cleaned = String(p).trim();
      cleaned = cleaned.split('(')[0].trim();
      cleaned = cleaned.replace(/[.;:]\s*$/, '').trim();
      cleaned = cleaned.replace(/^["']|["']$/g, '').trim();
      cleaned = cleaned.replace(/\s+/g, ' ');
      if (cleaned && !recommendedProducts.includes(cleaned)) recommendedProducts.push(cleaned);
    }
  }

  return {
    description: descCleaned,
    treatment: treatmentCleaned,
    prevention: preventionCleaned,
    recommendedProducts,
  };
}

function detectLanguageHint(message) {
  const s = String(message || '');
  if (/[\u0600-\u06FF]/.test(s)) return 'Arabic';
  return 'English';
}

// In-memory cache with short TTL to avoid repeated calls.
const cache = new Map(); // key -> { expiresAt, value }
const inFlight = new Map(); // key -> Promise

async function generateTreatment(
  diseaseName,
  cropName,
  { timeoutMs = 45000, ttlMs = 6 * 60 * 60 * 1000, userMessage } = {}
) {
  const dName = String(diseaseName || 'Unknown disease').trim();
  const cName = String(cropName || 'your crop').trim();
  const language = detectLanguageHint(userMessage);
  const key = `${normalizeKey(dName)}|${normalizeKey(cName)}|${normalizeKey(language)}`;
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    // Keep prompt compact so HF responds faster after image classification.
    const prompt = `Plant disease advisory for farmers.
Disease name: ${dName}
Crop: ${cName}
Reply language: ${language}

Return EXACTLY this plain-text format (no markdown, no bold **):
Description:
<2-4 sentences on symptoms and cause>
Treatment:
<practical treatment steps>
Prevention:
<practical prevention steps>
Recommended products:
<comma-separated product names>

Rules: agriculture only; concrete advice; no extra commentary outside those labels.`;

    const rawText = await callHuggingFaceTextModel(prompt, timeoutMs);
    if (!rawText) throw new Error('Empty text AI response');

    const parsed = parseAdvisorText(rawText);
    const description = parsed.description || '';
    const treatment = parsed.treatment || '';
    const prevention = parsed.prevention || '';
    const recommendations = parsed.recommendedProducts || [];

    // If the model ignored the template, still return usable text instead of empty sections.
    if (!description && !treatment && !prevention) {
      return {
        description: rawText.slice(0, 800),
        treatment: '',
        prevention: '',
        recommendations,
        rawText,
        looselyFormatted: true,
      };
    }

    return {
      description,
      treatment,
      prevention,
      recommendations,
      rawText,
    };
  })();

  inFlight.set(key, promise);
  try {
    const value = await promise;
    cache.set(key, { expiresAt: now + ttlMs, value });
    return value;
  } catch (err) {
    // Do not leave a rejected promise stuck for callers sharing inFlight
    throw err;
  } finally {
    inFlight.delete(key);
  }
}

module.exports = {
  generateTreatment,
  guessCropName,
  parseAdvisorText,
};

