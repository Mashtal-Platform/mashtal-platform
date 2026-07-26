/**
 * Mashtal — Real, content-matched image downloader
 *
 * This script updates ONLY images of existing Products and Posts.
 * It never creates or deletes products/posts/users/businesses.
 *
 * Source: Wikimedia Commons photographs through the official MediaWiki API.
 * Images are downloaded locally into:
 *   public/uploads/seed-images/products
 *   public/uploads/seed-images/posts
 *
 * MongoDB receives local public URLs such as:
 *   /uploads/seed-images/products/olive-tree-abc123.jpg
 *
 * Requirements:
 * - Node.js 18+ (Node 22 is fine)
 * - MONGODB_URI in .env
 *
 * Run from backend root:
 *   node scripts/fixRealMashtalImages.js
 */

require('dotenv').config();

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const MODEL_DIR = path.resolve(
  process.cwd(),
  process.env.MODEL_DIR || './src/models'
);

const PUBLIC_DIR = path.resolve(
  process.cwd(),
  process.env.PUBLIC_DIR || './public'
);

const Product = require(path.join(MODEL_DIR, 'Product'));
const Post = require(path.join(MODEL_DIR, 'Post'));

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const USER_AGENT =
  process.env.WIKIMEDIA_USER_AGENT ||
  'MashtalDemoSeeder/1.0 (educational agriculture platform)';

const PRODUCT_FOLDER = path.join(
  PUBLIC_DIR,
  'uploads',
  'seed-images',
  'products'
);

const POST_FOLDER = path.join(
  PUBLIC_DIR,
  'uploads',
  'seed-images',
  'posts'
);

const ATTRIBUTION_FILE = path.join(
  PUBLIC_DIR,
  'uploads',
  'seed-images',
  'image-attributions.json'
);

const REQUEST_DELAY_MS = 350;
const MAX_SEARCH_RESULTS = 25;
const MIN_WIDTH = 700;
const MIN_HEIGHT = 450;

const BLOCKED_TERMS = [
  'logo',
  'icon',
  'diagram',
  'map',
  'drawing',
  'illustration',
  'painting',
  'poster',
  'flag',
  'coat of arms',
  'seal',
  'screenshot',
  'document',
  'chart',
  'graph',
  'symbol',
  'clipart',
  'black and white',
  'monochrome',
  'microscopic',
  'herbarium',
  'museum specimen',
];

const GENERIC_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'how',
  'in', 'into', 'is', 'it', 'its', 'new', 'of', 'on', 'or', 'our', 'the',
  'their', 'this', 'to', 'using', 'we', 'with', 'your', 'you',
  'available', 'best', 'quality', 'premium', 'professional', 'special',
  'offer', 'sale', 'tips', 'guide', 'important', 'learn', 'discover',
]);

