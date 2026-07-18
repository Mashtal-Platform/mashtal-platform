const { callHfChatCompletions } = require('./hfTextClient');

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

/** Keep only valid OpenAI-style turns from this chat session. */
function sanitizeHistory(history, { maxMessages = 16 } = {}) {
  if (!Array.isArray(history)) return [];
  const cleaned = [];
  for (const item of history) {
    if (!item || typeof item !== 'object') continue;
    const role = item.role === 'assistant' ? 'assistant' : item.role === 'user' ? 'user' : null;
    const content = typeof item.content === 'string' ? item.content.trim() : '';
    if (!role || !content) continue;
    cleaned.push({ role, content: content.slice(0, 4000) });
  }
  return cleaned.slice(-maxMessages);
}

function detectLanguageHint(message) {
  const s = String(message || '');
  if (/[\u0600-\u06FF]/.test(s)) return 'Arabic';
  return 'English';
}

/**
 * Hard off-topic / unsafe topics for the agricultural assistant.
 * Farming-related money (fertilizer cost, crop prices) is allowed; finance/crypto/politics/etc. are not.
 */
function getOffTopicRefusal(message) {
  const text = normalizeText(message);
  if (!text) return null;

  const categories = [
    {
      id: 'adult',
      patterns: [
        /\b(porn|pornography|xxx|nsfw|nude|nudes|naked|sex\b|sexual|erotic|onlyfans|hentai)\b/i,
        /(إباحي|بورن|جنس\s*صريح|عاري|صور\s*إباحية)/,
      ],
    },
    {
      id: 'weapons',
      patterns: [
        /\b(gun|guns|firearm|firearms|rifle|pistol|handgun|ammunition|ammo|weapon|weapons|bomb|explosive)\b/i,
        /(سلاح|أسلحة|مسدس|بندقية|ذخيرة|قنبلة)/,
      ],
    },
    {
      id: 'politics',
      patterns: [
        /\b(politic|politics|politician|election|elections|president|prime\s*minister|parliament|congress|democrat|republican|vote\s*for|political\s*party|geopolitics)\b/i,
        /(سياسة|سياسي|انتخابات|رئيس\s*الجمهورية|حزب\s*سياسي|برلمان)/,
      ],
    },
    {
      id: 'finance',
      patterns: [
        /\b(bitcoin|crypto|cryptocurrency|stock\s*market|forex|trading\s*stocks|hedge\s*fund|casino|gambling|lottery|loan\s*shark|money\s*laundering|how\s*to\s*make\s*money\s*fast)\b/i,
        /\b(invest\s+in\s+(stocks?|crypto|bitcoin|nft))\b/i,
        /(بيتكوين|عملات\s*رقمية|بورصة|تداول\s*أسهم|قمار|كازينو)/,
      ],
    },
    {
      id: 'violence_crime',
      patterns: [
        /\b(how\s*to\s*(kill|murder|hack|steal|rob)|make\s*a\s*bomb|terrorist|assassination)\b/i,
        /(كيف\s*أقتل|كيف\s*أسرق|صنع\s*قنبلة)/,
      ],
    },
  ];

  for (const cat of categories) {
    if (cat.patterns.some((re) => re.test(text))) {
      const isAr = /[\u0600-\u06FF]/.test(String(message || ''));
      if (isAr) {
        return 'أنا مساعد زراعي في مشتل فقط. لا أجيب عن مواضيع مثل السياسة أو المحتوى الجنسي أو الأسلحة أو المال والاستثمار العام. اسألني عن الزراعة والنباتات والتربة والري والآفات والأسمدة أو صحة المحاصيل.';
      }
      return "I'm Mashtal's agricultural assistant only. I don't discuss politics, adult content, weapons, general money/finance, or similar topics. Ask me about farming, plants, soil, irrigation, pests, fertilizers, or crop health.";
    }
  }
  return null;
}

