/**
 * Clean Atlas reseed: products + posts with CONTENT-MATCHED images + comments.
 * - Deletes old products/posts/(related comments/reviews/saved)
 * - Downloads a unique image per item (Wikimedia search by keywords → local /images/...)
 * - Authors = existing business users; commenters = existing visitors/businesses from Atlas
 *
 * Run from server/:
 *   node scripts/seedAtlasMatchedCatalog.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const SavedItem = require('../src/models/SavedItem');
const Review = require('../src/models/Review');

const PUBLIC_IMAGES = path.join(__dirname, '..', 'public', 'images');
const PRODUCT_DIR = path.join(PUBLIC_IMAGES, 'products');
const POST_DIR = path.join(PUBLIC_IMAGES, 'posts');

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'MashtalAtlasSeeder/3.0 (university demo; content-matched agri images)';

const PRODUCTS_PER_BUSINESS = 6;
const POSTS_PER_BUSINESS = 3;
const COMMENTS_PER_POST = 3;

/** Each product has its OWN search keywords so lemon ≠ tomato */
const PRODUCT_TEMPLATES = [
  {
    name: 'Arbequina Olive Tree',
    description: 'Healthy nursery-grown Arbequina olive tree for Lebanese gardens and small orchards.',
    price: 18, stock: 34, category: 'trees',
    keywords: ['Olea europaea olive tree orchard', 'olive tree grove green'],
  },
  {
    name: 'Meyer Lemon Tree',
    description: 'Grafted Meyer lemon tree with healthy foliage for sunny Mediterranean locations.',
    price: 22, stock: 28, category: 'trees',
    keywords: ['yellow lemon fruit citrus', 'Citrus limon lemons'],
  },
  {
    name: 'Pomegranate Tree',
    description: 'Young pomegranate fruit tree adapted to dry summers and orchard planting.',
    price: 19, stock: 25, category: 'trees',
    keywords: ['pomegranate fruit Punica', 'open pomegranate red seeds'],
  },
  {
    name: 'Fig Tree',
    description: 'Healthy fig tree suitable for sunny gardens and productive home orchards.',
    price: 17, stock: 27, category: 'trees',
    keywords: ['fig fruit Ficus carica', 'fresh figs on tree'],
  },
  {
    name: 'Rosemary Plant',
    description: 'Aromatic rosemary plant for balconies, gardens, and culinary use.',
    price: 5, stock: 75, category: 'plants',
    keywords: ['rosemary herb plant Rosmarinus', 'fresh rosemary sprigs'],
  },
  {
    name: 'Lavender Plant',
    description: 'Fragrant lavender plant that attracts pollinators and tolerates dry conditions.',
    price: 6, stock: 60, category: 'plants',
    keywords: ['lavender field purple flowers', 'Lavandula flowering plant'],
  },
  {
    name: 'Sweet Basil Plant',
    description: 'Fresh sweet basil plant ready for kitchen gardens and balcony containers.',
    price: 3.5, stock: 92, category: 'plants',
    keywords: ['basil plant Ocimum basilicum', 'fresh green basil leaves'],
  },
  {
    name: 'Tomato Seedling Tray',
    description: 'Strong tomato seedlings with developed roots, ready for transplanting.',
    price: 7, stock: 46, category: 'plants',
    keywords: ['tomato seedlings tray young plants', 'Solanum lycopersicum seedlings'],
  },
  {
    name: 'Roma Tomato Seeds',
    description: 'Quality Roma tomato seeds for productive field and garden cultivation.',
    price: 3, stock: 120, category: 'seeds',
    keywords: ['tomato seeds packet agriculture', 'ripe red tomatoes harvest'],
  },
  {
    name: 'Cucumber Seeds Pack',
    description: 'Cucumber seeds selected for crisp fruit and warm-season production.',
    price: 3, stock: 110, category: 'seeds',
    keywords: ['cucumber vegetable green', 'Cucumis sativus cucumber'],
  },
  {
    name: 'Sweet Pepper Seeds',
    description: 'Sweet bell pepper seeds for greenhouse and open-field planting.',
    price: 3.5, stock: 95, category: 'seeds',
    keywords: ['bell pepper Capsicum red green', 'sweet peppers vegetables'],
  },
  {
    name: 'Parsley Seeds',
    description: 'High-germination parsley seeds for home gardens and herb production.',
    price: 2.5, stock: 140, category: 'seeds',
    keywords: ['parsley herb Petroselinum', 'fresh parsley bunch'],
  },
  {
    name: 'Balanced NPK Fertilizer 20-20-20',
    description: 'Water-soluble balanced fertilizer for vegetables, flowers, and fruit trees.',
    price: 12, stock: 78, category: 'fertilizers',
    keywords: ['fertilizer granules bag agriculture', 'NPK fertilizer farming'],
  },
  {
    name: 'Organic Compost Bag 20kg',
    description: 'Rich organic compost to improve soil structure and plant nutrition.',
    price: 9, stock: 64, category: 'fertilizers',
    keywords: ['compost soil organic gardening', 'garden compost heap'],
  },
  {
    name: 'Drip Irrigation Kit 50m',
    description: 'Complete drip irrigation kit for efficient watering of rows and gardens.',
    price: 45, stock: 30, category: 'irrigation',
    keywords: ['drip irrigation agriculture tubes', 'farm irrigation water pipes'],
  },
  {
    name: 'Garden Hose with Spray Nozzle',
    description: 'Durable garden hose with adjustable spray nozzle for daily watering.',
    price: 16, stock: 42, category: 'irrigation',
    keywords: ['garden hose watering plants', 'watering garden hose nozzle'],
  },
  {
    name: 'Pruning Shears',
    description: 'Sharp bypass pruning shears for orchard branches and garden shrubs.',
    price: 11, stock: 55, category: 'tools',
    keywords: ['pruning shears garden scissors', 'secateurs pruning tool'],
  },
  {
    name: 'Hand Cultivator Set',
    description: 'Three-piece hand tool set for weeding, digging, and soil preparation.',
    price: 14, stock: 48, category: 'tools',
    keywords: ['garden hand tools rake trowel', 'gardening tools soil'],
  },
  {
    name: 'Farm Wheelbarrow 80L',
    description: 'Sturdy farm wheelbarrow for soil, compost, and harvest transport.',
    price: 55, stock: 18, category: 'equipment',
    keywords: ['wheelbarrow garden farm', 'garden wheelbarrow soil'],
  },
  {
    name: 'Knapsack Sprayer 16L',
    description: 'Manual knapsack sprayer for crop protection and foliar feeding.',
    price: 28, stock: 33, category: 'equipment',
    keywords: ['knapsack sprayer agriculture', 'backpack sprayer farming'],
  },
  {
    name: 'Cedar Sapling',
    description: 'Young cedar sapling for landscaping and long-term garden planting.',
    price: 15, stock: 40, category: 'trees',
    keywords: ['cedar tree Cedrus forest', 'young conifer sapling'],
  },
  {
    name: 'Succulent Mix Pack',
    description: 'Assorted drought-tolerant succulents ideal for balconies and urban gardens.',
    price: 10, stock: 50, category: 'plants',
    keywords: ['succulent plants pot Echeveria', 'succulents cactus garden'],
  },
  {
    name: 'Potting Soil Mix 10L',
    description: 'Premium potting mix for containers, seedlings, and indoor plants.',
    price: 8, stock: 70, category: 'fertilizers',
    keywords: ['potting soil bag gardening', 'potting mix plant soil'],
  },
  {
    name: 'Copper Fungicide Spray',
    description: 'Protective copper-based spray for common fungal issues on crops and ornamentals.',
    price: 13, stock: 36, category: 'medicament',
    keywords: ['plant disease spray agriculture', 'crop protection spraying plants'],
  },
];

