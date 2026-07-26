/**
 * Fix product/post images in Atlas: replace local /images/... paths
 * with public HTTPS URLs so every clone sees the same pictures.
 *
 * Run: node scripts/fixAtlasImageUrls.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Product = require('../src/models/Product');
const Post = require('../src/models/Post');

const u = (id, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=85`;

/** Exact product name → matching public image (never reuse tomato for lemon, etc.) */
const PRODUCT_IMAGES = {
  'Arbequina Olive Tree': u('photo-1474979266404-7ea267078f90'), // olives
  'Meyer Lemon Tree': u('photo-1590502593747-44a6d8f0b4b0'.includes('44a6') ? 'photo-1577234286642-fc512a5f8f11' : 'photo-1577234286642-fc512a5f8f11'), // lemons
  'Pomegranate Tree': u('photo-1546548970-71785318a17b'), // pomegranate
  'Fig Tree': u('photo-1606313564200-e75d5e30476c'), // figs — may 404, fallback below
  'Rosemary Plant': u('photo-1515586007055-669fe2adf7d5'), // rosemary/herbs
  'Lavender Plant': u('photo-1499002238440-d264edd596ec'), // lavender
  'Sweet Basil Plant': u('photo-1618375569908-3eb57d694208'), // basil-ish herbs
  'Tomato Seedling Tray': u('photo-1592841200221-a6898d631c3e'), // tomato plants
  'Roma Tomato Seeds': u('photo-1592924357228-91a4daadcfea'), // tomatoes
  'Cucumber Seeds Pack': u('photo-1449300079323-02e209d9d3a6'), // cucumber
  'Sweet Pepper Seeds': u('photo-1563565375-f3fdfdbefa83'), // peppers
  'Parsley Seeds': u('photo-1628557044797-f21a7772a0d2'), // leafy herbs
  'Balanced NPK Fertilizer 20-20-20': u('photo-1416879595882-3373a0480b5b'), // soil/plants agri
  'Organic Compost Bag 20kg': u('photo-1464226184884-fa280b87c399'), // farm soil
  'Drip Irrigation Kit 50m': u('photo-1625246333195-78d9c38ad449'), // irrigation field
  'Garden Hose with Spray Nozzle': u('photo-1591857177580-dc82b9ac4e1e'), // watering
  'Pruning Shears': u('photo-1416879595882-3373a0480b5b'), // will refine
  'Hand Cultivator Set': u('photo-1585320806297-9794b3e4eeae'), // gardening
  'Farm Wheelbarrow 80L': u('photo-1500382017468-9049fed747ef'), // farm
  'Knapsack Sprayer 16L': u('photo-1530836369130-7f0fd45f4e56'), // greenhouse spray context
  'Cedar Sapling': u('photo-1441974231531-c6227db76b6e'), // trees/forest
  'Succulent Mix Pack': u('photo-1459411552884-841db9b3cb2a'), // succulents
  'Potting Soil Mix 10L': u('photo-1416879595882-3373a0480b5b'), // potting/soil
  'Copper Fungicide Spray': u('photo-1523741543316-beb7fc7023d8'), // crop care
};

// Clean overrides (fix any ternary mess above)
PRODUCT_IMAGES['Meyer Lemon Tree'] = u('photo-1577234286642-fc512a5f8f11');
PRODUCT_IMAGES['Fig Tree'] = u('photo-1601004890684-d8cbf664f06d');
PRODUCT_IMAGES['Pruning Shears'] = u('photo-1585320806297-9794b3e4eeae');
PRODUCT_IMAGES['Sweet Basil Plant'] = u('photo-1628557044797-f21a7772a0d2');

const POST_IMAGES = {
  'Spring planting tips for Lebanese gardens': u('photo-1523348837708-15d4a09cfac2', 1400),
  'How drip irrigation saves water in the Bekaa': u('photo-1625246333195-78d9c38ad449', 1400),
  'Choosing healthy nursery trees': u('photo-1445264618000-f1e069c5920f', 1400),
  'Organic compost for richer soil': u('photo-1464226184884-fa280b87c399', 1400),
  'Pruning olive trees for better harvest': u('photo-1474979266404-7ea267078f90', 1400),
  'Balcony herbs that thrive in Beirut': u('photo-1466692476868-aef1dfb1e735', 1400),
  'Protecting tomatoes from early blight': u('photo-1592841200221-a6898d631c3e', 1400),
  'Essential farm tools for small holdings': u('photo-1500382017468-9049fed747ef', 1400),
  'Seed starting calendar for summer crops': u('photo-1416879595882-3373a0480b5b', 1400),
  'Mulching to keep moisture in summer heat': u('photo-1492496913980-501348b61469', 1400),
};

function matchPostImage(title) {
  const t = String(title || '');
  for (const [key, url] of Object.entries(POST_IMAGES)) {
    if (t.startsWith(key) || t.includes(key)) return url;
  }
  return u('photo-1500382017468-9049fed747ef', 1400);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('Missing MONGODB_URI');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 25000 });
  console.log('[Fix] Connected', mongoose.connection.name);

  const products = await Product.find({});
  let pOk = 0;
  let pMiss = 0;
  for (const p of products) {
    const url = PRODUCT_IMAGES[p.name];
    if (!url) {
      console.warn('No mapping for product:', p.name);
      pMiss += 1;
      continue;
    }
    p.image = url;
    await p.save();
    pOk += 1;
  }

  const posts = await Post.find({});
  let postOk = 0;
  for (const post of posts) {
    post.image = matchPostImage(post.title);
    await post.save();
    postOk += 1;
  }

  console.log(`[Fix] Products updated: ${pOk}, missing map: ${pMiss}`);
  console.log(`[Fix] Posts updated: ${postOk}`);
  console.log('[Fix] All images are now public HTTPS URLs (work for every clone).');
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error('[Fix] FAILED', e.message || e);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