const SYSTEM_PROMPT = `You are Mashtal's agricultural assistant for farmers and gardeners ONLY.

Allowed topics: farming, plants, crops, soil, irrigation, pests, fertilizers, plant diseases, harvest, greenhouse, and practical garden/farm advice (including farm input costs tied to agriculture, e.g. fertilizer price tips).

STRICT refusals — if the user asks about any of the following, do NOT answer the substance. Reply briefly that you only help with agriculture and invite a farming question:
- Politics, elections, governments, parties, wars, news debates
- Adult / sexual / pornographic content
- Guns, firearms, weapons, explosives, violence, crime how-tos
- General money, banking, crypto, stocks, gambling, get-rich schemes (farm-cost questions are OK)
- Anything illegal or harmful unrelated to plant care

Never role-play as a political, sexual, weapons, or finance advisor.
Use the conversation history from THIS chat only — do not invent earlier chats.
If the user uploaded a plant image earlier in this chat, use that context when they ask follow-ups.
If details are missing (crop, region, symptoms), ask a short clarifying question.
Respond in the same language as the user's latest message (Arabic or English).
Keep answers focused and useful; use short paragraphs or bullet points when helpful.
Do not claim you can see an image unless the user message or history says one was uploaded.`;

/**
 * Generate a chat reply via Hugging Face (with this-session history).
 */
async function generateChatReply(message, history = [], { timeoutMs = 25000 } = {}) {
  const userMessage = String(message || '').trim();
  if (!userMessage) {
    throw new Error('Empty message');
  }

  const refused = getOffTopicRefusal(userMessage);
  if (refused) return refused;

  const prior = sanitizeHistory(history);
  const language = detectLanguageHint(userMessage);

  const messages = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\nPreferred reply language hint: ${language}.`,
    },
    ...prior,
    { role: 'user', content: userMessage },
  ];

  const text = await callHfChatCompletions({
    messages,
    timeoutMs,
    max_tokens: 700,
    temperature: 0.35,
  });

  if (!text) throw new Error('Empty HF chat response');
  return text;
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

  if (text.includes('irrigation') || text.includes('water') || text.includes('watering') || text.includes('drip')) {
    return [
      'Watering guidance:',
      '- Water early in the day to reduce evaporation and leaf wetness.',
      '- Aim for deep, infrequent irrigation (so roots grow deeper).',
      '- Check soil moisture before watering (finger test: top 2–5 cm should be slightly dry).',
      '- For many crops, drip irrigation helps reduce disease spread by keeping foliage dry.',
    ].join('\n');
  }

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
      '- Compost/organic matter improves soil structure and helps long-term fertility.',
    ].join('\n');
  }

  if (text.includes('plant') || text.includes('planting') || text.includes('sow') || text.includes('seed') || text.includes('transplant')) {
    return [
      'Planting tips (general):',
      '- Use clean, healthy seedlings/seeds.',
      '- Match planting depth and spacing to the crop variety.',
      '- Prepare soil: loosen, remove debris, and ensure drainage.',
      '- After transplanting, keep moisture steady until plants establish.',
    ].join('\n');
  }

  if (text.includes('pest') || text.includes('insect') || text.includes('bugs') || text.includes('aphid') || text.includes('caterpillar') || text.includes('weed')) {
    return [
      'Pest management (integrated, general):',
      '- Inspect leaves regularly (especially undersides).',
      '- Remove heavily infested leaves early.',
      '- Use targeted, labeled treatments when needed (organic options first where suitable).',
      '- Encourage beneficial insects by avoiding broad-spectrum sprays.',
    ].join('\n');
  }

  if (text.includes('spring') || text.includes('summer') || text.includes('autumn') || text.includes('winter') || text.includes('season')) {
    return [
      'Seasonal farming guidance (general):',
      '- Adjust watering and fertilizer timing to the season’s growth rate.',
      '- Watch for seasonal disease pressure (humidity/cool nights vs. hot dry stress).',
      '- Use mulching to stabilize soil moisture and temperature.',
    ].join('\n');
  }

  if (text.includes('soil') || text.includes('ph') || text.includes('compost') || text.includes('drainage')) {
    return [
      'Soil improvement (general):',
      '- Check pH and nutrient levels (soil test).',
      '- Add organic matter (compost) to improve structure and water retention.',
      '- Ensure good drainage for root health; avoid waterlogging.',
      '- Mulch to reduce evaporation and suppress weeds.',
    ].join('\n');
  }

  return [
    'I can help with your farming question.',
    'To give the best advice, tell me:',
    '- Crop/plant name',
    '- Your location/region (or climate: hot/dry, humid, etc.)',
    '- The specific issue or goal (yield, pests, leaf problems, irrigation, fertilizer schedule)',
  ].join('\n');
}

module.exports = {
  generateChatReply,
  sanitizeHistory,
  getOffTopicRefusal,
  generateGeneralImageObservation,
  generateCasualChatResponse,
  generateAgricultureChatResponse,
};
