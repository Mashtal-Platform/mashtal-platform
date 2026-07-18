/**
 * Local plant-disease image classification via the Python sidecar
 * (server/ai-disease/predict_server.py). No per-request cloud image API.
 */
const DISEASE_URL =
  process.env.LOCAL_DISEASE_URL || 'http://127.0.0.1:8765';

async function predictDiseaseFromImageBuffer(imageBuffer, mimeType) {
  if (!imageBuffer || !Buffer.isBuffer(imageBuffer) || imageBuffer.length === 0) {
    throw new Error('imageBuffer is empty or invalid');
  }

  const type = mimeType && String(mimeType).startsWith('image/') ? mimeType : 'image/jpeg';
  const ext = type.includes('png') ? 'png' : 'jpg';
  const blob = new Blob([imageBuffer], { type });
  const form = new FormData();
  form.append('file', blob, `leaf.${ext}`);

  const res = await fetch(`${DISEASE_URL}/predict`, {
    method: 'POST',
    body: form,
    signal: AbortSignal.timeout(Number(process.env.LOCAL_DISEASE_TIMEOUT_MS) || 120000),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Local disease model failed: ${res.status} ${text.slice(0, 300)}`);
  }

  const data = await res.json().catch(() => null);
  const label = data?.label;
  if (!label) {
    throw new Error('Local disease model returned no label');
  }
  return String(label).trim();
}

async function isLocalDiseaseReady() {
  try {
    const res = await fetch(`${DISEASE_URL}/health`, {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data?.ready;
  } catch {
    return false;
  }
}

module.exports = {
  predictDiseaseFromImageBuffer,
  isLocalDiseaseReady,
  DISEASE_URL,
};
