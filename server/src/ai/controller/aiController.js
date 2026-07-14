const { runAIAssistant } = require('../pipeline/mainPipeline');

async function handleAssistant(req, res) {
  try {
    const message = typeof req.body?.message === 'string' ? req.body.message : '';
    const file = req.file || null;
    const hasImage = Boolean(file);

    if (hasImage) {
      if (!file.buffer || !Buffer.isBuffer(file.buffer) || file.buffer.length === 0) {
        return res.status(400).json({ message: 'Uploaded image is empty' });
      }
    }

    const result = await runAIAssistant({
      message,
      hasImage,
      imageBuffer: file?.buffer,
      mimeType: file?.mimetype,
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

