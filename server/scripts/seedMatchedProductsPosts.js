/**
 * Seed matched Products + Posts for every business.
 * Uses curated Unsplash URLs so each image matches the product/post content.
 *
 * From server/:
 *   node scripts/seedMatchedProductsPosts.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Post = require('../src/models/Post');
const Comment = require('../src/models/Comment');
const SavedItem = require('../src/models/SavedItem');
const Review = require('../src/models/Review');

const u = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

/** Product templates: category must match Product enum */
const PRODUCT_POOL = [
  {
    name: 'Arbequina Olive Tree',
    description: 'Healthy nursery-grown Arbequina olive tree for Lebanese gardens and small orchards.',
    price: 18, stock: 34, category: 'trees',
    image: u('photo-1445264618000-f1e069c5920f'),
  },
  {
    name: 'Meyer Lemon Tree',
    description: 'Grafted Meyer lemon tree with healthy foliage for sunny Mediterranean locations.',
    price: 22, stock: 28, category: 'trees',
    image: u('photo-1592924357228-91a4daadcfea'),
  },
  {
    name: 'Pomegranate Tree',
    description: 'Young pomegranate fruit tree adapted to dry summers and orchard planting.',
    price: 19, stock: 25, category: 'trees',
    image: u('photo-1601004890684-d8cbf664f06d'),
  },
  {
    name: 'Fig Tree',
    description: 'Healthy fig tree suitable for sunny gardens and productive home orchards.',
    price: 17, stock: 27, category: 'trees',
    image: u('photo-1464226184884-fa280b87c399'),
  },
  {
    name: 'Rosemary Plant',
    description: 'Aromatic rosemary plant for balconies, gardens, and culinary use.',
    price: 5, stock: 75, category: 'plants',
    image: u('photo-1515586007055-669fe2adf7d5'),
  },
  {
    name: 'Lavender Plant',
    description: 'Fragrant lavender plant that attracts pollinators and tolerates dry conditions.',
    price: 6, stock: 60, category: 'plants',
    image: u('photo-1499002238440-d264edd596ec'),
  },
  {
    name: 'Basil Plant',
    description: 'Fresh sweet basil plant ready for kitchen gardens and balcony containers.',
    price: 3.5, stock: 92, category: 'plants',
    image: u('photo-1628557044797-f21a7772a0d2'),
  },
  {
    name: 'Tomato Seedling Tray',
    description: 'Strong tomato seedlings with developed roots, ready for transplanting.',
    price: 7, stock: 46, category: 'plants',
    image: u('photo-1592841200221-a6898d631c3e'),
  },
  {
    name: 'Roma Tomato Seeds',
    description: 'Quality Roma tomato seeds for productive field and garden cultivation.',
    price: 3, stock: 120, category: 'seeds',
    image: u('photo-1598512752271-33f913a5af13'),
  },
  {
    name: 'Cucumber Seeds Pack',
    description: 'Cucumber seeds selected for crisp fruit and warm-season production.',
    price: 3, stock: 110, category: 'seeds',
    image: u('photo-1449300079323-02e209d9d3a6'),
  },
  {
    name: 'Sweet Pepper Seeds',
    description: 'Sweet bell pepper seeds for greenhouse and open-field planting.',
    price: 3.5, stock: 95, category: 'seeds',
    image: u('photo-1563565375-f3fdfdbefa83'),
  },
  {
    name: 'Parsley Seeds',
    description: 'High-germination parsley seeds for home gardens and herb production.',
    price: 2.5, stock: 140, category: 'seeds',
    image: u('photo-1584270354949-c26b0d82b65a'),
  },
  {
    name: 'Balanced NPK Fertilizer 20-20-20',
    description: 'Water-soluble balanced fertilizer for vegetables, flowers, and fruit trees.',
    price: 12, stock: 78, category: 'fertilizers',
    image: u('photo-1416879595882-3373a0480b5b'),
  },
  {
    name: 'Organic Compost Bag 20kg',
    description: 'Rich organic compost to improve soil structure and plant nutrition.',
    price: 9, stock: 64, category: 'fertilizers',
    image: u('photo-1466692476868-aef1dfb1e735'),
  },
  {
    name: 'Drip Irrigation Kit 50m',
    description: 'Complete drip irrigation kit for efficient watering of rows and gardens.',
    price: 45, stock: 30, category: 'irrigation',
    image: u('photo-1625246333195-78d9c38ad449'),
  },
  {
    name: 'Garden Hose with Spray Nozzle',
    description: 'Durable garden hose with adjustable spray nozzle for daily watering.',
    price: 16, stock: 42, category: 'irrigation',
    image: u('photo-1591857177580-dc82b9ac4e1e'),
  },
  {
    name: 'Pruning Shears',
    description: 'Sharp bypass pruning shears for orchard branches and garden shrubs.',
    price: 11, stock: 55, category: 'tools',
    image: u('photo-1585320806297-9794b3e4eeae'),
  },
  {
    name: 'Hand Cultivator Set',
    description: 'Three-piece hand tool set for weeding, digging, and soil preparation.',
    price: 14, stock: 48, category: 'tools',
    image: u('photo-1501004318641-b39e6451bec6'),
  },
  {
    name: 'Wheelbarrow 80L',
    description: 'Sturdy farm wheelbarrow for soil, compost, and harvest transport.',
    price: 55, stock: 18, category: 'equipment',
    image: u('photo-1574943320219-553eb213f72d'),
  },
  {
    name: 'Knapsack Sprayer 16L',
    description: 'Manual knapsack sprayer for crop protection and foliar feeding.',
    price: 28, stock: 33, category: 'equipment',
    image: u('photo-1530836369130-7f0fd45f4e56'),
  },
  {
    name: 'Cedar Sapling',
    description: 'Young cedar sapling for landscaping and long-term garden planting.',
    price: 15, stock: 40, category: 'trees',
    image: u('photo-1441974231531-c6227db76b6e'),
  },
  {
    name: 'Succulent Mix Pack',
    description: 'Assorted drought-tolerant succulents ideal for balconies and urban gardens.',
    price: 10, stock: 50, category: 'plants',
    image: u('photo-1459411552884-841db9b3cb2a'),
  },
  {
    name: 'Potting Soil Mix 10L',
    description: 'Premium potting mix for containers, seedlings, and indoor plants.',
    price: 8, stock: 70, category: 'fertilizers',
    image: u('photo-1416879595882-3373a0480b5b'),
  },
  {
    name: 'Copper Fungicide Spray',
    description: 'Protective copper-based spray for common fungal issues on crops and ornamentals.',
    price: 13, stock: 36, category: 'medicament',
    image: u('photo-1523741543316-beb7fc7023d8'),
  },
];

