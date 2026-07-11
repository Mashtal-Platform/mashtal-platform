const fullKnowledge = require('./diseaseKnowledge.full.json');
const { buildGlobalDiseaseCatalogEntries } = require('./globalDiseaseCatalog');

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

const diseaseIndex = new Map();

function pickLocalized(value, language) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    if (language === 'ar') return value.ar || value.en || '';
    return value.en || value.ar || '';
  }
  return '';
}

function pickRecommendations(entry) {
  if (Array.isArray(entry.recommendedProducts)) return entry.recommendedProducts;
  if (Array.isArray(entry.recommendations)) return entry.recommendations;
  return [];
}

for (const entry of [...(fullKnowledge.entries || []), ...buildGlobalDiseaseCatalogEntries()]) {
  const canonical = String(entry.canonical || '').trim();
  if (!canonical) continue;

  const normalized = {
    name: canonical,
    description: entry.description || {},
    treatment: entry.treatment || {},
    prevention: entry.prevention || {},
    recommendations: pickRecommendations(entry),
  };

  const keys = [canonical, ...(Array.isArray(entry.aliases) ? entry.aliases : [])];
  for (const key of keys) {
    const k = normalizeName(key);
    if (!k) continue;
    diseaseIndex.set(k, normalized);
  }
}

function generateFallback(diseaseName, language = 'en') {
  const safeName = String(diseaseName || 'Unknown disease').trim();
  if (language === 'ar') {
    return {
      name: safeName,
      description:
        `هذه إرشادات عامة للحالة المتوقعة "${safeName}". للحصول على دقة أعلى، طابق الأعراض ميدانيًا مع نوع المحصول والظروف المناخية المحلية.`,
      treatment:
        'أزل الأجزاء شديدة الإصابة، وتجنب تبليل المجموع الخضري أثناء الري، واستخدم مبيدًا فطريًا/حيويًا معتمدًا حسب الملصق وتوقيت الرش المناسب.',
      prevention:
        'حافظ على التهوية الجيدة، والري عند الجذور، والتباعد المناسب بين النباتات، وإزالة المخلفات المصابة، مع اتباع دورة زراعية عندما يكون ذلك ممكنًا.',
      recommendations: [
        'مبيد فطري نحاسي',
        'مبيد كبريتي',
        'محفز حيوي مستخلص الطحالب',
      ],
    };
  }

  return {
    name: safeName,
    description:
      `Here is general guidance for "${safeName}". For best results, confirm symptoms on your crop and adjust treatments based on what matches your leaf pattern and conditions.`,
    treatment:
      'Remove heavily affected leaves, avoid watering the foliage, and consider a labeled fungicide/bio-fungicide depending on your crop. ' +
      'Follow the product label for correct dosage and re-application intervals.',
    prevention:
      'Use clean growing practices: ensure good airflow, water at the base/soil level, avoid overcrowding, remove plant debris, and rotate crops where possible.',
    recommendations: [
      'Copper fungicide',
      'Sulfur fungicide',
      'Seaweed biostimulant',
    ],
  };
}

/**
 * @param {string} diseaseName
 */
function getDiseaseKnowledge(diseaseName, options = {}) {
  const language = options.language === 'ar' ? 'ar' : 'en';
  const key = normalizeName(diseaseName);
  const hit = diseaseIndex.get(key);
  if (hit) {
    return {
      name: hit.name,
      description: pickLocalized(hit.description, language),
      treatment: pickLocalized(hit.treatment, language),
      prevention: pickLocalized(hit.prevention, language),
      recommendations: Array.isArray(hit.recommendations) ? hit.recommendations : [],
    };
  }

  return generateFallback(diseaseName, language);
}

module.exports = { getDiseaseKnowledge };

