function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function generateGeneralImageObservation(message) {
  const text = normalizeText(message);

  if (text.includes('healthy') || text.includes('good') || text.includes('normal')) {
    return "From this photo, the plant doesn't show obvious severe disease signs. If you notice spreading spots or fast yellowing, share a closer leaf photo and mention the crop type.";
  }

  if (text.includes('what is this') || text.includes('what this') || text.includes('what is')) {
    return "I can see a plant in the image, but I can't reliably confirm a specific disease from a single image. Please upload a close-up of the affected leaves (front + back) and tell me the crop name and your region.";
  }

  return "I can review the plant image, but identifying the exact disease confidently requires close-up symptoms (leaf/spot/border patterns) and your crop details. If you share a clearer close-up of the problem area, I can help you narrow it down.";
}

function generateCasualChatResponse() {
  return 'Hi! I can help with farming and plants. Tell me what you’re growing (crop name), and if you have an issue, share symptoms or upload a photo.';
}

function generateAgricultureChatResponse(message) {
  const text = normalizeText(message);

  // Irrigation / water
  if (text.includes('irrigation') || text.includes('water') || text.includes('watering') || text.includes('drip')) {
    return [
      'Watering guidance:',
      '- Water early in the day to reduce evaporation and leaf wetness.',
      '- Aim for deep, infrequent irrigation (so roots grow deeper).',
      '- Check soil moisture before watering (finger test: top 2–5 cm should be slightly dry).',
      '- For many crops, drip irrigation helps reduce disease spread by keeping foliage dry.'
    ].join('\n');
  }

  // Fertilizers
  if (
    text.includes('fertilizer') ||
    text.includes('fertiliser') ||
    text.includes('fertilization') ||
    text.includes('fertilisation') ||
    text.includes('npk') ||
    text.includes('manure') ||
    text.includes('compost') ||
    text.includes('urea')
  ) {
    return [
      'Fertilizer guidance (general):',
      '- Start with a soil test if possible (pH + NPK).',
      '- Use balanced fertilizers for early growth; increase potassium during flowering/fruiting.',
      '- Avoid over-fertilizing: it can burn roots and increase pest/disease susceptibility.',
      '- Compost/organic matter improves soil structure and helps long-term fertility.'
    ].join('\n');
  }

  // Planting / sowing
  if (text.includes('plant') || text.includes('planting') || text.includes('sow') || text.includes('seed') || text.includes('transplant')) {
    return [
      'Planting tips (general):',
      '- Use clean, healthy seedlings/seeds.',
      '- Match planting depth and spacing to the crop variety.',
      '- Prepare soil: loosen, remove debris, and ensure drainage.',
      '- After transplanting, keep moisture steady until plants establish.'
    ].join('\n');
  }

  // Pests / insects
  if (text.includes('pest') || text.includes('insect') || text.includes('bugs') || text.includes('aphid') || text.includes('caterpillar') || text.includes('weed')) {
    return [
      'Pest management (integrated, general):',
      '- Inspect leaves regularly (especially undersides).',
      '- Remove heavily infested leaves early.',
      '- Use targeted, labeled treatments when needed (organic options first where suitable).',
      '- Encourage beneficial insects by avoiding broad-spectrum sprays.'
    ].join('\n');
  }

  // Seasonal / climate
  if (text.includes('spring') || text.includes('summer') || text.includes('autumn') || text.includes('winter') || text.includes('season')) {
    return [
      'Seasonal farming guidance (general):',
      '- Adjust watering and fertilizer timing to the season’s growth rate.',
      '- Watch for seasonal disease pressure (humidity/cool nights vs. hot dry stress).',
      '- Use mulching to stabilize soil moisture and temperature.'
    ].join('\n');
  }

  // Soil
  if (text.includes('soil') || text.includes('ph') || text.includes('compost') || text.includes('drainage')) {
    return [
      'Soil improvement (general):',
      '- Check pH and nutrient levels (soil test).',
      '- Add organic matter (compost) to improve structure and water retention.',
      '- Ensure good drainage for root health; avoid waterlogging.',
      '- Mulch to reduce evaporation and suppress weeds.'
    ].join('\n');
  }

  // Fallback for agriculture questions
  return [
    'I can help with your farming question.',
    'To give the best advice, tell me:',
    '- Crop/plant name',
    '- Your location/region (or climate: hot/dry, humid, etc.)',
    '- The specific issue or goal (yield, pests, leaf problems, irrigation, fertilizer schedule)'
  ].join('\n');
}

module.exports = {
  generateGeneralImageObservation,
  generateCasualChatResponse,
  generateAgricultureChatResponse,
};

