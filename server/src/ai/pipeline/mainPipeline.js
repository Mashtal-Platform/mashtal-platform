const { detectIntent } = require('../intent/detectIntent');
const { predictDiseaseFromImageBuffer } = require('../services/localDiseaseService');
const { getDiseaseKnowledge } = require('../knowledge/knowledgeBase');
const {
  generateChatReply,
  generateAgricultureChatResponse,
  generateCasualChatResponse,
  sanitizeHistory,
  getOffTopicRefusal,
} = require('../services/chatService');
const { generateTreatment, guessCropName } = require('../services/treatmentGenerationService');

function detectLanguage(message) {
  const text = String(message || '');
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
}

async function runAIAssistant({ message, hasImage, imageBuffer, mimeType, history }) {
  const intent = detectIntent(message, hasImage);
  const language = detectLanguage(message);
  const chatHistory = sanitizeHistory(history);

  // Refuse off-topic text before calling HF (or local keyword fallbacks).
  if (!hasImage) {
    const refused = getOffTopicRefusal(message);
    if (refused) {
      return { kind: 'chat', intent: 'off_topic_refused', text: refused };
    }
  }

  // Image flow — always run local disease classifier on uploaded plant photos
  if (hasImage) {
    let diseaseName = null;
    let detectionError = null;
    try {
      diseaseName = await predictDiseaseFromImageBuffer(imageBuffer, mimeType);
    } catch (err) {
      detectionError = err?.message || String(err);
      diseaseName = 'Unknown disease';
    }

    const disease = getDiseaseKnowledge(diseaseName, { language });

    const enrichedDescription =
      detectionError && diseaseName === 'Unknown disease'
        ? `${disease.description}\n\nNote: Image disease detection model was not available right now. ${detectionError}`
        : disease.description;

    const cropName = guessCropName(message);

    let aiTreatment = null;
    let aiError = null;
    try {
      // Image classification already used some time; give HF enough budget + retries in client.
      aiTreatment = await generateTreatment(diseaseName, cropName, {
        timeoutMs: Number(process.env.HF_TREATMENT_TIMEOUT_MS) || 45000,
        userMessage: message,
      });
      console.log(
        '[AI] HF treatment OK for',
        diseaseName,
        '| desc chars:',
        aiTreatment?.description?.length || 0
      );
    } catch (err) {
      aiError = err?.message || String(err);
      console.error('[AI] HF treatment failed, using knowledge base:', aiError);
    }

    const hasStructuredAi =
      aiTreatment &&
      typeof aiTreatment.description === 'string' &&
      aiTreatment.description.trim() &&
      typeof aiTreatment.treatment === 'string' &&
      aiTreatment.treatment.trim() &&
      typeof aiTreatment.prevention === 'string' &&
      aiTreatment.prevention.trim();

    // Accept loosely formatted HF text (description-only) rather than discarding HF entirely.
    const hasLooseAi =
      aiTreatment &&
      aiTreatment.looselyFormatted &&
      typeof aiTreatment.description === 'string' &&
      aiTreatment.description.trim().length > 40;

    const hasAi = Boolean(hasStructuredAi || hasLooseAi);

    const descriptionToUse = hasStructuredAi
      ? aiTreatment.description
      : hasLooseAi
        ? aiTreatment.description
        : enrichedDescription;
    const treatmentToUse = hasStructuredAi ? aiTreatment.treatment : disease.treatment;
    const preventionToUse = hasStructuredAi ? aiTreatment.prevention : disease.prevention;

    const recommendationsToUse =
      hasAi && Array.isArray(aiTreatment.recommendations) && aiTreatment.recommendations.length
        ? aiTreatment.recommendations
        : Array.isArray(disease.recommendations)
          ? disease.recommendations
          : [];

    return {
      kind: 'disease_detection',
      intent: intent === 'image_disease_detection' ? intent : 'image_disease_detection',
      disease: {
        name: disease.name,
        description: descriptionToUse,
        treatment: treatmentToUse,
        prevention: preventionToUse,
      },
      recommendations: recommendationsToUse,
      source: hasAi ? 'huggingface+local-classifier' : 'local-knowledge+local-classifier',
      formattedText: [
        ...(language === 'ar' ? [`المرض: ${disease.name}`] : [`Disease: ${disease.name}`]),
        '',
        ...(language === 'ar' ? ['الوصف:'] : ['Description:']),
        descriptionToUse,
        '',
        ...(language === 'ar' ? ['العلاج:'] : ['Treatment:']),
        treatmentToUse,
        '',
        ...(language === 'ar' ? ['الوقاية:'] : ['Prevention:']),
        preventionToUse,
        ...(Array.isArray(recommendationsToUse) && recommendationsToUse.length
          ? [
              '',
              ...(language === 'ar' ? ['المنتجات الموصى بها:'] : ['Recommended products:']),
              ...recommendationsToUse.map((p) => `- ${p}`),
            ]
          : []),
        ...(aiError && !hasAi
          ? [
              '',
              ...(language === 'ar'
                ? [`ملاحظة: تعذر توليد النص عبر الذكاء الاصطناعي، تم استخدام قاعدة المعرفة المحلية. (${aiError})`]
                : [`Note: AI text generation timed out or failed. Used local knowledge base. (${aiError})`]),
            ]
          : []),
      ].join('\n'),
    };
  }

  // Text flow — Hugging Face with this-chat history
  try {
    const text = await generateChatReply(message, chatHistory, { timeoutMs: 25000 });
    return {
      kind: 'chat',
      intent,
      text,
    };
  } catch (err) {
    console.error('[AI] HF chat failed, using local fallback:', err?.message || err);
    const fallback =
      intent === 'text_agriculture_question'
        ? generateAgricultureChatResponse(message)
        : generateCasualChatResponse();
    return {
      kind: 'chat',
      intent,
      text: fallback,
      note: `HF chat unavailable: ${err?.message || String(err)}`,
    };
  }
}

module.exports = { runAIAssistant };