const POST_TEMPLATES = [
  {
    title: 'Spring planting tips for Lebanese gardens',
    content:
      'Prepare beds early, enrich soil with compost, and stagger tomato and pepper transplants after the last cold nights. Consistent morning watering helps seedlings establish without stress.',
    tags: ['planting', 'spring', 'lebanon'],
    keywords: ['vegetable garden planting seedlings', 'farmer planting crops spring'],
  },
  {
    title: 'How drip irrigation saves water in the Bekaa',
    content:
      'Drip lines deliver water to the root zone, reduce evaporation, and keep foliage dry. Start with a pressure filter, flush lines weekly, and check emitters for clogging during the dry season.',
    tags: ['irrigation', 'water', 'bekaa'],
    keywords: ['drip irrigation field agriculture', 'farm irrigation water system'],
  },
  {
    title: 'Choosing healthy nursery trees',
    content:
      'Look for a strong central leader, flexible branches, and roots that are white and not circling the pot. Avoid trees with yellow leaves or cracked trunks before you buy.',
    tags: ['nursery', 'trees', 'tips'],
    keywords: ['nursery tree sapling pot', 'potted young tree nursery'],
  },
  {
    title: 'Organic compost for richer soil',
    content:
      'Mix mature compost into the top 15 cm of soil before planting. It improves structure, moisture holding, and microbial life — especially in rocky or sandy Lebanese soils.',
    tags: ['compost', 'soil', 'organic'],
    keywords: ['organic compost soil gardening', 'compost heap garden'],
  },
  {
    title: 'Pruning olive trees for better harvest',
    content:
      'Prune after harvest to open the canopy for light and air. Remove dead wood and crossing branches, and keep tools clean to limit disease spread.',
    tags: ['olive', 'pruning', 'orchard'],
    keywords: ['olive tree pruning orchard', 'olive grove Mediterranean'],
  },
  {
    title: 'Balcony herbs that thrive in Beirut',
    content:
      'Basil, rosemary, mint, and parsley do well in deep pots with drainage holes. Give them morning sun, water when the top soil dries, and harvest often to encourage new growth.',
    tags: ['herbs', 'urban', 'balcony'],
    keywords: ['potted herbs balcony garden', 'basil rosemary herb pots'],
  },
  {
    title: 'Protecting tomatoes from early blight',
    content:
      'Space plants for airflow, avoid wetting leaves late in the day, and remove infected foliage promptly. Rotate crops yearly and consider copper sprays when humidity rises.',
    tags: ['tomato', 'disease', 'protection'],
    keywords: ['tomato plants greenhouse', 'tomato crop field'],
  },
  {
    title: 'Essential farm tools for small holdings',
    content:
      'A good pair of pruning shears, a sturdy hoe, a hand cultivator, and a reliable wheelbarrow cover most daily tasks. Clean and oil metal tools after muddy work.',
    tags: ['tools', 'farm', 'equipment'],
    keywords: ['farm tools gardening hoe', 'agricultural hand tools'],
  },
  {
    title: 'Seed starting calendar for summer crops',
    content:
      'Start tomatoes and peppers indoors 6–8 weeks before transplant. Cucumbers and zucchini prefer warmer soil — sow closer to outdoor planting time for stronger seedlings.',
    tags: ['seeds', 'calendar', 'seedlings'],
    keywords: ['seedling tray greenhouse plants', 'starting seeds indoors'],
  },
  {
    title: 'Mulching to keep moisture in summer heat',
    content:
      'A 5 cm layer of straw or wood chips around plants reduces evaporation and weeds. Keep mulch a few centimetres away from stems to prevent rot.',
    tags: ['mulch', 'summer', 'water'],
    keywords: ['mulch garden straw plants', 'wood chip mulch garden bed'],
  },
];

