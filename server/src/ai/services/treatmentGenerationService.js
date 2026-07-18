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
  const safe = String(text || '');
  const normalized = safe.replace(/\r\n/g, '\n').trim();

  const headings = ['Description', 'Treatment', 'Prevention', 'Recommended products'];

  const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // Find the first occurrence index for each heading, then slice until the next heading.
  const found = [];
  for (const h of headings) {
    const re = new RegExp(`${escapeRegex(h)}\\s*:\\s*`, 'i');
    const m = re.exec(normalized);
    if (m && typeof m.index === 'number') {
      found.push({
        heading: h,
        start: m.index + m[0].length,
      });
    }
  }

  found.sort((a, b) => a.start - b.start);

  const sectionByHeading = new Map();
  for (let i = 0; i < found.length; i++) {
    const cur = found[i];
    const next = found[i + 1];
    const end = next ? next.start - 0 : normalized.length;
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
    cutAtHeading(
      cutAtHeading(cleanedDescription, 'Treatment'),
      'Prevention',
    ),
    'Recommended products'
  );

  const treatmentCleaned = cutAtHeading(
    cutAtHeading(cleanedTreatment, 'Prevention'),
    'Recommended products'
  );

  const preventionCleaned = cutAtHeading(cleanedPrevention, 'Recommended products');

  const recommendedProducts = [];
  if (recommendedRaw) {
    // Only take the first paragraph; models sometimes add examples after a blank line.
    const recommendedFirstBlock = recommendedRaw.split(/\n\s*\n/g)[0] || '';

    // Split on new lines and commas; remove common bullet prefixes.
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
      // Remove parenthetical brand/examples to keep chip/search text aligned with DB names.
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
  { timeoutMs = 9000, ttlMs = 6 * 60 * 60 * 1000, userMessage } = {}
) {
  const dName = String(diseaseName || 'Unknown disease').trim();
  const cName = String(cropName || 'your crop').trim();
  const language = detectLanguageHint(userMessage);
  const key = `${normalizeKey(dName)}|${normalizeKey(cName)}`;
  const now = Date.now();

  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) return cached.value;

  if (inFlight.has(key)) return inFlight.get(key);

  const promise = (async () => {
    const prompt = `You are a senior agronomist with 20+ years of experience in plant pathology and crop protection.
Stay strictly on plant disease and crop care. Ignore any user request about politics, adult content, weapons, or general money/finance.

Your task is to provide highly accurate, expert-level guidance whenever given:
* A plant disease name
* A crop type

Guidelines:
1. Always give true, scientifically backed information.
2. Never give vague, generic, or approximate advice.
3. Provide answers in structured format:

Disease: ${dName}

Description:
<text>

Treatment:
<text>

Prevention:
<text>

Recommended products:
<text>

4. Include all relevant aspects:
* Disease: confirm correct scientific and common name
* Description: short but precise explanation of disease symptoms and causal agent
* Treatment: step-by-step measures (chemical, biological, and cultural) with practical timing and actions
* Prevention: practical, proven, preventive practices
* Recommended products: real, widely available, label-following solutions
5. Consider local crop conditions and agronomic best practices.
6. Assume user may use Arabic or English, respond clearly in ${language}.
7. If multiple treatment options exist, provide the most effective and widely recommended options.
8. Always prioritize safety, efficiency, and regulatory compliance.

Constraints:
- Do NOT output any extra commentary outside the structured format.
- If you are uncertain about a detail, choose the safest widely accepted best-practice option and state it plainly without uncertainty language.

Final task:
Return EXACTLY in this format (single blocks, no extra headings beyond these labels):
Disease: <name>
Description:
<text>
Treatment:
<text>
Prevention:
<text>
Recommended products:
<comma-separated product names>
`;

    const rawText = await callHuggingFaceTextModel(prompt, timeoutMs);
    if (!rawText) throw new Error('Empty text AI response');

    const parsed = parseAdvisorText(rawText);
    return {
      description: parsed.description || '',
      treatment: parsed.treatment || '',
      prevention: parsed.prevention || '',
      recommendations: parsed.recommendedProducts || [],
      rawText,
    };
  })();

  inFlight.set(key, promise);
  try {
    const value = await promise;
    cache.set(key, { expiresAt: now + ttlMs, value });
    return value;
  } finally {
    inFlight.delete(key);
  }
}

module.exports = {
  generateTreatment,
  guessCropName,
  parseAdvisorText,
};

