/**
 * OpenAI-compatible Hugging Face Router chat completions.
 * Used for text Q&A and structured treatment generation.
 */
const HF_TEXT_CHAT_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';
const HF_TEXT_CHAT_MODEL =
  process.env.HF_TEXT_CHAT_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

/**
 * @param {object} opts
 * @param {{ role: string, content: string }[]} opts.messages
 * @param {number} [opts.timeoutMs]
 * @param {number} [opts.max_tokens]
 * @param {number} [opts.temperature]
 */
async function callHfChatCompletions({
  messages,
  timeoutMs = 25000,
  max_tokens = 700,
  temperature = 0.35,
} = {}) {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN is not set in server environment');
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('HF chat requires at least one message');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(HF_TEXT_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: HF_TEXT_CHAT_MODEL,
        messages,
        max_tokens,
        temperature,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new Error(`HF text generation failed: ${res.status} ${t.slice(0, 300)}`);
    }

    const data = await res.json().catch(() => null);
    const content = data?.choices?.[0]?.message?.content;
    return String(content || '').trim();
  } finally {
    clearTimeout(timer);
  }
}

/** Single-prompt helper (treatment generation, etc.). */
async function callHuggingFaceTextModel(prompt, timeoutMs) {
  return callHfChatCompletions({
    messages: [
      { role: 'system', content: 'You are an expert agricultural advisor. Only discuss plant health, crops, and farming. Refuse politics, adult content, weapons, and general finance.' },
      { role: 'user', content: prompt },
    ],
    timeoutMs,
    max_tokens: 520,
    temperature: 0.2,
  });
}

module.exports = {
  callHfChatCompletions,
  callHuggingFaceTextModel,
  HF_TEXT_CHAT_MODEL,
};