const AGRICULTURE_SYNONYMS = [
  {
    matches: ['olive', 'olives'],
    terms: ['olive tree', 'olive fruit', 'olive orchard'],
  },
  {
    matches: ['tomato', 'tomatoes'],
    terms: ['fresh tomato fruit', 'tomato plant', 'tomato crop'],
  },
  {
    matches: ['cucumber', 'cucumbers'],
    terms: ['cucumber fruit', 'cucumber plant'],
  },
  {
    matches: ['pepper', 'peppers', 'capsicum'],
    terms: ['bell pepper crop', 'pepper plant'],
  },
  {
    matches: ['lemon', 'citrus', 'orange'],
    terms: ['citrus fruit tree', 'lemon tree orchard'],
  },
  {
    matches: ['seed', 'seeds'],
    terms: ['vegetable seeds packet', 'agricultural seeds'],
  },
  {
    matches: ['seedling', 'seedlings'],
    terms: ['vegetable seedlings nursery', 'young plant seedling'],
  },
  {
    matches: ['fertilizer', 'fertiliser', 'npk'],
    terms: ['granular fertilizer agriculture', 'fertilizer bag farming'],
  },
  {
    matches: ['compost'],
    terms: ['organic compost soil', 'compost agriculture'],
  },
  {
    matches: ['soil', 'potting mix', 'peat'],
    terms: ['potting soil bag', 'agricultural soil'],
  },
  {
    matches: ['irrigation', 'drip', 'dripper'],
    terms: ['drip irrigation equipment', 'farm irrigation system'],
  },
  {
    matches: ['sprinkler'],
    terms: ['agricultural sprinkler irrigation'],
  },
  {
    matches: ['hose'],
    terms: ['garden irrigation hose'],
  },
  {
    matches: ['pruning', 'pruner', 'shears', 'secateurs'],
    terms: ['pruning shears garden tool', 'secateurs tool'],
  },
  {
    matches: ['shovel', 'spade'],
    terms: ['garden shovel tool'],
  },
  {
    matches: ['rake'],
    terms: ['garden rake tool'],
  },
  {
    matches: ['sprayer'],
    terms: ['agricultural backpack sprayer'],
  },
  {
    matches: ['greenhouse'],
    terms: ['modern agricultural greenhouse', 'greenhouse crops'],
  },
  {
    matches: ['pest', 'insect'],
    terms: ['crop pest on plant', 'agricultural insect pest'],
  },
  {
    matches: ['disease', 'fungus', 'fungal'],
    terms: ['plant leaf disease crop', 'fungal plant disease'],
  },
  {
    matches: ['mulch'],
    terms: ['orchard mulch soil', 'organic mulch garden'],
  },
  {
    matches: ['harvest'],
    terms: ['farm crop harvest'],
  },
  {
    matches: ['orchard'],
    terms: ['fruit orchard agriculture'],
  },
  {
    matches: ['nursery'],
    terms: ['plant nursery agriculture'],
  },
  {
    matches: ['flower', 'flowers'],
    terms: ['flowering plant nursery'],
  },
  {
    matches: ['herb', 'herbs'],
    terms: ['fresh culinary herbs plant'],
  },
];

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function cleanText(value) {
  return String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalise(value) {
  return cleanText(value).toLowerCase();
}

function slugify(value) {
  return normalise(value)
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .replace(/_/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70) || 'image';
}

function shortId(value) {
  return crypto
    .createHash('sha1')
    .update(String(value))
    .digest('hex')
    .slice(0, 10);
}

function uniqueWords(value) {
  return [...new Set(
    normalise(value)
      .split(/[^a-z0-9]+/)
      .filter(word => word.length > 2 && !GENERIC_STOP_WORDS.has(word))
  )];
}

function selectImportantWords(value, limit = 8) {
  return uniqueWords(value).slice(0, limit);
}

function matchSynonymQueries(value) {
  const source = normalise(value);
  const queries = [];

  for (const mapping of AGRICULTURE_SYNONYMS) {
    if (mapping.matches.some(term => source.includes(term))) {
      queries.push(...mapping.terms);
    }
  }

  return [...new Set(queries)];
}

function productQueries(product) {
  const name = cleanText(product.name || product.title);
  const category = cleanText(
    product.category ||
    product.subcategory ||
    product.type
  );
  const description = cleanText(product.description);

  const source = `${name} ${category} ${description}`;
  const synonyms = matchSynonymQueries(source);
  const important = selectImportantWords(source, 7).join(' ');

  return [...new Set([
    `${name} ${category} agriculture product`,
    ...synonyms,
    important ? `${important} agriculture` : '',
    name,
  ].filter(Boolean))];
}

function postQueries(post) {
  const title = cleanText(post.title);
  const content = cleanText(post.content || post.description);
  const tags = Array.isArray(post.tags)
    ? post.tags.join(' ')
    : cleanText(post.tags);

  const source = `${title} ${content} ${tags}`;
  const synonyms = matchSynonymQueries(source);
  const important = selectImportantWords(source, 9).join(' ');

  return [...new Set([
    `${title} agriculture`,
    ...synonyms,
    important ? `${important} farming` : '',
    `${tags} agriculture`,
  ].filter(Boolean))];
}

function imageFieldTargets(Model) {
  const candidates = [
    'images',
    'image',
    'imageUrl',
    'photo',
    'photoUrl',
    'media',
    'mediaUrl',
    'coverImage',
  ];

  return candidates
    .filter(field => Boolean(Model.schema.path(field)))
    .map(field => ({
      field,
      isArray: Model.schema.path(field).instance === 'Array',
    }));
}

function extMetadataValue(metadata, key) {
  const value = metadata?.[key]?.value;
  return cleanText(value);
}

function isBlockedCandidate(candidate) {
  const haystack = normalise([
    candidate.title,
    candidate.description,
    candidate.categories,
    candidate.mime,
  ].join(' '));

  return BLOCKED_TERMS.some(term => haystack.includes(term));
}

function candidateScore(candidate, sourceText, usedSha1) {
  if (!candidate.url || !candidate.sha1) return -10000;
  if (usedSha1.has(candidate.sha1)) return -10000;
  if (isBlockedCandidate(candidate)) return -10000;
  if (!candidate.mime?.startsWith('image/')) return -10000;
  if (candidate.mime === 'image/svg+xml') return -10000;
  if (candidate.width < MIN_WIDTH || candidate.height < MIN_HEIGHT) return -10000;

  const sourceWords = new Set(uniqueWords(sourceText));
  const candidateWords = new Set(uniqueWords([
    candidate.title,
    candidate.description,
    candidate.categories,
  ].join(' ')));

  let score = 0;

  for (const word of sourceWords) {
    if (candidateWords.has(word)) score += 8;
  }

  const title = normalise(candidate.title);
  const description = normalise(candidate.description);

  for (const synonym of matchSynonymQueries(sourceText)) {
    for (const word of uniqueWords(synonym)) {
      if (title.includes(word)) score += 5;
      if (description.includes(word)) score += 2;
    }
  }

  const ratio = candidate.width / candidate.height;

  if (ratio >= 1.15 && ratio <= 2.1) score += 8;
  if (candidate.width >= 1200) score += 4;
  if (candidate.height >= 700) score += 3;

  if (
    description.includes('photograph') ||
    description.includes('photo')
  ) {
    score += 5;
  }

  return score;
}

async function commonsSearch(query) {
  const params = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(MAX_SEARCH_RESULTS),
    prop: 'imageinfo',
    iiprop: 'url|mime|size|sha1|extmetadata',
    iiurlwidth: '1600',
    origin: '*',
  });

  const response = await fetch(`${COMMONS_API}?${params}`, {
    headers: {
      'User-Agent': USER_AGENT,
      'Api-User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(
      `Wikimedia search failed (${response.status}) for "${query}"`
    );
  }

  const data = await response.json();
  const pages = data?.query?.pages || [];

  return pages.flatMap(page => {
    const info = page.imageinfo?.[0];

    if (!info) return [];

    const metadata = info.extmetadata || {};

    return [{
      pageId: page.pageid,
      title: cleanText(page.title).replace(/^File:/i, ''),
      url: info.thumburl || info.url,
      originalUrl: info.url,
      mime: info.mime,
      width: info.thumbwidth || info.width || 0,
      height: info.thumbheight || info.height || 0,
      sha1: info.sha1,
      description:
        extMetadataValue(metadata, 'ImageDescription') ||
        extMetadataValue(metadata, 'ObjectName'),
      categories: extMetadataValue(metadata, 'Categories'),
      artist: extMetadataValue(metadata, 'Artist'),
      credit: extMetadataValue(metadata, 'Credit'),
      licence:
        extMetadataValue(metadata, 'LicenseShortName') ||
        extMetadataValue(metadata, 'UsageTerms'),
      licenceUrl: extMetadataValue(metadata, 'LicenseUrl'),
      descriptionUrl: info.descriptionurl,
    }];
  });
}

