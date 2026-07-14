// NOTE: The model originally used in this project may not be deployed for inference providers (410).
// This model is served by an inference provider, so it works in production without GPUs.
const HF_MODEL_ENDPOINT =
  'https://router.huggingface.co/hf-inference/models/linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification';

async function predictDiseaseFromImageBuffer(imageBuffer, mimeType) {
  const token = process.env.HF_API_TOKEN;
  if (!token) {
    throw new Error('HF_API_TOKEN is not set in server environment');
  }
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error('imageBuffer is empty or invalid');
  }

  // HuggingFace Inference API for image classification expects the image as
  // a base64 string inside a JSON payload (serverless inference providers).
  const base64 = imageBuffer.toString('base64');

  const res = await fetch(HF_MODEL_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      inputs: base64,
      parameters: { top_k: 1 },
    }),
  });

  if (!res.ok) {
    // Some HF models are not deployed by any inference provider and return 410.
    // We surface it as a deterministic error so the pipeline can fallback safely.
    if (res.status === 410) {
      throw new Error('HuggingFace model is not deployed by any inference provider (410)');
    }
    const text = await res.text().catch(() => '');
    throw new Error(`HuggingFace request failed: ${res.status} ${text.slice(0, 300)}`);
  }

  // Expected response is usually an array of { label, score }
  const data = await res.json().catch(() => null);

  const extractLabel = () => {
    if (Array.isArray(data)) {
      const first = data[0];
      return first?.label || first?.name || null;
    }
    if (data && typeof data === 'object') {
      return data?.label || data?.name || data?.prediction?.label || null;
    }
    return null;
  };

  const label = extractLabel();
  if (!label) {
    throw new Error('Unable to parse disease label from HuggingFace response');
  }
  return String(label).trim();
}

module.exports = { predictDiseaseFromImageBuffer };

