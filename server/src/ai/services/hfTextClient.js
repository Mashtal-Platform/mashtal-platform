/**
 * OpenAI-compatible Hugging Face Router chat completions.
 * Used for text Q&A and structured treatment generation.
 */
const HF_TEXT_CHAT_ENDPOINT = 'https://router.huggingface.co/v1/chat/completions';
const HF_TEXT_CHAT_MODEL =
  process.env.HF_TEXT_CHAT_MODEL || 'meta-llama/Llama-3.1-8B-Instruct';

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableHfError(err) {
  const msg = `${err?.message || ''} ${err?.cause?.message || ''}`.toLowerCase();
  const name = String(err?.name || '');
  if (name === 'AbortError') return true;
  if (msg.includes('fetch failed')) return true;
  if (msg.includes('network')) return true;
  if (msg.includes('econnreset') || msg.includes('etimedout') || msg.includes('enotfound')) return true;
  if (msg.includes('socket') || msg.includes('tls')) return true;
  if (/HF text generation failed:\s*(429|500|502|503|504)/i.test(msg)) return true;
  return false;
}

/**
 * @param {object} opts
 * @param {{ role: string, content: string }[]} opts.messages
 * @param {number} [opts.timeoutMs]
 * @param {number} [opts.max_tokens]
 * @param {number} [opts.temperature]
 * @param {number} [opts.retries]
 */
async function callHfChatCompletions({
  messages,
  timeoutMs = 45000,
  max_tokens = 700,
  temperature = 0.35,
  retries = 3,
} = {}) {
  const token = process.env.HF_API_TOKEN;
  if (!token) throw new Error('HF_API_TOKEN is not set in server environment');
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('HF chat requires at least one message');
  }

  let lastErr;
  for (let attempt = 1; attempt <= retries; attempt += 1) {
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
        const err = new Error(`HF text generation failed: ${res.status} ${t.slice(0, 300)}`);
        if (
          attempt < retries &&
          (res.status === 429 || res.status >= 500)
        ) {
          lastErr = err;
          await sleep(600 * attempt);
          continue;
        }
        throw err;
      }

      const data = await res.json().catch(() => null);
      const content = data?.choices?.[0]?.message?.content;
      return String(content || '').trim();
    } catch (err) {
      lastErr = err;
      if (attempt < retries && isRetryableHfError(err)) {
        console.warn(
          `[HF] attempt ${attempt}/${retries} failed (${err?.message || err}); retrying…`
        );
        await sleep(700 * attempt);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastErr || new Error('HF request failed');
}

/** Single-prompt helper (treatment generation, etc.). */
async function callHuggingFaceTextModel(prompt, timeoutMs = 45000) {
  return callHfChatCompletions({
    messages: [
      {
        role: 'system',
        content:
          'You are an expert agricultural advisor. Only discuss plant health, crops, and farming. Refuse politics, adult content, weapons, and general finance. Use plain headings without markdown bold.',
      },
      { role: 'user', content: prompt },
    ],
    timeoutMs,
    max_tokens: 650,
    temperature: 0.2,
    retries: 3,
  });
}

module.exports = {
  callHfChatCompletions,
  callHuggingFaceTextModel,
  HF_TEXT_CHAT_MODEL,
};
