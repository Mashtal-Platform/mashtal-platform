function normalizeText(value) {
  return String(value || '').toLowerCase().trim();
}

/**
 * Classify user intent based on text + whether an image was provided.
 *
 * Returns one of:
 * - "image_disease_detection"
 * - "image_general_question"
 * - "text_agriculture_question"
 * - "casual_chat"
 */
function detectIntent(message, hasImage) {
  const text = normalizeText(message);

  const diseaseKeywords = [
    'disease',
    'problem',
    'what is this',
    'infection',
    // Arabic / colloquial
    'مرض',
    'شو هيدا',
    'في مشكلة',
  ];

  const agricultureKeywords = [
    // agriculture / farming
    'agriculture',
    'farming',
    'farm',
    'crop',
    'crops',
    'plant',
    'plants',
    'soil',
    'irrigation',
    'water',
    'fertilizer',
    'fertiliser',
    'fertilization',
    'fertilisation',
    'compost',
    'manure',
    'mulch',
    'pruning',
    'planting',
    'seed',
    'seeds',
    'harvest',
    'season',
    // pests / general plant health terms
    'pest',
    'pests',
    'insect',
    'bugs',
    'weed',
    'disease',
    'fungus',
  ];

  const hasAgricultureSignal = agricultureKeywords.some((kw) => text.includes(kw));

  if (hasImage) {
    const hasDiseaseSignal = diseaseKeywords.some((kw) => text.includes(kw));
    return hasDiseaseSignal ? 'image_disease_detection' : 'image_general_question';
  }

  return hasAgricultureSignal ? 'text_agriculture_question' : 'casual_chat';
}

module.exports = { detectIntent };

