/**
 * Export platform overview + products-per-business + all posts.
 * Usage (from server/): node scripts/exportPlatformData.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const User = require('../src/models/User');
const Product = require('../src/models/Product');
const Post = require('../src/models/Post');
const Thread = require('../src/models/Thread');
const Comment = require('../src/models/Comment');
const Order = require('../src/models/Order');
const Payment = require('../src/models/Payment');
const SubscriptionPayment = require('../src/models/SubscriptionPayment');
const MoneyTransaction = require('../src/models/MoneyTransaction');
const Conversation = require('../src/models/Conversation');
const ChatMessage = require('../src/models/ChatMessage');
const Notification = require('../src/models/Notification');
const SavedItem = require('../src/models/SavedItem');
const Review = require('../src/models/Review');
const BusinessReview = require('../src/models/BusinessReview');
const { BusinessReport } = require('../src/models/BusinessReport');
const Follow = require('../src/models/Follow');

function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function safeName(s) {
  return String(s || 'unknown')
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
    .replace(/\s+/g, '_')
    .slice(0, 80);
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGODB_URI in server/.env');
    process.exit(1);
  }

  console.log('[Export] Connecting…');
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 20000 });
  console.log('[Export] Connected');

  const outRoot = path.join(
    process.env.USERPROFILE || process.env.HOME || '.',
    'Desktop',
    `mashtal-export-${stamp()}`
  );
  const productsDir = path.join(outRoot, 'products-by-business');
  fs.mkdirSync(productsDir, { recursive: true });

  const overview = {
    exportedAt: new Date().toISOString(),
    counts: {
      users: await User.countDocuments({}),
      visitors: await User.countDocuments({ role: 'visitor' }),
      businesses: await User.countDocuments({ role: 'business' }),
      admins: await User.countDocuments({ role: 'admin' }),
      products: await Product.countDocuments({}),
      posts: await Post.countDocuments({}),
      threads: await Thread.countDocuments({}),
      comments: await Comment.countDocuments({}),
      orders: await Order.countDocuments({}),
      payments: await Payment.countDocuments({}),
      subscriptionPayments: await SubscriptionPayment.countDocuments({}),
      moneyTransactions: await MoneyTransaction.countDocuments({}),
      conversations: await Conversation.countDocuments({}),
      chatMessages: await ChatMessage.countDocuments({}),
      notifications: await Notification.countDocuments({}),
      savedItems: await SavedItem.countDocuments({}),
      reviews: await Review.countDocuments({}),
      businessReviews: await BusinessReview.countDocuments({}),
      businessReports: await BusinessReport.countDocuments({}),
      follows: await Follow.countDocuments({}),
    },
  };

  const businesses = await User.find({ role: 'business' })
    .select(
      'fullName email phone location verified subscriptionStatus subscriptionStartedAt subscriptionExpiresAt businessProfile pendingBusinessProfile createdAt'
    )
    .lean();

  overview.businessesSummary = businesses.map((b) => ({
    id: b._id.toString(),
    fullName: b.fullName,
    email: b.email,
    companyName: b.businessProfile?.companyName || b.pendingBusinessProfile?.companyName || null,
    subscriptionStatus: b.subscriptionStatus,
    subscriptionExpiresAt: b.subscriptionExpiresAt,
    verified: b.verified,
    location: b.location || b.businessProfile?.location || null,
  }));

  fs.writeFileSync(path.join(outRoot, 'overview.json'), JSON.stringify(overview, null, 2), 'utf8');
  console.log('[Export] overview.json');
  console.log(JSON.stringify(overview.counts, null, 2));

  // Products per business
  const allProducts = await Product.find({})
    .populate('business', 'fullName email role businessProfile subscriptionStatus')
    .lean();

  const byBusiness = new Map();
  for (const p of allProducts) {
    const bid = p.business?._id?.toString() || p.business?.toString() || 'unknown';
    if (!byBusiness.has(bid)) byBusiness.set(bid, []);
    byBusiness.get(bid).push({
      id: p._id.toString(),
      name: p.name,
      description: p.description,
      price: p.price,
      category: p.category,
      stock: p.stock,
      rating: p.rating,
      reviewsCount: p.reviewsCount,
      image: p.image,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }

  const productsIndex = [];
  for (const b of businesses) {
    const id = b._id.toString();
    const company =
      b.businessProfile?.companyName || b.pendingBusinessProfile?.companyName || b.fullName || id;
    const products = byBusiness.get(id) || [];
    const fileBase = `${safeName(company)}_${id.slice(-6)}`;
    const filePath = path.join(productsDir, `${fileBase}.json`);
    const payload = {
      businessId: id,
      fullName: b.fullName,
      email: b.email,
      companyName: company,
      subscriptionStatus: b.subscriptionStatus,
      productCount: products.length,
      products,
    };
    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf8');
    productsIndex.push({
      businessId: id,
      companyName: company,
      email: b.email,
      productCount: products.length,
      file: `products-by-business/${fileBase}.json`,
    });
  }

  // Orphan products (business missing / not role=business)
  for (const [bid, products] of byBusiness.entries()) {
    if (businesses.some((b) => b._id.toString() === bid)) continue;
    const biz = allProducts.find((p) => (p.business?._id?.toString() || p.business?.toString()) === bid)?.business;
    const fileBase = `orphan_${safeName(biz?.fullName || bid)}_${bid.slice(-6)}`;
    fs.writeFileSync(
      path.join(productsDir, `${fileBase}.json`),
      JSON.stringify(
        {
          businessId: bid,
          fullName: biz?.fullName || null,
          email: biz?.email || null,
          note: 'Business user missing or not role=business',
          productCount: products.length,
          products,
        },
        null,
        2
      ),
      'utf8'
    );
    productsIndex.push({
      businessId: bid,
      companyName: biz?.fullName || bid,
      productCount: products.length,
      file: `products-by-business/${fileBase}.json`,
      orphan: true,
    });
  }

  fs.writeFileSync(
    path.join(outRoot, 'products-index.json'),
    JSON.stringify({ totalProducts: allProducts.length, businesses: productsIndex }, null, 2),
    'utf8'
  );

  // All products flat
  fs.writeFileSync(
    path.join(outRoot, 'all-products.json'),
    JSON.stringify(
      allProducts.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        stock: p.stock,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        image: p.image,
        businessId: p.business?._id?.toString() || p.business?.toString() || null,
        businessName: p.business?.businessProfile?.companyName || p.business?.fullName || null,
        businessEmail: p.business?.email || null,
        subscriptionStatus: p.business?.subscriptionStatus || null,
        createdAt: p.createdAt,
      })),
      null,
      2
    ),
    'utf8'
  );

  // Posts
  const posts = await Post.find({})
    .populate('author', 'fullName email role businessProfile')
    .lean();

  const postsExport = posts.map((p) => ({
    id: p._id.toString(),
    title: p.title,
    content: p.content,
    image: p.image,
    tags: p.tags || [],
    likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
    commentsCount: p.commentsCount || 0,
    shares: p.shares || 0,
    authorId: p.author?._id?.toString() || p.author?.toString() || null,
    authorName: p.author?.fullName || null,
    authorEmail: p.author?.email || null,
    authorRole: p.author?.role || null,
    companyName: p.author?.businessProfile?.companyName || null,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }));

  fs.writeFileSync(path.join(outRoot, 'all-posts.json'), JSON.stringify(postsExport, null, 2), 'utf8');

  // Simple CSV for products + posts
  const productCsvHeader =
    'id,name,category,price,stock,rating,businessId,businessName,businessEmail,createdAt\n';
  const productCsv = allProducts
    .map((p) => {
      const cells = [
        p._id.toString(),
        JSON.stringify(p.name || ''),
        p.category || '',
        p.price,
        p.stock,
        p.rating,
        p.business?._id?.toString() || '',
        JSON.stringify(p.business?.businessProfile?.companyName || p.business?.fullName || ''),
        p.business?.email || '',
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
      ];
      return cells.join(',');
    })
    .join('\n');
  fs.writeFileSync(path.join(outRoot, 'all-products.csv'), productCsvHeader + productCsv, 'utf8');

  const postsCsvHeader = 'id,title,authorName,authorRole,likesCount,commentsCount,createdAt\n';
  const postsCsv = postsExport
    .map((p) =>
      [
        p.id,
        JSON.stringify(p.title || ''),
        JSON.stringify(p.authorName || ''),
        p.authorRole || '',
        p.likesCount,
        p.commentsCount,
        p.createdAt ? new Date(p.createdAt).toISOString() : '',
      ].join(',')
    )
    .join('\n');
  fs.writeFileSync(path.join(outRoot, 'all-posts.csv'), postsCsvHeader + postsCsv, 'utf8');

  console.log('\n[Export] Done');
  console.log(`[Export] Folder: ${outRoot}`);
  console.log(`[Export] Businesses: ${businesses.length}`);
  console.log(`[Export] Products: ${allProducts.length}`);
  console.log(`[Export] Posts: ${posts.length}`);

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error('[Export] Failed:', err?.message || err);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});
