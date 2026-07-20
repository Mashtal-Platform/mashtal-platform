const { translateText } = require('../services/translateService');

async function translate(req, res) {
  try {
    const text = req.body?.text;
    const to = req.body?.to === 'ar' ? 'ar' : 'en';

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ message: 'text is required' });
    }
    if (text.length > 5000) {
      return res.status(400).json({ message: 'text must be at most 5000 characters' });
    }

    const result = await translateText(text, to);
    return res.json(result);
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      message: err.message || 'Translation failed',
      code: err.code,
    });
  }
}

module.exports = { translate };
