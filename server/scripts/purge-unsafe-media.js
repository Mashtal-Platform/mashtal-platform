/**
 * One-off: remove products/posts that used known gun upload images.
 * Run: node scripts/purge-unsafe-media.js
 */
require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const GUN_FILES = [
  'mrq75lnp-f35cih.jpg',
  'mrq75trq-zy8rm6.jpg',
  'mrq7bykv-chsb5c.jpg',
  'mrq78ntk-28rhkp.jpg',
  'mrq7cf38-wjg93d.jpg',
];

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing');
    process.exit(1);
  }
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 30000, family: 4 });
  console.log('[Purge] Connected');

  const Product = require('../src/models/Product');
  const Post = require('../src/models/Post');

  const imageMatchers = GUN_FILES.map((f) => new RegExp(f.replace(/\./g, '\\.'), 'i'));

  const products = await Product.find({
    $or: imageMatchers.map((re) => ({ image: re })),
  }).lean();
  console.log('[Purge] Products to delete:', products.map((p) => ({ id: p._id, name: p.name, image: p.image })));

  const posts = await Post.find({
    $or: imageMatchers.map((re) => ({ image: re })),
  }).lean();
  console.log('[Purge] Posts to delete:', posts.map((p) => ({ id: p._id, title: p.title, image: p.image })));

  const prodRes = await Product.deleteMany({
    $or: imageMatchers.map((re) => ({ image: re })),
  });
  const postRes = await Post.deleteMany({
    $or: imageMatchers.map((re) => ({ image: re })),
  });
  console.log('[Purge] Deleted products:', prodRes.deletedCount, 'posts:', postRes.deletedCount);

  for (const folder of ['products', 'posts']) {
    for (const file of GUN_FILES) {
      const abs = path.join(__dirname, '..', 'public', 'images', folder, file);
      if (fs.existsSync(abs)) {
        fs.unlinkSync(abs);
        console.log('[Purge] Removed file', abs);
      }
    }
  }

  await mongoose.disconnect();
  console.log('[Purge] Done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
