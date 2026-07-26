/**
 * Fix ONLY existing Product and Post images.
 *
 * Safety:
 * - Does not create products, posts, users, businesses, comments, or follows.
 * - Does not delete any document.
 * - Updates only the image field(s) of existing Product and Post documents.
 * - Generates self-contained SVG data images, so images do not depend on
 *   LoremFlickr, Unsplash, redirects, CORS, or another external service.
 * - Every generated image is unique and contains the actual product/post title.
 *
 * Run:
 *   node scripts/fixMashtalImagesOnly.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const path = require('path');

const MODEL_DIR = path.resolve(process.cwd(), process.env.MODEL_DIR || './src/models');

const Product = require(path.join(MODEL_DIR, 'Product'));
const Post = require(path.join(MODEL_DIR, 'Post'));

function text(value) {
  return String(value || '').trim();
}

function normalise(value) {
  return text(value).toLowerCase();
}

function escapeXml(value) {
  return text(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function hashString(value) {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function wrapWords(value, maxCharacters = 28, maxLines = 3) {
  const words = text(value).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length <= maxCharacters) {
      current = candidate;
      continue;
    }

    if (current) lines.push(current);
    current = word;

    if (lines.length >= maxLines - 1) break;
  }

  if (current && lines.length < maxLines) lines.push(current);

  return lines;
}

function detectTheme(value) {
  const source = normalise(value);

  const themes = [
    {
      key: 'olive',
      words: ['olive', 'olives'],
      icon: 'olive',
      subtitle: 'Olive growing and orchard care',
    },
    {
      key: 'tomato',
      words: ['tomato', 'tomatoes'],
      icon: 'tomato',
      subtitle: 'Tomato cultivation',
    },
    {
      key: 'citrus',
      words: ['citrus', 'lemon', 'orange'],
      icon: 'citrus',
      subtitle: 'Citrus trees and fruit production',
    },
    {
      key: 'seed',
      words: ['seed', 'seeds', 'seedling', 'seedlings'],
      icon: 'seed',
      subtitle: 'Seeds and healthy germination',
    },
    {
      key: 'irrigation',
      words: ['irrigation', 'drip', 'hose', 'sprinkler', 'water', 'watering'],
      icon: 'water',
      subtitle: 'Efficient irrigation',
    },
    {
      key: 'fertilizer',
      words: ['fertilizer', 'fertiliser', 'compost', 'soil', 'nutrient', 'peat'],
      icon: 'soil',
      subtitle: 'Soil nutrition and plant health',
    },
    {
      key: 'tool',
      words: ['tool', 'tools', 'shears', 'pruner', 'shovel', 'rake', 'sprayer', 'equipment'],
      icon: 'tool',
      subtitle: 'Agricultural tools and equipment',
    },
    {
      key: 'greenhouse',
      words: ['greenhouse', 'ventilation', 'humidity'],
      icon: 'greenhouse',
      subtitle: 'Greenhouse production',
    },
    {
      key: 'plant',
      words: ['plant', 'plants', 'nursery', 'flower', 'flowers', 'herb', 'tree'],
      icon: 'plant',
      subtitle: 'Plants and nursery care',
    },
    {
      key: 'pest',
      words: ['pest', 'insect', 'fungus', 'disease', 'treatment', 'protection'],
      icon: 'shield',
      subtitle: 'Crop protection',
    },
    {
      key: 'orchard',
      words: ['orchard', 'pruning', 'harvest', 'fruit'],
      icon: 'tree',
      subtitle: 'Orchard management',
    },
  ];

  return (
    themes.find(theme => theme.words.some(word => source.includes(word))) || {
      key: 'agriculture',
      icon: 'plant',
      subtitle: 'Agriculture in Lebanon',
    }
  );
}

function iconSvg(icon, seed) {
  const variant = seed % 4;

  switch (icon) {
    case 'olive':
      return `
        <path d="M430 380 C470 250 535 160 645 105" fill="none" stroke="#385c35" stroke-width="24" stroke-linecap="round"/>
        <path d="M515 270 C460 215 405 220 372 270 C430 295 478 292 515 270Z" fill="#71995a"/>
        <path d="M568 205 C535 147 475 132 433 168 C474 210 522 222 568 205Z" fill="#8caf68"/>
        <path d="M610 155 C640 105 700 96 737 132 C700 175 653 181 610 155Z" fill="#71995a"/>
        <ellipse cx="${545 + variant * 16}" cy="${292 - variant * 8}" rx="31" ry="45" fill="#273d29"/>
        <ellipse cx="${638 - variant * 8}" cy="${220 + variant * 8}" rx="29" ry="43" fill="#405e34"/>`;

    case 'tomato':
      return `
        <path d="M515 170 C530 115 570 90 610 78" fill="none" stroke="#3f6b3d" stroke-width="22"/>
        <circle cx="515" cy="305" r="105" fill="#cf493f"/>
        <circle cx="665" cy="340" r="87" fill="#df5b46"/>
        <path d="M515 205 l-38 -48 55 20 31 -50 5 59 58 -7 -46 36" fill="#497b43"/>
        <path d="M665 255 l-30 -38 43 13 25 -40 5 47 46 -4 -38 29" fill="#497b43"/>`;

    case 'citrus':
      return `
        <circle cx="530" cy="290" r="115" fill="#e3b83f"/>
        <circle cx="690" cy="355" r="88" fill="#d9972e"/>
        <path d="M560 170 C605 115 670 108 719 142 C670 188 617 191 560 170Z" fill="#5d914d"/>
        <path d="M530 175 C540 125 570 98 610 82" fill="none" stroke="#446a3d" stroke-width="20"/>`;

    case 'seed':
      return `
        <ellipse cx="485" cy="290" rx="76" ry="116" transform="rotate(-28 485 290)" fill="#8a6849"/>
        <ellipse cx="650" cy="330" rx="68" ry="105" transform="rotate(31 650 330)" fill="#b38858"/>
        <path d="M570 360 C570 250 620 182 700 142" fill="none" stroke="#477947" stroke-width="22"/>
        <path d="M623 225 C572 180 520 188 493 231 C537 254 580 252 623 225Z" fill="#75a25e"/>`;

    case 'water':
      return `
        <path d="M555 105 C490 210 435 282 435 365 C435 447 495 500 570 500 C645 500 705 447 705 365 C705 282 650 210 585 105 C577 92 563 92 555 105Z" fill="#5b9db4"/>
        <path d="M430 365 C500 325 585 318 702 360" fill="none" stroke="#c7e3e8" stroke-width="18" opacity="0.9"/>
        <path d="M260 245 H405 M735 245 H880" stroke="#52785a" stroke-width="25" stroke-linecap="round"/>
        <circle cx="350" cy="245" r="18" fill="#36583e"/>
        <circle cx="790" cy="245" r="18" fill="#36583e"/>`;

    case 'soil':
      return `
        <path d="M350 360 Q570 250 790 360 V510 H350Z" fill="#79573f"/>
        <path d="M350 420 Q570 320 790 420" fill="none" stroke="#a77b56" stroke-width="34"/>
        <path d="M570 355 C565 255 600 185 675 145" fill="none" stroke="#477947" stroke-width="22"/>
        <path d="M610 240 C555 195 500 204 468 253 C522 277 568 271 610 240Z" fill="#72a25d"/>
        <path d="M625 202 C675 160 727 168 760 211 C715 238 670 235 625 202Z" fill="#5e8e50"/>`;

    case 'tool':
      return `
        <path d="M420 445 L690 175" stroke="#6f5138" stroke-width="42" stroke-linecap="round"/>
        <path d="M640 150 L735 245 L690 290 L595 195Z" fill="#879294"/>
        <path d="M410 180 L675 445" stroke="#7b583c" stroke-width="35" stroke-linecap="round"/>
        <path d="M365 125 L460 220 L415 265 L320 170Z" fill="#a0aaab"/>`;

    case 'greenhouse':
      return `
        <path d="M330 455 V260 L570 105 L810 260 V455Z" fill="#dbe8df" stroke="#52765c" stroke-width="18"/>
        <path d="M570 105 V455 M330 260 H810 M420 202 V455 M720 202 V455" stroke="#6d9274" stroke-width="10" opacity="0.8"/>
        <path d="M510 455 V330 H630 V455" fill="#aac4ad" stroke="#52765c" stroke-width="12"/>`;

    case 'shield':
      return `
        <path d="M570 100 L760 165 V300 C760 420 690 500 570 550 C450 500 380 420 380 300 V165Z" fill="#608b62"/>
        <path d="M480 320 L545 385 L675 235" fill="none" stroke="#edf3eb" stroke-width="35" stroke-linecap="round" stroke-linejoin="round"/>`;

    case 'tree':
      return `
        <rect x="535" y="330" width="70" height="195" rx="20" fill="#75513a"/>
        <circle cx="470" cy="290" r="115" fill="#6d9958"/>
        <circle cx="610" cy="225" r="135" fill="#5d8b50"/>
        <circle cx="720" cy="315" r="105" fill="#78a560"/>`;

    default:
      return `
        <path d="M570 500 C560 365 600 235 700 135" fill="none" stroke="#477947" stroke-width="25"/>
        <path d="M605 315 C535 255 465 270 425 330 C485 368 550 355 605 315Z" fill="#75a25e"/>
        <path d="M635 245 C690 190 755 195 797 250 C748 289 689 285 635 245Z" fill="#5e8e50"/>
        <path d="M545 400 C490 355 430 365 395 415 C445 448 500 440 545 400Z" fill="#89af6b"/>`;
  }
}

function makeSvgDataUrl({
  title,
  category,
  recordId,
  kind,
  width,
  height,
}) {
  const safeTitle = text(title) || (kind === 'product' ? 'Agricultural Product' : 'Agriculture Post');
  const theme = detectTheme(`${safeTitle} ${category}`);
  const seed = hashString(`${kind}:${recordId}:${safeTitle}:${category}`);
  const titleLines = wrapWords(safeTitle, kind === 'product' ? 27 : 38, 3);

  const backgrounds = [
    ['#eef4e9', '#dce9d4'],
    ['#f4efe4', '#e9ddca'],
    ['#e8f0eb', '#d5e4db'],
    ['#f1f3e6', '#e1e7cd'],
  ];

  const [backgroundA, backgroundB] = backgrounds[seed % backgrounds.length];
  const accentX = 110 + (seed % 150);
  const accentY = 90 + ((seed >> 3) % 140);

  const titleMarkup = titleLines
    .map((line, index) => {
      const y = kind === 'product' ? 590 + index * 55 : 645 + index * 62;
      return `<text x="70" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${kind === 'product' ? 42 : 48}" font-weight="700" fill="#23372a">${escapeXml(line)}</text>`;
    })
    .join('');

  const subtitleY = kind === 'product'
    ? 590 + titleLines.length * 55 + 23
    : 645 + titleLines.length * 62 + 25;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1000 750">
      <defs>
        <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${backgroundA}"/>
          <stop offset="1" stop-color="${backgroundB}"/>
        </linearGradient>
        <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="10" stdDeviation="12" flood-color="#26382d" flood-opacity="0.15"/>
        </filter>
      </defs>

      <rect width="1000" height="750" fill="url(#background)"/>
      <circle cx="${accentX}" cy="${accentY}" r="${80 + seed % 60}" fill="#ffffff" opacity="0.22"/>
      <circle cx="${850 - seed % 100}" cy="${120 + seed % 80}" r="${50 + seed % 50}" fill="#5d875d" opacity="0.10"/>

      <rect x="95" y="55" width="810" height="500" rx="44" fill="#f8fbf6" opacity="0.82" filter="url(#shadow)"/>
      ${iconSvg(theme.icon, seed)}

      <rect x="70" y="570" width="${kind === 'product' ? 180 : 130}" height="38" rx="19" fill="#446d4b"/>
      <text x="${kind === 'product' ? 160 : 135}" y="596" text-anchor="middle"
            font-family="Arial, Helvetica, sans-serif" font-size="20"
            font-weight="700" letter-spacing="2" fill="#ffffff">
        ${kind === 'product' ? 'PRODUCT' : 'POST'}
      </text>

      ${titleMarkup}

      <text x="70" y="${Math.min(subtitleY, 726)}"
            font-family="Arial, Helvetica, sans-serif" font-size="24"
            fill="#5b6f61">
        ${escapeXml(text(category) || theme.subtitle)}
      </text>

      <text x="930" y="715" text-anchor="end"
            font-family="Arial, Helvetica, sans-serif" font-size="18"
            fill="#718078">
        MASHTAL • ${escapeXml(theme.key.toUpperCase())}
      </text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function getSchemaImageTargets(Model) {
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
    .filter(pathName => Boolean(Model.schema.path(pathName)))
    .map(pathName => {
      const schemaPath = Model.schema.path(pathName);
      const instance = schemaPath.instance;
      const isArray = instance === 'Array';

      return { pathName, isArray };
    });
}

function buildImageUpdate(targets, dataUrl) {
  const update = {};

  for (const target of targets) {
    update[target.pathName] = target.isArray ? [dataUrl] : dataUrl;
  }

  return update;
}

async function updateProductImages() {
  const imageTargets = getSchemaImageTargets(Product);

  if (!imageTargets.length) {
    throw new Error(
      `No Product image field was found. Product schema paths: ${Object.keys(Product.schema.paths).join(', ')}`
    );
  }

  const products = await Product.find({}).sort({ _id: 1 });
  const operations = [];
  const generatedImages = new Set();

  for (const product of products) {
    const dataUrl = makeSvgDataUrl({
      title: product.name || product.title,
      category:
        product.category ||
        product.subcategory ||
        product.description ||
        'Agricultural product',
      recordId: product._id,
      kind: 'product',
      width: 1000,
      height: 750,
    });

    if (generatedImages.has(dataUrl)) {
      throw new Error(`Duplicate product image generated for product ${product._id}`);
    }

    generatedImages.add(dataUrl);

    operations.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $set: buildImageUpdate(imageTargets, dataUrl) },
      },
    });
  }

  if (operations.length) {
    await Product.bulkWrite(operations, { ordered: true });
  }

  return {
    count: products.length,
    imageTargets: imageTargets.map(item => item.pathName),
    uniqueImages: generatedImages.size,
  };
}

async function updatePostImages() {
  const imageTargets = getSchemaImageTargets(Post);

  if (!imageTargets.length) {
    throw new Error(
      `No Post image field was found. Post schema paths: ${Object.keys(Post.schema.paths).join(', ')}`
    );
  }

  const posts = await Post.find({}).sort({ _id: 1 });
  const operations = [];
  const generatedImages = new Set();

  for (const post of posts) {
    const tags = Array.isArray(post.tags) ? post.tags.join(', ') : post.tags;

    const dataUrl = makeSvgDataUrl({
      title: post.title || post.content?.slice(0, 90) || 'Agriculture update',
      category:
        tags ||
        post.category ||
        post.content?.slice(0, 130) ||
        'Agriculture in Lebanon',
      recordId: post._id,
      kind: 'post',
      width: 1400,
      height: 900,
    });

    if (generatedImages.has(dataUrl)) {
      throw new Error(`Duplicate post image generated for post ${post._id}`);
    }

    generatedImages.add(dataUrl);

    operations.push({
      updateOne: {
        filter: { _id: post._id },
        update: { $set: buildImageUpdate(imageTargets, dataUrl) },
      },
    });
  }

  if (operations.length) {
    await Post.bulkWrite(operations, { ordered: true });
  }

  return {
    count: posts.length,
    imageTargets: imageTargets.map(item => item.pathName),
    uniqueImages: generatedImages.size,
  };
}

async function verifyNoDuplicateRecordsWereCreated(beforeCounts) {
  const afterCounts = {
    products: await Product.countDocuments(),
    posts: await Post.countDocuments(),
  };

  if (
    beforeCounts.products !== afterCounts.products ||
    beforeCounts.posts !== afterCounts.posts
  ) {
    throw new Error(
      `Safety check failed. Counts changed: products ${beforeCounts.products} -> ${afterCounts.products}, posts ${beforeCounts.posts} -> ${afterCounts.posts}`
    );
  }

  return afterCounts;
}

async function run() {
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is missing from .env');
  }

  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const beforeCounts = {
    products: await Product.countDocuments(),
    posts: await Post.countDocuments(),
  };

  console.log(`Existing products: ${beforeCounts.products}`);
  console.log(`Existing posts: ${beforeCounts.posts}`);

  const productResult = await updateProductImages();
  const postResult = await updatePostImages();
  await verifyNoDuplicateRecordsWereCreated(beforeCounts);

  console.log('\nImages fixed successfully.');
  console.log(`Products updated: ${productResult.count}`);
  console.log(`Unique product images: ${productResult.uniqueImages}`);
  console.log(`Product image field(s): ${productResult.imageTargets.join(', ')}`);

  console.log(`Posts updated: ${postResult.count}`);
  console.log(`Unique post images: ${postResult.uniqueImages}`);
  console.log(`Post image field(s): ${postResult.imageTargets.join(', ')}`);

  console.log('\nNo Product or Post document was created or deleted.');
}

run()
  .catch(error => {
    console.error('\nImage repair failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
