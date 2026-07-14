const { buildDiseaseIndexJson, buildDiseaseIndexMarkdown } = require('../knowledge/diseaseIndex');

async function getKnowledgeIndex(req, res) {
  try {
    const format = String(req.query?.format || 'json').toLowerCase();
    if (format === 'md' || format === 'markdown') {
      const markdown = buildDiseaseIndexMarkdown();
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.send(markdown);
    }
    return res.json(buildDiseaseIndexJson());
  } catch (err) {
    console.error('[AI] getKnowledgeIndex error:', err);
    return res.status(500).json({ message: 'Failed to build disease index' });
  }
}

module.exports = { getKnowledgeIndex };

