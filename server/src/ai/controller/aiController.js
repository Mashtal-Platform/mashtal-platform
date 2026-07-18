const { runAIAssistant } = require('../pipeline/mainPipeline');

function parseHistory(raw) {
  if (!raw) return [];
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

async function handleAssistant(req, res) {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    const history = parseHistory(req.body?.history);
    const file = req.file || null;
    const hasImage = Boolean(file);

    if (!message.trim() && !hasImage) {
      return res.status(400).json({ message: 'Message or image is required' });
    }

    if (hasImage) {
      if (!file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
        return res.status(400).json({ message: 'Uploaded image is empty' });
      }
    }

    const result = await runAIAssistant({
      message: message.trim() || (hasImage ? 'Please analyze this plant image for disease.' : ''),
      hasImage,
      imageBuffer: file?.buffer,
      mimeType: file?.mimetype,
      history,
    });

    res.json(result);
  } catch (err) {
    console.error('[AI] handleAssistant error:', err);
    res.status(500).json({
      message: 'AI request failed',
      error: err?.message || String(err),
    });
  }
}

module.exports = { handleAssistant };