const POST_POOL = [
  {
    title: 'Spring planting tips for Lebanese gardens',
    content:
      'Prepare beds early, enrich soil with compost, and stagger tomato and pepper transplants after the last cold nights. Consistent morning watering helps seedlings establish without stress.',
    tags: ['planting', 'spring', 'lebanon'],
    image: u('photo-1523348837708-15d4a09cfac2', 1400),
  },
  {
    title: 'How drip irrigation saves water in the Bekaa',
    content:
      'Drip lines deliver water to the root zone, reduce evaporation, and keep foliage dry. Start with a pressure filter, flush lines weekly, and check emitters for clogging during the dry season.',
    tags: ['irrigation', 'water', 'bekaa'],
    image: u('photo-1625246333195-78d9c38ad449', 1400),
  },
  {
    title: 'Choosing healthy nursery trees',
    content:
      'Look for a strong central leader, flexible branches, and roots that are white and not circling the pot. Avoid trees with yellow leaves or cracked trunks before you buy.',
    tags: ['nursery', 'trees', 'tips'],
    image: u('photo-1445264618000-f1e069c5920f', 1400),
  },
  {
    title: 'Organic compost for richer soil',
    content:
      'Mix mature compost into the top 15 cm of soil before planting. It improves structure, moisture holding, and microbial life — especially in rocky or sandy Lebanese soils.',
    tags: ['compost', 'soil', 'organic'],
    image: u('photo-1464226184884-fa280b87c399', 1400),
  },
  {
    title: 'Pruning olive trees for better harvest',
    content:
      'Prune after harvest to open the canopy for light and air. Remove dead wood and crossing branches, and keep tools clean to limit disease spread.',
    tags: ['olive', 'pruning', 'orchard'],
    image: u('photo-1471194402529-8e0f5a675de6', 1400),
  },
  {
    title: 'Balcony herbs that thrive in Beirut',
    content:
      'Basil, rosemary, mint, and parsley do well in deep pots with drainage holes. Give them morning sun, water when the top soil dries, and harvest often to encourage new growth.',
    tags: ['herbs', 'urban', 'balcony'],
    image: u('photo-1466692476868-aef1dfb1e735', 1400),
  },
  {
    title: 'Protecting tomatoes from early blight',
    content:
      'Space plants for airflow, avoid wetting leaves late in the day, and remove infected foliage promptly. Rotate crops yearly and consider copper sprays when humidity rises.',
    tags: ['tomato', 'disease', 'protection'],
    image: u('photo-1592841200221-a6898d631c3e', 1400),
  },
  {
    title: 'Essential farm tools for small holdings',
    content:
      'A good pair of pruning shears, a sturdy hoe, a hand cultivator, and a reliable wheelbarrow cover most daily tasks. Clean and oil metal tools after muddy work.',
    tags: ['tools', 'farm', 'equipment'],
    image: u('photo-1500382017468-9049fed747ef', 1400),
  },
  {
    title: 'Seed starting calendar for summer crops',
    content:
      'Start tomatoes and peppers indoors 6–8 weeks before transplant. Cucumbers and zucchini prefer warmer soil — sow closer to outdoor planting time for stronger seedlings.',
    tags: ['seeds', 'calendar', 'seedlings'],
    image: u('photo-1416879595882-3373a0480b5b', 1400),
  },
  {
    title: 'Mulching to keep moisture in summer heat',
    content:
      'A 5 cm layer of straw or wood chips around plants reduces evaporation and weeds. Keep mulch a few centimetres away from stems to prevent rot.',
    tags: ['mulch', 'summer', 'water'],
    image: u('photo-1492496913980-501348b61469', 1400),
  },
];