async function selectBestPhoto({
  queries,
  sourceText,
  usedSha1,
}) {
  let best = null;

  for (const query of queries) {
    console.log(`      Searching: ${query}`);

    let candidates;

    try {
      candidates = await commonsSearch(query);
    } catch (error) {
      console.warn(`      Search warning: ${error.message}`);
      await delay(REQUEST_DELAY_MS);
      continue;
    }

    for (const candidate of candidates) {
      const score = candidateScore(candidate, sourceText, usedSha1);

      if (!best || score > best.score) {
        best = { ...candidate, score, matchedQuery: query };
      }
    }

    if (best && best.score >= 18) break;
    await delay(REQUEST_DELAY_MS);
  }

  if (!best || best.score < 0) {
    return null;
  }

  return best;
}

function extensionFrom(candidate, response) {
  const contentType = response.headers.get('content-type') || candidate.mime || '';

  if (contentType.includes('jpeg') || contentType.includes('jpg')) return '.jpg';
  if (contentType.includes('png')) return '.png';
  if (contentType.includes('webp')) return '.webp';

  const parsed = new URL(candidate.url);
  const fromPath = path.extname(parsed.pathname).toLowerCase();

  if (['.jpg', '.jpeg', '.png', '.webp'].includes(fromPath)) {
    return fromPath === '.jpeg' ? '.jpg' : fromPath;
  }

  return '.jpg';
}

