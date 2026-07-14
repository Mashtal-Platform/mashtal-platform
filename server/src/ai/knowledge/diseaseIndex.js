const fullKnowledge = require('./diseaseKnowledge.full.json');
const { buildGlobalDiseaseCatalogEntries } = require('./globalDiseaseCatalog');

function getAllEntries() {
  return [...(fullKnowledge.entries || []), ...buildGlobalDiseaseCatalogEntries()];
}

function buildCanonicalIndex() {
  const names = new Set();
  for (const entry of getAllEntries()) {
    const canonical = String(entry.canonical || '').trim();
    if (canonical) names.add(canonical);
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

function buildDiseaseIndexMarkdown() {
  const all = buildCanonicalIndex();
  const lines = [];
  lines.push('# Global Plant Disease Index');
  lines.push('');
  lines.push(`Total canonical entries: **${all.length}**`);
  lines.push('');
  lines.push('> This index is generated from curated and global catalog sources.');
  lines.push('');
  for (const name of all) {
    lines.push(`- ${name}`);
  }
  lines.push('');
  return lines.join('\n');
}

function buildDiseaseIndexJson() {
  const all = buildCanonicalIndex();
  return {
    total: all.length,
    canonicalNames: all,
  };
}

module.exports = {
  buildCanonicalIndex,
  buildDiseaseIndexMarkdown,
  buildDiseaseIndexJson,
};