const BUSINESS_FOCUS = [
  { match: /nursur|nursery|cedar|garden|mashtalee|hadi|orchard|urban/i, categories: ['trees', 'plants', 'seeds'] },
  { match: /agro|seed|bekaa|akkar/i, categories: ['seeds', 'fertilizers', 'plants'] },
  { match: /irrigat/i, categories: ['irrigation', 'equipment', 'tools'] },
  { match: /tool|equipment/i, categories: ['tools', 'equipment', 'irrigation'] },
  { match: /organic|tyre/i, categories: ['plants', 'seeds', 'fertilizers'] },
];

function companyName(b) {
  return b.businessProfile?.companyName || b.pendingBusinessProfile?.companyName || b.fullName || b.email;
}

function pickCategories(business, index) {
  const name = companyName(business);
  const hit = BUSINESS_FOCUS.find((f) => f.match.test(name));
  if (hit) return hit.categories;
  const fallbacks = [
    ['trees', 'plants'],
    ['seeds', 'fertilizers'],
    ['irrigation', 'tools'],
    ['equipment', 'tools'],
    ['plants', 'medicament'],
  ];
  return fallbacks[index % fallbacks.length];
}

function productsForBusiness(business, index) {
  const cats = new Set(pickCategories(business, index));
  const pool = PRODUCT_POOL.filter((p) => cats.has(p.category));
  const source = pool.length >= 6 ? pool : PRODUCT_POOL;
  const start = (index * 3) % source.length;
  const picked = [];
  for (let i = 0; i < 6; i += 1) {
    picked.push(source[(start + i) % source.length]);
  }
  // unique names within business
  const seen = new Set();
  return picked.filter((p) => {
    if (seen.has(p.name)) return false;
    seen.add(p.name);
    return true;
  }).slice(0, 6);
}

const FALLBACK_IMAGE = u('photo-1500382017468-9049fed747ef');

async function assertImageOk(url) {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Range: 'bytes=0-1023', Accept: 'image/*' },
      redirect: 'follow',
    });
    if (!res.ok && res.status !== 206) return false;
    const ct = res.headers.get('content-type') || '';
    if (ct && !ct.startsWith('image/') && !ct.includes('octet-stream')) return false;
    return true;
  } catch {
    return false;
  }
}

async function resolveImage(url) {
  if (await assertImageOk(url)) return url;
  console.warn(`  ! image failed, using fallback: ${url}`);
  return FALLBACK_IMAGE;
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');

  console.log('[Seed] Connecting…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 25000 });
  console.log('[Seed] Connected');

  const businesses = await User.find({ role: 'business' }).sort({ createdAt: 1 });
  console.log(`[Seed] Businesses: ${businesses.length}`);
  if (!businesses.length) throw new Error('No business users found');

  const oldProducts = await Product.find({}).select('_id');
  const oldPosts = await Post.find({}).select('_id');
  const oldProductIds = oldProducts.map((p) => p._id);
  const oldPostIds = oldPosts.map((p) => p._id);

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
  console.log(`[Seed] Cleared ${oldProductIds.length} products, ${oldPostIds.length} posts`);

  // Resolve images (replace broken URLs with fallback)
  console.log(`[Seed] Verifying curated images…`);
  for (const p of PRODUCT_POOL) {
    p.image = await resolveImage(p.image);
  }
  for (const p of POST_POOL) {
    p.image = await resolveImage(p.image);
  }
  console.log('[Seed] Images ready');

  let productCount = 0;
  let postCount = 0;

  for (let i = 0; i < businesses.length; i += 1) {
    const business = businesses[i];
    const name = companyName(business);
    const products = productsForBusiness(business, i);
    console.log(`\n[Seed] ${name} → ${products.length} products`);

    for (const p of products) {
      await Product.create({
        business: business._id,
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        category: p.category,
        image: p.image,
        rating: 4 + ((productCount % 9) / 10),
        reviewsCount: 0,
      });
      productCount += 1;
      console.log(`  + ${p.name} [${p.category}]`);
    }

    for (let j = 0; j < 3; j += 1) {
      const post = POST_POOL[(i * 3 + j) % POST_POOL.length];
      const title = j === 0 ? post.title : `${post.title} (${name.split(' ')[0]})`;
      await Post.create({
        title,
        content: post.content,
        image: post.image,
        tags: post.tags,
        author: business._id,
        likes: [],
        commentsCount: 0,
        shares: 0,
      });
      postCount += 1;
      console.log(`  ✎ ${title}`);
    }
  }

  console.log('\n========== DONE ==========');
  console.log(`Products created: ${productCount}`);
  console.log(`Posts created: ${postCount}`);
  console.log(`Businesses: ${businesses.length}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('\n[Seed] FAILED:', err.message || err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