async function downloadCandidate(candidate, folder, baseName) {
  const response = await fetch(candidate.url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Api-User-Agent': USER_AGENT,
      Accept: 'image/jpeg,image/png,image/webp,image/*',
    },
    redirect: 'follow',
  });

  if (!response.ok) {
    throw new Error(
      `Image download failed (${response.status}): ${candidate.url}`
    );
  }

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.startsWith('image/')) {
    throw new Error(`Downloaded response is not an image: ${contentType}`);
  }

  const extension = extensionFrom(candidate, response);
  const filename = `${baseName}${extension}`;
  const absolutePath = path.join(folder, filename);
  const buffer = Buffer.from(await response.arrayBuffer());

  if (buffer.length < 20_000) {
    throw new Error(`Downloaded image is unexpectedly small: ${buffer.length} bytes`);
  }

  await fs.writeFile(absolutePath, buffer);

  return {
    filename,
    absolutePath,
    bytes: buffer.length,
  };
}

function mongoImageUpdate(targets, publicUrl) {
  const update = {};

  for (const target of targets) {
    update[target.field] = target.isArray ? [publicUrl] : publicUrl;
  }

  return update;
}

async function readExistingAttributions() {
  try {
    return JSON.parse(await fs.readFile(ATTRIBUTION_FILE, 'utf8'));
  } catch {
    return [];
  }
}

async function processCollection({
  Model,
  kind,
  folder,
  buildQueries,
}) {
  const targets = imageFieldTargets(Model);

  if (!targets.length) {
    throw new Error(
      `No supported image field found in ${kind} schema. Found: ${
        Object.keys(Model.schema.paths).join(', ')
      }`
    );
  }

  const documents = await Model.find({}).sort({ _id: 1 });
  const usedSha1 = new Set();
  const attributions = [];
  const failures = [];

  console.log(`\n${kind}: ${documents.length} existing records`);
  console.log(`Image field(s): ${targets.map(item => item.field).join(', ')}`);

  for (let index = 0; index < documents.length; index += 1) {
    const document = documents[index];
    const title = cleanText(
      document.name ||
      document.title ||
      document.content?.slice(0, 80) ||
      `${kind} ${index + 1}`
    );

    const sourceText = cleanText([
      document.name,
      document.title,
      document.category,
      document.subcategory,
      document.description,
      document.content,
      Array.isArray(document.tags) ? document.tags.join(' ') : document.tags,
    ].join(' '));

    const queries = buildQueries(document);

    console.log(`\n[${index + 1}/${documents.length}] ${title}`);

    const candidate = await selectBestPhoto({
      queries,
      sourceText,
      usedSha1,
    });

    if (!candidate) {
      console.warn(`      No relevant photograph found. Record left unchanged.`);
      failures.push({
        id: String(document._id),
        title,
        reason: 'No relevant photograph found',
        queries,
      });
      continue;
    }

    try {
      const baseName =
        `${slugify(title)}-${shortId(document._id)}`;

      const downloaded = await downloadCandidate(
        candidate,
        folder,
        baseName
      );

      const folderName = kind === 'Product' ? 'products' : 'posts';
      const publicUrl =
        `/uploads/seed-images/${folderName}/${downloaded.filename}`;

      await Model.updateOne(
        { _id: document._id },
        {
          $set: mongoImageUpdate(targets, publicUrl),
        }
      );

      usedSha1.add(candidate.sha1);

      attributions.push({
        kind,
        recordId: String(document._id),
        recordTitle: title,
        localUrl: publicUrl,
        matchedQuery: candidate.matchedQuery,
        sourceTitle: candidate.title,
        sourcePage: candidate.descriptionUrl,
        originalImage: candidate.originalUrl,
        creator: candidate.artist,
        credit: candidate.credit,
        licence: candidate.licence,
        licenceUrl: candidate.licenceUrl,
        sha1: candidate.sha1,
        score: candidate.score,
      });

      console.log(
        `      Saved: ${publicUrl} (${Math.round(downloaded.bytes / 1024)} KB)`
      );
      console.log(`      Source: ${candidate.title}`);
    } catch (error) {
      console.warn(`      Download warning: ${error.message}`);
      failures.push({
        id: String(document._id),
        title,
        reason: error.message,
        queries,
      });
    }

    await delay(REQUEST_DELAY_MS);
  }

  return {
    updated: attributions.length,
    total: documents.length,
    targets,
    attributions,
    failures,
  };
}