const COMMENT_TEXTS = [
  'Very useful tip — thank you for sharing this with the community.',
  'We tried this last season in the Bekaa and it worked well.',
  'Clear advice. Do you recommend the same approach for small balcony pots?',
  'Great post. I will share this with my neighbours who grow olives.',
  'Thanks! Looking for products related to this on your shop page.',
  'Helpful for beginners. More photos of the setup would be awesome.',
  'Agreed — watering in the morning made a big difference for us.',
  'Solid guidance. What soil mix do you prefer with this method?',
];

const REPLY_TEXTS = [
  'Glad it helped! Feel free to message us if you need product recommendations.',
  'Yes — for balconies use a smaller dose and check drainage carefully.',
  'Thanks for the feedback. We can share more details in a follow-up post.',
];

const FOCUS = [
  { match: /nursur|nursery|cedar|garden|mashtalee|hadi|orchard|urban/i, cats: ['trees', 'plants', 'seeds'] },
  { match: /agro|seed|bekaa|akkar/i, cats: ['seeds', 'fertilizers', 'plants'] },
  { match: /irrigat/i, cats: ['irrigation', 'equipment', 'tools'] },
  { match: /tool|equipment/i, cats: ['tools', 'equipment', 'irrigation'] },
  { match: /organic|tyre/i, cats: ['plants', 'seeds', 'fertilizers'] },
];

