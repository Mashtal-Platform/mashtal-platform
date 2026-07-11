const { detectIntent } = require('../intent/detectIntent');
const { predictDiseaseFromImageBuffer } = require('../services/huggingfaceService');
const { getDiseaseKnowledge } = require('../knowledge/knowledgeBase');
const { generateAgricultureChatResponse, generateCasualChatResponse, generateGeneralImageObservation } = require('../services/chatService');
const { generateTreatment, guessCropName } = require('../services/treatmentGenerationService');

function detectLanguage(message) {
  const text = String(message || '');
  return /[\u0600-\u06FF]/.test(text) ? 'ar' : 'en';
}

async function runAIAssistant({ message, hasImage, imageBuffer, mimeType }) {
  const intent = detectIntent(message, hasImage);
  const language = detectLanguage(message);

  // Image flow
  if (hasImage) {
    if (intent === 'image_disease_detection') {
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

      // If disease is detected, generate a professional, specific response using HF text generation.
      let aiTreatment = null;
      let aiError = null;
      try {
        aiTreatment = await generateTreatment(diseaseName, cropName, { timeoutMs: 15000, userMessage: message });
      } catch (err) {
        aiError = err?.message || String(err);
      }

      const hasAi =
        aiTreatment &&
        typeof aiTreatment.description === 'string' &&
        aiTreatment.description.trim() &&
        typeof aiTreatment.treatment === 'string' &&
        aiTreatment.treatment.trim() &&
        typeof aiTreatment.prevention === 'string' &&
        aiTreatment.prevention.trim();

      const descriptionToUse = hasAi ? aiTreatment.description : enrichedDescription;
      const treatmentToUse = hasAi ? aiTreatment.treatment : disease.treatment;
      const preventionToUse = hasAi ? aiTreatment.prevention : disease.prevention;

      const recommendationsToUse =
        hasAi && Array.isArray(aiTreatment.recommendations) && aiTreatment.recommendations.length
          ? aiTreatment.recommendations
          : Array.isArray(disease.recommendations) ? disease.recommendations : [];

      return {
        kind: 'disease_detection',
        intent,
        disease: {
          name: disease.name,
          description: descriptionToUse,
          treatment: treatmentToUse,
          prevention: preventionToUse,
        },
        recommendations: recommendationsToUse,
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

    // Image but not disease-detection intent
    return {
      kind: 'general_image_question',
      intent,
      text: generateGeneralImageObservation(message),
    };
  }

  // Text flow
  if (intent === 'text_agriculture_question') {
    return {
      kind: 'chat',
      intent,
      text: generateAgricultureChatResponse(message),
    };
  }

  return {
    kind: 'chat',
    intent,
    text: generateCasualChatResponse(),
  };
}

module.exports = { runAIAssistant };