async function removePreviousGeneratedFiles(folder) {
  await fs.mkdir(folder, { recursive: true });

  const entries = await fs.readdir(folder, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile()) continue;

    if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
      await fs.unlink(path.join(folder, entry.name));
    }
  }
}

async function verifyCounts(before) {
  const after = {
    products: await Product.countDocuments(),
    posts: await Post.countDocuments(),
  };

  if (
    before.products !== after.products ||
    before.posts !== after.posts
  ) {
    throw new Error(
      `Safety check failed: record count changed. ` +
      `Products ${before.products} -> ${after.products}, ` +
      `Posts ${before.posts} -> ${after.posts}`
    );
  }

  return after;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing from .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const before = {
    products: await Product.countDocuments(),
    posts: await Post.countDocuments(),
  };

  console.log(`Existing Products: ${before.products}`);
  console.log(`Existing Posts: ${before.posts}`);
  console.log('No record will be created or deleted.');

  await removePreviousGeneratedFiles(PRODUCT_FOLDER);
  await removePreviousGeneratedFiles(POST_FOLDER);

  const oldAttributions = await readExistingAttributions();

  const productResult = await processCollection({
    Model: Product,
    kind: 'Product',
    folder: PRODUCT_FOLDER,
    buildQueries: productQueries,
  });

  const postResult = await processCollection({
    Model: Post,
    kind: 'Post',
    folder: POST_FOLDER,
    buildQueries: postQueries,
  });

  await verifyCounts(before);

  const report = {
    generatedAt: new Date().toISOString(),
    source: 'Wikimedia Commons',
    products: {
      total: productResult.total,
      updated: productResult.updated,
      failures: productResult.failures,
    },
    posts: {
      total: postResult.total,
      updated: postResult.updated,
      failures: postResult.failures,
    },
    images: [
      ...productResult.attributions,
      ...postResult.attributions,
    ],
    previousAttributionCount: oldAttributions.length,
  };

  await fs.mkdir(path.dirname(ATTRIBUTION_FILE), { recursive: true });
  await fs.writeFile(
    ATTRIBUTION_FILE,
    JSON.stringify(report, null, 2),
    'utf8'
  );

  console.log('\n======================================');
  console.log('REAL IMAGE UPDATE COMPLETED');
  console.log('======================================');
  console.log(
    `Products updated: ${productResult.updated}/${productResult.total}`
  );
  console.log(
    `Posts updated: ${postResult.updated}/${postResult.total}`
  );
  console.log(
    `Product failures: ${productResult.failures.length}`
  );
  console.log(
    `Post failures: ${postResult.failures.length}`
  );
  console.log(`Attributions: ${ATTRIBUTION_FILE}`);
  console.log('\nProduct/Post counts did not change.');
}

run()
  .catch(error => {
    console.error('\nReal-image update failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