const usedSha1 = new Set();
const imageCache = new Map(); // keywords join → local path

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function companyName(b) {
  return b.businessProfile?.companyName || b.pendingBusinessProfile?.companyName || b.fullName || b.email;
}

function slug(s) {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
}

function pickCategories(business, index) {
  const name = companyName(business);
  const hit = FOCUS.find((f) => f.match.test(name));
  if (hit) return hit.cats;
  const fb = [
    ['trees', 'plants'],
    ['seeds', 'fertilizers'],
    ['irrigation', 'tools'],
    ['equipment', 'tools'],
    ['plants', 'medicament'],
  ];
  return fb[index % fb.length];
}

function productsForBusiness(index, business) {
  const cats = new Set(pickCategories(business, index));
  const pool = PRODUCT_TEMPLATES.filter((p) => cats.has(p.category));
  const source = pool.length >= PRODUCTS_PER_BUSINESS ? pool : PRODUCT_TEMPLATES;
  const start = (index * 2) % source.length;
  const out = [];
  const seen = new Set();
  for (let i = 0; i < source.length && out.length < PRODUCTS_PER_BUSINESS; i += 1) {
    const item = source[(start + i) % source.length];
    if (seen.has(item.name)) continue;
    seen.add(item.name);
    out.push(item);
  }
  return out;
}

async function downloadImage(url, destAbs) {
  let lastErr;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'image/*' },
        redirect: 'follow',
      });
      if (!res.ok) throw new Error(`download ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 4000) throw new Error('image too small');
      await fsp.writeFile(destAbs, buf);
      return;
    } catch (err) {
      lastErr = err;
      await sleep(400 * attempt);
    }
  }
  throw lastErr || new Error('download failed');
}

async function commonsSearch(query) {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const params = new URLSearchParams({
        action: 'query',
        format: 'json',
        formatversion: '2',
        generator: 'search',
        gsrsearch: query,
        gsrnamespace: '6',
        gsrlimit: '20',
        prop: 'imageinfo',
        iiprop: 'url|mime|size|sha1',
        iiurlwidth: '1200',
        origin: '*',
      });
      const res = await fetch(`${COMMONS_API}?${params}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`search HTTP ${res.status}`);
      const data = await res.json();
      return (data?.query?.pages || [])
        .map((page) => {
          const info = page.imageinfo?.[0];
          if (!info) return null;
          return {
            title: page.title || '',
            url: info.thumburl || info.url,
            mime: info.mime || '',
            width: info.thumbwidth || info.width || 0,
            height: info.thumbheight || info.height || 0,
            sha1: info.sha1 || crypto.createHash('md5').update(info.url || '').digest('hex'),
          };
        })
        .filter(Boolean);
    } catch (err) {
      lastErr = err;
      await sleep(500 * attempt);
    }
  }
  console.warn(`  search fail (${query}):`, lastErr?.message || lastErr);
  return [];
}

function isBlockedTitle(title) {
  const t = title.toLowerCase();
  return ['logo', 'icon', 'svg', 'diagram', 'map', 'flag', 'coat of arms', 'drawing'].some((w) =>
    t.includes(w)
  );
}

async function resolveMatchedImage(keywords, folderAbs, webPrefix, fileBase) {
  const cacheKey = keywords.join('|');
  if (imageCache.has(cacheKey)) return imageCache.get(cacheKey);

  await fsp.mkdir(folderAbs, { recursive: true });

  for (const query of keywords) {
    await sleep(200);
    let candidates = [];
    try {
      candidates = await commonsSearch(query);
    } catch (err) {
      console.warn(`  search fail (${query}):`, err.message);
      continue;
    }

    const ranked = candidates
      .filter((c) => c.mime?.startsWith('image/') && c.mime !== 'image/svg+xml')
      .filter((c) => !isBlockedTitle(c.title))
      .filter((c) => !usedSha1.has(c.sha1))
      .filter((c) => c.width >= 500 || c.height >= 400)
      .slice(0, 8);

    for (const c of ranked) {
      const ext = c.mime.includes('png') ? 'png' : 'jpg';
      const filename = `${fileBase}-${c.sha1.slice(0, 8)}.${ext}`;
      const abs = path.join(folderAbs, filename);
      const web = `${webPrefix}/${filename}`;
      try {
        await downloadImage(c.url, abs);
        usedSha1.add(c.sha1);
        imageCache.set(cacheKey, web);
        console.log(`  ✓ image: ${query} → ${web}`);
        return web;
      } catch (err) {
        try {
          await fsp.unlink(abs);
        } catch (_) {}
      }
    }
  }

  // Last resort: loremflickr by first keyword tokens (still content-tagged, unique lock)
  const tags = keywords[0]
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(',');
  const lock = crypto.createHash('md5').update(cacheKey).digest('hex').slice(0, 8);
  const flickr = `https://loremflickr.com/900/700/${encodeURIComponent(tags)}/all?lock=${parseInt(lock, 16) % 99999}`;
  const filename = `${fileBase}-flickr-${lock}.jpg`;
  const abs = path.join(folderAbs, filename);
  const web = `${webPrefix}/${filename}`;
  try {
    await downloadImage(flickr, abs);
    imageCache.set(cacheKey, web);
    console.log(`  ~ flickr fallback: ${tags} → ${web}`);
    return web;
  } catch (err) {
    // Absolute last resort: reuse any previously downloaded product/post image is wrong —
    // instead write a tiny note and throw so we know which item failed.
    throw new Error(`Could not download any image for "${fileBase}" (${tags}): ${err.message}`);
  }
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI (Atlas)');
  if (/127\.0\.0\.1|localhost/.test(uri)) {
    console.warn('[Seed] WARNING: URI looks local. Expected Atlas.');
  }

  console.log('[Seed] Connecting to MongoDB…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 25000 });
  console.log('[Seed] DB:', mongoose.connection.name);

  const businesses = await User.find({ role: 'business' }).sort({ createdAt: 1 });
  const visitors = await User.find({ role: 'visitor' }).sort({ createdAt: 1 });
  const commenters = [...visitors, ...businesses];

  console.log(`[Seed] Businesses: ${businesses.length}, Visitors: ${visitors.length}`);
  if (!businesses.length) throw new Error('No businesses in Atlas');
  if (commenters.length < 2) throw new Error('Need at least 2 users in Atlas to leave comments');

  const oldPosts = await Post.find({}).select('_id');
  const oldProducts = await Product.find({}).select('_id');
  const oldPostIds = oldPosts.map((p) => p._id);
  const oldProductIds = oldProducts.map((p) => p._id);

  if (oldPostIds.length) {
    await Comment.deleteMany({ targetType: 'post', targetId: { $in: oldPostIds } });
    await SavedItem.deleteMany({ type: 'post', refId: { $in: oldPostIds } });
  }
  if (oldProductIds.length) {
    await Review.deleteMany({ product: { $in: oldProductIds } });
    await SavedItem.deleteMany({ type: 'product', refId: { $in: oldProductIds } });
  }
  await Product.deleteMany({});
  await Post.deleteMany({});
  console.log(`[Seed] Cleared ${oldProductIds.length} products + ${oldPostIds.length} posts (+ related)`);

  // Pre-download unique template images once
  console.log('\n[Seed] Downloading content-matched product images…');
  for (const t of PRODUCT_TEMPLATES) {
    t._image = await resolveMatchedImage(
      t.keywords,
      PRODUCT_DIR,
      '/images/products',
      slug(t.name)
    );
  }
  console.log('\n[Seed] Downloading content-matched post images…');
  for (const t of POST_TEMPLATES) {
    t._image = await resolveMatchedImage(
      t.keywords,
      POST_DIR,
      '/images/posts',
      slug(t.title)
    );
  }

  let productCount = 0;
  let postCount = 0;
  let commentCount = 0;

  for (let bi = 0; bi < businesses.length; bi += 1) {
    const business = businesses[bi];
    const bName = companyName(business);
    const products = productsForBusiness(bi, business);
    console.log(`\n[Seed] ${bName}`);

    for (const p of products) {
      await Product.create({
        business: business._id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category,
        image: p._image,
        rating: 4 + ((productCount % 9) / 10),
        reviewsCount: 0,
      });
      productCount += 1;
      console.log(`  + product: ${p.name}`);
    }

    for (let pi = 0; pi < POSTS_PER_BUSINESS; pi += 1) {
      const tmpl = POST_TEMPLATES[(bi * POSTS_PER_BUSINESS + pi) % POST_TEMPLATES.length];
      const title = pi === 0 ? tmpl.title : `${tmpl.title} — ${bName.split(' ')[0]}`;
      const post = await Post.create({
        title,
        content: tmpl.content,
        image: tmpl._image,
        tags: tmpl.tags,
        author: business._id,
        likes: [],
        commentsCount: 0,
        shares: Math.floor(Math.random() * 8),
      });
      postCount += 1;

      // Comments + one reply from real Atlas users (not the same as author when possible)
      let added = 0;
      const shuffled = [...commenters].sort(() => Math.random() - 0.5);
      let parentId = null;

      for (let ci = 0; ci < shuffled.length && added < COMMENTS_PER_POST; ci += 1) {
        const user = shuffled[ci];
        if (String(user._id) === String(business._id) && visitors.length > 0) continue;

        const isReply = added === 2 && parentId;
        const comment = await Comment.create({
          targetType: 'post',
          targetId: post._id,
          parentComment: isReply ? parentId : null,
          author: isReply ? business._id : user._id,
          content: isReply
            ? REPLY_TEXTS[bi % REPLY_TEXTS.length]
            : COMMENT_TEXTS[(bi + ci) % COMMENT_TEXTS.length],
          likes: [],
        });
        if (!isReply && !parentId) parentId = comment._id;
        added += 1;
        commentCount += 1;
      }

      post.commentsCount = added;
      await post.save();
      console.log(`  ✎ post: ${title} (${added} comments)`);
    }
  }

  console.log('\n========== DONE (Atlas) ==========');
  console.log(`Products: ${productCount}`);
  console.log(`Posts: ${postCount}`);
  console.log(`Comments: ${commentCount}`);
  console.log(`Businesses used: ${businesses.length}`);
  console.log(`Images saved under: ${PUBLIC_IMAGES}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n[Seed] FAILED:', err.message || err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
